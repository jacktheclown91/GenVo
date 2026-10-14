import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {behaviorVisualState,visualActionFromIntent} from '../src/render/behavior.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {faunaVisualPose} from '../src/render/fauna.js';

const sim=new Simulation('GENVO8-BEHAVIOR-READABILITY',{player:true});
const p=sim.player(),rngBefore=sim.rng.state;

const flee=behaviorVisualState({species:'genvo',id:7,action:'flee',phase:2,moving:true,life:{}});
const guard=behaviorVisualState({species:'genvo',id:7,action:'guard',phase:2,moving:false,life:{}});
const forage=behaviorVisualState({species:'genvo',id:7,action:'forage',phase:2,moving:true,life:{}});
const drink=behaviorVisualState({species:'genvo',id:7,action:'drink',phase:2,moving:false,life:{}});
assert.ok(flee.bodyLean>guard.bodyLean,'flight body language leans farther forward than guarding');
assert.ok(guard.stanceSpread>flee.stanceSpread,'guarding uses the widest planted stance');
assert.ok(forage.feelerSweep>flee.feelerSweep,'foraging visibly sweeps sensory feelers');
assert.ok(drink.bodyDrop>forage.bodyDrop,'drinking commits to a lower body posture than searching');

const hurt=behaviorVisualState({species:'genvo',id:7,action:'move',phase:6,moving:true,life:{hurt:true,strained:true}});
assert.ok(hurt.limp>0&&hurt.recoil>0,'injury creates an asymmetric limp/recoil phase');

const base={id:7,dir:2,frame:2,moving:false,action:'guard',bodyScale:1,limbScale:1,sensoryScale:1,life:{},behavior:guard};
const guarded=genvoVisualPose(base),neutral=genvoVisualPose({...base,action:'idle',behavior:behaviorVisualState({species:'genvo',id:7,action:'idle',phase:2,moving:false,life:{}})});
const guardWidth=Math.max(...guarded.legs.map(l=>Math.abs(l.foot.y)));
const neutralWidth=Math.max(...neutral.legs.map(l=>Math.abs(l.foot.y)));
assert.ok(guardWidth>=neutralWidth,'GenVo8 guard state visibly spreads planted limbs');

const hopperSearch=faunaVisualPose('mosskip',{id:4,dir:2,frame:2,moving:true,action:'seek-water',behavior:behaviorVisualState({species:'mosskip',id:4,action:'seek-water',phase:2,moving:true,life:{}})});
const hopperMove=faunaVisualPose('mosskip',{id:4,dir:2,frame:2,moving:true,action:'move',behavior:behaviorVisualState({species:'mosskip',id:4,action:'move',phase:2,moving:true,life:{}})});
assert.ok(hopperSearch.noseDip>hopperMove.noseDip,'Hopper lowers its head while searching for water');

const diggerForage=faunaVisualPose('rootling',{id:5,dir:2,frame:1.5,moving:true,action:'forage',behavior:behaviorVisualState({species:'rootling',id:5,action:'forage',phase:1.5,moving:true,life:{}})});
assert.notEqual(diggerForage.clawStroke,0,'Digger searches with active foreclaw motion before feeding');

p.intent='avoid-intruder';assert.equal(visualActionFromIntent(sim,p),'flee','territorial retreat reads as flight');
p.intent='ward';assert.equal(visualActionFromIntent(sim,p),'guard','territorial warding reads as guarding');
p.intent='return-home';assert.equal(visualActionFromIntent(sim,p),'move','returning home keeps locomotion body language');
p.intent='hide-shift';assert.equal(visualActionFromIntent(sim,p),'hide','covered camouflage movement keeps concealment body language');
p.intent='stealth-forage';p.target={x:p.x,y:p.y};assert.equal(visualActionFromIntent(sim,p),'eat','stealth feeding reads as feeding rather than generic idle');
p.intent='core-patrol';p.target={x:p.x+4,y:p.y};assert.equal(visualActionFromIntent(sim,p),'stalk','home-core defense reads as deliberate predator pursuit');
p.intent='provision-home';p.target={x:p.x+4,y:p.y};assert.equal(visualActionFromIntent(sim,p),'move','provisioning return trip keeps locomotion body language');
assert.equal(sim.rng.state,rngBefore,'behavior presentation must not consume simulation RNG');
console.log('behavior readability checks: PASS');
