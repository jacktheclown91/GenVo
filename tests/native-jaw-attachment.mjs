import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
import {drawPart} from '../src/render/part-sprites.js';

const ids=['tearing-jaw','crushing-jaw','gape-mouth','tusk-jaw'];
const factory=()=>({getContext:()=>({createImageData:()=>({data:new Uint8ClampedArray(4096)}),putImageData(){}})});
const ctx=new Proxy({drawImage(){}},{get:(t,k)=>t[k]??(()=>{})});
let count=0;
for(const id of ids){
 const source=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+id+'.json',import.meta.url)));
 const decode=spec=>({...spec,frames:spec.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
 const asset=await compileSourceRgbaPart(decode(source));
 assert.equal(asset.expressionScale,'fixed');
 assert.notEqual(asset.checksum,(await compileSourceRgbaPart(decode({...source,expressionScale:'pulse'}))).checksum,'Expression geometry participates in checksum');
 await assert.rejects(()=>compileSourceRgbaPart(decode({...source,expressionScale:true})),/invalid expression scale/);
 const legacy=structuredClone(source);delete legacy.expressionScale;
 assert.equal(prepareIndexedPartRenderer(await compileSourceRgbaPart(decode(legacy)),{createCanvas:factory}).expressionScale,'pulse');
 const renderer=prepareIndexedPartRenderer(asset,{createCanvas:factory}),calls=[];
 const wrapped={...renderer,draw(c,o){calls.push({...o});return renderer.draw(c,o)}};
 for(let dir=0;dir<8;dir++)for(const pulse of [0,.8,2]){
  drawPart(ctx,id,{s:3,fx:1,fy:0,perp:{x:0,y:1},bx:0,by:0,bodyW:8,bodyH:7,mouth:{x:2,y:3},authoredFacing:dir,authoredFrameIndex:pulse?1:0,authoredParts:{[id]:wrapped},behavior:{mouthPulse:pulse}});
  const call=calls.at(-1);assert.equal(call.scale,3*.72/2);assert.deepEqual([call.x,call.y],[6,9]);assert.equal(call.frameIndex,pulse?1:0);count++;
 }
 const rest=recolorIndexedFrame(asset,'idle:2:0'),active=recolorIndexedFrame(asset,'idle:2:1');
 assert.notDeepEqual(rest,active,id+' must visibly articulate');
 for(let y=0;y<32;y++)for(let x=0;x<14;x++){
  const at=(y*32+x)*4;assert.deepEqual(rest.slice(at,at+4),active.slice(at,at+4),id+' painted attachment cannot change during processing');
 }
 if(id==='tusk-jaw')for(let i=0;i<rest.length;i+=4){
  const ivory=[[165,157,120],[225,219,183],[244,239,207]].some(c=>c.every((v,j)=>v===rest[i+j]));
  if(ivory)assert.deepEqual(rest.slice(i,i+4),active.slice(i,i+4),'Rigid tusk paint must remain fixed');
 }
}
console.log(`${count} mounted jaw facing/pulse cases: fixed root/scale, distinct working tissue, rigid tusks, validated checksum and legacy defaults PASS`);
