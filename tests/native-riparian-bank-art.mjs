import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {riparianBankArt as art} from '../assets/art/environment/riparian-bank.js';
import {riparianColorAt} from '../src/render/riparian-bank-art.js';
import {drawRiparianDepth} from '../src/render/habitat-detail.js';
import {smoothedWaterScore} from '../src/render/landform.js';
assert.equal(art.schema,'genvo.environment-riparian-bank/1');assert.equal(art.width,32);assert.equal(art.height,32);assert.deepEqual(art.alpha,[.31,.32,.22]);assert.equal(art.frames.length,4);assert.equal(new Set(art.frames.map(f=>JSON.stringify(f))).size,4);
const master=fs.readFileSync(new URL('../assets/art/production-review/riparian-bank-v1/sediment-master.png',import.meta.url));assert.equal(createHash('sha256').update(master).digest('hex'),art.sourceSha256);
for(const f of art.frames){assert.equal(f.length,1024);assert.ok(f.every(v=>Number.isInteger(v)&&v>=0&&v<4));assert.equal(new Set(f).size,4)}
for(const palette of art.palettes){assert.equal(palette.length,4);for(const rgb of palette)assert.ok(rgb.length===3&&rgb.every(v=>Number.isInteger(v)&&v>=0&&v<=255))}
for(const score of [NaN,-1,.29,.54,1])assert.equal(riparianColorAt(score,0,0,0,0),null);
const oldText=fs.readFileSync(new URL('../assets/art/production-review/riparian-bank-v1/habitat-detail-baseline.js',import.meta.url),'utf8').replace(/^import .*\r?\n/gm,'').replace(/export /g,'');
const original=new Function('visualCompositionAt','smoothedWaterScore',oldText+';return drawRiparianDepth')(()=>{throw Error('Not a composition test')},smoothedWaterScore);
const n=12,world={n,seedHash:191,idx(x,y){return Math.max(0,Math.min(n-1,Math.floor(y)))*n+Math.max(0,Math.min(n-1,Math.floor(x)))},moisture:new Float32Array(n*n),water:new Uint8Array(n*n)};
const alpha=style=>Number(style.slice(style.lastIndexOf(',')+1,-1));
function paint(fn,options){const calls=[],ctx={fillStyle:'',depth:0,save(){this.depth++},restore(){this.depth--},fillRect(...rect){calls.push({rect,style:this.fillStyle})}};fn(ctx,options);assert.equal(ctx.depth,0);return calls}
let cases=0,changed=0;
for(const moisture of [.1,.59,.95])for(const x of [3,4])for(const y of [3,4])for(const edge of ['n','s','e','w','all','none'])for(const mode of [0,1,2,3,4]){
 world.moisture.fill(moisture);world.water.fill(0);const coords={n:[x,y-1],s:[x,y+1],w:[x-1,y],e:[x+1,y]};for(const [key,[xx,yy]]of Object.entries(coords))if(key===edge||edge==='all')world.water[world.idx(xx,yy)]=1;
 const depth=mode===4?null:Uint8Array.from({length:1024},(_,i)=>mode===0?i%256:mode===1?255-i%256:mode===2?(i%32)*8:(i/32|0)*8),options={world,isWater:(x,y)=>!!world.water[world.idx(x,y)],px:13,py:21,u:1.7,i:world.idx(x,y),x,y,depth};const before=JSON.stringify(world),a=paint(original,options),b=paint(drawRiparianDepth,options);assert.equal(JSON.stringify(world),before);assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i++){assert.deepEqual(a[i].rect,b[i].rect,'exact original spatial coverage');assert.equal(alpha(a[i].style),alpha(b[i].style),'exact original opacity');if([.31,.32,.22].includes(alpha(a[i].style))){if(a[i].style!==b[i].style)changed++}else assert.equal(a[i].style,b[i].style,'existing habitat accents unchanged')}
 cases++;
}
assert.ok(changed>10000);console.log('Native riparian bank PASS:',cases,'original-painter comparisons, all original coverage/alpha/accent calls, source hash, four native cells, immutable physical fields and deterministic color-only replacement.');
