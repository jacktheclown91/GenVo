import assert from 'node:assert/strict';
import {drawDetailedFeeler} from '../src/render/feeler-detail.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
import {compileIndexedPart} from '../src/render/indexed-part-art.js';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const palette=Object.freeze({shade:'#183429',body:'#4c8564',light:'#b1d4a2'}),colors=new Set(Object.values(palette));let probes=0;
for(const resolution of [64,128])for(let facing=0;facing<8;facing++)for(const side of [-1,1])for(const scale of [1,2,8])for(let phase=0;phase<8;phase++){
 const angle=(facing-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),px=-fy,py=fx,root=Object.freeze({x:px*side*4,y:py*side*4}),tip=Object.freeze({x:root.x+fx*2+px*(side*.75+Math.sin(phase)*.3),y:root.y+fy*2+py*(side*.75+Math.sin(phase)*.3)}),calls=[],c={set fillStyle(v){assert.ok(colors.has(v))},fillRect(...v){calls.push(v)}};
 assert.equal(drawDetailedFeeler(c,{root,tip,scale,palette,resolution,side}),true);assert.ok(calls.length>10&&calls.length<250);for(const [x,y,w,h] of calls){assert.ok([x,y,w,h].every(Number.isInteger),'fine pixel tissue retains crisp screen pixels');assert.ok(w>0&&h>0);assert.ok(x>=Math.min(root.x,tip.x)*scale-2*scale&&x<=Math.max(root.x,tip.x)*scale+2*scale);assert.ok(y>=Math.min(root.y,tip.y)*scale-2*scale&&y<=Math.max(root.y,tip.y)*scale+2*scale)}probes++;
}
let calls=0;const untouched={fillRect(){calls++}};for(const resolution of [32,16,96,undefined])assert.equal(drawDetailedFeeler(untouched,{root:{x:0,y:0},tip:{x:2,y:1},palette,resolution}),false);assert.equal(calls,0,'native fallback is not repainted');assert.equal(drawDetailedFeeler(untouched,{root:{x:0,y:0},tip:{x:0,y:0},palette,resolution:128}),false);
for(const resolution of [32,64,128]){const raw=resolution===32?JSON.parse(fs.readFileSync(new URL('../assets/art/parts/head-base.indexed.json',import.meta.url))):JSON.parse(gunzipSync(fs.readFileSync(new URL('../assets/art/production-candidate-v1/head-base-'+resolution+'.indexed.json.gz',import.meta.url)))),asset=await compileIndexedPart(raw),createCanvas=()=>({width:0,height:0,getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}}),renderer=prepareIndexedPartRenderer(asset,{createCanvas});assert.equal(renderer.resolution,resolution);assert.ok(Object.isFrozen(renderer));assert.equal(renderer.checksum,asset.checksum)}
console.log('Detailed feelers PASS: '+probes+' fixed-input facings/frames/sides/zooms, native grid detail, inherited colors, integer pixels, bounded geometry, immutable renderer resolution and untouched32 fallback.');
