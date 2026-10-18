import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {CarryingPressureController} from '../src/ecology/carrying.js';
import {dietaryDemand} from '../src/ecology/dietary-demand.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const frozen=fs.readFileSync(new URL('../docs/timeout-investigation/dietary-demand-before.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(frozen).digest('hex'),'25eb870884c92bf18750ac0b9723c62f78d0a0c2ac73def51e15f24b4f00b2e7');
const rebase=(text,base,override={})=>text.replace(/from '([^']+)'/g,(_,specifier)=>'from '+JSON.stringify(override[specifier]||new URL(specifier,base).href));
const data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const beforeUrl=data(rebase(frozen,new URL('../src/ecology/dietary-demand.js',import.meta.url)));
const {dietaryDemand:beforeDemand}=await import(beforeUrl);
const carrying=fs.readFileSync(new URL('../src/ecology/carrying.js',import.meta.url),'utf8');
const {CarryingPressureController:BeforeCarrying}=await import(data(rebase(carrying,new URL('../src/ecology/carrying.js',import.meta.url),{'./dietary-demand.js':beforeUrl})));
const left=new Simulation('SCAN-NATURAL-PARITY',{player:false}),right=new Simulation('SCAN-NATURAL-PARITY',{player:false});
left.carrying=new BeforeCarrying(left);right.carrying=new CarryingPressureController(right);
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'2000-01-01T00:00:00.000Z',reason:'scan-parity'}));
assert.deepEqual(snapshot(left),snapshot(right));
for(let day=0;day<8;day++){const d=left.day;while(left.day===d){left.update(null);right.update(null)}assert.deepEqual(snapshot(left),snapshot(right),'complete natural saved state differs at day '+left.day)}
let comparisons=0;
for(const original of right.animals.filter(a=>a.alive).slice(0,24))for(const energy of [0,.001,1,50]){
 const a={...original,energy},supplies=new Map(),beforeMemos=new WeakMap(),afterMemos=new WeakMap();
 for(const [dx,dy] of [[0,0],[1,0],[-1,1],[2,2],[-2,-1],[3,0],[-3,0]]){
  const actor={...a,x:a.x+dx,y:a.y+dy};if(!right.canOccupy(actor,actor.x,actor.y))continue;
  const supply=right.carrying.surveyFor(actor,supplies);if(!beforeMemos.has(supply)){beforeMemos.set(supply,new Map());afterMemos.set(supply,new Map())}
  const expected=beforeDemand(right,actor,supply,8,{overlapMemo:beforeMemos.get(supply)}),actual=dietaryDemand(right,actor,supply,8,{overlapMemo:afterMemos.get(supply)});
  assert.deepEqual(actual,expected,'scan receipt changes demand/nearby with reserve '+energy);comparisons++;
 }
}
assert.ok(comparisons>100,'many real pools, candidate positions and reserve edges exercised');
console.log('Eight natural days exact full-state parity and '+comparisons+' candidate/reserve comparisons against frozen pre-cache arithmetic PASS');
