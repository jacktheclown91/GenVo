// arid-physiology/1 (morphology S4): heat costs water through evaporative cooling,
// arid anatomy changes that cost, and drought dormancy (aestivation) slows the
// drain without stopping it. Scenario C: an ordinary water-dependent body in
// hot, dry, waterless ground dehydrates quickly; an adapted body lasts longer
// through its physiology and behaviour; neither receives any water.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {BIO_STEPS_PER_DAY} from '../src/sim/day-clock.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {founderPlan} from '../src/lineage/body-inheritance.js';
import {ARID_PHYSIOLOGY,evaporativeCooling,aestivationStatus,enterAestivation,aestivating,aridExpressionOf} from '../src/ecology/arid-physiology.js';
import {wakeTorpor} from '../src/ecology/cold-wildlife.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const base=founderPlan().nodes.map(n=>({partId:!n.parent?'soft-torso':n.partId,parent:n.parent,socket:n.socket}));
const ordinary=makePlan(base),adapted=makePlan([...base,{partId:'heat-frill',parent:'root',socket:'dorsal'},{partId:'wax-plates',parent:'root',socket:'flank.left'},{partId:'fat-pad',parent:'root',socket:'flank.right'}]);
assert.ok(validatePlan(ordinary).ok&&validatePlan(adapted).ok);

