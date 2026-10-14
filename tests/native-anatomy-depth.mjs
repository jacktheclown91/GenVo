import assert from 'node:assert/strict';
import fs from 'node:fs';
import {genvoVisualPose} from '../src/render/genvo.js';
import {anatomicalLimbLayers,limbScreenDepth} from '../src/render/anatomy-depth.js';
import {artMount,drawPart} from '../src/render/part-sprites.js';
import {PARTS} from '../src/lineage/part-registry.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/art/catalog.json',import.meta.url)));
const installed=new Set(catalog.parts.map(p=>p.partId));
for(const name of ['armor-plate','venom-gland','storage-sac','gliding-membrane','gill-slits','spine-cluster','brood-pouch','claw','barb','hook-spur','dew-claw','heel-spike','sensory-bristle']){
 assert.ok(installed.has(name),name+' new native art registered');
 assert.ok(PARTS[name],name+' canonical biology exists');
}
// Every native mount must use its actual physical joint/socket, across changing body proportions.
const base={s:3,bx:2,by:4,bodyW:10,bodyH:8,fx:1,fy:0,perp:{x:0,y:1},sign:-1};
const tall={...base,fx:0,fy:1,perp:{x:-1,y:0}};
assert.equal(artMount('balance-tail',base).x,2-4.8);
assert.equal(artMount('balance-tail',tall).y,4-3.84);
assert.ok(artMount('armor-plate',base).y<base.by);
assert.ok(artMount('armor-plate',{...base,sign:1}).y>base.by);
assert.equal(artMount('gill-slits',{...base,L:{'flank.left':{x:5,y:7}}}).x,5,'authored flank socket is respected');
assert.equal(artMount('balance-tail',{...base,L:{tail:{x:-12,y:3}}}).x,-12,'authored tail socket is respected');
assert.equal(artMount('sail-fin',{...base,L:{dorsal:{x:4,y:0}}}).y,0,'authored dorsal socket is respected');
const leg={...base,root:{x:1,y:2},knee:{x:3,y:6},foot:{x:7,y:7},leg:{side:-1}};
const c=artMount('claw',leg);
assert.ok(c.x>3&&c.x<7&&c.y>6&&c.y<7,'spur mounts on the articulated distal limb');
assert.ok(c.mirrorX);
assert.ok(artMount('barb',leg).x<artMount('dew-claw',leg).x&&artMount('dew-claw',leg).x<artMount('heel-spike',leg).x,'knee/shin/foot spurs mount at different joints');
assert.equal(artMount('claw',base),null,'no disembodied spur when foot absent');
const trace=[];
const stub={draw(_ctx,opts){trace.push(opts);return true}};
const fake={drawImage(){},save(){},restore(){}};
assert.equal(drawPart(fake,'claw',{...leg,authoredParts:{claw:stub},authoredFacing:3,authoredTimeMs:300}),true);
assert.equal(trace.length,1);
assert.ok(Math.abs(trace[0].x-c.x*base.s)<1e-8);
assert.ok(Math.abs(trace[0].y-c.y*base.s)<1e-8);
assert.equal(trace[0].facing,3);
for(let dir=0;dir<8;dir++)for(let f=0;f<8;f++){
 const pose=genvoVisualPose({id:12,dir,frame:f,moving:true,legSlots:null});
 const {front,back}=anatomicalLimbLayers(pose.legs,pose.bodyOffset.y);
 assert.equal(front.length+back.length,8,'each physical limb is rendered exactly once');
 assert.ok(front.length>0&&back.length>0,'torso occludes some limbs, foreground limbs cover torso');
 assert.equal(new Set([...front,...back]).size,8);
 const inOrder=arr=>arr.every((v,i)=>i===0||limbScreenDepth(arr[i-1],pose.bodyOffset.y)<=limbScreenDepth(v,pose.bodyOffset.y));
 assert.ok(inOrder(front)&&inOrder(back));
}
console.log('native-anatomy-depth: 13 anatomical packs + socket mounts + spur rendering + 64 walking/facing depth samples PASS');
