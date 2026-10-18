import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {interactAs} from './helpers/interaction.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('IMMUNITY-AWARENESS',{player:true});sim.endOpeningGrace('test');const p=sim.player();
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);assert(mate);
p.x=40;p.y=40;mate.x=43.2;mate.y=40;mate.age=SPECIES.genvo.maturity+5;mate.energy=105;mate.hydration=100;
const child=sim.spawnAnimal('genvo',40.9,40.3,[p,mate]);sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);child.age=8;child.energy=94;child.hydration=92;child.careStress=.3;
const adult=sim.spawnAnimal('genvo',42.2,41.0,[p,mate]);sim.lineage.registerBirth(adult,[p,mate]);sim.family.registerBirth(adult,p,mate);adult.age=38;adult.energy=106;adult.hydration=100;
const rng0=sim.rng.state;
assert(sim.disease.infect(p,{force:true,source:'test'}));sim.disease.recover(p);assert(sim.disease.isImmune(p),'recovered player receives canonical temporary immunity');
let recovery=sim.illness.snapshot(p);assert(recovery.recovering&&recovery.immuneDays>0,'recovery snapshot exposes fever break and temporary immunity');
assert(sim.disease.infect(child,{force:true,source:'test'}));sim.rebuildSpatial();
assert.equal(sim.familyIllness.healthyCarer(child)?.id,p.id,'immune recovered parent is preferred for close sick-young care');
let snap=sim.familyIllness.snapshot(p);assert.equal(snap.infectedCount,1);assert(snap.immuneCount>=1,'family outbreak snapshot counts recovered immune relatives');
let dec=sim.familyIllness.decision(mate);assert(dec&&dec.intent==='illness-distance','susceptible co-parent continues making space');
dec=sim.familyIllness.decision(adult);assert(dec&&dec.intent==='illness-distance','susceptible adult relative continues making space');
p.x=child.x+.65;p.y=child.y;sim.rebuildSpatial();let hint=sim.interactionHint();assert.match(hint,/recovered immunity/i,'close-care prompt explains why recovered player can safely stay');const cared=interactAs(sim,assert,'illness-care');assert.equal(cared.ok,true);assert.equal(cared.type,'illness-care');assert(child.infected,'immune caregiving does not cure Marsh fever');
// A recovered immune non-parent can become the safest helper when both parents are susceptible.
const helper=adult;helper.infected=false;helper.immune=true;helper.immuneUntilDay=sim.disease.absoluteDay()+12;helper.x=child.x+2.6;helper.y=child.y+.1;p.immune=false;p.immuneUntilDay=0;mate.immune=false;mate.immuneUntilDay=0;
assert.equal(sim.familyIllness.healthyCarer(child)?.id,helper.id,'temporary immunity can make a healthy adult relative the safest close caregiver');dec=sim.familyIllness.decision(helper);assert(dec&&dec.intent==='illness-immune-care','immune non-parent actively stays with sick young');
// When an adult is sick, one immune adult may remain nearby while susceptible relatives distance.
sim.disease.recover(child);assert(sim.disease.infect(mate,{force:true,source:'test'}));helper.x=mate.x+3;helper.y=mate.y;sim.rebuildSpatial();dec=sim.familyIllness.decision(helper);assert(dec&&dec.intent==='illness-immune-support','immune adult can safely support a sick adult relative');
assert.equal(sim.rng.state,rng0,'immunity-aware family decisions consume no simulation RNG');
// Family membership cache must notice births registered within an already-cached tick.
const cacheSim=new Simulation('IMMUNITY-CACHE',{player:true});const cp=cacheSim.player(),cm=cacheSim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==cp.id);cacheSim.familyIllness.family();const late=cacheSim.spawnAnimal('genvo',cp.x+.7,cp.y+.2,[cp,cm]);cacheSim.lineage.registerBirth(late,[cp,cm]);cacheSim.family.registerBirth(late,cp,cm);assert(cacheSim.familyIllness.isFamilyAnimal(late),'same-tick birth invalidates family illness membership cache by animal count');
const headless=new Simulation('IMMUNITY-AWARENESS-HEADLESS',{player:false});const h=headless.animals.find(a=>a.species==='genvo');headless.disease.infect(h,{force:true,source:'test'});headless.disease.recover(h);headless.familyIllness.phase();assert.equal(headless.familyIllness.snapshot(h),null,'player:false ecology creates no immunity-aware family response state');
console.log('immunity awareness checks: PASS');
