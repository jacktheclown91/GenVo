import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileSourceRgbaPart} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
import {drawLimb,drawPart} from '../src/render/part-sprites.js';
const multiply=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
function record(){
 let matrix=[1,0,0,1,0,0];const stack=[],points=[],calls=[];
 return{points,calls,save(){stack.push([...matrix])},restore(){matrix=stack.pop()},translate(x,y){matrix=multiply(matrix,[1,0,0,1,x,y])},rotate(a){matrix=multiply(matrix,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])},scale(x,y){matrix=multiply(matrix,[x,0,0,y,0,0])},drawImage(_canvas,...args){
  calls.push({matrix:[...matrix],args});
  const [x,y,w,h]=args.length===8?args.slice(4):[args[0],args[1],_canvas.width,_canvas.height];
  // Probe an off-axis location within each actual bone/hip/knee paint rectangle.
  const px=x+w*.31,py=y+h*.27;points.push({x:matrix[0]*px+matrix[2]*py+matrix[4],y:matrix[1]*px+matrix[3]*py+matrix[5]});
 }};
}
let checks=0;
for(const id of ['walking-leg','runner-leg','sturdy-leg','padded-leg'])for(const resolution of [32,64,128]){
 let asset;
 if(resolution===32){const source=JSON.parse(fs.readFileSync('assets/art/parts/'+id+'.json'));asset=await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});}
 else asset=JSON.parse(gunzipSync(fs.readFileSync('assets/art/production-candidate-v1/'+id+'-'+resolution+'.indexed.json.gz')));
 let allocations=0;const renderer=prepareIndexedPartRenderer(asset,{createCanvas(){allocations++;return{getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}};}});
 for(let facing=0;facing<8;facing++)for(const scale of [.75,2,5])for(const frameIndex of [0,1])for(const withFeet of [false,true]){
  const a=(facing-2)*Math.PI/4,forward={x:Math.cos(a),y:Math.sin(a)},perp={x:-forward.y,y:forward.x};
  const point=(f,s)=>({x:(forward.x*f+perp.x*s)*scale,y:(forward.y*f+perp.y*s)*scale});
  const right={root:point(1,2),knee:point(.4,4),foot:point(-1,6)},left={root:point(1,-2),knee:point(.4,-4),foot:point(-1,-6)},saved=JSON.stringify({right,left});
  const r=record(),l=record(),wrong=record(),footForward=withFeet?forward:null;renderer.drawLimb(r,{...right,scale,facing,frameIndex,footForward});renderer.drawLimb(l,{...left,scale,facing,frameIndex,footForward,mirrorTransverse:true});renderer.drawLimb(wrong,{...left,scale,facing,frameIndex,footForward});
  if(withFeet){
   const toe=r.calls[2],m=toe.matrix,length=Math.hypot(m[0],m[1]);
   assert.ok(Math.abs(m[0]/length-forward.x)<1e-10&&Math.abs(m[1]/length-forward.y)<1e-10,'front/rear distal paint points along body forward, not the shin');
   const [sx,sy,,,dx,dy]=toe.args,localX=asset.rig.lower.end[0]-(sx-dx),localY=asset.rig.lower.end[1]-(sy-dy);
   assert.ok(Math.hypot(m[0]*localX+m[2]*localY+m[4]-right.foot.x,m[1]*localX+m[3]*localY+m[5]-right.foot.y)<1e-9,'distal artwork endpoint stays on the exact contact');
  }
  assert.equal(r.points.length,l.points.length);assert.ok(r.points.length>=2);
  const reflected=p=>{const f=p.x*forward.x+p.y*forward.y,s=p.x*perp.x+p.y*perp.y;return{x:forward.x*f-perp.x*s,y:forward.y*f-perp.y*s};};
  for(let i=0;i<r.points.length;i++){const p=reflected(r.points[i]);assert.ok(Math.hypot(p.x-l.points[i].x,p.y-l.points[i].y)<1e-9,'paired tissue follows reflected geometry in every facing');checks++;}
  assert.ok(wrong.points.some((p,i)=>Math.hypot(p.x-l.points[i].x,p.y-l.points[i].y)>.01),'preceding unmirrored paint fails the anatomical reflection');
  assert.equal(JSON.stringify({right,left}),saved);
 }
 const prepared=allocations;renderer.drawLimb(record(),{root:{x:0,y:0},knee:{x:2,y:3},foot:{x:5,y:5},mirrorTransverse:true});assert.equal(allocations,prepared,'mirroring reuses native tissue');
}
// Actual assembly handoff must request the paint chirality from anatomical side.
for(const side of [-1,1]){let received;drawLimb({drawImage(){}},'walking-leg',{s:2,leg:{side,planted:true},root:{x:1,y:2},knee:{x:3,y:4},foot:{x:5,y:6},authoredParts:{'walking-leg':{drawLimb(_c,args){received=args;return true;}}}});assert.equal(received.mirrorTransverse,side<0);assert.deepEqual(received.footForward,{x:1,y:0});assert.deepEqual(received.root,{x:2,y:4});}
for(const action of ['swim','climb','dig','fly','glide','jump']){
 let received;drawLimb({drawImage(){}},'walking-leg',{s:1,fx:1,fy:0,authoredState:action,leg:{side:-1},root:{x:0,y:0},knee:{x:2,y:2},foot:{x:4,y:3},authoredParts:{'walking-leg':{drawLimb(_c,args){received=args;return true;}}}});assert.equal(received.footForward,null,'specialized poses retain distal orientation');
}
// Paired flanks/spurs already reflect about the creature's forward axis.
// Keep that path intact: a screen-horizontal flip would break diagonal facings.
let attachments=0;
for(const id of ['armor-plate','gill-slits','claw']){
 const source=JSON.parse(fs.readFileSync('assets/art/parts/'+id+'.json'));
 const asset=await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 const art=prepareIndexedPartRenderer(asset,{createCanvas(){return{getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}};}});
 for(let facing=0;facing<8;facing++){
  const angle=(facing-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),perp={x:-fy,y:fx};
  const points=[];
  for(const sign of [1,-1]){
   const ctx=record(),k={s:2,fx,fy,perp,bx:0,by:0,bodyW:8,bodyH:7,sign,leg:{side:sign},root:{x:0,y:0},knee:{x:perp.x*sign*4,y:perp.y*sign*4},foot:{x:perp.x*sign*6,y:perp.y*sign*6},authoredFacing:facing,authoredState:'idle',authoredTimeMs:0,authoredParts:{[id]:art}};
   drawPart(ctx,id,k);assert.equal(ctx.points.length,1);points.push(ctx.points[0]);
  }
  const [r,l]=points,fore=r.x*fx+r.y*fy,side=r.x*perp.x+r.y*perp.y;
  assert.ok(Math.hypot(fx*fore-perp.x*side-l.x,fy*fore-perp.y*side-l.y)<1e-9,'paired attachment preserves forward direction');attachments++;
 }
}
console.log('Existing paired attachment reflection PASS: '+attachments+' real armor/gill/claw cases across eight headings.');
console.log('Limb paint handedness PASS: '+checks+' reflected bone/hip/knee probes, 32/64/128 tissue, all eight facings, three zooms, two skin frames and independently forward-facing feet; prior paint fails, coordinates exact, no extra allocations.');
