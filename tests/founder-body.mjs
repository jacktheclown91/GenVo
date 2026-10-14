import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {replaceRoot,place} from '../src/lineage/evolution-draft.js';
import {founderPlan,mutatePlan,reconcileTraits,inheritBody} from '../src/lineage/body-inheritance.js';
import {partEffectFactors} from '../src/lineage/part-abilities.js';
import {movementProfile} from '../src/lineage/lifestyle.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from '../src/persistence/save-manager.js';

// New creature vision (creator decision 2026-10-09): every GenVo8 starts with a small body, four
// legs, a grazing mouth and two simple eyes, at the original speed; more legs are faster; wild
// GenVo8s start the same and evolve their own bodies; saves start fresh.

const legsOf=a=>a.bodyPlan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)).length;
{const sim=new Simulation('GENVO8-FOUNDER',{player:true}),g=sim.animals.filter(a=>a.species==='genvo');
 for(const a of g){assert.equal(a.bodyPlan.nodes.find(n=>!n.parent).partId,'small-torso');assert.equal(legsOf(a),4);assert.equal(a.bodyPlan.nodes.find(n=>n.socket==='mouth').partId,'grazing-mouth');assert.equal(a.bodyPlan.nodes.filter(n=>n.socket?.startsWith('eye')).every(n=>n.partId==='simple-eye'),true)}
 const p=sim.player(),pf=partEffectFactors(p);assert.equal(pf.landSpeed,1,'the founder moves at the original speed');assert.equal(pf.metabolism,1,'and eats as before');
 const w=sim.world;let i=0;while(w.water[i])i++;const x=i%CFG.worldSize+.5,y=Math.floor(i/CFG.worldSize)+.5;assert.equal(movementProfile(p,w,{fromX:x,fromY:y,toX:x,toY:y}).speed,1);
 // Living wildlife (v1.45.0): other species start from their own body plan, built from the same parts.
 for(const a of sim.animals.filter(a=>a.species!=='genvo')){assert.ok(a.bodyPlan,'wild species have bodies');assert.notEqual(a.bodyPlan.nodes.find(n=>!n.parent).partId,'small-torso')}}

// Inheritance: a newborn takes a parent's body; variation is occasional, reachable and seeded.
{const runs=[];for(let r=0;r<2;r++){const sim=new Simulation('GENVO8-INHERIT',{player:false});const out=[];const g=sim.animals.filter(a=>a.alive&&a.species==='genvo');
  for(let k=0;k<200;k++){const mum=g[k%g.length],dad=g[(k+1)%g.length],child={species:'genvo',alive:true,adaptations:[],genes:{...mum.genes}};inheritBody(sim,child,mum,dad);out.push(child.bodyPlan.id)}runs.push(out)}
 assert.deepEqual(runs[0],runs[1],'the same seed gives the same bodies');const varied=runs[0].filter(id=>id!==founderPlan().id).length;assert.ok(varied>20&&varied<110,`some, not most, newborns vary (${varied}/200)`)}
{const rng={i:0,int(a,b){return a+(this.i++%(b-a+1))},chance(){return true},next(){return .1}};let plan=founderPlan(),changed=0;
 for(let k=0;k<40;k++){const next=mutatePlan(rng,plan);if(next.id!==plan.id)changed++;plan=next}assert.ok(changed>10,'bodies keep evolving over generations');}

// Traits from heredity or lived pressure become visible parts.
{const p=reconcileTraits(founderPlan(),['heavy-jaw','spring-tendons','hardened-mantle']),ids=p.nodes.map(n=>n.partId);
 assert.ok(ids.includes('tearing-jaw')&&ids.includes('spring-leg')&&ids.includes('armor-plate'))}

// The editor grows a founder: a soft torso adds leg slots, and more legs are faster.
{const sim=new Simulation('GENVO8-FOUNDER-EDIT',{player:true}),p=sim.player();p.generation=2;p.age=SPECIES.genvo.maturity+5;
 const m=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex);m.age=SPECIES.genvo.maturity+5;
 const mum=p.sex==='F'?p:m,dad=p.sex==='F'?m:p;mum.pregnant={fatherId:dad.id,days:1,totalDays:16,startedDay:sim.day,startedYear:sim.year};sim.reproduction.onMated(p,m);
 const d=sim.evolutionEditor.openDraft();assert.equal(d.base.nodes.find(n=>!n.parent).partId,'small-torso');
 assert.equal(place(d,'walking-leg','root','limb.2').ok,false,'a small body has no side leg slots');
 assert.equal(replaceRoot(d,'sleek-torso').ok,false,'bigger bodies come later in the lineage');
 assert.equal(replaceRoot(d,'soft-torso').ok,true);place(d,'walking-leg','root','limb.2');place(d,'walking-leg','root','limb.6');
 const r=sim.evolutionEditor.commit(d);assert.equal(r.ok,true,JSON.stringify(r.problems));const kids=sim.giveBirth(mum);assert.ok(kids.length);
 for(const k of kids){assert.equal(k.bodyPlan.nodes.find(n=>!n.parent).partId,'soft-torso');assert.equal(legsOf(k),6);assert.ok(partEffectFactors(k).landSpeed>1,'six legs are faster than four')}
 // Saves keep the new bodies; older saves are refused.
 const snap=structuredClone(createSimulationSnapshot(sim)),r2=restoreSimulationSnapshot(structuredClone(snap));assert.deepEqual(r2.animals.find(a=>a.id===kids[0].id).bodyPlan,kids[0].bodyPlan);
 assert.equal(SAVE_SCHEMA,10);const old={...snap,schema:8};assert.throws(()=>restoreSimulationSnapshot(old),/earlier GenVo8/)}
console.log('founder body ok');
