import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES,GENE_KEYS,phenotypeFor} from '../src/organisms/species.js';
import {RNG} from '../src/core/rng.js';
import {inheritLineageGenes,inheritLineageAdaptations,adaptationCarryChance,emergentAdaptation,rankEmergentAdaptations} from '../src/lineage/heredity.js';
import {buildSuccessorChoices} from '../src/ui/succession-chooser.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from '../src/persistence/save-manager.js';

// v1.31 Succession as Selection.
const flat=v=>Object.fromEntries(GENE_KEYS.map(k=>[k,v]));

// Variation appears in actual offspring: siblings differ, and the mate's genes matter.
{
  const rng=new RNG('HEREDITY'),a=flat(1),fast={...flat(1),motion:1.2},slow={...flat(1),motion:.85};
  const sibs=Array.from({length:40},()=>inheritLineageGenes(rng,a,a,GENE_KEYS));
  const motions=sibs.map(g=>g.motion),spread=Math.max(...motions)-Math.min(...motions);
  assert.ok(spread>.08,`siblings from the same pair differ visibly (motion spread ${spread.toFixed(3)})`);
  const withFast=Array.from({length:40},()=>inheritLineageGenes(rng,a,fast,GENE_KEYS).motion),withSlow=Array.from({length:40},()=>inheritLineageGenes(rng,a,slow,GENE_KEYS).motion);
  const avg=v=>v.reduce((x,y)=>x+y,0)/v.length;assert.ok(avg(withFast)-avg(withSlow)>.12,'choosing a faster mate gives faster young on average');
  for(const g of sibs)for(const k of GENE_KEYS)assert.ok(g[k]>=.72&&g[k]<=1.28);
}

// Adaptations: one parent passes it to most but not all young; both parents pass it to all.
{
  const rng=new RNG('CARRY'),p1={adaptations:['spring-tendons']},p2={adaptations:[]},both={adaptations:['spring-tendons']};
  let carried=0;for(let i=0;i<200;i++)if(inheritLineageAdaptations(rng,[p1,p2]).includes('spring-tendons'))carried++;
  assert.ok(carried>110&&carried<180,`single-parent adaptation carried by ${carried}/200`);
  for(let i=0;i<20;i++)assert.ok(inheritLineageAdaptations(rng,[p1,both]).includes('spring-tendons'));
  assert.equal(adaptationCarryChance('spring-tendons',p1,both),1);assert.equal(adaptationCarryChance('spring-tendons',p1,p2),CFG.heredity.singleParentCarry);
  const tier2=inheritLineageAdaptations(new RNG('T2'),[{adaptations:['camouflage-mantle','adaptive-chromatophores']},{adaptations:['camouflage-mantle','adaptive-chromatophores']}]);
  assert.ok(tier2.includes('camouflage-mantle')&&tier2.includes('adaptive-chromatophores'),'an upgrade keeps its foundation');
}

// New adaptations appear in newborns, weighted by what the parents lived through.
{
  const ranked=rankEmergentAdaptations(new Set(),[{kind:'dryness',score:20}]);assert.equal(ranked[0][0],'water-sacs','thirst points toward water-saving bodies');
  const sim=new Simulation('GENVO8-EMERGE',{player:true}),p=sim.player();
  sim.pressure.lifetimeSummary=()=>[{kind:'predation',score:30}];
  let fresh=0;const parents=[p,p];
  for(let i=0;i<200;i++){const child={adaptations:[]};if(emergentAdaptation(sim,child,parents))fresh++}
  assert.ok(fresh>20&&fresh<110,`some but not most newborns show a new adaptation (${fresh}/200)`);
  sim.pressure.lifetimeSummary=()=>[];let none=0;for(let i=0;i<50;i++)if(emergentAdaptation(sim,{adaptations:[]},parents))none++;
  assert.equal(none,0,'no lived pressure, no new adaptation');
}

