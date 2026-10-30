import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {AudioDirector} from '../src/audio/audio.js';

class Param{
  constructor(value=0){this.value=value}
  setValueAtTime(v){this.value=v}
  exponentialRampToValueAtTime(v){this.value=v}
  setTargetAtTime(v){this.value=v}
  cancelScheduledValues(){}
}
class Node{constructor(ctx){this.ctx=ctx}connect(){return this}}
class GainNode extends Node{constructor(ctx){super(ctx);this.gain=new Param(1)}}
class FilterNode extends Node{constructor(ctx){super(ctx);this.frequency=new Param(1000);this.Q=new Param(0);this.type='lowpass'}}
class OscNode extends Node{constructor(ctx){super(ctx);this.frequency=new Param(440);this.detune=new Param(0);this.type='sine'}start(){this.ctx.starts++}stop(){}}
class SourceNode extends Node{constructor(ctx){super(ctx);this.loop=false;this.buffer=null;this.playbackRate=new Param(1)}start(){this.ctx.starts++}stop(){}}
class StereoPannerNode extends Node{constructor(ctx){super(ctx);this.pan=new Param(0)}}
class Buffer{constructor(length){this.data=new Float32Array(length)}getChannelData(){return this.data}}
class FakeAudioContext{
  constructor(){this.state='running';this.currentTime=10;this.sampleRate=48000;this.destination=new Node(this);this.starts=0}
  createGain(){return new GainNode(this)}
  createBiquadFilter(){return new FilterNode(this)}
  createOscillator(){return new OscNode(this)}
  createBufferSource(){return new SourceNode(this)}
  createStereoPanner(){const p=new StereoPannerNode(this);this.lastPanner=p;return p}
  createBuffer(channels,length){return new Buffer(length)}
  async decodeAudioData(){return new Buffer(1024)}
  async resume(){this.state='running'}
}
globalThis.AudioContext=FakeAudioContext;
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(32)});

const sim=new Simulation('GENVO8-AUDIO-RUNTIME',{player:true});
const audio=new AudioDirector(sim);
assert.equal(audio.playSpeciesVoice(sim.player()),false,'voice before gesture is silent and safe');
assert.doesNotThrow(()=>audio.pollCourtshipAudio(),'locked courtship polling is safe');
assert.equal(await audio.unlock(),true);
assert.ok(audio.ctx instanceof FakeAudioContext);
assert.ok(audio.ambienceSource,'ambience starts after unlock');
assert.equal(await audio.assetLoadPromise,true,'authored WAV pack decodes when browser facilities exist');
assert.equal(audio.authoredReady,true);
assert.deepEqual([...audio.authoredLoops.keys()].sort(),['danger','field','lineage','rain','shelter','theme','water-edge','wet'],'the exact authored loop contract includes the new independent native-rain bed');
const starts=audio.ctx.starts;
audio.noteResult({ok:true,type:'drink'});
assert.ok(audio.ctx.starts>starts,'interaction cue schedules WebAudio nodes');
assert.ok(audio.assetBuffers.has('food-berries')&&audio.assetBuffers.has('genvo-rally')&&audio.assetBuffers.has('stalker-charge')&&audio.assetBuffers.has('theme')&&audio.assetBuffers.has('branch-stealth'),'event-specific and compositional authored pack decodes');
const foodStarts=audio.ctx.starts;audio.noteResult({ok:true,type:'eat',kind:'bramble'});assert.ok(audio.ctx.starts>foodStarts,'food kind selects an authored eating cue');
audio.update(.3,{right:true});
assert.ok(audio.nextMusicTime>audio.ctx.currentTime,'music scheduler queues ahead');
const themeLoop=audio.authoredLoops.get('theme');assert.ok(themeLoop?.gain.gain.value>0,'canonical theme bed participates in the adaptive mix');
const branchStarts=audio.ctx.starts;audio.currentScene={...audio.currentScene,branch:'stealth',generation:8};audio.musicStep=16;audio.nextMusicTime=audio.ctx.currentTime+.01;audio.scheduleMusic();assert.ok(audio.ctx.starts>branchStarts,'branch phrase schedules the authored variation of the shared theme');
const p=sim.player();sim.openingGraceEnded=true;const hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');hunter.x=p.x+2.1;hunter.y=p.y;audio.sceneClock=.3;const threatStarts=audio.ctx.starts;audio.update(.3,{});assert.ok(audio.lastThreatBand>=2,'real close Stalker advances the authored warning stage');assert.ok(audio.ctx.starts>threatStarts,'Stalker escalation schedules positional warning audio');
audio.assetBuffers.set('stalker',new Buffer(256));const spatialStarts=audio.ctx.starts;
assert.equal(audio.playSample('stalker',{x:p.x+4,y:p.y,radius:12,volume:.5}),true);
assert.ok(audio.ctx.starts>spatialStarts,'authored cue schedules a buffer source');
assert.ok(audio.ctx.lastPanner?.pan.value>0,'world-right cue pans right of the player');
audio.ctx.currentTime+=3;audio.updateMix(audio.currentScene);
const normalMusic=audio.musicBus.gain.value,normalAmbience=audio.ambienceBus.gain.value;
const beforeVoice=JSON.stringify(sim.player());
audio.playSpeciesVoice(sim.player());
assert.ok(audio.musicBus.gain.value<normalMusic,'voices make room in music');
assert.ok(audio.ambienceBus.gain.value<normalAmbience,'voices make room in habitat bed');
assert.equal(JSON.stringify(sim.player()),beforeVoice,'audio never mutates the organism');
audio.ctx.currentTime+=3;audio.updateMix(audio.currentScene);
assert.equal(audio.musicBus.gain.value,normalMusic,'background music recovers after cue');
assert.equal(audio.ambienceBus.gain.value,normalAmbience,'habitat bed recovers after cue');
const preDuck=audio.musicBus.gain.value;audio.playHandoff({reason:'selected',newlyEstablished:false});assert.ok(audio.handoffDuckUntil>audio.ctx.currentTime,'handoff opens a temporary mix-duck window');assert.ok(audio.musicBus.gain.value<preDuck,'handoff stinger ducks procedural music instead of stacking at full level');
assert.equal(audio.toggleMute(),false);
assert.equal(audio.master.gain.value,0);
assert.equal(audio.toggleMute(),true);
assert.equal(audio.master.gain.value,audio.masterLevel);

console.log('audio runtime checks: PASS');
