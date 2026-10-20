import assert from 'node:assert/strict';
import {stepClimb} from '../src/lineage/climbing.js';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {founderPlan,mutatePlan,recombineBodyPlans} from '../src/lineage/body-inheritance.js';
import {createDraft,place,whyNot} from '../src/lineage/evolution-draft.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {PARTS,registryProblems} from '../src/lineage/part-registry.js';
import {GLIDING,hasGlidingSurfaces,glideGround,glidingAvailability,launchGlide,stepGlide,endGlide} from '../src/lineage/gliding.js';
import {advanceFlight} from '../src/lineage/flight.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {RNG} from '../src/core/rng.js';

assert.deepEqual(registryProblems(),[]);
assert.ok(!PARTS.patagium.tags.includes('exclusive'));
let d=createDraft({base:founderPlan(),ancestry:[],budget:8});
assert.match(whyNot(d,'patagium','root','flank.left'),/Requires/);
for(const id of ['grasper','climber-leg']){
 const next=createDraft({base:d.plan,ancestry:[...d.ancestry],budget:8});
 for(const socket of ['limb.1','limb.7'])assert.ok(place(next,id,'root',socket).ok,id);
 d=next;
}
const climbing=d.plan;
const membrane=createDraft({base:climbing,ancestry:climbing.nodes.map(n=>n.partId),budget:8});
for(const side of ['left','right'])assert.ok(place(membrane,'patagium','root','flank.'+side).ok);
const body=membrane.plan;
assert.ok(validatePlan(body).ok&&hasGlidingSurfaces({bodyPlan:body}));
assert.ok(!hasGlidingSurfaces({bodyPlan:makePlan(body.nodes.filter(n=>n.socket!=='flank.right'))}));
let witness=null;
for(let i=0;i<1000&&!witness;i++){const candidate=mutatePlan(new RNG('GLIDE-WITNESS-'+i),climbing);if(hasGlidingSurfaces({bodyPlan:candidate}))witness=candidate;}
assert.ok(witness,'normal mutation operator has a legal bilateral membrane route');
assert.ok(hasGlidingSurfaces({bodyPlan:recombineBodyPlans(new RNG('GLIDE-INHERIT'),body,body)}));
for(let i=0;i<100;i++)assert.ok(!mutatePlan(new RNG('GLIDE-LEGACY-'+i),climbing,{gliding:false}).nodes.some(n=>n.partId==='patagium'));

const sim=new Simulation('GLIDING-INTEGRATION'),p=sim.player(),w=sim.world;
p.bodyPlan=body;p.age=SPECIES[p.species].maturity+1;p.energy=90;p.health=100;
// Constructed physiology fixture: existing Woodspire stock, notified through
// its canonical tissue authority. No claim of natural evolution or human play.
let cell=-1;
for(let i=0;i<w.len;i++)if(w.isPlayable(i%w.n+.5,(i/w.n|0)+.5)&&!w.water[i]&&w.plants.woodspire[i]>.05){cell=i;break;}
assert.ok(cell>=0);
p.x=cell%w.n+.5;p.y=(cell/w.n|0)+.5;p.dir=2;
const old=w.plants.woodspire[cell];w.plants.woodspire[cell]=1.6;sim.dispersal.noteGrowth('woodspire',cell,old,1.6);
const energy=p.energy;
assert.ok(sim.playerToggleRoost().ok,'climbing legs reach actual living canopy without wings');
while(p.climb)stepClimb(sim,p,.1);
assert.ok(p.perched&&p.energy<energy,'climbing consumes finite body energy');
assert.ok(sim.glidingStatus().enabled);
assert.ok(sim.playerToggleGlide().ok);assert.equal(p.glideAltitude,glideGround(w,p.x,p.y)+GLIDING.canopyHeight);
assert.equal(sim.playerToggleFlight().ok,false,'powered flight cannot bypass glide physics');
assert.equal(sim.resourceAvailability('drink').enabled,false);
const before=structuredClone(p),x=p.x,z=p.glideAltitude,e=p.energy;
assert.equal(advanceFlight(p,w,1),null,'no powered wing drain or automatic wingless fall');assert.equal(p.energy,e);
sim.playerControlStep({});assert.ok(p.x>x&&p.glideAltitude<z&&p.energy<e,'releasing input cannot hover');
assert.equal(sim.playerInputActive({}),true,'external control owns even an unsteered glide');
const save=createSimulationSnapshot(sim,{savedAt:'fixed'}),restored=restoreSimulationSnapshot(structuredClone(save));
assert.equal(restored.glidingRules,GLIDING.policy);assert.deepEqual(restored.player(),p);
sim.phasePlayerMovement({}, {stepHz:8});restored.phasePlayerMovement({}, {stepHz:8});assert.deepEqual(restored.player(),p);
const broken=structuredClone(save);broken.animals.find(a=>a.id===p.id).glideAltitude=NaN;
assert.throws(()=>restoreSimulationSnapshot(broken),/glide state/);
const unknown=structuredClone(save);unknown.core.glidingRules='unknown/1';assert.throws(()=>restoreSimulationSnapshot(unknown),/gliding rules/);
const legacy=structuredClone(save);delete legacy.core.glidingRules;
for(const a of legacy.animals){delete a.aerialMode;delete a.glideAltitude;delete a.glideHeading;a.airborne=false;}
const historical=restoreSimulationSnapshot(legacy);assert.equal(historical.glidingRules,undefined);assert.equal(historical.glidingStatus().enabled,false);

