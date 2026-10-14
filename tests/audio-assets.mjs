import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {AUTHORED_AUDIO,authoredAudioIds} from '../src/audio/assets.js';

function wavInfo(buf){
  assert.equal(buf.toString('ascii',0,4),'RIFF');
  assert.equal(buf.toString('ascii',8,12),'WAVE');
  let pos=12,fmt=null,data=null;
  while(pos+8<=buf.length){const id=buf.toString('ascii',pos,pos+4),size=buf.readUInt32LE(pos+4),start=pos+8;if(id==='fmt ')fmt={format:buf.readUInt16LE(start),channels:buf.readUInt16LE(start+2),sampleRate:buf.readUInt32LE(start+4),bits:buf.readUInt16LE(start+14)};if(id==='data'){data={start,size};break}pos=start+size+(size&1)}
  assert.ok(fmt&&data,'WAV contains fmt and data chunks');
  assert.equal(fmt.format,1,'assets use portable PCM');assert.equal(fmt.channels,1,'fauna/stems remain mono for cheap spatialization');assert.equal(fmt.sampleRate,22050);assert.equal(fmt.bits,16);
  let peak=0,sum=0,count=0;for(let i=data.start;i<data.start+data.size;i+=2){const v=buf.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));sum+=v*v;count++}
  return{...fmt,duration:count/fmt.sampleRate,peak,rms:Math.sqrt(sum/Math.max(1,count))};
}

const ids=authoredAudioIds();
assert.ok(ids.length>=32,'authored pack includes ambience, lineage theme/branch music, food, shelter and creature voices');
let total=0,shipped=0;
for(const [id,def] of Object.entries(AUTHORED_AUDIO)){
  // v1.58.0: levels are checked on the 16-bit WAV master; the game ships its compressed copies.
  const path=fileURLToPath(new URL('../'+def.master,import.meta.url)),buf=await readFile(path),info=wavInfo(buf);total+=(await stat(path)).size;
  assert.ok(def.urls?.length===2&&def.urls[0].endsWith('.ogg')&&def.urls[1].endsWith('.m4a'),`${id} ships Opus with an AAC fallback`);
  for(const u of def.urls){const st=await stat(fileURLToPath(u));assert.ok(st.size>500,`${id} has ${u.split('.').pop()} audio`);shipped+=st.size}
  if(def.kind==='loop')assert.ok(def.seconds===Math.round(info.duration),`${id} records its exact loop length`);
  assert.ok(info.peak>.2&&info.peak<.9,`${id} has useful but headroom-safe peak level`);
  assert.ok(info.rms>.02&&info.rms<.30,`${id} has non-silent, bounded RMS`);
  if(def.kind==='loop')assert.ok(info.duration>=5&&info.duration<=16,`${id} is a bounded loop stem`);
  else assert.ok(info.duration>=.25&&info.duration<=1.1,`${id} is a short positional cue`);
}
assert.ok(total<5_000_000,`authored audio masters stay bounded (${total} bytes)`);
assert.ok(shipped<2_000_000,`the compressed pack the game ships stays small (${shipped} bytes)`);
console.log(`audio asset checks: PASS (${ids.length} assets, masters ${total} bytes, shipped ${shipped} bytes)`);
