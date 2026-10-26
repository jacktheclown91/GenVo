import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {openScenarioSnapshot} from '../src/persistence/scenario-library.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
import {gestationFullness,gestationSurfaceSize} from '../src/render/gestation-surface.js';
import {visualLifeState} from '../src/render/life.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {assemblyFor} from '../src/render/creature-assembler.js';

const saved=openScenarioSnapshot(JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('../assets/scenarios/established-valley-d30.json.gz',import.meta.url))))),sim=restoreSimulationSnapshot(saved),mother=sim.animals.find(a=>a.id===117),ordinary=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.pregnant);
assert.equal(mother.pregnant.mode,'live');assert.ok(ordinary);
const snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'gestation-surface-test'}))),before=snap(),rng=sim.rng.state;
const life=visualLifeState(sim,mother,{action:'idle',timeSeconds:0});assert.equal(life.gestation,.625);assert.equal(visualLifeState(sim,ordinary).gestation,undefined);
for(let dir=0;dir<8;dir++)for(const moving of [false,true]){
 const options={id:mother.id,dir,frame:3,moving,action:moving?'walk':'idle',legSlots:assemblyFor(mother).legSlots,life};
 const baseline=genvoVisualPose({...options,life:{...life,gestation:0}}),candidate=genvoVisualPose(options);
 assert.deepEqual(candidate,baseline,'Painted fullness cannot alter the inherited rig, sockets, posture or contacts');
}
let previous=1;
for(let step=0;step<=16;step++){
 // Explicit presentation-model inputs, not authored biological pregnancies.
 const fullness=gestationFullness({family:{pregnancyProgress:()=>({progress:step/16})}},{alive:true,pregnant:{mode:'live'}}),size=gestationSurfaceSize(10,8,fullness);
 assert.ok(size.width>=previous&&size.width<=11.4+1e-9&&size.height<=8.8+1e-9);previous=size.width;
}
assert.deepEqual(gestationSurfaceSize(10,8,0),{width:10,height:8});
for(const actor of [null,{alive:false,pregnant:{mode:'live'}},{alive:true},{alive:true,pregnant:{mode:'egg'}}])assert.equal(gestationFullness({family:{pregnancyProgress(){throw Error('Ineligible actor queried')}}},actor),0);
const source=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8'),key=Function('return ('+source.match(/^function spriteKey\([^\n]+/m)[0]+')')(),base={growth:1,action:'idle',stage:'adult'};
assert.notEqual(key(mother,{body:'#aaa'},0,0,false,base,{gestation:0}),key(mother,{body:'#aaa'},0,0,false,base,life),'Cached native sprites must distinguish actual tissue progress');
for(let n=0;n<100;n++)gestationFullness(sim,mother);
assert.equal(sim.rng.state,rng);assert.equal(snap(),before,'Presentation cannot write any canonical state');
console.log('Gestation surface PASS: real recorded live progress, bounded monotonic tissue, exact eight-facing moving/resting rigs, ordinary/egg/dead exclusion, cache separation and complete graph/RNG parity.');
