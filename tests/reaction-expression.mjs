import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {reactionExpression,applyReactionPose,watchedThreat} from '../src/render/reaction-expression.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';

// Living Creature Pass, part 1: each animal's own threat stage is visible. The stage is read
// from staged perception's real state (vigilance, the 'wary' retreat, flight), never invented,
// and reading it changes nothing.
const make=()=>{const s=new Simulation('PLANET-OBS-3',{player:true,worldGenerator:'planetary/1',regionalFrontier:true});s.setPlayerAutonomy(true);return s};

// 1. Stages map from real state; the reader is pure.
{
 const sim=make(),[a,b]=sim.animals.filter(x=>x.alive&&!x.player&&!x.lineage);
 a.intent='idle';delete a.vigilance;assert.equal(reactionExpression(sim,a),null,'no reaction without a perceived threat');
 a.vigilance={id:b.id,untilTick:sim.tickCount+10};const before=JSON.stringify(a);
 const watch=reactionExpression(sim,a);assert.equal(watch.stage,'watch');assert.deepEqual(watch.attention,{x:b.x,y:b.y},'a watching animal looks at the predator it tracks');
 assert.equal(JSON.stringify(a),before,'reading a reaction writes nothing');
 a.intent='wary';assert.equal(reactionExpression(sim,a).stage,'wary');
 a.intent='escape';assert.equal(reactionExpression(sim,a).stage,'flee');assert.equal(reactionExpression(sim,a).attention,null,'a fleeing animal looks where it runs');
 a.intent='idle';a.vigilance.untilTick=sim.tickCount;assert.equal(watchedThreat(sim,a),null,'vigilance ends on time');
 // Inherited boldness changes the body language of the same stage.
 a.vigilance.untilTick=sim.tickCount+10;
 a.genes.temperament=1.12;const bold=reactionExpression(sim,a).pose;a.genes.temperament=.88;const shy=reactionExpression(sim,a).pose;
 assert.ok(bold.bodyRise>shy.bodyRise&&bold.stanceSpread>shy.stanceSpread,'a bold animal stands tall and square');
 assert.ok(shy.compress>bold.compress&&shy.feelerPin>bold.feelerPin,'a cautious animal crouches and pins its feelers');
 const behavior={bodyRise:0,feelerForward:1,feelerPin:0};applyReactionPose(behavior,reactionExpression(sim,a));assert.equal(behavior.attention,'threat');assert.equal(behavior.eyeWide,true);
}

// 2. In a natural world, animals of one species near the same predator react at different
// stages, and reading every reaction each step leaves the world identical to an unread twin.
{
 const read=make(),twin=make();let mixed=0,frames={watch:0,wary:0,flee:0};
 for(let t=0;t<CFG.dayTicks*3;t++){read.update(null);twin.update(null);if(t%10)continue;
  const groups=new Map();for(const a of read.animals){const r=reactionExpression(read,a);if(r)frames[r.stage]++;const v=a.vigilance;if(r&&v?.untilTick>read.tickCount){const k=a.species+':'+v.id;(groups.get(k)||groups.set(k,[]).get(k)).push(r.stage)}}
  for(const list of groups.values())if(new Set(list).size>1)mixed++}
 assert.ok(frames.watch>0&&frames.flee>0,'watching and fleeing both occur naturally: '+JSON.stringify(frames));
 assert.ok(mixed>0,'same-species animals near the same predator react at different stages');
 const snap=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'t',reason:'t'}));
 assert.deepEqual(snap(read),snap(twin),'reading reactions changes no state and consumes no RNG');
 console.log(`Reaction expression PASS: stages from real perception, boldness shapes body language, ${mixed} mixed-stage groups in 3 days (${JSON.stringify(frames)}), read-only.`);
}
