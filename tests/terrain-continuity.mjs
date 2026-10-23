import assert from 'node:assert/strict';
import {floraTraceAnchor} from '../src/render/flora.js';
import {terrainPaletteAt,terrainGrainAt} from '../src/render/identity.js';
import {substrateArtAddress,substrateTileData} from '../src/render/biome-substrates.js';
const n=40,w={n,len:n*n,seedHash:312937,regionOrigin:{x:100,y:-80},idx(x,y){return Math.floor(y)*n+Math.floor(x)},temperature:new Float32Array(n*n).fill(.5),moisture:new Float32Array(n*n).fill(.1),water:new Uint8Array(n*n),terrain:{elevation:new Float32Array(n*n).fill(.1)}};
const before=JSON.stringify(w);
const first=substrateTileData(w,12,12),repeated=substrateTileData(w,14,12);assert.notDeepEqual(first.pixels,repeated.pixels,'authored source no longer repeats after two terrain tiles');
const left={...w,regionOrigin:{x:100,y:-80}},right={...w,regionOrigin:{x:120,y:-80}};
for(let q=0;q<30;q++){const x=q/13,y=q/7;assert.deepEqual(substrateArtAddress(left,x+20,y),substrateArtAddress(right,x,y),'identical absolute position across region ownership');assert.ok(Math.abs(terrainGrainAt(left,x+20,y)-terrainGrainAt(right,x,y))<1e-12);const a=substrateArtAddress(w,x,y);assert.ok(a.frame>=0&&a.frame<4&&a.pixel>=0&&a.pixel<1024)}
// Reconstruct the unchanged renderer's category baseline plus the new correction.
function tone(m,f){const old=m>.68?[130,29,27]:f>.64?[102,30,30]:f<.34?[75,20,29]:[96,25,29],p=terrainPaletteAt(w,12.5,12.5,m,f);return old.map((v,k)=>v+p[['hue','sat','light'][k]])}
for(const [m,f,axis] of [[.68,.5,0],[.5,.64,1],[.5,.34,1]]){const a=tone(m-(axis===0?1e-7:0),f-(axis===1?1e-7:0)),b=tone(m+(axis===0?1e-7:0),f+(axis===1?1e-7:0));assert.ok(a.every((v,k)=>Math.abs(v-b[k])<.0001),'no old categorical palette jump')}
for(let q=1;q<30;q++){const x=q/3,a=terrainGrainAt(w,x-1e-7,4),b=terrainGrainAt(w,x+1e-7,4);assert.ok(Math.abs(a-b)<.00001,'light signal continuous across tile cache boundaries')}
const rows=new Set(),columns=new Set();for(let y=0;y<20;y++)for(let x=0;x<20;x++){const a=floraTraceAnchor('sunmoss',x,y);rows.add(a.oy);columns.add(a.ox);assert.ok(a.ox>=3&&a.ox<=12&&a.oy>=5&&a.oy<=14)}assert.equal(rows.size,10,'minor plants no longer confined to three bottom rows');assert.equal(columns.size,10);
assert.equal(JSON.stringify(w),before,'all physical fields and seed unchanged');console.log('Terrain continuity PASS: removed two-tile source repeat, absolute coordinate continuity, smooth category transitions, bounded authored addresses, immutable world.');
