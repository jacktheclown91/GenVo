#!/usr/bin/env node
// The creator explicitly installs an exported browser draft into the ONE live art source catalog.
// Example: node tools/install-native-art-draft.mjs downloaded-draft.json stalk-eye 2
// No automatic biology changes, and no rewriting original human-reference files.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {PARTS} from '../src/lineage/part-registry.js';

const [file,id,facingText]=process.argv.slice(2),facing=Number(facingText);
if(!file||!PARTS[id]||!Number.isInteger(facing)||facing<0||facing>7)throw Error('Usage: node tools/install-native-art-draft.mjs <draft.json> <registered-part-id> <facing 0..7>');
const draft=JSON.parse(fs.readFileSync(file,'utf8'));
if(draft.schema!=='genvo8.lab.authored-draft/2'||draft.width!==32||draft.height!==32||!Array.isArray(draft.framePixels)||!draft.framePixels.length||draft.framePixels.length>64||!draft.framePixels.every(p=>Array.isArray(p)&&p.length===4096&&p.every(v=>Number.isInteger(v)&&v>=0&&v<=255)))throw Error('Draft must contain exact 32×32 RGBA source frames. No resampling or partial frames.');
if(!Array.isArray(draft.frameDurations)||draft.frameDurations.length!==draft.framePixels.length||!draft.frameDurations.every(n=>Number.isInteger(n)&&n>=1&&n<=655350))throw Error('Invalid frame durations');
const base=new URL('../assets/art/',import.meta.url),catalogFile=new URL('catalog.json',base),catalog=JSON.parse(fs.readFileSync(catalogFile,'utf8'));
const record=catalog.parts.find(p=>p.partId===id);if(!record)throw Error('Part is not currently in the published first wave. Add an approved source template before installing.');
const sourceFile=new URL(record.path,base),bytes=fs.readFileSync(sourceFile);
if(crypto.createHash('sha256').update(bytes).digest('hex')!==record.checksumSha256)throw Error('Source hash differs from manifest: review manual edits before installing');
const source=JSON.parse(bytes);const frames=source.frames.filter(f=>f.facing!==facing),added=[];
for(let i=0;i<draft.framePixels.length;i++)added.push({state:'idle',facing,index:i,durationMs:draft.frameDurations[i],rgbaBase64:Buffer.from(draft.framePixels[i]).toString('base64'),jointDegrees:Math.max(-180,Math.min(180,draft.frameJointAngles?.[i]||0))});
const merged=[...frames,...added].sort((a,b)=>a.facing-b.facing||a.index-b.index);
if(!merged.every(f=>f.index<64))throw Error('Excessive authored frame index');
source.frames=merged;source.version++;
const fresh=Buffer.from(JSON.stringify(source));
// Avoid corrupting the canonical source on validation failure: compile an isolated candidate first.
const {compileSourceRgbaPart}=await import('../src/render/indexed-part-art.js');
await compileSourceRgbaPart({...source,frames:source.frames.map(f=>({...f,rgba:Buffer.from(f.rgbaBase64,'base64')}))});
// All validations passed. Atomically replace only the installed part's source, derived output and manifest.
const tmp=new URL(record.path+'.tmp',base);fs.writeFileSync(tmp,fresh);fs.renameSync(tmp,sourceFile);
record.checksumSha256=crypto.createHash('sha256').update(fresh).digest('hex');
const safeManifest=new URL('catalog.json.tmp',base);fs.writeFileSync(safeManifest,JSON.stringify(catalog,null,2)+'\n');fs.renameSync(safeManifest,catalogFile);
// Derived native preview PNG for east-facing frame 0, built without third-party dependencies.
// Canvas's RGBA bytes are kept exact; PNG filter type 0 and deflate ensure no resampling.
const selected=source.frames.find(f=>f.facing===2&&f.index===0);
if(selected){const rgba=Buffer.from(selected.rgbaBase64,'base64');const scan=Buffer.alloc(32*(1+32*4));for(let y=0;y<32;y++)rgba.copy(scan,y*129+1,y*128,(y+1)*128);
 let crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
 function crc32(data){let c=0xffffffff;for(const n of data)c=crcTable[(c^n)&255]^(c>>>8);return(c^0xffffffff)>>>0}
 function chunk(tag,body){const name=Buffer.from(tag);const len=Buffer.alloc(4);len.writeUInt32BE(body.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,body])));return Buffer.concat([len,name,body,crc])}
 const header=Buffer.alloc(13);header.writeUInt32BE(32,0);header.writeUInt32BE(32,4);header[8]=8;header[9]=6;
 const safePng=new URL(record.png+'.tmp',base);fs.writeFileSync(safePng,Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]));fs.renameSync(safePng,new URL(record.png,base));}
const build=spawnSync(process.execPath,[new URL('./build-native-part-art.mjs',import.meta.url).pathname],{encoding:'utf8'});
if(build.status!==0)throw Error('Art source installed, but derived indexed output failed validation: '+(build.stderr||build.stdout));
console.log(`Installed ${id} facing ${facing} (${added.length} frames). Art source, derived catalog and native PNG updated. Run tests/native-part-catalog.mjs before packaging.`);