// Real births through the simulation use the new heredity for the founder line only.
{
  const sim=new Simulation('GENVO8-BIRTHS',{player:true}),p=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex);
  p.adaptations=['heavy-jaw'];sim.pressure.lifetimeSummary=()=>[{kind:'predation',score:40}];
  const kids=[];for(let i=0;i<24;i++){p.pregnant={fatherId:mate.id,days:0,totalDays:16};const mother=p.sex==='F'?p:mate,father=p.sex==='F'?mate:p;mother.pregnant={fatherId:father.id,days:0,totalDays:16};kids.push(...sim.giveBirth(mother))}
  const lineageKids=kids.filter(k=>k.lineage);assert.ok(lineageKids.length>10);
  const carriers=lineageKids.filter(k=>k.adaptations.includes('heavy-jaw')).length;assert.ok(carriers>0&&carriers<lineageKids.length,'siblings differ in which adaptations they carry');
  assert.ok(lineageKids.some(k=>k.bornWith?.length),'some newborns show a new adaptation');
  const parentalTraits=new Set([...(p.adaptations||[]),...(mate.adaptations||[])]);for(const k of lineageKids)for(const id of k.bornWith||[]){assert.ok(k.adaptations.includes(id));assert.equal(parentalTraits.has(id),false,'birth labels describe actual new expression, not inherited or invented traits');assert.equal(k.birthVariationSource,'inherited-variation');}
  const sizes=lineageKids.map(k=>phenotypeFor(k).bodyScale);assert.ok(Math.max(...sizes)-Math.min(...sizes)>.05,'body differences are visible in the drawn size');
}

// The handoff draft is retired; succession is a comparison of living descendants.
{
  assert.equal(CFG.evolution.handoffDraft,false);
  const sim=new Simulation('GENVO8-CHOOSE',{player:true}),p=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex);
  const heirs=[];for(let i=0;i<3;i++){const c=sim.spawnAnimal('genvo',p.x+i,p.y,[p,mate]);sim.lineage.registerBirth(c,[p,mate]);c.age=SPECIES.genvo.maturity+2;heirs.push(c)}
  heirs[1].adaptations=['spring-tendons'];heirs[1].bornWith=['spring-tendons'];
  const choices=buildSuccessorChoices(sim);assert.equal(choices.length,3,'every grown descendant is a candidate');
  const c1=choices.find(c=>c.id===heirs[1].id);assert.ok(c1.adaptations.some(a=>a.born&&a.name==='Spring Tendons'),'cards show what a descendant was born with');
  assert.ok(choices.every(c=>c.body&&c.habits),'cards compare body and habits');
  sim.lineage.selectedHeirId=heirs[2].id;assert.equal(sim.lineage.handoffSelected(),true);assert.equal(sim.player().id,heirs[2].id,'the chosen descendant continues the line');
  assert.equal(sim.evolution.pending,null,'no pick-one-of-three draft at handoff');
}

// Saves: earned adaptations and an old pending draft choice survive migration.
{
  assert.ok(SAVE_SCHEMA>=4);
  const sim=new Simulation('GENVO8-SUCC-SAVE',{player:true}),p=sim.player();p.adaptations=['hardened-mantle'];
  sim.evolution.pending={fromId:1,toId:p.id,generation:p.generation,pressure:[],offers:[{id:'water-sacs',name:'Water Sacs'},{id:'efficient-gut',name:'Efficient Gut'}],chosen:null,handoff:null};
  const old=structuredClone(createSimulationSnapshot(sim));old.schema=3;for(const a of old.animals)delete a.bornWith;
  // v1.39.0 (creator decision 2026-10-09): saves start fresh; an older save is refused with a clear message.
  assert.throws(()=>restoreSimulationSnapshot(old),/predates GenVo's modular creature bodies/,'older saves are refused, not migrated');
  const cur=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim))),cp=cur.player();assert.ok(cur.evolution.offerFor(cp),'a pending choice survives a save');assert.ok(cur.evolution.choose('water-sacs'));assert.ok(cp.adaptations.includes('water-sacs'));
}
console.log('succession as selection ok');
