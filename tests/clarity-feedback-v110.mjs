import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {EffectFeedbackController} from '../src/ui/effect-feedback.js';
import {visualLifeState} from '../src/render/life.js';
import {genvoVisualPose} from '../src/render/genvo.js';

function quietFeedback(sim){
  sim.exposure.snapshot=()=>null;
  sim.stalkerTerritory.playerStatus=()=>null;
}

{
  const sim=new Simulation('V110-EFFICIENT-GUT',{player:true}),p=sim.player();quietFeedback(sim);
  p.adaptations=['efficient-gut'];const feedback=new EffectFeedbackController(sim);
  feedback.observe();sim.lastPlayerAction={type:'eat',kind:'bramble',tick:sim.tickCount};
  assert.equal(feedback.observe(),null,'action feedback waits for the ordinary interaction toast to finish');
  sim.tickCount+=16;const notice=feedback.observe();
  assert.match(notice?.message||'',/Efficient Gut increased the energy/,'real adaptation effect is explained after feeding');
}

{
  const sim=new Simulation('V110-WEBBED',{player:true}),p=sim.player();quietFeedback(sim);p.adaptations=['webbed-limbs'];
  let water=null;for(let y=2;y<126&&!water;y++)for(let x=2;x<126;x++)if(sim.world.water[sim.world.idx(x,y)]){water={x:x+.5,y:y+.5};break}
  assert.ok(water,'world contains water');p.x=water.x;p.y=water.y;
  const notice=new EffectFeedbackController(sim).observe();assert.match(notice?.message||'',/Webbed Limbs/,'entering open water explains why it is possible');
}

{
  const sim=new Simulation('V110-MANTLE',{player:true}),p=sim.player();quietFeedback(sim);p.adaptations=['hardened-mantle'];
  const feedback=new EffectFeedbackController(sim);feedback.observe();sim.lastPlayerDamage={tick:sim.tickCount+1,amount:18,rawAmount:25,mantleReduction:7,coordinatedReduction:0};sim.tickCount++;
  const notice=feedback.observe();assert.match(notice?.message||'',/absorbed about 7 damage/,'resolved bite reduction is made immediately legible');
}

{
  const sim=new Simulation('V110-ILLNESS',{player:true}),p=sim.player();quietFeedback(sim);sim.endOpeningGrace('test');p.intent='idle';p.target=null;
  sim.shelter.shelters.length=0;sim.shelter.shelters.push({id:1,ownerId:p.id,x:p.x,y:p.y,integrity:100,weatherSeal:1,foodStore:4,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount});
  assert.equal(sim.disease.infect(p,{force:true,source:'test'}),true);const feedback=new EffectFeedbackController(sim),notice=feedback.observe();
  assert.match(notice?.message||'',/shelter rest is cutting fever strain/i,'illness recovery consequence is surfaced when it actually applies');
}

{
  const sim=new Simulation('V110-SICK-POSE',{player:true}),p=sim.player();p.infected=true;
  const life=visualLifeState(sim,p,{frame:2,moving:false,action:'idle'});assert.equal(life.sick,true,'visual life state exposes sickness to presentation');
  const adult=genvoVisualPose({id:1,stage:'adult',frame:2,life:{},behavior:{}}),elder=genvoVisualPose({id:1,stage:'elder',frame:2,life:{},behavior:{}});
  const maxReach=pose=>Math.max(...pose.legs.map(l=>Math.hypot(l.foot.x,l.foot.y)));
  assert.ok(maxReach(elder)<maxReach(adult),'elder silhouette uses a shorter, lower stance than an adult');
  assert.ok(elder.bodyOffset.y>adult.bodyOffset.y,'elder posture sits visibly lower');
  const sick=genvoVisualPose({id:1,stage:'adult',frame:2,life:{sick:true},behavior:{}});assert.ok(sick.bodyOffset.y>adult.bodyOffset.y,'illness lowers posture before any icon is needed');assert.equal(sick.face.squint,true);
}

{
  const tutorial=fs.readFileSync(new URL('../src/ui/tutorial.js',import.meta.url),'utf8'),renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8'),main=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(tutorial,/renderOpeningGoals/,'the opening is broad goals, not a fixed step list');assert.match(tutorial,/LEGACY_OPENING_STAGES/,'old saved tutorial steps resume on the goals');assert.doesNotMatch(tutorial,/endOpeningGrace\?\.\('paired'\)/,'pairing no longer abruptly ends the guided safe start');
  assert.match(renderer,/nearKnown/,'known Stalker territory gets restrained physical boundary sign');assert.match(renderer,/a\.lineage&&a\.species==='genvo'&&!a\.player/,'nearby family receives a restrained kinship mark');
  assert.match(main,/EffectFeedbackController/,'runtime wires cause-effect feedback into ordinary play');
}

console.log('v1.10 first-run clarity + cause/effect readability: PASS');
