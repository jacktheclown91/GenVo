import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compileSourceRgbaPart,recolorIndexedFrame} from '../src/render/indexed-part-art.js';
import {prepareIndexedPartRenderer} from '../src/render/indexed-part-renderer.js';
const ids=['climber-leg','hook-pad','proto-wing'];
for(const id of ids){
 const path='assets/art/parts/'+id+'.json',old=JSON.parse(fs.readFileSync('assets/art/production-review/climbing-wing-v1/'+id+'-baseline.json')),now=JSON.parse(fs.readFileSync(path));
 assert.equal(createHash('sha256').update(fs.readFileSync('assets/art/production-review/climbing-wing-v1/'+id+'-baseline.json')).digest('hex'),now.climbingWingArt.previousSourceSha256,'retained original input provenance');
 const metadata=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!['frames','version','authorship','climbingWingArt','rig'].includes(k)));assert.deepEqual(metadata(now),metadata(old),'original root/display/palette/source metadata');assert.equal(now.version,old.version+1);assert.equal(now.frames.length,16);
 if(id==='climber-leg'){assert.equal(old.rig,undefined,'new registration must not overwrite an existing rig');assert.deepEqual(now.rig,JSON.parse(fs.readFileSync('assets/art/parts/walking-leg.json')).rig,'uses the established native two-bone registration')}
 else assert.deepEqual(now.rig,old.rig,'existing hook/proto-wing mounting contracts unchanged');
 assert.equal(createHash('sha256').update(fs.readFileSync('assets/art/production-review/climbing-wing-v1/'+id+'-master.png')).digest('hex'),now.climbingWingArt.masterSha256);
 const compiled=await compileSourceRgbaPart({...now,frames:now.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});let fixed=0;
 for(let f=0;f<16;f++){const {rgbaBase64:a,...aMeta}=old.frames[f],{rgbaBase64:b,...bMeta}=now.frames[f];assert.deepEqual(bMeta,aMeta,'exact frame keys/facings/durations retained');const rgba=Buffer.from(b,'base64');assert.ok(Buffer.from(recolorIndexedFrame(compiled,compiled.frames[f].key)).equals(rgba),'exact source/indexed native RGBA');
  const skin=[[10,30,20],[30,60,40],[70,110,80],[120,170,130],[200,230,210]],tinted=recolorIndexedFrame(compiled,compiled.frames[f].key,{skin});for(let k=0;k<1024;k++){assert.equal(tinted[k*4+3],rgba[k*4+3]);if(compiled.frames[f].indices[k]>=5){assert.deepEqual([...tinted.slice(k*4,k*4+4)],[...rgba.slice(k*4,k*4+4)],'protected keratin stays fixed');if(rgba[k*4+3])fixed++}}
  if(id!=='climber-leg')assert.ok(rgba[(16*32+16)*4+3],'painted root must cover the preserved actual mounting point');
  if(id!=='climber-leg')for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(x===0||x===31||y===0||y===31)assert.equal(rgba[(y*32+x)*4+3],0,'isolated source must retain margin through diagonal rotation');
  if(id==='climber-leg')for(const [x,y] of [[4,8],[27,8],[28,8],[4,24],[27,24]])assert.ok(rgba[(y*32+x)*4+3],'paint reaches every existing atlas attachment');
 }
 if(id!=='proto-wing')assert.ok(fixed>0,'gripping keratin remains a protected material');else for(const frame of compiled.frames)for(let k=0;k<1024;k++)if(frame.alpha[k])assert.ok(frame.indices[k]<5,'feather tissue stays inheritable');
 for(let dir=0;dir<8;dir++)assert.notDeepEqual(recolorIndexedFrame(compiled,'idle:'+dir+':0'),recolorIndexedFrame(compiled,'idle:'+dir+':1'),'retain both rest/contact paint phases');
 if(id==='climber-leg'){
  const imageContext={createImageData(){return{data:new Uint8ClampedArray(4096)}},putImageData(){}},renderer=prepareIndexedPartRenderer(compiled,{createCanvas:()=>({getContext:()=>imageContext})});
  for(let dir=0;dir<8;dir++)for(let phase=0;phase<8;phase++){
   const root={x:0,y:0},knee={x:2+Math.cos(phase)*1.7,y:Math.sin(phase)*3},foot={x:5+Math.sin(phase)*2,y:2+Math.cos(phase)*3},before=JSON.stringify({root,knee,foot}),translations=[];let depth=0,draws=0;
   const c={save(){depth++},restore(){depth--},translate(x,y){assert.ok(Number.isFinite(x+y));translations.push({x,y})},rotate(a){assert.ok(Number.isFinite(a))},scale(x,y){assert.ok(x>0&&y>0)},drawImage(){draws++}};
   assert.equal(renderer.drawLimb(c,{root,knee,foot,scale:4,facing:dir,frameIndex:phase&1}),true);assert.equal(draws,4);assert.equal(depth,0);assert.deepEqual(translations,[root,knee,root,knee],'native thigh/shin and insertions follow assembly joints');assert.equal(JSON.stringify({root,knee,foot}),before);
  }
 }
}
console.log('Native climbing/wing art PASS: exact root/display/material/frame contracts, 48 source/indexed frames, protected keratin and inherited feathers, new registered limb paint at unchanged real joints, all facings/contact phases.');
