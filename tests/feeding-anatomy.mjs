import assert from 'node:assert/strict';
import {feedingReceipt,feedingExpression,FeedingPresentation,applyFeedingExpression} from '../src/render/feeding-expression.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {starterPlan,attachPart} from '../tools/creature-lab/assembly-model.js';
import {drawPart} from '../src/render/part-sprites.js';
const base=starterPlan('small-torso'),animal=mouth=>({id:42,player:true,alive:true,intent:'idle',bodyPlan:attachPart(base,'root','mouth',mouth)});
const plant=Object.freeze({actorId:42,tick:10,i:3,removed:.2,edible:.1,tissue:'leaf',kind:'sunmoss'}),water=Object.freeze({tick:10,i:3,amount:.1,kind:'algae'}),meat=Object.freeze({type:'eat',actorId:42,tick:10,kind:'carrion',energyGain:2});
const sim={world:{n:16},tickCount:10,foraging:{states:new Map(),state(){throw Error('Drawing cannot create controller state');}}};
for(const [mouth,receipt,mode] of [['grazing-mouth',plant,'graze'],['nibbler-mouth',plant,'nibble'],['beak-mouth',plant,'peck'],['tearing-jaw',meat,'tear'],['sucker-mouth',meat,'suck'],['filter-mouth',water,'filter'],['gape-mouth',meat,'swallow']]){
 const a=animal(mouth);if(receipt===plant)a.lastPlantMeal=receipt;else if(receipt===water)a.lastFreshwaterMeal=receipt;sim.lastPlayerAction=receipt===meat?meat:null;
 const saved=JSON.stringify({a,receipt}),size=sim.foraging.states.size;
 for(const elapsedSeconds of [0,.12,.3,.5,.7]){const p=feedingExpression(sim,a,{elapsedSeconds});assert.equal(p.mode,mode);assert.ok(Number.isFinite(p.headReach+p.headDrop));assert.ok(p.mouthShape.forward>=.8&&p.mouthShape.forward<=1.15);assert.ok(p.mouthShape.width>=.8&&p.mouthShape.width<=1.15);const behavior={};applyFeedingExpression(behavior,p);assert.equal(behavior.feedingMouthShape,p.mouthShape);}
 assert.equal(JSON.stringify({a,receipt}),saved);assert.equal(sim.foraging.states.size,size);
}
const a=animal('tearing-jaw');sim.lastPlayerAction=meat;assert.equal(feedingReceipt(sim,a),meat,'actual carrion player receipt is observed by identity');
for(const patch of [{actorId:-1},{energyGain:0},{kind:'invented'},{tick:-100}]){sim.lastPlayerAction={...meat,...patch};assert.equal(feedingExpression(sim,a),null);}
sim.lastPlayerAction=null;a.player=false;const owned=Object.freeze({kind:'carrion',tick:10,energyGain:2});sim.foraging.states.set(a.id,{lastMeal:owned});assert.equal(feedingReceipt(sim,a),owned,'existing actor-bound successful record works for NPCs');assert.equal(feedingExpression(sim,a).mode,'tear');assert.equal(feedingReceipt(sim,{...a,id:43}),null,'no cross-actor borrowing');
const observe=new FeedingPresentation();assert.ok(observe.sample(sim,a,0));a.bodyPlan=attachPart(base,'root','mouth','sucker-mouth');assert.equal(observe.sample(sim,a,.1),null,'an anatomy change cannot reinterpret an old meal');
// Preserve actual seed fate; intake style never edits the meal's reproduction outcome.
const nib=animal('nibbler-mouth');nib.lastPlantMeal={...plant,tissue:'fruit',viableSeeds:.04};sim.foraging.states.clear();const before=JSON.stringify(nib.lastPlantMeal);assert.equal(feedingExpression(sim,nib).seedFate,'carried');assert.equal(JSON.stringify(nib.lastPlantMeal),before);
// Oral deformation follows the mouth's own forward axis, not screen x/y.
for(let dir=0;dir<8;dir++){
 const angle=(dir-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),calls=[];const ctx=Object.fromEntries(['save','restore','translate','rotate','scale','drawImage'].map(name=>[name,(...args)=>calls.push([name,...args])]));let args;
 const k={s:2,fx,fy,perp:{x:-fy,y:fx},mouth:{x:3,y:5},behavior:{feedingMouthShape:{forward:1.1,width:.9},mouthPulse:1},authoredFacing:dir,authoredParts:{'sucker-mouth':{draw(_ctx,o){args=o;return true;}}}};
 drawPart(ctx,'sucker-mouth',k);assert.ok(calls.some(c=>c[0]==='translate'&&c[1]===6&&c[2]===10),'native mouth anchor is fixed');assert.ok(calls.some(c=>c[0]==='rotate'&&Math.abs(Math.atan2(Math.sin(c[1]-angle),Math.cos(c[1]-angle)))<1e-9));assert.ok(calls.some(c=>c[0]==='scale'&&c[1]===1.1&&c[2]===.9));assert.equal(args.x,0);assert.equal(args.y,0);assert.equal(args.scale,.72,'directional feeding replaces uniform balloon scaling');
 calls.length=0;k.authoredParts['sucker-mouth'].expressionScale='fixed';drawPart(ctx,'sucker-mouth',k);assert.ok(!calls.some(c=>c[0]==='scale'),'fixed native artwork is not deformed');
}
console.log('Feeding anatomy PASS: seven capability-specific intake styles, successful carrion/actor-owned events, immutable seed fate, no controller writes, anatomy interruption and eight-heading mouth-local deformation.');

// Actual receipt motion must not inherit a second, arbitrary idle chewing clock.
const {behaviorVisualState}=await import('../src/render/behavior.js');
const feeding=feedingExpression(sim,nib,{elapsedSeconds:.4});
for(const mouth of ['nibbler-mouth','sucker-mouth'])for(const action of ['eat','crack','forage']){
 const bodyPlan=animal(mouth).bodyPlan,poses=[0,2,4,6].map(phase=>{const b=behaviorVisualState({bodyPlan,action,phase,feeding});applyFeedingExpression(b,feeding);return b;});
 for(const key of ['headDrop','bodyDrop','mouthPulse','headReach','compress'])assert.ok(poses.every(p=>p[key]===poses[0][key]),key+' follows the actual meal rather than idle phase');
 assert.ok(poses.every(p=>p.action===action),'actual action metadata remains intact');
 const hurt=behaviorVisualState({bodyPlan,action,feeding,life:{injured:true,injuryLevel:'severe',exhausted:true}});assert.ok(hurt.limp>0&&hurt.bodyDrop>0&&hurt.eyeNarrow,'physiological expression survives confirmed feeding');
 const alarm=behaviorVisualState({bodyPlan,action:'flee',feeding,social:{alarm:true}});assert.equal(alarm.attention,'threat');assert.ok(alarm.eyeWide,'alarm keeps presentation priority');
}
console.log('Feeding composition PASS: single receipt clock, retained action metadata, physiological overlays and alarm priority.');

for(const key of ['airborne','climb','caveTransit','burrowWork','torpor']){
 const actor=animal('nibbler-mouth');actor.lastPlantMeal=plant;const observer=new FeedingPresentation();assert.ok(observer.sample(sim,actor,0));actor[key]=true;assert.equal(observer.sample(sim,actor,.1),null,key+' interrupts receipt playback');actor[key]=null;assert.equal(observer.sample(sim,actor,.2),null,'work completion cannot replay the stale meal');
}
console.log('Feeding interruption PASS: aerial, climbing, excavation, transit and dormancy retain priority.');
