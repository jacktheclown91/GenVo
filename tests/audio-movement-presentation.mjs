import assert from 'node:assert/strict';
import {AudioDirector} from '../src/audio/audio.js';

// Audio reads displacement; no creature clock, biology or event is synthesized.
const audio=new AudioDirector(null),body={id:1,x:4,y:4,intent:'forage'},world={};
audio.sim={world,paused:false,player:()=>body};
const cues=[];audio.playCue=name=>cues.push(name);audio.markInteractiveAudio=()=>{};
const sample=(keys={})=>audio.updateMovement(1/64,keys);
sample();
for(let n=0;n<128;n++)sample({right:true,sprint:true});
assert.deepEqual(cues,[],'Blocked keys cannot produce imaginary movement sounds');
for(let n=0;n<8;n++){body.x+=.125;sample()}
assert.deepEqual(cues,['move','move'],'Actual AUTO/click travel is audible without held keys');
body.intent='flee';body.x+=.75;sample();
assert.equal(cues.at(-1),'sprint','Actual fleeing movement can use the stronger cue');
const count=cues.length;
body.airborne={};body.x+=.75;sample();delete body.airborne;sample();
body.perched=true;body.x+=.75;sample();delete body.perched;sample();
body.diveDepth=.2;body.x+=.75;sample();body.diveDepth=0;sample();
audio.sim.paused=true;body.x+=.75;sample();audio.sim.paused=false;sample();
assert.equal(cues.length,count,'Airborne, perched, underwater and paused movement stays quiet');
body.x+=100;sample();
audio.sim.world={};body.x+=.75;sample();
body.id=2;body.x+=.75;sample();
assert.equal(cues.length,count,'Region/owner/character changes cannot play accumulated footsteps');
body.intent='forage';body.x+=.5;sample();assert.equal(cues.length,count+1);

const fallback={value:0,setTargetAtTime(value){this.value=value}};
audio.ctx={currentTime:1};audio.master={};
audio.musicBus={gain:{setTargetAtTime(){}}};audio.ambienceBus={gain:{setTargetAtTime(){}}};
audio.ambienceSource={gain:{gain:fallback},filter:{frequency:{setTargetAtTime(){}}}};
audio.updateAuthoredMix=()=>{};
const scene={scene:'calm',danger:0};
audio.updateMix(scene);const before=fallback.value;
audio.authoredLoops.set('theme',{});audio.updateMix(scene);
assert.equal(fallback.value,before,'Music loading alone must not remove missing habitat ambience');
audio.authoredLoops.set('field',{});audio.updateMix(scene);
assert.ok(fallback.value<before/10,'Loaded habitat stems replace the generic noise bed');
audio.authoredLoops.clear();audio.updateMix(scene);
assert.equal(fallback.value,before,'A failed/missing asset pack retains audible fallback ambience');
console.log('Movement audio presentation PASS: actual AUTO/click travel, silent blocked controls, listener exclusions, identity resets and authored/fallback crossfade.');
