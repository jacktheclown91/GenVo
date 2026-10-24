import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {atmosphereAt} from '../src/ecology/atmospheric-visibility.js';
import {localRainIntensity,musicSceneFor} from '../src/audio/model.js';
import {AudioDirector} from '../src/audio/audio.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const observed=[];
for(const seed of ['AUDIO-RAIN-3','GENVO8-TEST-A','AUDIO-RAIN-4']){
 const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1'});
 for(let t=0;t<CFG.lifeStride;t++)sim.update(null);
 const p=sim.player(),before=JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'weather-audio'}))),air=atmosphereAt(sim,p.x,p.y),rain=localRainIntensity(sim);
 assert.equal(rain,air.liquid,'sound reads the existing local liquid-rain authority');
 assert.equal(musicSceneFor(sim).rain,rain);
 // Explicit listener-reading fixtures, never installed into the simulation.
 assert.equal(localRainIntensity(sim,{...p,underground:true}),0);
 assert.equal(localRainIntensity(sim,{...p,diveDepth:.1}),0);
 const values=new Map(),director=Object.create(AudioDirector.prototype);director.ctx={currentTime:1};director.handoffDuckUntil=0;director.lastMixDanger=0;director.setLoopGain=(id,value)=>values.set(id,value);
 director.updateAuthoredMix(musicSceneFor(sim));assert.equal(values.get('rain'),.48*Math.sqrt(rain));
 assert.equal(JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'weather-audio'}))),before,'reading and mixing consume no saved state or simulation RNG');
 observed.push({seed,rain,snow:air.snow,rawRain:air.rain});
}
assert.ok(observed[0].rain>.1,'ordinary generated rain case');assert.equal(observed[1].rain,0,'ordinary dry case');assert.ok(observed[2].snow>0&&observed[2].rain===0,'ordinary snow does not play liquid rain');
assert.equal(localRainIntensity(null),0);
console.log('Weather audio PASS: native generated rain/dry/snow, explicit listener limits, exact mixing target and complete state/RNG parity.');
