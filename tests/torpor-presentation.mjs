import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {visualLifeState} from '../src/render/life.js';
import {behaviorVisualState} from '../src/render/behavior.js';
import {genvoVisualPose} from '../src/render/genvo.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const baseline=async(name,imports)=>{let s=fs.readFileSync(new URL('../docs/art/torpor-presentation-v1-handoff/before/'+name,import.meta.url),'utf8');for(const [from,to] of Object.entries(imports))s=s.replaceAll(from,new URL(to,import.meta.url).href);return import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'))};
const oldLife=(await baseline('life.js',{'../organisms/species.js':'../src/organisms/species.js'})).visualLifeState;
const oldBehavior=(await baseline('behavior.js',{'../sim/config.js':'../src/sim/config.js','./care-expression.js':'../src/render/care-expression.js'})).behaviorVisualState;
// Explicit cold-site fixture using the unchanged canonical entry action.
const sim=new Simulation('TORPOR-PRESENTATION',{player:true,bootstrap:false});sim.climate={temp:.20,rain:.24,wind:0,frontDay:1};
const a=sim.spawnAnimal('genvo',49.5,49.5);a.bodyPlan=makePlan([...founderPlan().nodes.map(n=>({partId:n.partId,parent:n.parent,socket:n.socket})),{partId:'fat-tail',parent:'root',socket:'tail'}]);a.player=true;sim.playerId=a.id;a.age=SPECIES.genvo.maturity+4;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;const i=sim.world.idx(a.x,a.y);sim.world.water[i]=0;sim.world.temperature[i]=.12;sim.rebuildSpatial();
for(const action of ['idle','rest','move','eat'])for(let frame=0;frame<8;frame++)for(const timeSeconds of [0,.3,3,8,21]){
 const options={frame,moving:action==='move',action,timeSeconds,development:{stage:'adult'}},life=visualLifeState(sim,a,options),{dormant,...ordinary}=life;assert.equal(dormant,false);assert.deepEqual(ordinary,oldLife(sim,a,options),'ordinary life pixels retain their previous inputs');
 const input={id:a.id,action,phase:frame,moving:options.moving,life};assert.deepEqual(behaviorVisualState(input),oldBehavior(input),'ordinary behavior remains exact');
}
a.intent='torpor';assert.equal(visualLifeState(sim,a,{action:'rest'}).dormant,false,'intent alone is not dormancy');a.intent='idle';assert.equal(sim.playerToggleTorpor().ok,true);
const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'torpor-art-fixture'}))),before=snapshot(),rng=sim.rng.state;
const sleepingBreaths=[];let maxBreath=0;for(let t=0;t<=40;t+=.1){const life=visualLifeState(sim,a,{action:'rest',timeSeconds:t});assert.equal(life.dormant,true);assert.equal(life.blink,true);assert.equal(life.settle,0);assert.equal(life.settleIndex,0);maxBreath=Math.max(maxBreath,life.breath);sleepingBreaths.push(life.breath)}assert.ok(maxBreath>.2&&maxBreath<=.28);
for(const count of [0,2,4,8,12])for(let dir=0;dir<8;dir++){
 const legSlots=Array.from({length:count},(_,n)=>({slot:Math.floor(n*16/count),reach:1}));let planted=null;
 for(let phase=0;phase<8;phase+=.5){const life=visualLifeState(sim,a,{frame:phase|0,action:'rest',timeSeconds:phase}),behavior=behaviorVisualState({id:a.id,action:'rest',phase,life,social:{alarm:true}}),pose=genvoVisualPose({id:a.id,dir,frame:phase,action:'rest',legSlots,life,behavior});
  assert.equal(behavior.eyeNarrow,true);assert.equal(behavior.eyeWide,false);assert.equal(behavior.guardPlanted,true);assert.equal(pose.legs.length,count);assert.ok(pose.legs.every(l=>l.planted&&l.liftAmount===0));const feet=pose.legs.map(l=>l.foot);if(planted)assert.deepEqual(feet,planted,'dormant feet never shuffle or drift');planted=feet;
 }
}
for(const blocked of [{airborne:true},{perched:true},{underground:true},{climb:{}},{burrowWork:{}},{caveTransit:{}},{bracing:true},{attackAction:{}},{courtshipPerformance:{}}])assert.equal(visualLifeState(sim,{...a,...blocked},{action:'rest'}).dormant,false);
assert.equal(visualLifeState(sim,a,{action:'rest',moving:true}).dormant,false);assert.equal(visualLifeState(sim,a,{action:'eat'}).dormant,false);
assert.equal(sim.rng.state,rng);assert.equal(snapshot(),before,'all presentation samples preserve the full canonical graph');
assert.equal(sim.playerToggleTorpor().ok,true);assert.equal(a.torpor,false);assert.equal(visualLifeState(sim,a,{action:'rest'}).dormant,false,'canonical waking clears dormancy immediately');
const awakeBreaths=[];for(let t=0;t<=40;t+=.1)awakeBreaths.push(visualLifeState(sim,a,{action:'rest',timeSeconds:t}).breath);const peaks=values=>values.filter((v,i)=>i>0&&i<values.length-1&&v>values[i-1]&&v>=values[i+1]).length;assert.ok(peaks(sleepingBreaths)<peaks(awakeBreaths)*.75,'dormancy visibly slows the breathing rhythm rather than only shrinking it');
console.log('Torpor presentation PASS: canonical-entry fixture, exact ordinary-life parity, eight facings/0-12 limbs, planted contacts, interruptions/wake and full graph/RNG parity.');
