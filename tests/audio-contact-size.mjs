import {AudioDirector} from '../src/audio/audio.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {movementContact,contactEnvelope,acousticDimensions} from '../src/audio/movement-contact.js';
import {creatureVoiceProfile} from '../src/audio/creature-voice.js';
import {SURFACE_ICE} from '../src/world/surface-ice.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const sim=new Simulation('CONTACT-AUDIO',{player:true,dayClock:true,metabolism:true,bodySize:true}),a=sim.player(),snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'audio-contact'}))),before=snap();
for(const actor of sim.animals)if(actor.alive){movementContact(sim.world,actor);creatureVoiceProfile(actor)}assert.equal(snap(),before);
const w={idx:()=>0,isPlayable:()=>true,water:new Uint8Array(1),moisture:new Float32Array(1),plants:{sunmoss:new Float32Array(1)},soilWater:{snowpack:new Float32Array(1)},environment:{volume:new Float64Array([1])}};
assert.equal(movementContact(w,a).surface,'dry');w.plants.sunmoss[0]=.8;assert.equal(movementContact(w,a).surface,'vegetation');w.moisture[0]=.8;assert.equal(movementContact(w,a).surface,'mud');w.soilWater.snowpack[0]=.2;assert.equal(movementContact(w,a).surface,'snow');w.water[0]=1;assert.equal(movementContact(w,a).surface,'water');w.environment.volume[0]=0;assert.notEqual(movementContact(w,a).surface,'water','an empty surface stock never splashes');w.environment.volume[0]=1;Object.assign(w.environment,{icePolicy:SURFACE_ICE.policy,ice:new Float64Array([.5]),iceBroken:new Uint8Array(1)});assert.equal(movementContact(w,a).surface,'ice');w.environment.iceBroken[0]=1;assert.equal(movementContact(w,a).surface,'water','a real crack exposes the owned liquid');assert.equal(movementContact(w,{...a,underground:true}).surface,'earth');
const actors=[.5,1,2].map(size=>({...a,bodySize:{schema:1,alleles:[Math.log(size),Math.log(size)]}})),dimensions=actors.map(acousticDimensions),voices=actors.map(creatureVoiceProfile);assert.ok(dimensions[0].pitch>dimensions[1].pitch&&dimensions[1].pitch>dimensions[2].pitch);assert.ok(voices[0].rate>voices[2].rate);assert.ok(acousticDimensions({...actors[2],age:0}).pitch>dimensions[2].pitch);assert.equal(movementContact(null,actors[2]).spacing,2);assert.equal(movementContact(null,actors[0]).spacing,.5);
const quiet={...a,bodyPlan:makePlan(a.bodyPlan.nodes.map(n=>n.socket?.startsWith('limb.')?{...n,partId:'padded-leg'}:n))};assert.ok(movementContact(w,quiet).weight<movementContact(w,a).weight);
for(const surface of ['dry','mud','snow','ice','water','vegetation','earth'])for(const actor of actors){const e=contactEnvelope({...movementContact(null,actor),surface},true);assert.ok(e.peak>0&&e.peak<=.075&&e.body<=.025&&e.seconds<.25&&Number.isFinite(e.frequency))}
const mute={...a,bodyPlan:makePlan(a.bodyPlan.nodes.filter(n=>n.socket!=='mouth'))};assert.equal(creatureVoiceProfile(mute),null,'physical size grants no call capability');assert.equal(snap(),before);
console.log('Contact audio PASS: actual stocks, snow, ice/cracks, substrate, padded feet, inherited size/growth, bounded envelopes, gated voices and full biological parity.');

const locked=new AudioDirector(null);assert.equal(locked.playContact(movementContact(null,a)),false,'locked contact playback is safe');

const cueCount=size=>{const body={...a,x:0,y:0,bodySize:{schema:1,alleles:[Math.log(size),Math.log(size)]}},director=new AudioDirector(null);director.sim={world:null,player:()=>body};let count=0;director.playCue=()=>count++;director.markInteractiveAudio=()=>{};director.updateMovement(1/64,{});for(let i=0;i<32;i++){body.x+=.125;director.updateMovement(1/64,{})}return count};
assert.equal(cueCount(1),8);assert.equal(cueCount(2),4,'same physical distance produces fewer longer-stride contacts for the larger rig');assert.equal(cueCount(.5),16);
