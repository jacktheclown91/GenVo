import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {aridExpressionOf,enterAestivation} from '../src/ecology/arid-physiology.js';
import {wakeTorpor} from '../src/ecology/cold-wildlife.js';
import {aridVisualState,aridPartPigment} from '../src/render/arid-presentation.js';
import {dormancyAction,dormancyCaption} from '../src/ui/dormancy-presentation.js';
import {visualLifeState,playerMoodLabel} from '../src/render/life.js';
import {drawPart} from '../src/render/part-sprites.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const sim=new Simulation('ARID-PRESENTATION',{player:true,dayClock:true,metabolism:true,aridPhysiology:true}),a=sim.player(),w=sim.world;
// Explicit controlled physiological fixture; no claim of natural field entry.
a.bodyPlan=makePlan([...founderPlan().nodes.map(n=>({partId:n.parent?n.partId:'soft-torso',parent:n.parent,socket:n.socket})),{partId:'heat-frill',parent:'root',socket:'dorsal'},{partId:'wax-plates',parent:'root',socket:'flank.left'},{partId:'fat-pad',parent:'root',socket:'flank.right'}]);
Object.assign(a,{age:SPECIES.genvo.maturity+2,health:100,infected:false,pregnant:null,energy:SPECIES.genvo.maxEnergy*.9,hydration:SPECIES.genvo.maxHydration*.5,genes:{...a.genes,climate:1}});
sim.animals=[a];sim.rebuildSpatial();const i=w.idx(a.x,a.y);w.water[i]=0;w.temperature[i]=.98;w.moisture[i]=.08;w.waterDistance[i]=99;sim.coverAt=()=>.6;
const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'arid-paint'})));
let saved=snapshot();const hot=aridVisualState(sim,a),raw=aridExpressionOf(sim,a);
assert.equal(hot.frillFlushed,raw.frillFlushed);assert.equal(hot.waxSealed,raw.waxSealed);assert.equal(hot.cacheToken,'110');assert.equal(dormancyAction(sim).label,'Drought dormancy');assert.equal(dormancyAction(sim).enabled,true);assert.equal(snapshot(),saved);
const pigment=[[20,30,40],[60,90,80],[130,150,120],[180,190,160],[220,230,200]],original=structuredClone(pigment);
for(const partId of ['heat-frill','wax-plates']){
 const tint=aridPartPigment(partId,pigment,hot);assert.notDeepEqual(tint,pigment);
 for(let facing=0;facing<8;facing++)for(const sign of [-1,1]){
  let received,fills=0;const angle=(facing-2)*Math.PI/4,fx=Math.cos(angle),fy=Math.sin(angle),ctx={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){},fillRect(){fills++}};
  const k={s:2,fx,fy,perp:{x:-fy,y:fx},bx:0,by:0,bodyW:8,bodyH:7,sign,authoredFacing:facing,nativePigment:pigment,arid:hot,authoredParts:{[partId]:{draw(_c,args){received=args;return true}}}};
  // Consolidated presentation (PR #51, October 30 main): the native draw keeps the inherited
  // pigment and the arid accent overlay marks flushed frills and sealed wax.
  assert.equal(drawPart(ctx,partId,k),true);assert.deepEqual(received.pigment,pigment,'native draw keeps the inherited pigment');assert.ok(fills>0,'the arid accent marks the active state');
  fills=0;assert.equal(drawPart(ctx,partId,{...k,arid:null}),true);assert.equal(fills,0,'no accent without an arid signal');
 }
}
assert.deepEqual(pigment,original);assert.equal(aridPartPigment('fur-mantle',pigment,hot),pigment);
assert.equal(enterAestivation(sim,a).ok,true);saved=snapshot();assert.equal(dormancyCaption(a),'In drought dormancy');assert.equal(dormancyAction(sim).label,'Wake');assert.equal(aridVisualState(sim,a).cacheToken,'111');assert.equal(snapshot(),saved);
a.underground=true;saved=snapshot();assert.equal(visualLifeState(sim,a,{action:'rest',moving:false,timeSeconds:2}).dormant,true);assert.equal(playerMoodLabel(sim,a),'Drought dormancy');assert.equal(snapshot(),saved);a.underground=false;
wakeTorpor(a);w.temperature[i]=.2;w.moisture[i]=.8;saved=snapshot();assert.equal(aridVisualState(sim,a),null);assert.equal(dormancyAction(sim).label,'Winter torpor');assert.equal(snapshot(),saved);
delete sim.aridPhysiologyRules;w.temperature[i]=.98;w.moisture[i]=.08;saved=snapshot();assert.equal(aridVisualState(sim,a),null);assert.equal(dormancyAction(sim).label,'Torpor');assert.equal(snapshot(),saved);
assert.equal(aridPartPigment('heat-frill',pigment,null),pigment);assert.equal(dormancyCaption({...a,torpor:true}),'In deep winter torpor');assert.equal(dormancyCaption(a),null);
console.log('Arid presentation PASS: canonical conditional signals, native pigment routing/all facings/bilateral mounts, unchanged inherited palette and unrelated anatomy, correct cold/drought/legacy availability, authoritative dormancy entry/wake and exact full save graph.');
