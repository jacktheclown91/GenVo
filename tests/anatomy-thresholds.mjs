import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {RNG} from '../src/core/rng.js';
import {ADAPTATION_IDS,ANATOMY_FOR,expressedAdaptations,anatomyFromAdaptations,syncAnatomy,nearThreshold} from '../src/lineage/evolution.js';
import {inheritLineageAnatomy,emergentAdaptation} from '../src/lineage/heredity.js';
import {buildSuccessorChoices} from '../src/ui/succession-chooser.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from '../src/persistence/save-manager.js';

// v1.32 consolidation Stage D: adaptations are thresholds of inherited anatomy.

// Every adaptation has a body part, and a tier 2 adaptation is the same part developed further.
for(const id of ADAPTATION_IDS)assert.ok(ANATOMY_FOR[id],`${id} has a body part`);
assert.deepEqual(expressedAdaptations(anatomyFromAdaptations(['heavy-jaw'])),['heavy-jaw']);
assert.deepEqual(expressedAdaptations(anatomyFromAdaptations(['crushing-jaw'])).sort(),['crushing-jaw','heavy-jaw'],'developing a jaw past the second threshold expresses both tiers');
for(const id of ADAPTATION_IDS){const ids=expressedAdaptations(anatomyFromAdaptations([id]));assert.ok(ids.includes(id),`${id} round-trips through anatomy`)}

// Inheritance: a body part one parent developed reaches most young, both parents reaches all.
{
  const rng=new RNG('ANATOMY'),p1={adaptations:['spring-tendons']},p2={adaptations:[]},p3={adaptations:['spring-tendons']};
  let n=0;for(let i=0;i<300;i++)if(inheritLineageAnatomy(rng,[p1,p2],i).spring>=.5)n++;
  assert.ok(n>170&&n<260,`single-parent body part carried by ${n}/300`);
  for(let i=0;i<30;i++)assert.ok(inheritLineageAnatomy(rng,[p1,p3],i).spring>=.5);
  const sibs=Array.from({length:12},(_,i)=>inheritLineageAnatomy(rng,[p1,p3],i).spring);assert.ok(new Set(sibs.map(v=>v.toFixed(3))).size>3,'siblings carry slightly different body parts');
}

// Lived pressure develops a body part over generations until it crosses its threshold.
{
  const sim=new Simulation('GENVO8-ANATOMY-DRIFT',{player:true});sim.pressure.lifetimeSummary=()=>[{kind:'dryness',score:30}];
  sim.rng.chance=()=>false; // no sudden variation: only gradual drift
  let parents=[{adaptations:[],anatomy:anatomyFromAdaptations([])},{adaptations:[],anatomy:anatomyFromAdaptations([])}],crossed=0,seenNear=false;
  for(let g=1;g<=8&&!crossed;g++){
    const child={adaptations:[],anatomy:inheritLineageAnatomy(sim.rng,parents,g)};child.adaptations=expressedAdaptations(child.anatomy);
    emergentAdaptation(sim,child,parents);if(child.adaptations.includes('water-sacs'))crossed=g;
    if(!crossed&&nearThreshold(child).some(x=>x.id==='water-sacs'))seenNear=true;
    parents=[child,{...child,anatomy:{...child.anatomy}}];
  }
  assert.ok(crossed>=2,`sustained dryness grew Water Sacs over ${crossed} generations rather than instantly`);
  assert.ok(seenNear,'a developing body part is visible before it is expressed');
}

// Directly edited adaptation lists (older saves, tests, the legacy draft) fold into anatomy.
{
  const a={adaptations:['grasping-limbs']};syncAnatomy(a);assert.ok(a.anatomy.forelimb>=.5);
  a.adaptations=[];syncAnatomy(a);assert.ok(a.anatomy.forelimb<.5&&a.anatomy.forelimb>.3,'a removed adaptation leaves the body part just below its threshold');
}

// Real births, the successor cards and saves.
{
  const sim=new Simulation('GENVO8-ANATOMY-BIRTH',{player:true}),p=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex);
  p.adaptations=['heavy-jaw','crushing-jaw'];mate.adaptations=['heavy-jaw'];
  const kids=[];for(let i=0;i<10;i++){const mother=p.sex==='F'?p:mate,father=p.sex==='F'?mate:p;mother.pregnant={fatherId:father.id,days:0,totalDays:16};kids.push(...sim.giveBirth(mother))}
  for(const k of kids.filter(k=>k.lineage)){assert.ok(k.anatomy,'newborns carry anatomy');assert.deepEqual(k.adaptations,expressedAdaptations(k.anatomy),'adaptations are exactly what anatomy expresses');assert.ok(k.adaptations.includes('heavy-jaw'),'both parents had a heavy jaw')}
  const heir=kids.find(k=>k.lineage);heir.age=40;heir.anatomy.armor=.4;
  const card=buildSuccessorChoices(sim).find(c=>c.id===heir.id);assert.ok(card.developing.includes('Hardened Mantle'),'successor cards show body parts close to a threshold');
  assert.ok(SAVE_SCHEMA>=6);
  const old=structuredClone(createSimulationSnapshot(sim));old.schema=5;for(const a of old.animals)delete a.anatomy;
  // v1.39.0 (creator decision 2026-10-09): saves start fresh; an older save is refused with a clear message.
  assert.throws(()=>restoreSimulationSnapshot(old),/earlier GenVo8/,'older saves are refused, not migrated');
}
console.log('anatomy thresholds ok');