// 1. The evaporative law: proportional to the body's own resting water cost and its heat load; never negative.
close(evaporativeCooling(.1,.052),.1*ARID_PHYSIOLOGY.evaporativeWater*.052,'law');
assert.equal(evaporativeCooling(.1,0),0);assert.equal(evaporativeCooling(.1,-1),0);
function close(x,y,label,tol=1e-9){assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${label}: ${x} vs ${y}`)}

// A controlled hot, dry, waterless patch run on the real metabolism step.
// `rate`: hydration lost per day, from the first biological step (BIO_STEPS_PER_DAY per day); `days`: whole days survived (capped).
function survival({arid=true,plan=ordinary,temperature=.98,moisture=.08,dormant=false,cover=false,days=12}={}){
 const sim=new Simulation('ARID-SCENARIO-C',{player:true,dayClock:true,metabolism:true,aridPhysiology:arid}),w=sim.world;sim.phaseClimate();
 w.water.fill(0);w.buildLandRegions();w.buildHydrology();
 const a=sim.animals.find(x=>x.alive&&x.species==='genvo'&&!x.player)||sim.player();sim.animals=[a];sim.rebuildSpatial();
 Object.assign(a,{x:40.5,y:40.5,age:SPECIES.genvo.maturity+5,health:100,energy:SPECIES.genvo.maxEnergy*.9,hydration:SPECIES.genvo.maxHydration*.5,bodyPlan:plan,intent:'idle',target:null,pregnant:null,infected:false});
 a.genes.climate=1;const i=w.idx(a.x,a.y);
 if(cover)sim.coverAt=()=>.6;
 const hold=()=>{w.temperature[i]=temperature;w.moisture[i]=moisture};hold();
 if(dormant){const status=aestivationStatus(sim,a);assert.ok(status.enabled,status.reason);assert.ok(enterAestivation(sim,a).ok)}
 const steps=Math.round(BIO_STEPS_PER_DAY),quarter=1,start=a.hydration;let gained=0,last=a.hydration,day=0,rate=null,taken=0,dormantAtRate=null;
 for(;day<days&&a.hydration>0;day++)for(let k=0;k<steps&&a.hydration>0;k++){hold();sim.phaseMetabolism();if(a.hydration>last+1e-12)gained+=a.hydration-last;last=a.hydration;if(++taken===quarter){rate=(start-a.hydration)*BIO_STEPS_PER_DAY;dormantAtRate=aestivating(a)}}
 return{sim,a,lossPerDay:rate,days:a.hydration>0?days:day,steps:taken,gained,dormant:dormantAtRate,wokeLow:!aestivating(a)};
}
// 2. Scenario C.
const temperate=survival({temperature:.58,moisture:.4,days:1}),hot=survival({days:1}),plainHot=survival({arid:false,days:1});
assert.equal(hot.gained,0,'no body receives water from heat or anatomy');
assert.ok(hot.lossPerDay>temperate.lossPerDay*2.2,`heat drives water loss: ${hot.lossPerDay.toFixed(2)} vs ${temperate.lossPerDay.toFixed(2)} per day`);
assert.ok(hot.lossPerDay>plainHot.lossPerDay*2,'worlds without the rule keep their recorded (heat-blind) water cost');
const frilled=survival({plan:adapted,days:1});
assert.ok(frilled.lossPerDay<hot.lossPerDay,`a heat frill and wax plates cut the loss: ${frilled.lossPerDay.toFixed(2)} vs ${hot.lossPerDay.toFixed(2)}`);
const dormant=survival({plan:adapted,dormant:true,cover:true,days:1});
assert.ok(dormant.dormant,'stays dormant while the drought holds');assert.ok(dormant.wokeLow,'and rouses once its water runs low');assert.equal(dormant.gained,0);
assert.ok(dormant.lossPerDay>0&&dormant.lossPerDay<frilled.lossPerDay*.6,`aestivation slows but never stops the drain: ${dormant.lossPerDay.toFixed(2)}`);
// Survival time from half water: ordinary < adapted < adapted and dormant.
const toDays=n=>+(n/BIO_STEPS_PER_DAY).toFixed(2),tO=toDays(survival({days:30}).steps),tA=toDays(survival({plan:adapted,days:30}).steps),tD=toDays(survival({plan:adapted,dormant:true,cover:true,days:60}).steps);
assert.ok(tO<tA&&tA<tD,`days to dehydration: ordinary ${tO}, adapted ${tA}, adapted and dormant ${tD}`);
// 3. Dormancy rules: needs fat fuel, shelter, drought and no water in reach; reserves still drain; a predator attack wakes it.
{
 const {sim,a}=survival({plan:ordinary,days:0});a.hydration=SPECIES.genvo.maxHydration*.4;
 assert.match(aestivationStatus(sim,a).reason,/fat pad or fat tail/);
 a.bodyPlan=adapted;assert.match(aestivationStatus(sim,a).reason,/burrow or dense cover/);
 sim.coverAt=()=>.6;assert.ok(aestivationStatus(sim,a).enabled);
 a.hydration=SPECIES.genvo.maxHydration*.9;assert.match(aestivationStatus(sim,a).reason,/Not short enough/);a.hydration=SPECIES.genvo.maxHydration*.4;
 assert.ok(enterAestivation(sim,a).ok&&a.torporKind==='aestivation');
 const e=aridExpressionOf(sim,a);assert.ok(Object.isFrozen(e)&&e.aestivating&&e.frillFlushed&&e.waxSealed&&e.heat>.4);
 // Saves keep the dormancy kind; inconsistent saves are refused.
 const snap=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'arid'})),back=restoreSimulationSnapshot(structuredClone(snap));
 assert.equal(back.aridPhysiologyRules,ARID_PHYSIOLOGY.policy);assert.equal(back.animals[0].torporKind,'aestivation');
 const bad=structuredClone(snap);bad.animals[0].torpor=false;assert.throws(()=>restoreSimulationSnapshot(bad),/dormancy kind/);
 const plain=new Simulation('ARID-PLAIN',{player:true,dayClock:true,metabolism:true}),ps=structuredClone(createSimulationSnapshot(plain,{savedAt:'fixed',reason:'arid'}));
 ps.animals[0].torpor=true;ps.animals[0].torporKind='aestivation';assert.throws(()=>restoreSimulationSnapshot(ps),/without its recorded arid physiology rule/);
 wakeTorpor(a,{reason:'A predator attack broke torpor.'});assert.equal(a.torpor,false);assert.equal(a.torporKind,undefined,'any wake-up clears the dormancy kind');
 // Rain or cooler, moister ground wakes it.
 a.hydration=SPECIES.genvo.maxHydration*.4;assert.ok(enterAestivation(sim,a).ok);const i=sim.world.idx(a.x,a.y);
 sim.world.temperature[i]=.5;sim.world.moisture[i]=.5;sim.phaseMetabolism();assert.equal(aestivating(a),false,'eased conditions end dormancy');
}
console.log(`Arid physiology /1 PASS: heat costs water (${(hot.lossPerDay/temperate.lossPerDay).toFixed(1)}x temperate), frill and wax cut it to ${(frilled.lossPerDay/hot.lossPerDay*100).toFixed(0)}%, aestivation to ${(dormant.lossPerDay/hot.lossPerDay*100).toFixed(0)}%; days to dehydration from half water: ordinary ${tO}, adapted ${tA}, dormant ${tD}; no water created; saves; unchanged without the rule`);
