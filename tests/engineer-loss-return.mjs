import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {disturbanceAt} from '../src/ecology/soil-disturbance.js';

// One natural long observation and one deliberately staged causal comparison.
// Distinguishes 'work suspended' from actual species extinction.
if(!process.argv[2]){
 for(const mode of ['free-world','return-patch']){
  const r=spawnSync(process.execPath,[fileURLToPath(import.meta.url),mode],{stdio:'inherit',timeout:110000});
  assert.equal(r.status,0,`${mode}: failed or timed out (${r.error?.message||r.signal||r.status})`);
 }
 process.exit(0);
}

const mode=process.argv[2];
if(mode==='free-world'){
 const sim=new Simulation('EK-NATURAL-WORK-INTERRUPTION',{player:false});
 let work=0,staged=0,returned=0,lastDay=0;
 const digsByGeneration={};
 const original=sim.partAbilities.dig.bind(sim.partAbilities);
 const interrupted=()=>sim.day>=61&&sim.day<=128;
 sim.partAbilities.dig=actor=>{
  if(interrupted())return{ok:false,type:'dig',quiet:true,message:'Study pause: engineering activity suspended'};
  const result=original(actor);
  if(result.ok){assert.ok(hasPart(actor,'digging-forelimb'));
   work++;digsByGeneration[actor.generation]=(digsByGeneration[actor.generation]||0)+1;
   if(sim.day<=60)staged++;else returned++;
  }
  return result;
 };
 while(sim.day<=168){
  sim.update(null);
  if(sim.day!==lastDay){lastDay=sim.day;
   if(sim.day===60||sim.day===128||sim.day===168){
    let strength=0;for(const [cell] of sim.partAbilities.soilDisturbance)strength+=disturbanceAt(sim.partAbilities.soilDisturbance,cell,sim.day);
    console.log('natural ecological observation',JSON.stringify({day:sim.day,completedDigs:work,soilCells:sim.partAbilities.soilDisturbance.size,soilStrength:+strength.toFixed(4),population:sim.population()}));
    if(sim.day===128){assert.equal(strength,0,'All unmaintained patches recover over the 68-day period');assert.equal(work,staged,'No successful digging during the work-interruption experiment');}
   }
  }
 }
 assert.ok(staged>10,'Unassisted wildlife must engineer the world before intervention');
 assert.ok(returned>10,'Unassisted wildlife resume engineering after cessation');
 assert.ok(Object.keys(digsByGeneration).some(n=>Number(n)>1),'Natural descendants perform renewed engineering');
 const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim)));
 assert.deepEqual(restored.regionalEcology.records,sim.regionalEcology.records,'Environmental engineering observations survive normal save/restore');
 const regions=[...sim.regionalEcology.records.values()].filter(r=>r.engineering?.digs);
 assert.ok(regions.length>0&&regions.some(r=>r.engineering.history?.length>0));
 assert.ok(regions.every(r=>r.engineering.history.length<=sim.regionalEcology.engineeringHistoryLimit));
 const total=regions.reduce((n,r)=>n+r.engineering.digs,0);
 assert.equal(total,work,'Regional dig receipts reconcile exactly with successful natural actions');
 console.log('natural-world restoration after 68-day work interruption: PASS',JSON.stringify({staged,returned,receipts:total,regions:regions.length,digsByGeneration}));
}else if(mode==='return-patch'){
 const sim=new Simulation('NATURAL-ENGINEERS-B',{player:false});
 while(sim.day<=60)sim.update(null);
 const descendant=sim.animals.find(a=>a.alive&&a.generation>=2&&hasPart(a,'digging-forelimb'));
 assert.ok(descendant,'Naturally born functional digging descendants must be present at the intervention');
 // A controlled translocation, not a natural emigration claim. Stage a cleared
 // island of cells to attribute new plant establishment only to prepared soil.
 const w=sim.world;let x=0,y=0;
 for(let cy=12;cy<w.n-12&&!x;cy++)for(let cx=12;cx<w.n-12;cx++){
  const i=w.idx(cx,cy);if(!w.water[i]&&w.fertility[i]>.68&&w.moisture[i]>.14&&w.moisture[i]<.56){x=cx;y=cy;break}
 }
 assert.ok(x>0,'Experimental plot requires naturally suitable exposed ground');
 const i=w.idx(x,y);w.plants.thistlepod[i]=0;w.seedBank.thistlepod[i]=0;sim.dispersal.active.thistlepod.delete(i);
 const snap=structuredClone(createSimulationSnapshot(sim));
 const absent=restoreSimulationSnapshot(structuredClone(snap));
 const returning=restoreSimulationSnapshot(structuredClone(snap));
 const keeper=restoreSimulationSnapshot(structuredClone(snap));
 const worlds=[absent,returning,keeper];
 for(const world of worlds){world.day=61;world.tickCount=61*CFG.dayTicks;world.climate={temp:.58,rain:.45};}
 const workAt=(world,day)=>{
  world.day=day;world.tickCount=day*CFG.dayTicks;
  const animal=world.animals.find(a=>a.id===descendant.id);
  animal.x=x+.2;animal.y=y+.2;animal.digUntilTick=0;
  const result=world.partAbilities.dig(animal);
  assert.ok(result.ok,`Day ${day}: canonical digging with naturally born descendant: ${result.message}`);
 };
 for(const world of worlds)workAt(world,61);
 // Move the living study animal physically out of the patch in both absence
 // arms (no death/carrion is created); one descendant later returns. This is
 // an experimental translocation, not evidence of spontaneous migration.
 let offsite=null;
 for(let cy=w.n-12;cy>12&&!offsite;cy--)for(let cx=w.n-12;cx>12;cx--){
  if(!w.water[w.idx(cx,cy)]&&Math.hypot(cx-x,cy-y)>35){offsite={x:cx+.2,y:cy+.2};break}
 }
 assert.ok(offsite,'Study animal needs a viable offsite destination');
 for(const world of [absent,returning]){
  const animal=world.animals.find(a=>a.id===descendant.id);
  animal.x=offsite.x;animal.y=offsite.y;
 }
 const initial=absent.partAbilities.disturbedSoilAt(x,y);
 assert.ok(initial>0,'All plots start with actual completed digging');
 let erosionAt=0;
 for(let day=62;day<=142;day++){
  for(const world of worlds){world.day=day;world.tickCount=day*CFG.dayTicks;world.climate={temp:.58,rain:.45};}
  // Long-lived diggers in the maintenance case continue to renew the plot.
  if(day>=68&&day<=145&&(day-68)%7===0)workAt(keeper,day);
  // Translocated descendant returns to the study patch on day 132; it remains
  // without completed digs during that interval in the other two worlds.
  if(day===132)workAt(returning,day);
  if(day===139)workAt(returning,day);
  if(day===129){
   for(const world of [absent,returning]){
    assert.equal(world.partAbilities.disturbedSoilAt(x,y),0,'Ground recovers during 68-day absence');
    assert.equal(world.partAbilities.soilDisturbance.has(i),false,'Recovered soil record is actually pruned');
   }
   assert.ok(keeper.partAbilities.disturbedSoilAt(x,y)>0,'Continuing local work maintains prepared ground');
   erosionAt=day;
  }
  if(day===140){
   for(const world of worlds){
    // Standardized fresh seedbed isolates NEW establishment from unrelated
    // local seed arrivals during the 79-day recovery interval.
    world.world.plants.thistlepod[i]=0;world.world.seedBank.thistlepod[i]=0;
    world.dispersal.active.thistlepod.delete(i);
    const planted=world.dispersal.deposit('thistlepod',x,y,.8);
    assert.ok(Math.abs(planted-.65)<1e-5,'Canonical deposit caps per-cell seed arrival at .65 in all comparison worlds');
   }
  }
  for(const world of worlds){world.phaseVegetation();world.regionalEcology.observe();}
 }
 const land=world=>world.world.plants.thistlepod[i],bank=world=>world.world.seedBank.thistlepod[i];
 assert.ok(land(returning)>land(absent),`Returning descendant creates more seed-funded plant biomass: ${land(returning)} vs ${land(absent)}`);
 assert.ok(land(keeper)>land(absent),'Uninterrupted maintenance also improves planted plot');
 assert.ok(bank(returning)>=0&&bank(absent)>=0&&bank(keeper)>=0,'Soil cannot create seeds');
 assert.ok(returning.partAbilities.disturbedSoilAt(x,y)>0,'Return restores ground modifier');
 assert.equal(absent.partAbilities.disturbedSoilAt(x,y),0,'Absent engineer leaves ground recovered');
 const key=returning.regionalEcology.keyAt(x,y);
 const trend=returning.regionalEcology.engineeringTrend(key);
 assert.ok(trend.some(t=>t.day<129&&t.soilStrength===0),'Regional record captures engineering disappearance');
 assert.ok(trend.some(t=>t.day>=132&&t.soilStrength>0),'Regional record captures renewed inherited work');
 assert.ok(trend.length<=returning.regionalEcology.engineeringHistoryLimit);
 const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(returning)));
 assert.deepEqual(restored.regionalEcology.engineeringTrend(key),trend,'Regional history persists through normal saving');
 assert.equal(restored.world.plants.thistlepod[i],returning.world.plants.thistlepod[i]);
 console.log('staged descendant relocation, finite soil recovery and restored seedling establishment: PASS',JSON.stringify({generation:descendant.generation,plot:[x,y],erosionAt,soil:{absent:absent.partAbilities.disturbedSoilAt(x,y),returning:returning.partAbilities.disturbedSoilAt(x,y),maintained:keeper.partAbilities.disturbedSoilAt(x,y)},plants:{absent:land(absent),returning:land(returning),maintained:land(keeper)},seedBank:{absent:bank(absent),returning:bank(returning),maintained:bank(keeper)},historyEntries:trend.length}));
}else throw Error('Unknown study mode');
