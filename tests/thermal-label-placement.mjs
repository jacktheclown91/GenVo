import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
import {weatherReadoutModel} from '../src/render/weather-readout.js';
new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(new URL('../src/render/weather-readout.js',import.meta.url)));
import {weatherReadoutPlacement as thermalWeatherLabelPlacement,drawWeatherReadout as drawThermalWeatherLabel} from '../src/render/weather-readout.js';
import {overlapArea} from '../src/ui/overlay-placement.js';
for(const [width,height] of [[1920,1080],[1366,768],[1024,768],[800,600],[390,540]]){
 const body={left:width/2-40,right:width/2+40,top:height/2-45,bottom:height/2+65},dock={left:8,right:width-8,top:height-185,bottom:height-8},notices={left:10,top:10,right:270,bottom:165};
 const p=thermalWeatherLabelPlacement({width,height,protectedRects:[body],obstacles:[dock,notices]});assert.equal(overlapArea(p,body),0);assert.equal(overlapArea(p,dock),0);assert.equal(overlapArea(p,notices),0);assert.ok(p.left>=10&&p.top>=10&&p.right<=width-10&&p.bottom<=height-10);
}
// Hidden exposure and unavailable authority return before reading DOM or painting.
for(const a of [null,{underground:true},{diveDepth:.2},{}])drawThermalWeatherLabel({sim:{player:()=>a},ctx:null});


for(const seed of ['THERMAL-REVIEW-3','THERMAL-REVIEW-41']){
 const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1'});for(let k=0;k<8;k++)sim.update({});
 const snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'weather-readout-test'}))),before=snap(),model=weatherReadoutModel(sim);assert.ok(model&&model.thermal);assert.ok(!/\uFFFD/.test(model.title+model.detail));assert.equal(snap(),before,'readout must preserve the complete canonical graph and RNG');
}

console.log('Weather readout PASS: five viewport body/HUD/feedback clearances, exposure guards, native UTF-8 and real-tick exact canonical state/RNG parity.');
