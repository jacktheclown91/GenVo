import {CFG} from '../../src/sim/config.js';
import {dayTicksFor} from '../../src/sim/day-clock.js';
import {pendingRegionalBiology} from '../../src/world/planetary-offscreen-biology.js';
import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES} from '../../src/organisms/species.js';
import {setProto} from '../../src/lineage/readings.js';
import {canOccupy} from '../../src/lineage/lifestyle.js';
import {dispersalContextFor,setDispersalContext,emigrate,takeEmigrants,deliverEmigrants} from '../../src/world/planetary-dispersal.js';
import {recordControlledBranch,replaceControlledSession,regionalSnapshot} from './regional-evolution-world.mjs';
import {placeSupportedBreedingPair} from './breeding-pair.js';
import {syncPlanetaryBoundaryOwnership} from '../../src/world/planetary-seam-salt.js';
const ensure=(condition,message)=>{if(!condition)throw Error(message)};

export function createPaidRegionalMotherWorld({modern=false,inheritedPhenotype=false}={}){
  const options={player:false,bootstrap:false,worldGenerator:'planetary/1',
    autonomousPopulations:true,autonomousEvolution:true,
    dayClock:modern,metabolism:modern,foodProperties:modern,tissueWater:modern,
    winterWater:modern,tissueEnergy:modern,perennialRegrowth:modern};
  const source=new Simulation('PLANET-B0-A',options);
  const point=source.safeSpawn('mosskip',source.pickHabitatCenter('mosskip')),founders=[];
  // Controlled initial adult positions/reserves/sex, optional inherited phenotype,
  // and prior classification. No post-conception trait, food, preference,
  // mutation-probability, gestation or establishment edit.
  for(let n=0;n<4;n++){
    const animal=source.spawnAnimal('mosskip',point.x,point.y);
    Object.assign(animal,{sex:n%2?'M':'F',age:SPECIES.mosskip.maturity+2,
      energy:SPECIES.mosskip.maxEnergy,hydration:SPECIES.mosskip.maxHydration,reproCooldown:0});
    founders.push(animal);
  }
  if(inheritedPhenotype)for(const parent of founders.slice(0,2))
    setProto(parent,{id:'dryland-skin',strength:.55,lineageDepth:3});
  if(modern)placeSupportedBreedingPair(source,founders[0],founders[1],{developDays:0});
  source.rebuildSpatial();source.populationMemory.observeResidence();source.populationMemory.advanceDay();
  const population=[...source.populationMemory.natural.records.values()].find(p=>p.scope==='regional-source');
  ensure(population,'The population authority must observe its actual source candidate');
  const [mother,father]=founders,branch=recordControlledBranch(source,mother,'paid',population,
    inheritedPhenotype?{id:'dryland-skin',pressure:'dryness'}:null);
  father.speciesBranch={...branch};source.evolutionTree.onIdentityAssigned(father,branch);
  const beforeEnergy=mother.energy+father.energy;
  const gate=source.conceptionAvailability(mother,father);ensure(gate.enabled,gate.reason);
  ensure(source.tryMate(mother,father)&&mother.pregnant,'The fixed pair must actually accept canonical conception');
  const afterEnergy=mother.energy+father.energy;
  ensure(afterEnergy<beforeEnergy,'Conception must spend real parent reserves');
  const witness=structuredClone(mother.pregnant.maternalInheritance.evolutionaryPopulationAtConception);

  const destination=new Simulation(source.seed,{...options,planetOrigin:{x:128,y:0},
    planetDescriptor:source.world.planet.descriptor});
  destination.nextId=source.nextId;
  const session={key:'0,0',snapshot:regionalSnapshot(source),biologicalMode:'canonical-ticks/1'};
  destination.planetaryTravel={schema:1,nextId:source.nextId,sessions:[session]};
  const context=dispersalContextFor(destination,'0,0',source.tickCount);ensure(context?.open('east'),'Actual neighbour must be open');
  let positioned=false;
  for(let y=8.5;y<118.5;y++)if(canOccupy(mother,source.world,125.5,y)&&context.arrival('east',125.5,y,mother)){
    mother.x=125.5;mother.y=y;positioned=true;break;
  }
  ensure(positioned,'Controlled pregnant carrier requires a physically valid seam');
  setDispersalContext(source,context);ensure(emigrate(source,mother,'east'),'Canonical emigration must accept the carrier');
  const emigrants=takeEmigrants(source);ensure(emigrants.length===1,'Only the actual pregnant carrier leaves');
  replaceControlledSession(session,source);
  ensure(deliverEmigrants(destination,context,emigrants).length===1,'Canonical delivery must retain the mother');
  const arrived=destination.animals.find(a=>a.id===mother.id);
  ensure(arrived?.pregnant,'Migration must not discard the real pregnancy');

  // Controlled active/archived role layout, with both physical worlds at tick
  // zero. The only actual inter-region organism movement was the one above.
  const archived=regionalSnapshot(destination);delete archived.core.planetaryTravel;delete archived.regionalWorlds;
  source.planetaryTravel={schema:1,nextId:source.nextId,sessions:[{
    key:'128,0',snapshot:archived,biologicalMode:'canonical-ticks/1',
  }]};
  source.evolutionTree.mergeRecordedHistory(destination.evolutionTree.recordedHistory());
  source.rebuildSpatial();syncPlanetaryBoundaryOwnership(source);
  return {simulation:source,motherId:mother.id,fatherId:father.id,branchId:branch.id,
    witness,beforeEnergy,afterEnergy,modern,inheritedPhenotype,populationStatus:population.status};
}

export function reachPendingRegionalBirth(fixture,{controls=[],maxTicks=6000}={}){
  const sim=fixture.simulation;
  for(let ticks=0;ticks<=maxTicks;ticks++){
    const due=pendingRegionalBiology(sim);
    const session=due.find(s=>s.snapshot.animals.some(a=>a.id===fixture.motherId));
    if(session){
      const mother=session.snapshot.animals.find(a=>a.id===fixture.motherId);
      const from=session.snapshot.core.tickCount;
      const to=Math.min(sim.tickCount,from+CFG.lifeStride),dayTicks=dayTicksFor(session.snapshot.core);
      if(mother?.alive&&mother.pregnant?.days===1&&Math.floor(to/dayTicks)>Math.floor(from/dayTicks))
        return {session,ticks};
    }
    if(ticks===maxTicks)break;
    sim.update(null);for(const control of controls)control.update(null);
  }
  throw Error('No actual pending final gestation day within the controlled bound');
}
