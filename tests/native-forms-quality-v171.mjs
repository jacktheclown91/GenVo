import fs from 'node:fs';
import assert from 'node:assert/strict';
const body=['small-torso','soft-torso','reinforced-torso','sleek-torso','light-torso','stout-torso','barrel-torso','dome-torso','long-torso'];
const legs=['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb'];
const masks=new Set(),colors=new Map(),bounds=[];
for(const id of [...body,...legs]){
 const source=JSON.parse(fs.readFileSync(new URL(`../assets/art/parts/${id}.json`,import.meta.url),'utf8'));
 assert.equal(source.width,32);assert.equal(source.height,32);assert.equal(source.frames.length,16);
 const frames=source.frames.map(f=>({key:`${f.facing}:${f.index}`,data:Buffer.from(f.rgbaBase64,'base64')}));
 assert.ok(frames.every(f=>f.data.length===4096));
 let full=0;
 for(const {data} of frames){
  for(let i=0;i<1024;i++) if(data[i*4+3]){
   full++;
   if(legs.includes(id)){
    const x=i%32,y=Math.floor(i/32);
    const rig=source.rig; const regions=[rig.upper.rect,rig.lower.rect];
    assert.ok(regions.some(([rx,ry,rw,rh])=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh),`${id}: visual pixel outside section atlas at ${x},${y}`);
   }
  }
 }
 assert.ok(full>=300,`${id}: missing readable pixel coverage`);
 const sample=frames.find(f=>f.key==='2:0').data;
 const mask=Buffer.from([...Array(1024)].map((_,i)=>sample[i*4+3]?'1'.charCodeAt(0):'0'.charCodeAt(0))).toString();
 if(body.includes(id)){assert.ok(!masks.has(mask),`Duplicate torso silhouette: ${id}`);masks.add(mask)}
 const ncolors=new Set(Array.from({length:1024},(_,i)=>i).filter(i=>sample[i*4+3]).map(i=>`${sample[i*4]},${sample[i*4+1]},${sample[i*4+2]}`)).size;
 assert.ok(ncolors>=4,`${id}: too little readable tonal structure`);colors.set(id,ncolors);
}
assert.equal(masks.size,9);
console.log(`native-forms-quality-v171: ${body.length} distinct torso alpha silhouettes, ${legs.length} joint-bound limb sheets, 272 frames, purposeful shaded clusters PASS`);
