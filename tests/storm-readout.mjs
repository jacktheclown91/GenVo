import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {weatherReadoutModel,weatherReadoutPlacement} from '../src/render/weather-readout.js';
import {THUNDERSTORMS,thunderstormAt} from '../src/ecology/thunderstorms.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
// Explicitly authored climate fixtures, not naturally observed storms.
const s=new Simulation('STORM-READOUT',{player:true});for(let k=0;k<8;k++)s.update({});
for(const rain of [0,.62,1,3])for(const temp of [-.2,.4,1]){
 s.climate={...s.climate,rain,temp};const a=s.player(),snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(s,{savedAt:'storm-readout-fixture'}))),before=snap(),eligible=thunderstormAt(s,s.world.idx(a.x,a.y)).intensity>.4,model=weatherReadoutModel(s);assert.equal(!!model?.storm,eligible);if(eligible){assert.equal(model.title,'Thunderstorm');assert.ok(model.detail.startsWith('Avoid exposed high ground'))}assert.equal(snap(),before);
}
s.climate={...s.climate,rain:3,temp:1};assert.ok(weatherReadoutModel(s).storm);
for(const width of [390,800,1366]){const p=weatherReadoutPlacement({width,height:768,model:weatherReadoutModel(s)});assert.ok(p.titleLines.join(' ')==='Thunderstorm');assert.ok(p.detailLines.join(' ').includes('Avoid exposed high ground'));assert.ok(p.left>=0&&p.right<=width)}
const a=s.player();a.underground=true;assert.equal(weatherReadoutModel(s),null);a.underground=false;a.diveDepth=.1;assert.equal(weatherReadoutModel(s),null);a.diveDepth=0;s.thunderRules=undefined;assert.equal(!!weatherReadoutModel(s)?.storm,false);s.thunderRules=THUNDERSTORMS.policy;
console.log('Storm readout PASS: canonical eligibility parity and complete state under labelled climate fixtures, preserved warning, exposure and historical guards, wrapped viewport text. No natural-storm browser acceptance.');

const narrow=weatherReadoutPlacement({width:390,height:540,model:{title:"Thunderstorm",detail:"Avoid exposed high ground · Warm spell · Rain",storm:true},measureTitle:t=>t==="Thunderstorm"?98.37:t.length*7,measureDetail:t=>t.length*5.2});assert.ok(narrow.titleLines.join(" ")==="Thunderstorm");assert.ok(narrow.detailLines.join(" ").includes("Avoid exposed high ground"));
