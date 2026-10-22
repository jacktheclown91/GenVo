import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {validatePlanetAnimalOwnership} from '../src/world/planet-regions.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {REGIONAL_DISPERSAL,dispersalContextFor} from '../src/world/planetary-dispersal.js';

const cross=(sim,x)=>{const p=sim.player();p.energy=SPECIES[p.species].maxEnergy*.94;p.hydration=SPECIES[p.species].maxHydration*.95;for(let y=8.5;y<118.5;y++){p.x=x;p.y=y;sim.rebuildSpatial();if(planetaryTravelAvailability(sim).enabled)return crossPlanetaryBorder(sim).simulation}throw Error('no border')};
// Emigration is triggered by refused breeding. This mechanics test keeps the
// legacy breeding calibration so its trigger does not depend on breeding-support/1,
// under which early abundant food refuses fewer breeders.
let sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1',breedingSupport:false});
assert.equal(sim.regionalDispersalRules,REGIONAL_DISPERSAL.policy);
sim=cross(sim,125.2);for(let i=0;i<CFG.lifeStride*2;i++)sim.update();sim=cross(sim,125.2);
assert.deepEqual(sim.world.regionOrigin,{x:256,y:0});

// Borders open only to regions that exist in memory with a close clock.
const here=dispersalContextFor(sim,'256,0',sim.tickCount);
assert.equal(here.open('west'),true,'the resident neighbour is open');
for(const d of ['east','north','south'])assert.equal(here.open(d),false,'unvisited regions are never materialized by wildlife: '+d);
const far=dispersalContextFor(sim,'0,0',sim.planetaryTravel.sessions.find(s=>s.key==='0,0').snapshot.core.tickCount);
assert.equal(far?.open('west')??false,false);

// Natural dispersal over real days: identities stay unique and move whole.
const owners=()=>[...sim.animals.map(a=>[a,'256,0']),...sim.planetaryTravel.sessions.flatMap(s=>s.snapshot.animals.map(a=>[a,s.key]))];
const before=new Map(owners().map(([a])=>[a.id,{genes:JSON.stringify(a.genes),body:a.bodyPlan?.id,generation:a.generation}]));
for(let d=0;d<10;d++){for(let i=0;i<CFG.dayTicks;i++)sim.update();validatePlanetAnimalOwnership(sim.animals,sim.planetaryTravel)}
const log=sim.planetaryTravel.dispersalLog||[];
assert.ok(log.length>0,'refused breeders crossed into neighbouring regions');
const where=new Map(owners().map(([a,k])=>[a.id,{a,k}]));
for(const move of log){
 assert.ok(['0,0','128,0','256,0'].includes(move.from)&&['0,0','128,0','256,0'].includes(move.to)&&move.from!==move.to);
 const found=where.get(move.id);if(!found)continue; // later recorded death
 const was=before.get(move.id);if(was){assert.equal(JSON.stringify(found.a.genes),was.genes,'genome travels unchanged');assert.equal(found.a.generation,was.generation)}
 assert.ok(found.a.dispersalHistory?.some(h=>h.from===move.from&&h.to===move.to&&h.tick===move.tick),'each animal carries its recorded crossings');
}
// A disperser does not bounce straight back through the border it used.
const byId=new Map();for(const m of log){const prior=byId.get(m.id);if(prior&&prior.to===m.from&&prior.from===m.to)assert.ok(m.day-prior.day>=CFG.seasonDays,'returned only after a season: '+JSON.stringify([prior,m]));byId.set(m.id,m)}
const ledgers=sim.planetaryTravel.sessions.map(s=>s.biologicalLedger).filter(Boolean);
for(const s of sim.planetaryTravel.sessions)if(s.biologicalLedger)assert.equal(s.biologicalLedger.lastPopulation,s.snapshot.animals.length,'ledger tracks arrivals and departures');

// Exact save/restore and identical continuation.
const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),snap);
for(let i=0;i<CFG.lifeStride;i++){sim.update();back.update()}
assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));

// Historical worlds without the policy never open a border.
const legacy=structuredClone(snap);delete legacy.core.regionalDispersalRules;const old=restoreSimulationSnapshot(legacy);
assert.equal(dispersalContextFor(old,'256,0',old.tickCount),null);
console.log('Regional dispersal PASS: '+log.length+' natural crossings in 10 days ('+new Set(log.map(m=>m.id)).size+' animals), only into existing regions, unique identities and intact genomes, recorded histories, no immediate return, consistent ledgers ('+ledgers.length+'), exact save/continuation and historical policy.');
