import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {gaitTravelFor} from '../src/render/genvo.js';
import {assemblyFor} from '../src/render/creature-assembler.js';
import {locomotionStyle,locomotionOffsets} from '../src/render/locomotion-style.js';
import {CFG} from '../src/sim/config.js';
import {drawGenvoSprite} from '../src/render/genvo-draw.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {canSwim,movementProfile} from '../src/lineage/lifestyle.js';

// Whole-creature locomotion reads differently by mounted anatomy, never by species label.
// Presentation only: planted-toe contact is covered by grounded-locomotion.mjs.

const sim=new Simulation('GENVO8-LOCOMOTION',{player:true}),p=sim.player(),rng=sim.rng.state;
const base=p.bodyPlan.nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket}));
const legs=id=>base.map(x=>x.socket?.startsWith('limb.')?{...x,partId:id}:x);
const PLANS={
  walker:base,
  runner:legs('runner-leg'),
  heavy:[...legs('sturdy-leg').map(x=>x.parent?x:{partId:'reinforced-torso'}),{partId:'armor-plate',parent:'root',socket:'flank.left'},{partId:'armor-plate',parent:'root',socket:'flank.right'}],
  spring:legs('spring-leg'),
  swimmer:legs('webbed-leg'),
};
const BODY_BOB=[0,-1,-1,0,0,1,1,0],cycle8=(v,ph)=>{ph=((ph%8)+8)%8;const a=Math.floor(ph),t=ph-a;return v[a]+(v[(a+1)&7]-v[a])*t};
const range=xs=>Math.max(...xs)-Math.min(...xs);
const m={};
for(const [name,placements] of Object.entries(PLANS)){
  const plan=makePlan(placements);assert.ok(validatePlan(plan).ok,name+' is a legal body');
  const body={species:'genvo',bodyPlan:plan},style=locomotionStyle(body),legSlots=assemblyFor(body).legSlots;
  const walk=[],land=[];for(let f=0;f<8;f+=.125){const o=locomotionOffsets(style,{phase:f,moving:true,action:'move',baseBob:cycle8(BODY_BOB,f)});walk.push(o)}
  const swim=[];for(let f=0;f<8;f+=.125)swim.push(locomotionOffsets(style,{phase:f,moving:true,action:'swim',baseBob:0}));
  m[name]={style,travel:gaitTravelFor(1,legSlots),phasePerTile:8*CFG.tileSize/gaitTravelFor(1,legSlots),bob:range(walk.map(o=>o.rise)),sway:range(walk.map(o=>o.sway)),twist:range(walk.map(o=>o.twist)),roll:range(walk.map(o=>o.roll)),lean:walk[0].lean,swimSurge:Math.max(...swim.map(o=>o.lean)),swimTwist:range(swim.map(o=>o.twist)),walk};
}

// 1. A plain walking body keeps exactly the shared walk bob it had before this pass.
for(let i=0;i<m.walker.walk.length;i++){const f=i*.125,o=m.walker.walk[i];assert.ok(Math.abs(o.rise+cycle8(BODY_BOB,f))<1e-12&&o.sway===0&&o.lean===0&&o.twist===0&&o.roll===0,'walker carriage unchanged at phase '+f)}

// 2. Step length follows leg type, so cadence does too (fewer, longer strides for runners).
assert.ok(m.runner.travel>m.walker.travel&&m.walker.travel>m.heavy.travel,'runner > walker > sturdy step length');
assert.ok(m.runner.phasePerTile<m.walker.phasePerTile&&m.heavy.phasePerTile>m.walker.phasePerTile,'runner takes fewer, sturdy legs more steps per tile');

// 3. Carriage: runner low and forward; heavy deep and rolling; spring bounding; webbed waddling.
assert.ok(m.runner.bob<m.walker.bob*.6&&m.runner.lean>.4,'runner glides low and leans into the stride');
assert.ok(m.heavy.bob>m.walker.bob*1.5&&m.heavy.lean<0,'heavy build drops hard');
const top=k=>Math.max(...m[k].walk.map(o=>o.rise)),low=k=>Math.min(...m[k].walk.map(o=>o.rise));
assert.ok(top('spring')>top('heavy')+1&&top('spring')>2,'spring legs bound clear above the walk line');
assert.ok(low('heavy')<low('spring')-.5&&low('heavy')<low('walker')-.5,'heavy build drops below the walk line at each stance');

// 3b. Weight transfer is articulation, never sideways displacement of the body centre.
for(const k of Object.keys(m))assert.equal(m[k].sway,0,k+' body centre does not slide sideways');
assert.ok(m.heavy.twist>2.5&&m.heavy.roll>1.5,'heavy body twists head/tail apart and rolls its dorsal tissue');
assert.ok(m.swimmer.twist>3,'webbed body waddles through torso twist');
assert.ok(m.runner.twist===0&&m.walker.twist===0&&m.spring.twist<.5,'light legs do not waddle');
// Twist lags the bob by a quarter cycle (uncorrelated), so the two never cancel on screen.
for(const k of ['heavy','swimmer']){const w=m[k].walk,mr=w.reduce((x,o)=>x+o.rise,0)/w.length,mt=w.reduce((x,o)=>x+o.twist,0)/w.length;let c=0,vr=0,vt=0;for(const o of w){c+=(o.rise-mr)*(o.twist-mt);vr+=(o.rise-mr)**2;vt+=(o.twist-mt)**2}assert.ok(Math.abs(c/Math.sqrt(vr*vt))<.2,k+' twist is in quadrature with the bob')}

