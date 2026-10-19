import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {createDraft,place} from '../src/lineage/evolution-draft.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {flightMass} from '../src/lineage/flight.js';
import {canOccupy,movementProfile} from '../src/lineage/lifestyle.js';
import {CANOPY,canopySupport,canopyGrips,checkCanopyHold,canAccessCanopyNest} from '../src/ecology/canopy-site.js';
import {constructNest,nestCareAvailability,careForNest,eggFeedingAvailability,advanceNests} from '../src/reproduction/egg-ecology.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

let draft=createDraft({base:founderPlan(),ancestry:[],budget:8});
for(const id of ['filament-tuft','feather-mantle','proto-wing','flight-wing']){
 const next=createDraft({base:draft.plan,ancestry:[...draft.ancestry],budget:8});
 assert.ok(place(next,id,'root','dorsal').ok,id);draft=next;
}
let replacements=0;
const body=makePlan(draft.plan.nodes.map(n=>{
 if(n.partId==='walking-leg'&&replacements<2){replacements++;return{partId:'grasper',parent:n.parent,socket:n.socket}}
 return{partId:n.partId,parent:n.parent,socket:n.socket}
}));
assert.equal(replacements,2);assert.ok(validatePlan(body).ok);
const sim=new Simulation('E9-CANOPY',{player:true}),w=sim.world,p=sim.player();
p.bodyPlan=body;p.age=SPECIES[p.species].maturity+1;p.energy=80;p.hydration=50;p.health=100;
assert.ok(flightMass(p)<2.25);
assert.equal(canopyGrips(p),2);
// Use a real land cell and set existing Woodspire's single authoritative
// plant stock. Notify the canonical seed/tissue accounting of the change.
let cell=-1;for(let i=0;i<w.len;i++){let x=i%w.n+.5,y=(i/w.n|0)+.5;if(w.isPlayable(x,y)&&!w.water[i]&&w.plants.woodspire[i]>.4){cell=i;break}}
assert.ok(cell>=0,'generated world has living mature woody habitat');
p.x=cell%w.n+.5;p.y=(cell/w.n|0)+.5;
const old=w.plants.woodspire[cell];w.plants.woodspire[cell]=1.6;sim.dispersal.noteGrowth('woodspire',cell,old,1.6);
assert.ok(canopySupport(w,p.x,p.y).supported);
assert.equal(sim.roostStatus().enabled,false,'surface cannot roost without flight');
assert.ok(sim.playerToggleFlight().ok,'takeoff uses flight genetics');
const roost=sim.playerToggleRoost();assert.ok(roost.ok,roost.message);
assert.equal(p.airborne,false);assert.equal(p.perched,true);
assert.equal(movementProfile(p,w,{toX:p.x+1,toY:p.y}).allowed,false,'roost cannot walk through midair');
assert.equal(canOccupy(p,w,p.x+2,p.y),false);
const metBefore=p.energy;sim.phaseClimate();sim.phaseMetabolism();assert.ok(p.energy<metBefore,'roost remains subject to ordinary bodily metabolism');
assert.equal(sim.resourceAvailability('eat').enabled,false,'no surface grazing from canopy');
assert.ok(sim.canopyFoodAvailability().enabled,'canonical canopy crop and compatible mouth');
const cropBefore=w.plants.woodspire[cell],seedsBefore=sim.dispersal.seedReserve.woodspire[cell];
p.energy=20;const meal=sim.playerCanopyFeed();assert.ok(meal.ok,meal.message);
assert.ok(w.plants.woodspire[cell]<cropBefore);
assert.ok(sim.dispersal.seedReserve.woodspire[cell]<seedsBefore,'feeding draws finite propagule tissue');
assert.ok(p.seedCargo?.woodspire?.load>0,'intact seeds enter the ordinary wildlife transport system');
// Restock only for isolation of the structural nest contract after harvesting.
const prior=w.plants.woodspire[cell];w.plants.woodspire[cell]=1.6;sim.dispersal.noteGrowth('woodspire',cell,prior,1.6);
const nestBefore=w.plants.woodspire[cell];
const nest=constructNest(sim,p);assert.ok(nest,'actual parent funds elevated nest');
assert.equal(nest.layer,'canopy');assert.equal(nest.material,'woodspire');
assert.ok(w.plants.woodspire[cell]<nestBefore,'building spends living tree material');
const egg={id:9001,motherId:p.id,fatherId:-1,nestId:nest.id,x:p.x,y:p.y,energy:2,hydration:1,condition:1,incubationDays:5};
sim.eggs.push(egg);
assert.ok(nestCareAvailability(sim,p,nest).enabled,'canopy parent can tend real clutch');
const energyBefore=p.energy;assert.equal(careForNest(sim,p,nest),true);assert.ok(p.energy<energyBefore);
const stalker=sim.animals.find(a=>a.alive&&!a.player);stalker.x=p.x;stalker.y=p.y;
assert.equal(canAccessCanopyNest(stalker,w,nest),false);
assert.equal(eggFeedingAvailability(sim,stalker,egg).enabled,false,'ground fauna cannot raid tree clutches');
p.perched=false;assert.equal(nestCareAvailability(sim,p,nest).enabled,false,'surface parent cannot remotely tend canopy');
p.perched=true;
const snap=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'e9'})));
assert.ok(snap.player().perched,'save/load preserves real perch state');
assert.equal(snap.nests.find(n=>n.id===nest.id).layer,'canopy','save/load preserves nest height');
assert.equal(snap.world.plants.woodspire[cell],w.plants.woodspire[cell]);
const integrity=nest.integrity;w.plants.woodspire[cell]=0.15;advanceNests(sim);
assert.ok(nest.integrity<integrity-.1,'tree depletion weakens elevated egg cover');
const health=p.health,failed=checkCanopyHold(p,w);assert.ok(failed?.forced);
assert.equal(p.perched,false);assert.equal(p.health,health-CANOPY.fallingDamage);
assert.equal(sim.roostStatus().enabled,false);
console.log('E9 canopy: inherited flight + two grips, real tree support, grounded vs roost flight states, finite food and nests, parental egg care, height-separated raids, canopy collapse, save PASS');
