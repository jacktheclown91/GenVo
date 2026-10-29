import assert from 'node:assert/strict';
import {drawGenvoSprite,SPRITE_CACHE,SPRITE_STATS} from '../src/render/genvo-draw.js';
import {phenotypeFor} from '../src/organisms/species.js';
import {studyCreatures} from '../tools/art-resolution/specimens.mjs';
let allocations=0;
const context=canvas=>new Proxy({canvas,drawImage(){}},{get:(t,k)=>k in t?t[k]:(()=>{})});
globalThis.document={createElement(tag){assert.equal(tag,'canvas');allocations++;const canvas={width:0,height:0,getContext(){return this.ctx??=context(this)}};return canvas}};
SPRITE_CACHE.scratchPool=1;
const animal=studyCreatures()[0],ctx=context({}),paint=scale=>drawGenvoSprite(ctx,{animal,phenotype:phenotypeFor(animal),scale,frame:0,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'}});
const sizes=[1,1.05,1.1,1.15,1.2,1.25,1.3,1.35];for(const s of sizes)paint(s);const warm=allocations;
for(let i=0;i<40;i++)for(const s of sizes)paint(s);
assert.equal(allocations,warm,'alternating inherited sizes reuse prepared scratch canvases');assert.equal(SPRITE_STATS.scratchSizes(),8);
for(let i=0;i<80;i++){paint(1+i*.1);assert.ok(SPRITE_STATS.scratchSizes()<=8);assert.ok(SPRITE_STATS.scratchBytes()<=32*1024*1024)}
SPRITE_CACHE.scratchPool=256;for(let i=0;i<100;i++)paint(8);assert.ok(SPRITE_STATS.scratchBytes()<=32*1024*1024,'finished rotation shares the same total memory budget');
console.log('Sprite scratch size PASS: alternating-size reuse, bounded LRU and shared 32 MiB rotation budget.');
