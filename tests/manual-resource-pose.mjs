import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {visualActionFromIntent} from '../src/render/behavior.js';
import {CFG} from '../src/sim/config.js';
const s=new Simulation('MANUAL-RESOURCE-POSE',{player:true}),p=s.player();p.intent='idle';
let meal=s.foraging.options(p)[0];if(!meal){for(let y=8;y<120&&!meal;y++)for(let x=8;x<120&&!meal;x++){if(!s.canOccupy(p,x+.5,y+.5))continue;p.x=x+.5;p.y=y+.5;meal=s.foraging.options(p)[0]}}
assert.ok(meal,'natural compatible food exists');const result=s.playerEat(meal);assert.equal(result.ok,true);assert.equal(s.lastPlayerAction.actorId,p.id);
const rng=s.rng.state,energy=p.energy,body=JSON.stringify(p.bodyPlan);assert.equal(visualActionFromIntent(s,p),'eat');assert.equal(s.rng.state,rng);assert.equal(p.energy,energy);assert.equal(JSON.stringify(p.bodyPlan),body);
assert.equal(visualActionFromIntent(s,p,{moving:true}),'idle','moving suppresses a stationary meal response');p.intent='escape';assert.equal(visualActionFromIntent(s,p),'flee');p.intent='idle';p.bracing=true;assert.equal(visualActionFromIntent(s,p),'idle');p.bracing=false;p.attackAction={phase:'windup'};assert.equal(visualActionFromIntent(s,p),'idle');p.attackAction=null;
const other={...p,id:p.id+10000};assert.equal(visualActionFromIntent(s,other),'idle','old action cannot animate a new controlled actor');const responseDuration=Math.ceil(CFG.simHz*(.9+Math.min(.9,s.lastPlayerAction.processingCost||0)));s.tickCount+=responseDuration;assert.equal(visualActionFromIntent(s,p),'idle','even high-coat meals expire after their actual processing duration without modifying intent');
console.log('Actual manual meal receipt, read-only pose, actor ownership, expiry and movement/combat precedence PASS');
