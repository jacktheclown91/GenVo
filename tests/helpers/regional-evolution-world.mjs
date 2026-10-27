import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES} from '../../src/organisms/species.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../../src/world/planetary-travel.js';
import {createSimulationSnapshot} from '../../src/persistence/save-manager.js';
import {markRegionalOwnerDirty} from '../../src/world/regional-revision.js';

export const regionalSnapshot=sim=>structuredClone(createSimulationSnapshot(sim,
  {savedAt:'fixed',reason:'regional-evolution-history'}));
export function controlledEastCrossing(sim){
  // Favorable reserves and frontier placement are controlled test conditions.
  // Terrain approval, crossing, fauna founding and physiological cost are real.
  const actor=sim.player();
  actor.energy=SPECIES[actor.species].maxEnergy*.94;
  actor.hydration=SPECIES[actor.species].maxHydration*.95;
  for(let y=8.5;y<118.5;y++){
    actor.x=125.2;actor.y=y;sim.rebuildSpatial();
    if(planetaryTravelAvailability(sim).enabled){
      const crossed=crossPlanetaryBorder(sim);
      if(!crossed.ok)throw Error(crossed.message);
      return crossed.simulation;
    }
  }
  throw Error('Controlled source has no physically approved east crossing.');
}
export function createRegionalHistoryWorld(){
  return controlledEastCrossing(new Simulation('PLANET-B0-A',{
    player:true,worldGenerator:'planetary/1',autonomousPopulations:true,autonomousEvolution:true,
  }));
}
export function recordControlledBranch(sim,animal,suffix,population=null,trait=null){
  // Classification metadata is staged through the existing tree controller.
  // This tests transport/history only, never natural recognition qualification.
  const pop=population||{key:'natural:0,0:history-'+suffix,label:'Controlled history '+suffix,species:animal.species};
  const candidate=sim.speciation.branchFor(pop,trait||{id:'anatomy:walking-leg:gain',pressure:'locomotion'},
    {cohort:[animal]});
  const rng=sim.rng.state;
  const branch=sim.evolutionTree.onRecognize(candidate,{pop,cohort:[animal]});
  animal.speciesBranch={...branch};sim.evolutionTree.onIdentityAssigned(animal,branch);
  if(sim.rng.state!==rng)throw Error('Recorded identity must consume no biology RNG.');
  return branch;
}
export function replaceControlledSession(session,source){
  const snapshot=createSimulationSnapshot(source,{savedAt:session.snapshot.savedAt,reason:session.snapshot.reason});
  delete snapshot.regionalWorlds;
  if(session.biologicalLedger&&session.biologicalLedger.lastPopulation!==snapshot.animals.length)
    throw Error('Controlled fixture must use canonical publication for a changed replay population');
  markRegionalOwnerDirty(session);session.snapshot=structuredClone(snapshot);
}
