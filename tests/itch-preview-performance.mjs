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
assert.equal(rects.length,2,'pending ground stays readable without native draw work');
assert.deepEqual(rects[1].slice(1),[160,128,32,32]);
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