// Same physical initial state, player and wildlife integration paths.
const wild=structuredClone(before);wild.id=sim.nextId++;wild.player=false;wild.target=null;wild.intent='idle';sim.animals=[wild];sim.playerId=null;
sim.phaseMovement();const direct=structuredClone(before);stepGlide(direct,w,1/8);
for(const k of ['x','y','energy','glideAltitude','glideHeading'])assert.equal(wild[k],direct[k],k+' shared autonomous physics');
let ticks=0;while(wild.aerialMode==='glide'&&ticks++<1000)sim.phaseMovement();
assert.ok(ticks<1000&&!wild.airborne,'gliding always ends; no permanent aerial layer');
const controlled=structuredClone(before);controlled.player=true;controlled.id=sim.nextId++;controlled.glideAltitude=glideGround(w,controlled.x,controlled.y)+.001;
sim.animals=[controlled];sim.playerId=controlled.id;sim.advanceGlide(controlled,.125);
const landingNotice=sim.playerCombat.consumeResult();assert.equal(landingNotice.type,'glide-land');assert.equal(landingNotice.damage,controlled.lastFlightIncident.damage);assert.equal(landingNotice.water,controlled.lastFlightIncident.water,'automatic glide landing reaches player feedback with its actual surface');
const flat={water:new Uint8Array(100),terrain:{elevation:new Float32Array(100)},idx:(x,y)=>Math.floor(y)*10+Math.floor(x),isPlayable:(x,y)=>x>=0&&y>=0&&x<10&&y<10};
const actor=structuredClone(before);actor.x=4.5;actor.y=4.5;actor.glideAltitude=1;actor.glideHeading=0;actor.energy=90;
assert.equal(glidingAvailability({world:flat,glidingRules:GLIDING.policy}, {...actor,airborne:false,aerialMode:undefined,perched:false}).enabled,false,'flat ground cannot launch');
flat.water[flat.idx(actor.x,actor.y)]=1;const health=actor.health;endGlide(actor,flat);assert.equal(actor.health,health-GLIDING.waterDamage,'no free rescue above water');
const crash=structuredClone(before);crash.x=4.5;crash.y=4.5;crash.glideAltitude=1;crash.glideHeading=0;flat.terrain.elevation[flat.idx(4.8,4.5)]=1;flat.water.fill(0);
stepGlide(crash,flat,.125);assert.ok(!crash.airborne&&crash.health<before.health,'rising terrain ends glide with injury');
console.log('Gliding PASS: precursor/mutation/inheritance, costed tree climb, shared continuous descent, player/wild parity, finite landing, water/collision costs, exact continuation, legacy policy and corrupt-save rejection.');
