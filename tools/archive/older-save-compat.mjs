// Older-save compatibility (Phase 3H). Builds a save with an older source tree (e.g. extracted with
// `git archive HEAD src | tar -x -C <dir>`), restores it with the working tree, runs 60 more days and checks
// finiteness, population reconciliation and re-save. Usage: node tools/older-save-compat.mjs <oldTreeDir>
import {pathToFileURL} from 'node:url';
const H=process.argv[2];if(!H)throw Error('usage: node tools/older-save-compat.mjs <oldTreeDir>');
const OldSim=(await import(pathToFileURL(H+'/src/sim/simulation.js').href)).Simulation;
const OldSave=await import(pathToFileURL(H+'/src/persistence/save-manager.js').href);
const NewSave=await import('../../src/persistence/save-manager.js');
const {SPECIES}=await import('../../src/organisms/species.js');
let ok=true;
for(const player of [true,false]){
  const old=new OldSim('OLD-SAVE-COMPAT',{player});if(player)old.setPlayerAutonomy?.(true);
  const d0=old.day;while(old.day<d0+40)old.update(null);
  const snap=structuredClone(OldSave.createSimulationSnapshot(old));
  const sim=NewSave.restoreSimulationSnapshot(snap);const alive0=sim.animals.filter(a=>a.alive).length,b0=sim.stats.births,dth0=sim.stats.deaths;
  const d1=sim.day;while(sim.day<d1+60)sim.update(null);
  const alive=sim.animals.filter(a=>a.alive),bad=alive.filter(a=>![a.x,a.y,a.energy,a.hydration,a.health,a.age].every(Number.isFinite));
  const recon=alive.length===alive0+(sim.stats.births-b0)-(sim.stats.deaths-dth0);
  const juv=alive.filter(a=>a.age<SPECIES[a.species].maturity).length,resave=!!structuredClone(NewSave.createSimulationSnapshot(sim));
  ok&&=bad.length===0&&recon&&resave;
  console.log(JSON.stringify({player,schemaOld:snap.schema,oldDay:old.day,day:sim.day,alive:alive.length,nonFinite:bad.length,populationReconciles:recon,foundingReport:sim.foundingReport??null,juveniles:juv,growthPaidSeen:alive.some(a=>a.growthPaid>0),resave}));
}
console.log(ok?'older save compatibility: PASS':'older save compatibility: FAIL');process.exit(ok?0:1);
