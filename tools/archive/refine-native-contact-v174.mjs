import fs from 'node:fs';
import crypto from 'node:crypto';
const base=new URL('../../assets/art/',import.meta.url);
const file=new URL('catalog.json',base),catalog=JSON.parse(fs.readFileSync(file));
const ids=['walking-leg','spring-leg','grasper','runner-leg','sturdy-leg','webbed-leg','padded-leg','digging-forelimb'];
for(const id of ids){
 const entry=catalog.parts.find(p=>p.partId===id),sourceFile=new URL(entry.path,base),source=JSON.parse(fs.readFileSync(sourceFile));
 if(source.artReview?.startsWith('v1.74'))continue;
 if(source.rig?.lower?.rect[1]!==16)throw Error('Expected dual-row limb rig: '+id);
 const tones=source.regions.find(r=>r.id==='skin').colors;
 for(const frame of source.frames){
  const data=Buffer.from(frame.rgbaBase64,'base64');
  const paint=(x,y,t)=>{const k=(y*32+x)*4;if(data[k+3]===255)for(let c=0;c<3;c++)data[k+c]=tones[t][c]};
  // Inset ankle cuff: recessed seam, upper bevel and lower contact plane.
  // Existing alpha and protected claws/webbing remain exactly intact.
  for(let x=23;x<=25;x++)for(let y=21;y<=27;y++){
   const k=(y*32+x)*4;
   if(!tones.some(t=>t.every((v,c)=>v===data[k+c])))continue;
   paint(x,y,x===23?1:y<=23?3:y>=26?0:2);
  }
  // Two discrete heel highlight clusters follow the lifted/contact microstate.
  for(const [x,y] of frame.index===1?[[24,22],[25,22],[26,23]]:[[24,23],[25,23],[26,24]]){
   const k=(y*32+x)*4;if(tones.some(t=>t.every((v,c)=>v===data[k+c])))paint(x,y,4);
  }
  frame.rgbaBase64=data.toString('base64');
 }
 source.artReview='v1.74 runtime contact revision: inset ankle cuffs and pose-driven heel highlights; creator visual approval pending';
 const text=JSON.stringify(source);fs.writeFileSync(sourceFile,text);entry.checksumSha256=crypto.createHash('sha256').update(text).digest('hex');entry.status='development-review-v174';
}
fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
console.log('Eight limb source packs enriched without altering silhouettes, rigs or protected materials.');
