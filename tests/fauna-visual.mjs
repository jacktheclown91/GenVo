import assert from 'node:assert/strict';
import {faunaVisualPose} from '../src/render/fauna.js';

const base={id:11,dir:2,frame:2,moving:true,action:'move',alert:false,dependent:false,bodyScale:1,limbScale:1,sensoryScale:1,life:{}};
for(const kind of ['mosskip','rootling','needlejaw']){
  const a=faunaVisualPose(kind,base),b=faunaVisualPose(kind,base);
  assert.deepEqual(a,b,`${kind} pose geometry must be deterministic`);
  assert.equal(a.kind,kind);
  assert.ok(Number.isFinite(a.v.x)&&Number.isFinite(a.v.y));
}
const moss=faunaVisualPose('mosskip',{...base,frame:3});
assert.ok(moss.leap<=-3,'Hopper has a strong airborne hop phase');
assert.ok(moss.earLength>=5&&moss.footReach>=4,'Hopper retains tall ears and spring feet');
const mossLand=faunaVisualPose('mosskip',{...base,frame:0});
assert.notEqual(moss.leap,mossLand.leap,'Hopper locomotion visibly changes vertical phase');
const root=faunaVisualPose('rootling',{...base,action:'eat',frame:1});
assert.ok(root.clawReach>=4&&root.snoutReach>=5,'Digger is defined by projecting snout and digging claws');
assert.notEqual(root.clawStroke,0,'Digger feeding animates its foreclaws');
const needle=faunaVisualPose('needlejaw',{...base,action:'hunt',frame:1});
assert.ok(needle.jawReach>8&&needle.tailReach>=10,'Stalker keeps exaggerated jaw and tail axes');
assert.equal(needle.jawOpen,true,'Stalker hunt phase can visibly open its paired mandibles');
const stalk=faunaVisualPose('needlejaw',{...base,action:'stalk'});
assert.equal(stalk.stalk,true,'Stalker has a distinct stalking posture');
console.log('fauna visual geometry checks: PASS');
