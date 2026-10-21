import assert from 'node:assert/strict';
import {Renderer} from '../src/render/renderer.js';
import {AudioDirector} from '../src/audio/audio.js';

// Gameplay must not compile several expensive native chunks in one render.
const priorDocument=globalThis.document;globalThis.document={};
const r=Object.create(Renderer.prototype);
r.sceneShown=true;r.terrainChunkCache=new Map();r.terrainRefreshQueue=[];r.terrainRefreshQueued=new Set();r.habitatFieldDay=1;
let builds=0;r.buildTerrainChunk=()=>{builds++;return {name:'compiled'}};
assert.equal(r.terrainChunk(3,4),null);
assert.equal(builds,0,'new gameplay chunk must not synchronously compile native terrain');
assert.equal(r.terrainRefreshQueue.length,1);
assert.equal(r.terrainChunk(3,4),null);
assert.equal(r.terrainRefreshQueue.length,1,'repeated draw should not duplicate queued work');
const staleKey='3,4,4',stale={name:'old scene'};
r.terrainChunkCache.set(staleKey,{sig:0,canvas:stale});
assert.equal(r.terrainChunk(3,4),stale,'preserve detailed cached art while scheduling refresh');
assert.equal(builds,0);
r.sceneShown=false;
assert.deepEqual(r.terrainChunk(5,4),{name:'compiled'},'preparation/direct render retains full-resolution construction');
assert.equal(builds,1);
const rects=[];r.ctx={set fillStyle(v){this.color=v},fillRect(...args){rects.push([this.color,...args])}};
r.sim={world:{n:16,water:Uint8Array.from({length:256},(_,i)=>i===4*16+5?1:0),idx:(x,y)=>y*16+x}};
r.drawPendingTerrainChunk(1,1,4,32,128,128);
const largeTiles=rects.filter(([color,x,y,w,h])=>w===32&&h===32);
assert.equal(largeTiles.length,16,'every pending ground tile has immediate readable backing');
assert.ok(largeTiles.some(([color,x,y])=>/^#4[0-9a-f]{5}$/i.test(color)&&x===160&&y===128),'pending water tile is visibly distinct');
assert.ok(rects.length>16,'pending terrain has modest visual variation until native art arrives');
globalThis.document=priorDocument;

const audio=new AudioDirector(null);
assert.ok(audio.ambienceLevel>=.25,'default natural ambience should be audible');
const visited=[],started=[];
audio.ctx={decodeAudioData:()=>null};
audio.decodeAudio=async bytes=>({n:bytes.byteLength});
audio.startAuthoredLoops=()=>{started.push({at:visited.length,decoded:audio.assetBuffers.size})};
audio.yieldAudioDecode=async()=>{};
audio.waitForDecodeIdle=async()=>{};
const previousFetch=globalThis.fetch;
globalThis.fetch=async url=>{visited.push(String(url));return {ok:true,arrayBuffer:async()=>new Uint8Array(5).buffer}};
try{
 assert.equal(await audio.loadAssetPack(),true);
 assert.ok(visited[0].includes('field-loop'),'field ambience loads before optional action samples');
 assert.ok(started.length>=3,'authored beds start as they become available');
 assert.equal(started[0].at,1,'the first field loop starts before a second fetch');
}finally{globalThis.fetch=previousFetch}
console.log('itch preview performance/audio contracts PASS');

// Incremental construction must never publish half-painted terrain and may
// resume across any number of frames without losing its render context.
{
 const oldDocument=globalThis.document;
 const made=[];
 globalThis.document={createElement:()=>{const context={imageSmoothingEnabled:true,scale(){},drawImage(){},fillRect(){}};const canvas={width:0,height:0,getContext(){return context}};made.push(canvas);return canvas}};
 try{
  const staged=Object.create(Renderer.prototype),world={n:128,water:new Uint8Array(128*128).fill(1),idx:(x,y)=>y*128+x};
  staged.sim={world};staged.ctx={};staged.terrainChunkCache=new Map();
  // Start directly with water-only vegetation phase to keep the tiny fake
  // browser environment independent of real canvas and habitat generation.
  const job=staged.createTerrainChunkWork(1,1,2,99);
  assert.ok(job);job.phase=1;
  for(let i=0;i<4;i++){
    assert.equal(staged.stepTerrainChunkWork(job,Infinity,2),false);
    assert.equal(staged.terrainChunkCache.size,0,'partial chunk not visible');
    assert.equal(staged.ctx===job.cc,false,'restore drawing context after yielding');
  }
  let completed=false;
  for(let i=0;i<15&&!completed;i++)completed=staged.stepTerrainChunkWork(job,Infinity,2);
  assert.equal(completed,true,'finite tile tasks eventually publish complete art');
  assert.equal(staged.terrainChunkCache.get(job.key).canvas,job.chunk);
  assert.equal(staged.terrainChunkCache.get(job.key).vegetation,job.vegetation);
  // An invalidated job must not publish art with an obsolete epoch/signature.
  staged.terrainChunkWork=staged.createTerrainChunkWork(2,2,2,2);
  staged.terrainRefreshQueued=new Set();staged.terrainRefreshQueue=[];
  staged.terrainChunkSignature=()=>3;
  staged.processTerrainRefreshQueue();
  assert.equal(staged.terrainChunkWork,null,'discard obsolete in-flight work');
  assert.equal(staged.terrainRefreshQueue.length,1,'requeue updated chunk');
  assert.equal(staged.terrainChunkCache.has('2,2,2'),false);
 }finally{globalThis.document=oldDocument}
}
console.log('incremental cached terrain scheduling contracts PASS');
