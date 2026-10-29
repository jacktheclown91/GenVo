import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compileIndexedPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
const root=new URL('../assets/art/production-candidate-v1/',import.meta.url),catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',root))),old=JSON.parse(fs.readFileSync(new URL('../docs/limb-refinement-2026-10-28/before/catalog.json',import.meta.url))),ids=['walking-leg','runner-leg','sturdy-leg'];
const scaled=(v,r)=>Array.isArray(v)?v.map(x=>scaled(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaled(x,r)])):typeof v==='number'?v*r:v;
let count=0;const areas={};
for(const e of catalog.parts){if(['proto-wing','flight-wing'].includes(e.partId))continue;if(!ids.includes(e.partId)){if(['small-torso','soft-torso','dome-torso','head-base'].includes(e.partId))continue;assert.deepEqual(e,old.parts.find(p=>p.partId===e.partId&&p.resolution===e.resolution),'unrelated candidate art stays exact');continue}
 const asset=await compileIndexedPart(JSON.parse(gunzipSync(fs.readFileSync(new URL(e.path,root))))),native=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/'+e.partId+'.indexed.json',import.meta.url))),ratio=e.resolution/32;
 assert.equal(asset.checksum,e.checksum);assert.deepEqual(asset.rig,scaled(native.rig,ratio));assert.deepEqual(asset.regions,native.regions);assert.deepEqual(asset.rootAnchorPx,scaled(native.rootAnchorPx,ratio));assert.equal(asset.displayScale*ratio,native.displayScale);
 for(let facing=0;facing<8;facing++){const planted=asset.frames.find(f=>f.facing===facing&&f.index===0),recovering=asset.frames.find(f=>f.facing===facing&&f.index===1);assert.notDeepEqual(planted.alpha,recovering.alpha,'actual digital pads flex during recovery');assert.equal(planted.durationMs,native.frames.find(f=>f.facing===facing&&f.index===0).durationMs);
 for(const frame of [planted,recovering]){assert.ok(new Set(frame.indices.filter((v,i)=>frame.alpha[i])).size>=4,'native tissue uses the inherited shading ramp');for(let n=0;n<e.resolution;n++)assert.equal(frame.alpha[n]+frame.alpha[(e.resolution-1)*e.resolution+n]+frame.alpha[n*e.resolution]+frame.alpha[n*e.resolution+e.resolution-1],0,'paint stays inside the authored cell');count++}
 const changed=recolorIndexedFrame(asset,planted.key,{skin:native.regions[0].colors.map(c=>c.map(v=>Math.round(v*.7)))}),base=recolorIndexedFrame(asset,planted.key);assert.ok(changed.some((v,i)=>i%4!==3&&v!==base[i]),'actual native pigmentation tints new muscle tissue');for(let i=3;i<base.length;i+=4)assert.equal(changed[i],base[i]);}
 areas[e.partId+'-'+e.resolution]=asset.frames[0].alpha.filter(v=>v>0).length;
}
for(const r of [64,128])assert.ok(areas['runner-leg-'+r]<areas['walking-leg-'+r]&&areas['walking-leg-'+r]<areas['sturdy-leg-'+r],'distinct runner/walker/sturdy silhouettes');
assert.ok(catalog.parts.filter(e=>!['proto-wing','flight-wing'].includes(e.partId)).reduce((n,e)=>n+e.bytes,0)<=old.parts.reduce((n,e)=>n+e.bytes,0),'detail does not increase shipped candidate bytes');
console.log('Detailed limbs PASS: '+count+' native frames, distinct silhouettes, flexing toes, exact rigs/pivots/palettes/timing, no clipping, inherited tints and other16 retained variants (torso/head revisions checked separately).');
