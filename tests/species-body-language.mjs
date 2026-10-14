import assert from 'node:assert/strict';
import {faunaVisualPose} from '../src/render/fauna.js';

const base={id:17,dir:2,moving:true,action:'move',alert:false,dependent:false,bodyScale:1,limbScale:1,sensoryScale:1,life:{},behavior:{}};

const hopGround=faunaVisualPose('mosskip',{...base,frame:0});
const hopAir=faunaVisualPose('mosskip',{...base,frame:3});
assert.ok(hopAir.airborne>.65,'Hopper exposes a real airborne phase');
assert.ok(hopAir.tuck>hopGround.tuck,'Hopper folds its legs in flight');
assert.ok(hopAir.earTrail>hopGround.earTrail,'Hopper ears trail during the airborne travel phase');
assert.ok(hopAir.leap<hopGround.leap,'Hopper body follows a visible launch arc');

const digA=faunaVisualPose('rootling',{...base,frame:1});
const digB=faunaVisualPose('rootling',{...base,frame:3});
assert.equal(Math.sign(digA.leftClawStroke),-Math.sign(digA.rightClawStroke),'Digger mole claws alternate rather than stroke together');
assert.notEqual(digA.bodyWave,digB.bodyWave,'Digger three-mass body wave changes across travel');
assert.notEqual(digA.bellyDrive,digB.bellyDrive,'Digger belly traction advances with gait phase');

const stalkA=faunaVisualPose('needlejaw',{...base,frame:1,action:'prowl'});
const stalkB=faunaVisualPose('needlejaw',{...base,frame:3,action:'prowl'});
assert.equal(stalkA.legPhases.length,4);
assert.equal(stalkA.footPlants.length,4);
assert.ok(stalkA.legPhases[0]*stalkA.legPhases[1]<=0,'Stalker diagonal support pairs are out of phase');
assert.notEqual(stalkA.shoulderRoll,stalkB.shoulderRoll,'Stalker shoulders roll through the prowl');
assert.equal(Math.sign(stalkA.headCounter),-Math.sign(stalkA.shoulderRoll),'Stalker head counter-moves against shoulder roll');
assert.equal(Math.sign(stalkA.tailSweep),-Math.sign(stalkA.shoulderRoll),'Stalker tail balances the moving shoulder mass');

for(const kind of ['mosskip','rootling','needlejaw']){
  const a=faunaVisualPose(kind,{...base,frame:2.25});
  const b=faunaVisualPose(kind,{...base,frame:2.25});
  assert.deepEqual(a,b,`${kind} species gait remains deterministic`);
}

console.log('species body-language gait checks: PASS');
