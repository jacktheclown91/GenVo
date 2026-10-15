import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
import {drawPart,artMount} from '../src/render/part-sprites.js';
const ids=['signal-crest','display-frill'],dirs=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
let allocations=0,cases=0;
const factory=()=>{allocations++;const canvas={getContext:()=>({createImageData:()=>({data:new Uint8ClampedArray(4096)}),putImageData(image){canvas.rgba=image.data.slice()}})};return canvas};
function context(){
 let m=[1,0,0,1,0,0],stack=[],draws=[];
 const multiply=n=>{const[a,b,c,d,e,f]=m,[A,B,C,D,E,F]=n;m=[a*A+c*B,b*A+d*B,a*C+c*D,b*C+d*D,a*E+c*F+e,b*E+d*F+f]};
 return{draws,save(){stack.push([...m])},restore(){m=stack.pop()},translate(x,y){multiply([1,0,0,1,x,y])},rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])},scale(x,y){multiply([x,0,0,y,0,0])},drawImage(...args){draws.push({args,m:[...m]})}};
}
for(const id of ids){
 const source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+id+'.json',import.meta.url)));
 const decode=s=>({...s,frames:s.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 for(const rig of [{...source.rig,panels:[]},{...source.rig,panels:{}},{...source.rig,rootRect:[0,10,32,4]},{...source.rig,foldedExtent:0}])await assert.rejects(()=>compileSourceRgbaPart(decode({...source,rig})),/dorsal/);
 const asset=await compileSourceRgbaPart(decode(source)),renderer=prepareIndexedPartRenderer(asset,{createCanvas:factory});
 const before=JSON.stringify(asset);let calls=0;
 const art={...renderer,drawDorsal(c,o){calls++;return renderer.drawDorsal(c,o)}};
 for(let dir=0;dir<8;dir++)for(const extent of [.25,.6,1]){
  const [dx,dy]=dirs[dir],len=Math.hypot(dx,dy),fx=dx/len,fy=dy/len;
  const k={s:2,fx,fy,perp:{x:-fy,y:fx},bx:0,by:0,bodyW:8,bodyH:8,authoredFacing:dir,L:{dorsal:{x:2,y:3}},expressionNodeId:'selected-frill',authoredParts:{[id]:art},partExpression:{'selected-frill':{extent},[id]:{extent:1}}};
  const neutral=context(),open=context();drawPart(neutral,id,{...k,behavior:{crestSpread:0}});drawPart(open,id,{...k,behavior:{crestSpread:.7}});
  assert.equal(open.draws.length,3);assert.equal(neutral.draws.length,3);
  assert.deepEqual(open.draws[2],neutral.draws[2],'Actual root pixels and transform must stay fixed while membranes unfold');
  const n=neutral.draws[0].m,o=open.draws[0].m;
  const angle=(dir-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle),forward=m=>[m[0]*co+m[2]*si,m[1]*co+m[3]*si],lateral=m=>Math.hypot(-m[0]*si+m[2]*co,-m[1]*si+m[3]*co);
  assert.ok(Math.hypot(...forward(n).map((v,i)=>v-forward(o)[i]))<1e-10,'World-forward axis cannot grow');
  assert.ok(lateral(o)>lateral(n),'Only transverse membrane projection unfolds');
  assert.ok(Math.abs(lateral(o)-2*.31*(asset.rig.foldedExtent+(1-asset.rig.foldedExtent)*.7)*extent)<1e-10,'Physical expression must constrain this exact native node');
  const hx=2*si,hy=-2*co;
  assert.ok(Math.hypot(o[0]*hx+o[2]*hy+o[4]-(4+2*.31*2*fy),o[1]*hx+o[3]*hy+o[5]-(6-2*.31*2*fx))<1e-10,'Upper panel hinge stays on the mounted root boundary');
  cases++;
 }
 const count=allocations;const c=context();drawPart(c,id,{s:2,fx:1,fy:0,perp:{x:0,y:1},bx:0,by:0,bodyW:8,bodyH:8,authoredParts:{[id]:art},behavior:{crestSpread:.5}});assert.equal(allocations,count,'Projection cannot allocate new paint each draw');
 const young=context(),grown=context(),sizeBase={s:2,fx:1,fy:0,perp:{x:0,y:1},bx:0,by:0,bodyW:8,bodyH:8,authoredParts:{[id]:art},behavior:{crestSpread:.5}};
 drawPart(young,id,{...sizeBase,nativeBodyScale:.4});drawPart(grown,id,{...sizeBase,nativeBodyScale:1.2});
 for(const i of [0,1,2,3])assert.ok(Math.abs(grown.draws[2].m[i]-young.draws[2].m[i]*3)<1e-10,'Native tissue follows existing expressed body/developmental scale');
 assert.ok(calls>0);assert.equal(JSON.stringify(asset),before);
 // Every direction and idle cell remains an editable source, not a hidden east-only atlas.
 for(let facing=0;facing<8;facing++)for(const frameIndex of [0,1]){
  const check=context();renderer.drawDorsal(check,{facing,frameIndex,headingRadians:(facing-2)*Math.PI/4,deployment:1});
  const original=asset.frames.find(f=>f.facing===facing&&f.index===frameIndex),rgba=recolorIndexedFrame(asset,original.key);
  for(let i=0;i<rgba.length;i+=4)if(rgba[i+3]){
   const pieces=check.draws.map(d=>d.args[0].rgba);assert.equal(pieces.filter(p=>p[i+3]>0).length,1,'Every selected source pixel belongs to exactly one panel/root');
   const selected=pieces.find(p=>p[i+3]>0);assert.deepEqual(selected.slice(i,i+4),rgba.slice(i,i+4),'Selected native-facing/frame pixels stay exact');
  }
 }
 assert.throws(()=>renderer.drawDorsal(context(),{deployment:NaN}),/Invalid dorsal/);
}
for(const id of ['sail-fin','water-hump','moss-back']){
 const k={fx:1,fy:0,perp:{x:0,y:1},bx:0,by:0,bodyW:8,bodyH:8};assert.deepEqual(artMount(id,{...k,behavior:{crestSpread:.7}}),artMount(id,k),'Non-display anatomy must not enlarge during another organ’s flare');
}
console.log(`${cases} native display/facing/physical-expression cases: fixed root, transverse folding, exact node ownership, no repeat allocation, non-display isolation PASS`);
