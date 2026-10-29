// inertia/1 (creator approval October 28, 0.20 s reference ramp): bodies carry
// velocity under a traction circle. Checks the exact integrator, size-scaled
// acceleration and turning, ice and water traction, arrival without overshoot,
// coasting, the player's ramp and braking at the 64 Hz control rate, kinetic
// work, saves and old worlds. Speed is never granted by size.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {INERTIA,REFERENCE_ACCELERATION,accelerationLimit,arrivalSpeed,integrateMotion,planMotion,kineticWork,motionStateOf,speedOf} from '../src/organisms/motion.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const close=(x,y,label,tol=1e-9)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`);
const sized=(a,s)=>{a.bodySize={schema:1,alleles:[Math.log(s),Math.log(s)]};return a};

// 1. The integrator is exact for a constant desired velocity: one long step equals many short ones.
{
 const runs=[[0,0,3,1,7,1],[2,-1,-2,1.5,10.75,.5],[1,1,1,1,4,2]];
 for(const [vx,vy,dx,dy,acc,T] of runs){
  const once=integrateMotion(vx,vy,dx,dy,acc,T);let v={vx,vy},x=0,y=0;
  for(let k=0;k<64;k++){const s=integrateMotion(v.vx,v.vy,dx,dy,acc,T/64);x+=s.dx;y+=s.dy;v=s}
  close(once.dx,x,'coarse = fine x');close(once.dy,y,'coarse = fine y');close(once.vx,v.vx,'coarse = fine vx');close(once.vy,v.vy,'coarse = fine vy');
 }
 // Reference body: walking speed in 0.20 s, reversal from walking in 0.40 s.
 close(REFERENCE_ACCELERATION,INERTIA.referenceSpeed/INERTIA.rampSeconds,'reference acceleration');
 const ramp=integrateMotion(0,0,2.15,0,REFERENCE_ACCELERATION,.2);close(ramp.vx,2.15,'reaches walking speed in 0.20 s');
 const half=integrateMotion(0,0,2.15,0,REFERENCE_ACCELERATION,.1);close(half.vx,2.15/2,'half way at 0.10 s');
 const rev=integrateMotion(2.15,0,-2.15,0,REFERENCE_ACCELERATION,.4);close(rev.vx,-2.15,'reverses in 0.40 s');
 close(arrivalSpeed(5,.5,10),Math.sqrt(10),'arrival speed stops on the point');assert.equal(arrivalSpeed(3,.5,10),3,'never above the anatomical speed');
}
// 2. Size: the same anatomy scaled by s accelerates at a_ref/s on firm ground; traction caps small bodies; ice and water.
{
 const ref={species:'genvo'},big=sized({species:'genvo'},2),small=sized({species:'genvo'},.5),tiny=sized({species:'genvo'},.4);
 close(accelerationLimit(ref),REFERENCE_ACCELERATION,'reference');close(accelerationLimit(big),REFERENCE_ACCELERATION/2,'2x body: half the acceleration');
 close(accelerationLimit(small),REFERENCE_ACCELERATION*2,'half-size body: muscle and firm-ground traction meet');
 close(accelerationLimit(tiny),REFERENCE_ACCELERATION*INERTIA.groundTraction,'smaller bodies are traction-limited');
 close(accelerationLimit(ref,{onIce:true}),REFERENCE_ACCELERATION*INERTIA.groundTraction*INERTIA.iceTraction,'ice slides');
 close(accelerationLimit(big,{onIce:true}),Math.min(REFERENCE_ACCELERATION/2,REFERENCE_ACCELERATION*2*.2),'ice binds every size');
 close(accelerationLimit(ref,{swimming:true}),REFERENCE_ACCELERATION*INERTIA.waterPropulsion,'water halves propulsion');
 close(accelerationLimit(ref,{traction:.5}),REFERENCE_ACCELERATION,'loose ground at half grip still allows the reference body');
 close(accelerationLimit(ref,{traction:.25}),REFERENCE_ACCELERATION*.5,'very loose ground limits it');
 // Turning: at sprint the 2x body needs twice the radius and twice the time to reverse.
 const v=3.33,rRef=v*v/accelerationLimit(ref),rBig=v*v/accelerationLimit(big);close(rBig,2*rRef,'turn radius doubles');
 const t=b=>{let s={vx:v,vy:0},n=0;while(s.vx>-v+1e-9&&n<1000){s=integrateMotion(s.vx,s.vy,-v,0,accelerationLimit(b),1/64);n++}return n/64};
 close(t(big),2*t(ref),'reversal time doubles',1e-6);
}
// 3. In the world: wildlife travel ramps up, stops on a fixed point and keeps no momentum there.
const opts={player:true,dayClock:true,metabolism:true,bodySize:true,inertia:true};
assert.throws(()=>new Simulation('INERTIA-BAD',{...opts,inertia:'inertia/9'}),/Unknown inertia policy/);
const sim=new Simulation('INERTIA-WORLD',opts),w=sim.world;assert.equal(sim.inertiaRules,INERTIA.policy);
w.water.fill(0);w.buildLandRegions();w.buildHydrology();
{
 const a=sim.animals.find(x=>x.alive&&!x.player);sim.animals=[sim.player(),a];sim.rebuildSpatial();
 sim.activity.movementBudget=()=>({advance:true,scale:1});sim.activity.ambientMoveAllowed=()=>true;
 Object.assign(a,{x:40.5,y:40.5,age:SPECIES[a.species].maturity,health:100,energy:SPECIES[a.species].maxEnergy*.9,intent:'explore',target:{x:46.5,y:40.5},torpor:false});delete a.motion;
 const speeds=[];let maxX=a.x;
 for(let k=0;k<40;k++){sim.phaseMovement({locomotionOnly:true});speeds.push(speedOf(a));maxX=Math.max(maxX,a.x)}
 assert.ok(speeds[0]>0&&speeds[0]<speeds[2],'speed ramps up over several ticks');
 assert.ok(maxX<=46.5+1e-9,'never passes its own target');close(a.x,46.5,'arrives on the target',1e-6);assert.equal(speedOf(a),0,'at rest on arrival');
 // Coasting: a moving body that stops steering brakes over distance instead of stopping dead.
 Object.assign(a,{x:40.5,y:40.5,intent:'explore',target:{x:60.5,y:40.5}});delete a.motion;
 for(let k=0;k<6;k++)sim.phaseMovement({locomotionOnly:true});const v0=speedOf(a),x0=a.x;assert.ok(v0>1);
 a.target=null;a.intent='idle';sim.phaseMovement({locomotionOnly:true});
 assert.ok(a.x>x0&&speedOf(a)<v0&&speedOf(a)>0,'coasts and brakes');
 for(let k=0;k<8;k++)sim.phaseMovement({locomotionOnly:true});assert.equal(speedOf(a),0,'comes to rest');
 const stop=a.x-x0;close(stop,v0*v0/(2*accelerationLimit(a,{traction:1}))+0,'braking distance v^2/2a',.25);
 // Background strides: one coarse stride covers what fine steps do toward the same far target.
 const run=stride=>{Object.assign(a,{x:40.5,y:40.5,intent:'explore',target:{x:70.5,y:40.5}});delete a.motion;
  sim.activity.movementBudget=()=>({advance:true,scale:stride});for(let k=0;k<8/stride;k++)sim.phaseMovement({locomotionOnly:true});return{x:a.x,v:speedOf(a)}};
 const fine=run(1),coarse=run(4);close(coarse.x,fine.x,'coarse strides cover fine distance',1e-6);close(coarse.v,fine.v,'and leave the same velocity',1e-6);
 sim.activity.movementBudget=()=>({advance:true,scale:1});
 // Kinetic work is charged once per start and never for steady travel.
 const p={from:{vx:0,vy:0},vx:3.33,vy:0};close(kineticWork(p,1.45),.5*3.33*3.33*1.45*INERTIA.kineticWork,'start work');assert.equal(kineticWork({from:{vx:2,vy:0},vx:2,vy:0},1.45),0);
}
// 3b. Courtship: a suitor inside the courtship radius keeps pace with a moving partner
// (found while building: coasting let partners drift apart and courtship reset).
{
 const [suitor,partner]=sim.animals.filter(x=>x.alive&&!x.player).length>=2?sim.animals.filter(x=>x.alive&&!x.player):[sim.animals[1],sim.spawnAnimal(sim.animals[1].species,40.5,44.5)];
 sim.animals=[sim.player(),suitor,partner];sim.rebuildSpatial();
 Object.assign(partner,{x:40.5,y:44.5,intent:'idle',target:null,motion:{schema:1,vx:1.5,vy:0,ax:0,ay:0}});
 Object.assign(suitor,{x:40.5,y:44.1,intent:'mate',target:partner});delete suitor.motion;
 sim.phaseMovement({locomotionOnly:true});
 assert.ok(suitor.motion&&suitor.motion.vx>0&&suitor.x>40.5,'the suitor moves with its partner instead of coasting to rest');
}
// 4. The player at the 64 Hz control rate: the same ramp, and releasing the keys brakes.
{
 const a=sim.player();Object.assign(a,{x:30.5,y:30.5,energy:80,health:100,age:SPECIES[a.species].maturity});delete a.motion;
 const hz=CFG.controlHz;let n=0;
 sim.phasePlayerMovement({right:true},{stepHz:hz});const first=speedOf(a);
 while(n<64){sim.phasePlayerMovement({right:true},{stepHz:hz});n++}
 assert.ok(first>0&&first<speedOf(a),'the player ramps up too');const cruise=speedOf(a),x0=a.x;
 let ticks=0;while(speedOf(a)>0&&ticks<200){sim.phasePlayerMovement(null,{stepHz:hz});ticks++}
 assert.ok(a.x>x0,'released keys glide forward');close(ticks/hz,cruise/accelerationLimit(a),'braking takes v/a',.1);
 assert.equal(sim.phasePlayerMovement(null,{stepHz:hz}),false,'at rest nothing moves');
 const st=motionStateOf(a);assert.ok(Object.isFrozen(st)&&st.speed===0&&st.heading===null);
}
// 4b. Movement parity under inertia: an autonomous player walks a lane exactly as far as a hand-steered one
// (found while building: the empty control step must not brake an autonomous player).
{
 const lane=W=>{for(let y=10;y<W.n-10;y++)for(let x=8;x<W.n-60;x++){let ok=true;for(let k=0;k<52;k++){const i=W.idx(x+k+.5,y+.5);if(W.water[i]||!W.isPlayable(x+k+.5,y+.5)){ok=false;break}}if(ok)return{x:x+.5,y:y+.5}}return null};
 const walk=auto=>{const s=new Simulation('INERTIA-PARITY',{player:true,inertia:true});s.endOpeningGrace?.('t');const p=s.player(),L=lane(s.world);s.animals=[p];Object.assign(p,{x:L.x,y:L.y,energy:SPECIES.genvo.maxEnergy*.9,hydration:SPECIES.genvo.maxHydration*.9});s.rebuildSpatial();if(auto)s.setPlayerAutonomy(true);
  const goal={x:L.x+50,y:L.y},x0=p.x,ratio=Math.round(CFG.controlHz/CFG.simHz);if(auto){const pm=s.phaseMovement.bind(s);s.phaseMovement=(...q)=>{p.intent='explore';p.target=goal;return pm(...q)}}
  for(let t=0;t<CFG.dayTicks;t++){if(auto){p.intent='explore';p.target=goal;s.update(null)}else{for(let k=0;k<ratio;k++)s.playerControlStep({right:true},CFG.controlHz);s.update({right:true},{externalPlayerControl:true})}}return p.x-x0};
 const manual=walk(false),auto=walk(true);assert.ok(manual>5&&Math.abs(auto/manual-1)<.02,`same body, same lane: AUTO ${auto.toFixed(2)} vs manual ${manual.toFixed(2)}`);
}
// 5. Saves keep velocity exactly; rules and state must agree; old worlds have none.
{
 const a=sim.animals.find(x=>!x.player);Object.assign(a,{intent:'explore',target:{x:80.5,y:40.5}});for(let k=0;k<3;k++)sim.phaseMovement({locomotionOnly:true});assert.ok(a.motion);
 const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'inertia'})),saved=snap(sim),back=restoreSimulationSnapshot(structuredClone(saved));
 assert.equal(back.inertiaRules,INERTIA.policy);assert.ok(isDeepStrictEqual(back.animals.map(x=>x.motion),sim.animals.map(x=>x.motion)));
 for(const damage of [s=>{s.animals.find(x=>x.motion).motion.vx=NaN},s=>{s.animals.find(x=>x.motion).motion.vx=99},s=>{s.animals.find(x=>x.motion).motion.schema=2},s=>{s.core.inertiaRules='inertia/9'}]){
  const bad=structuredClone(saved);damage(bad);assert.throws(()=>restoreSimulationSnapshot(bad),/inertia|motion/i)}
 const plain=new Simulation('INERTIA-WORLD',{player:true,dayClock:true,metabolism:true,bodySize:true}),plainSaved=snap(plain);
 assert.equal(plain.inertiaRules,undefined);plainSaved.animals[0].motion={schema:1,vx:0,vy:0,ax:0,ay:0};
 assert.throws(()=>restoreSimulationSnapshot(plainSaved),/without its recorded inertia rule/);
 for(let k=0;k<12;k++)plain.update(null);assert.ok(plain.animals.every(x=>x.motion===undefined),'kinematic worlds never gain motion');
}
console.log(`Inertia /1 PASS: exact integrator (coarse = fine), 0.20 s ramp and 0.40 s reversal at reference, 2x bodies half the acceleration and twice the turn radius, ice and water traction, arrival without overshoot, coasting, background strides equivalent, player ramp and braking at ${CFG.controlHz} Hz, kinetic work, exact saves and rule agreement`);