// 4. In water, webbed bodies stroke harder than other swimmers.
{
  // Real swimming contract: eligibility from canSwim, propulsion from movementProfile in water.
  const w=sim.world;let wi=-1;for(let i=0;i<w.water.length&&wi<0;i++)if(w.water[i])wi=i;assert.ok(wi>=0);const wx=wi%w.n+.5,wy=Math.floor(wi/w.n)+.5;
  const limbs=base.filter(x=>x.socket?.startsWith('limb.'));
  const webbedN=n=>base.map(x=>x.socket?.startsWith('limb.')&&limbs.indexOf(x)<n?{...x,partId:'webbed-leg'}:x);
  const cases={ordinary:base,oneWebbed:webbedN(1),twoWebbed:webbedN(2),allWebbed:webbedN(limbs.length),allWebbedPaddle:[...webbedN(limbs.length).filter(x=>x.socket!=='tail'),{partId:'paddle-tail',parent:'root',socket:'tail'}]};
  const swim={};
  for(const [k,pl] of Object.entries(cases)){const plan=makePlan(pl);assert.ok(validatePlan(plan).ok,k+' legal');const body={species:'genvo',alive:true,adaptations:[],x:wx,y:wy,bodyPlan:plan};
    const can=canSwim(body),prof=movementProfile(body,w,{fromX:wx,fromY:wy});const propulsion=can?prof.speed/.66:0;
    const strokes=[];if(can)for(let f=0;f<8;f+=.125)strokes.push(locomotionOffsets(locomotionStyle(body),{phase:f,moving:true,action:'swim',propulsion}));
    swim[k]={can,propulsion,surge:can?Math.max(...strokes.map(o=>o.lean)):0,undulation:can?range(strokes.map(o=>o.twist)):0};}
  assert.equal(swim.ordinary.can,false,'an ordinary body cannot swim, so it never receives a swim pose');
  assert.equal(swim.oneWebbed.can,false,'one webbed leg is not enough under the current contract');
  assert.ok(swim.twoWebbed.can&&swim.allWebbed.can,'two or more webbed legs swim');
  assert.ok(swim.allWebbed.propulsion>=swim.twoWebbed.propulsion&&swim.allWebbedPaddle.propulsion>swim.allWebbed.propulsion,'propulsion follows the authority: '+JSON.stringify(swim));
  assert.ok(swim.allWebbedPaddle.surge>swim.twoWebbed.surge&&swim.allWebbedPaddle.undulation>swim.twoWebbed.undulation,'a stronger swimmer visibly strokes harder');
  globalThis.__swim=swim;
}

// 5. Anatomy, not label: the same plan reads the same on any species; no simulation state changes.
const plan=makePlan(PLANS.heavy);
assert.deepEqual(locomotionStyle({species:'mosskip',bodyPlan:plan}),locomotionStyle({species:'genvo',bodyPlan:plan}));
const before=JSON.stringify(p.bodyPlan);locomotionStyle(p);locomotionOffsets(locomotionStyle(p),{phase:3,moving:true});
assert.equal(JSON.stringify(p.bodyPlan),before);assert.equal(sim.rng.state,rng,'no simulation RNG consumed');
assert.deepEqual(locomotionOffsets(locomotionStyle(p),{phase:3,moving:false}),{rise:0,sway:0,lean:0,twist:0,roll:0},'standing still adds no carriage');


// 6. Drawing: twist moves whole pixel groups (head end +, tail end -) and nothing else slides.
{
  const plan=makePlan([...PLANS.heavy.filter(x=>x.socket!=='tail'),{partId:'balance-tail',parent:'root',socket:'tail'}]);assert.ok(validatePlan(plan).ok);
  const animal={...p,id:77,bodyPlan:plan,dir:2};
  const record=twist=>{const out=[];let tx=0,ty=0;const stack=[];const c={set fillStyle(v){this.f=v},get fillStyle(){return this.f},fillRect(x,y,w,h){out.push(`${x+tx},${y+ty},${w},${h},${this.f}`)},save(){stack.push([tx,ty])},restore(){[tx,ty]=stack.pop()},translate(x,y){tx+=x;ty+=y}};
    drawGenvoSprite(c,{animal,phenotype:phenotypeFor(animal),scale:2,frame:2,moving:true,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},pose:{dir:2,action:'move',life:{growth:1},behavior:{torsoTwist:twist}}});return out};
  const flat=record(0),bent=record(2),d=Math.round(2*2);  // facing east: perp is screen-vertical (0,1)
  const shiftedBy=dy=>{const set=new Set(flat);return bent.filter(k=>{const [x,y,...r]=k.split(',');return !set.has(k)&&set.has([x,Number(y)-dy,...r].join(','))}).length};
  assert.equal(record(0).join('|'),flat.join('|'),'drawing is deterministic');
  assert.ok(shiftedBy(d)>10,'head end moves as a whole group with the twist: '+shiftedBy(d));
  assert.ok(shiftedBy(-d)>0,'tail end moves to the opposite side: '+shiftedBy(-d));
}
console.log('Anatomy-driven locomotion: walker unchanged; runner/heavy/spring/webbed distinct step length, cadence, bob, roll, lean and stroke PASS',JSON.stringify(Object.fromEntries(Object.entries(m).map(([k,v])=>[k,{travel:+v.travel.toFixed(2),bob:+v.bob.toFixed(2),sway:+v.sway.toFixed(2),lean:+v.lean.toFixed(2)}]))));
