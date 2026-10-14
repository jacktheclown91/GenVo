import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

const sim=new Simulation('FAMILY-ILLNESS',{player:true});sim.endOpeningGrace('test');const p=sim.player();
const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);assert(mate);
p.x=40;p.y=40;mate.x=41;mate.y=40;mate.age=SPECIES.genvo.maturity+4;mate.energy=SPECIES.genvo.maxEnergy*.9;mate.hydration=SPECIES.genvo.maxHydration*.9;
const child=sim.spawnAnimal('genvo',41.4,40.3,[p,mate]);sim.lineage.registerBirth(child,[p,mate]);sim.family.registerBirth(child,p,mate);child.age=8;child.energy=95;child.hydration=90;child.careStress=.16;
const adult=sim.spawnAnimal('genvo',40.8,41.1,[p,mate]);sim.lineage.registerBirth(adult,[p,mate]);sim.family.registerBirth(adult,p,mate);adult.age=38;adult.energy=105;adult.hydration=100;
sim.rebuildSpatial();const rng0=sim.rng.state;assert(sim.disease.infect(p,{force:true,source:'test'}));assert.equal(sim.rng.state,rng0,'family illness response starts without simulation RNG');
let dec=sim.familyIllness.decision(child);assert(dec&&dec.intent==='illness-buffer','healthy dependent buffers away from a sick caregiver toward healthy care');assert.equal(dec.target.caregiverId,mate.id,'healthy parent becomes the temporary buffer target');
child.caregiverId=mate.id;const careView=sim.family.priorityChild(p);assert.notEqual(careView?.need,'separation','young beside a healthy co-parent is not falsely reported as separated from family');
dec=sim.familyIllness.decision(adult);assert(dec&&['illness-distance','illness-buffer'].includes(dec.intent),'susceptible adult avoids unnecessary close contact');
// Sick dependent keeps one healthy caregiver close while another susceptible relative makes space.
sim.disease.recover(p);assert(sim.disease.infect(child,{force:true,source:'test'}));mate.x=43.8;mate.y=40;adult.x=41.1;adult.y=40.5;sim.rebuildSpatial();
assert.equal(sim.familyIllness.healthyCarer(child)?.id,p.id,'recovered immune parent is the safest caregiver for sick young');
dec=sim.familyIllness.decision(mate);assert(dec&&dec.intent==='illness-distance','other susceptible parent makes space while immune caregiver stays with sick young');
dec=sim.familyIllness.decision(adult);assert(dec&&dec.intent==='illness-distance','other susceptible relative makes space from sick young');
p.x=child.x+.7;p.y=child.y;const hint=sim.interactionHint();assert.match(hint,/Check sick G/i,'player gets explicit sick-young care interaction');const cared=sim.playerInteract({kind:'creature',id:child.id},'illness-care');assert.equal(cared.ok,true);assert.equal(cared.type,'illness-care');assert(child.infected,'care does not magically cure Marsh fever');
// Recovery opens a short family regroup window rather than permanent spacing.
sim.disease.recover(child);const after=sim.familyIllness.snapshot(p);assert(after?.after,'family illness aftermath opens after the final fever breaks');adult.x=48;adult.y=40;dec=sim.familyIllness.decision(adult);assert(dec&&dec.intent==='illness-regroup','healthy relatives regroup after fever clears');
assert.equal(sim.rng.state,rng0,'family illness positioning/care consumes no simulation RNG');
const headless=new Simulation('FAMILY-ILLNESS-HEADLESS',{player:false});const h=headless.animals.find(a=>a.species==='genvo');headless.disease.infect(h,{force:true,source:'test'});headless.familyIllness.phase();assert.equal(headless.familyIllness.snapshot(h),null,'player:false ecology creates no family illness response state');
console.log('family illness checks: PASS');
