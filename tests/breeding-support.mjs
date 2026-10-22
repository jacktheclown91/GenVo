import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {BREEDING_SUPPORT} from '../src/ecology/breeding-support.js';
import {foundRegionalPopulations} from '../src/ecology/regional-founding.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

// breeding-support/1 (creator direction 2026-10-22): one anatomy- and
// resource-based breeding rule for every body; no species-named thresholds.
const world=(on,origin={x:0,y:0})=>new Simulation('PLANET-OBS-2',{player:false,worldGenerator:'planetary/1',planetOrigin:origin,breedingSupport:on});
const sim=world(true);assert.equal(sim.breedingSupportRules,BREEDING_SUPPORT.policy);
assert.equal(new Simulation('GENVO8-BREEDING',{player:false}).breedingSupportRules,undefined);
for(let i=0;i<CFG.dayTicks*10;i++)sim.update(null);
const adults=sim.animals.filter(a=>a.alive&&a.age>=SPECIES[a.species].maturity);
const state=a=>sim.carrying.breedingState(a);

// The same rule decides for every anatomy: allowed exactly when the body's
// share of renewable food exceeds its own maintenance-plus-offspring need.
const kinds=new Set();
for(const a of adults){const b=state(a);assert.ok(b.support&&Number.isFinite(b.support.supportRatio),a.species);kinds.add(a.species);
 assert.equal(b.allowed,b.support.resource>.04,'one decision rule for '+a.species);
 assert.ok(Math.abs(b.support.share-b.support.production/(1+Math.max(0,b.competitors)))<1e-9,'food is shared among overlapping consumers')}
assert.ok(kinds.size>=6,'unrelated anatomies are covered: '+[...kinds].join(','));

// No privilege by name: an identical, fully grown body relabelled with another
// founding name gets the same support. (Juvenile growth still reads the legacy
// carrier's maturity; that dependency is recorded for the carrier-removal task.)
{const a=adults.find(x=>x.species==='mosskip'),other=Object.keys(SPECIES).find(k=>k!=='mosskip'&&k!=='genvo'&&SPECIES[k].maturity<=SPECIES.mosskip.maturity);
 const grown={...a,id:-76,age:Math.max(a.age,SPECIES.mosskip.lifespan*.5)},twin={...grown,id:-77,species:other},p=state(grown).support,q=state(twin).support;
 assert.equal(q.production,p.production,'food reach comes from anatomy');assert.equal(q.need,p.need,'adult need comes from the anatomical body, not the label')}

// Anatomy matters: the same individual with a different mouth reaches different
// food; a heavier body needs more.
{const a=adults.find(x=>x.species==='mosskip'),swap=(b,id)=>({...b,id:-78,bodyPlan:makePlan(b.bodyPlan.nodes.map(n=>({partId:n.socket==='mouth'?id:n.partId,parent:n.parent,socket:n.socket})))});
 const grazer=state(a).support,hunter=state(swap(a,'tearing-jaw')).support;assert.notEqual(hunter.production,grazer.production,'diet reach follows the mouth');
 const heavy={...a,id:-79,bodyPlan:makePlan(a.bodyPlan.nodes.map(n=>({partId:!n.parent?'barrel-torso':n.partId,parent:n.parent,socket:n.socket})).filter(n=>!n.parent||!/^limb\.(9|14)$/.test(n.socket)))};
 assert.ok(state(heavy).support.need>grazer.need,'a heavier body needs more food')}

// Habitat matters and nothing is guaranteed: the same body on barren ground or
// deep in the sea is not supported.
{const a=adults.find(x=>x.species==='genvo'),w=sim.world;let barren=null;for(let i=0;i<w.len&&!barren;i++){const x=i%w.n+.5,y=(i/w.n|0)+.5;if(w.isPlayable(x,y)&&!w.water[i]){let food=0;for(const f of Object.values(w.plants))food+=f[i];if(food<1e-4)barren={x,y}}}
 if(barren){const b=state({...a,id:-80,x:barren.x,y:barren.y});assert.ok(b.support.production<state(a).support.production,'poorer ground supports less')}}

// Competition: more overlapping consumers nearby shrink each share.
{const a=adults.find(x=>x.species==='mosskip'),alone=state(a).support,crowd=[];for(let k=0;k<12;k++)crowd.push({...a,id:-100-k,x:a.x+(k%4)*.3,y:a.y+(k>>2)*.3});
 sim.animals.push(...crowd);sim.rebuildSpatial();const crowded=state(a).support;sim.animals.splice(sim.animals.length-crowd.length,crowd.length);sim.rebuildSpatial();
 assert.ok(crowded.share<alone.share,'local dietary competition reduces support')}

// Founding templates on a coast (land, freshwater-free shore and open sea) are
// judged by the same rule.
{const coast=new Simulation('PLANET-OBS-2',{player:false,bootstrap:false,worldGenerator:'planetary/1',planetOrigin:{x:-57600,y:-18176},breedingSupport:true});const r=foundRegionalPopulations(coast,{region:'-57600,-18176'});assert.ok(r.introduced.length>=4);
 for(const a of coast.animals.filter(a=>a.alive)){const b=coast.carrying.breedingState(a);assert.ok(b.support&&b.allowed===(b.support.resource>.04),a.species)}}

// Historical worlds keep the legacy calibration; saves record the policy.
{const legacy=world(false);for(let i=0;i<CFG.dayTicks*2;i++)legacy.update(null);const a=legacy.animals.find(x=>x.alive&&x.age>=SPECIES[x.species].maturity);assert.equal(legacy.carrying.breedingState(a).support,undefined)}
const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})),back=restoreSimulationSnapshot(structuredClone(snap));
assert.equal(back.breedingSupportRules,BREEDING_SUPPORT.policy);assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),snap);
for(let i=0;i<CFG.lifeStride;i++){sim.update(null);back.update(null)}
assert.deepEqual(structuredClone(createSimulationSnapshot(back,{savedAt:'t',reason:'t'})),structuredClone(createSimulationSnapshot(sim,{savedAt:'t',reason:'t'})));
const old=structuredClone(snap);delete old.core.breedingSupportRules;assert.equal(restoreSimulationSnapshot(old).breedingSupportRules,undefined);
const bad=structuredClone(snap);bad.core.breedingSupportRules='always-breed/9';assert.throws(()=>restoreSimulationSnapshot(bad),/Unknown breeding support/);
console.log('Breeding support PASS: one rule across '+kinds.size+' anatomies and coastal founders, identical support for an identical body under another name, mouth and mass change support, poorer habitat and local competition reduce it, legacy worlds unchanged, exact save/continuation.');
