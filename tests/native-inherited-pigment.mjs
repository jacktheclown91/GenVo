import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inheritedSkinRamp} from '../src/render/genvo-draw.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
import {artMount} from '../src/render/part-sprites.js';
const C=JSON.parse(fs.readFileSync(new URL('../assets/art/parts/soft-torso.indexed.json',import.meta.url)));
const mark=[];
function factory(){const canvas={pixels:null};const ctx={createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(image){canvas.pixels=new Uint8ClampedArray(image.data)}};canvas.getContext=()=>ctx;mark.push(canvas);return canvas}
const native=prepareIndexedPartRenderer(C,{createCanvas:factory});
const palate1={body:'#89bc96',shade:'#426553',light:'#c6e3b3'};
const palate2={body:'#b97862',shade:'#61392c',light:'#f5b791'};
const pigment1=inheritedSkinRamp(palate1),pigment2=inheritedSkinRamp(palate2);
assert.ok(pigment1&&pigment2,'both phenotypes provide valid five-tone native pigments');
assert.deepEqual(pigment1[2],[137,188,150],'native pigment retains real RGB ordering');
assert.deepEqual(pigment2[2],[185,120,98],'rust-colored parent must not become blue');
const captures=[];const dest={save(){},restore(){},translate(){},scale(){},drawImage(cv){captures.push(cv.pixels)}};
for(const pigment of [pigment1,pigment2,pigment1])assert.equal(native.drawTorso(dest,{pigment, width:20,height:14, facing:2,timeMs:0}),true);
assert.strictEqual(captures[0],captures[2],'same face and inherited pigmentation shares cached displayed pixels');
assert.notDeepEqual(captures[0],captures[1],'distinct genotypes produce different native skin colors');
const frame=C.frames.find(f=>f.key==='idle:2:0'),off=C.regions.find(r=>r.id==='protected-detail').offset;
for(let i=0;i<1024;i++){
 const a=[...captures[0].slice(i*4,i*4+3)],b=[...captures[1].slice(i*4,i*4+3)];
 if(frame.indices[i]>=off)assert.deepEqual(a,b,'protected eye/marking tones remain identical');
}
assert.equal(mark.length,18,'only 16 base frames plus 2 requested pigment frames are rasterized');
const K={bx:2,by:4,bodyW:10,bodyH:8,fx:1,fy:0,perp:{x:0,y:1},sign:-1};
assert.equal(artMount('balance-tail',K).x,2-5*.96,'tail mounts at facing-correct mantle edge, not face');
assert.equal(artMount('sail-fin',K).y,4-8*.33,'dorsal silhouette attaches to mantle');
assert.equal(artMount('armor-plate',K).mirrorX,true);
assert.equal(artMount('simple-eye',K),null,'face uses face anchor');
console.log('native inherited-pigment and anatomical socket mounting PASS');
