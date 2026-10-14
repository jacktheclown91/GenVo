import {preyPreference} from '../src/ecology/functional-diet.js';
import {makePlan} from '../src/lineage/body-plan.js';
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,phenotypeFor} from '../src/organisms/species.js';
import {PLANTS} from '../src/sim/config.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';
import {SPECIES_LIFESTYLES} from '../src/lineage/species-lifestyle.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';

function readySim(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();
  p.age=SPECIES.genvo.maturity+8;p.generation=5;sim.lineage.highestGeneration=5;
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
  mate.lineage=true;mate.age=SPECIES.genvo.maturity+6;mate.generation=5;
  if(!sim.lineage.records.has(mate.id))sim.lineage.register(mate,[p.id]);
  sim.populationMemory.histories.set('home',{key:'home',label:'Home Range',kind:'home',centerId:null,days:5,firstDay:1,lastDay:5,exposure:{},peak:{},recent:{},last:{},lastAssessment:null});
  return{sim,p,mate};
}

function setLifestyle(sim,id){
  const ctrl=sim.speciesLifestyle,state=ctrl.ensure(ROOT_TAXON_ID),def=SPECIES_LIFESTYLES[id];
  const lifestyle={id,label:def.label,short:def.short,formedDay:sim.day,formedGeneration:5,taxonId:ROOT_TAXON_ID,taxonLabel:'GenVo8',evidence:'test',score:1};
  state.lifestyle=lifestyle;state.loopDay=-1;state.loop=null;
  const node=ctrl.node(ROOT_TAXON_ID);if(node)node.lifestyle={...lifestyle};
  ctrl.applyToMembers(ROOT_TAXON_ID,lifestyle);return ctrl;
}

function addAdaptation(animal,id){animal.adaptations=[...new Set([...(animal.adaptations||[]),id])]}

// A settled hunting habit plus a hunting-capable body should establish a Hunter
// lifestyle through real evidence, without consuming RNG or adding a fake adaptation.
// Stage F: the lifestyle reads habits and anatomy, not the day's hunt count.
{
  const {sim,p,mate}=readySim('GENVO8-DIET-HUNTER-EVIDENCE'),ctrl=sim.speciesLifestyle;
  addAdaptation(p,'heavy-jaw');addAdaptation(mate,'heavy-jaw');
  {const before=ctrl.evidenceFor(ROOT_TAXON_ID).ranked.find(r=>r.id==='hunter');assert.equal(before.gate,false,'a hunting body alone is not yet a Hunter')}
  for(let i=0;i<12;i++){sim.habits.noteHunt(p);sim.habits.reinforce(mate,'hunting',.06,{scale:1})}
  const prey=sim.animals.find(a=>a.alive&&a.species==='mosskip');assert.ok(prey);
  const rngBefore=sim.rng.state;
  for(let day=1;day<=3;day++){
    sim.day=day;
    ctrl.noteHunt(p,{prey,killed:true});
    ctrl.noteHunt(mate,{prey,killed:false});
    ctrl.advanceDay();
  }
  assert.equal(ctrl.lifestyleFor(p)?.id,'hunter','a sustained hunting habit establishes Hunter');
  assert.equal(sim.rng.state,rngBefore,'Hunter establishment consumes no RNG');
  assert.ok(ctrl.foodEnergyMultiplier(p,{kind:'mosskip',livePrey:true})>1,'Hunter gains more from live prey');
  assert.ok(ctrl.foodEnergyMultiplier(p,{kind:'bramble'})<1,'Hunter pays a plant-food tradeoff');
  assert.ok(ctrl.huntSuccessMultiplier(p)>1,'Hunter gains a bounded hunting advantage');
  assert.equal(p.adaptations.includes('hunter'),false,'Hunter remains a lifestyle, not an adaptation flag');
  const ph=phenotypeFor(p);assert.equal(ph.speciesLifestyle,'hunter');assert.ok(ph.limbScale>0&&ph.eyeScale>0,'Hunter phenotype remains renderable');
}

// Efficient Gut, an inherited Forager form and no hunting habit should
// establish a Grazer lifestyle and specialize food economics in the opposite direction.
{
  const {sim,p,mate}=readySim('GENVO8-DIET-GRAZER-EVIDENCE'),ctrl=sim.speciesLifestyle;
  for(const a of [p,mate]){addAdaptation(a,'efficient-gut');setForm(a,{kind:'forager',strength:.72,sourceGeneration:4})}
  const rngBefore=sim.rng.state;
  for(let day=1;day<=3;day++){
    sim.day=day;
    ctrl.noteFeeding(p,{kind:'bramble',amount:.16});
    ctrl.noteFeeding(p,{kind:'sunmoss',amount:.18});
    ctrl.noteFeeding(mate,{kind:'marshroot',amount:.16});
    ctrl.noteFeeding(mate,{kind:'thistlepod',amount:.14});
    ctrl.advanceDay();
  }
  assert.equal(ctrl.lifestyleFor(p)?.id,'grazer','a plant-feeding body with no hunting habit establishes Grazer');
  assert.equal(sim.rng.state,rngBefore,'Grazer establishment consumes no RNG');
  assert.ok(ctrl.foodEnergyMultiplier(p,{kind:'bramble'})>1,'Grazer gains more from plants');
  assert.ok(ctrl.foodEnergyMultiplier(p,{kind:'carrion'})<1,'Grazer pays an animal-food tradeoff');
  assert.ok(ctrl.feedingThreshold(p)>.72,'Grazer begins feeding before deep hunger');
  const ph=phenotypeFor(p),basePh=phenotypeFor({...p,ecoLifestyle:null});assert.equal(ph.speciesLifestyle,'grazer');assert.ok(ph.bodyWidthScale>basePh.bodyWidthScale,'Grazer lifestyle broadens the inherited silhouette');
}

// Hunter adults should seek live edible prey even though base GenVo8 is not a hunter species.
{
  const {sim,mate}=readySim('GENVO8-DIET-HUNTER-LOOP'),ctrl=setLifestyle(sim,'hunter');
  mate.energy=SPECIES.genvo.maxEnergy*.62;mate.hydration=SPECIES.genvo.maxHydration*.90;
  const prey=sim.animals.find(a=>a.alive&&a.species==='mosskip');assert.ok(prey);
  prey.x=mate.x+.25;prey.y=mate.y;sim.rebuildSpatial();
  // Learned hunting strategy without a flesh-eating jaw is not enough by itself.
  assert.notEqual(ctrl.autonomousDecision(mate)?.intent,'hunt','learned strategy alone cannot grant predatory anatomy');
  mate.bodyPlan=makePlan(mate.bodyPlan.nodes.map(n=>({partId:n.parent==='root'&&n.socket==='mouth'?'tearing-jaw':n.partId,parent:n.parent,socket:n.socket})));
  const decision=ctrl.autonomousDecision(mate);
  assert.equal(decision?.intent,'hunt','a Hunter with inherited hunting anatomy autonomously seeks prey');
  assert.ok(decision?.target?.alive&&preyPreference(mate,decision.target)>0,'Hunter chooses real edible prey, not a fixed named species');

  // Reproduction pressure for the Hunter branch now follows local prey availability.
  const nearby=sim.animals.filter(a=>a.alive&&(a.species==='mosskip'||a.species==='rootling')).slice(0,4);
  for(let i=0;i<nearby.length;i++){nearby[i].x=mate.x+.35+i*.2;nearby[i].y=mate.y+.15;}
  sim.rebuildSpatial();
  const carrying=sim.carrying.breedingState(mate);
  assert.ok(carrying.resourceValue>=Math.min(3,nearby.length),'Hunter carrying pressure measures nearby prey');
  assert.ok(carrying.resource>.4,'prey-rich ground can support Hunter reproduction');
}

// Grazer adults should actively seek productive vegetation before the generic hunger threshold.
{
  const {sim,mate}=readySim('GENVO8-DIET-GRAZER-LOOP'),ctrl=setLifestyle(sim,'grazer');
  mate.energy=SPECIES.genvo.maxEnergy*.77;mate.hydration=SPECIES.genvo.maxHydration*.90;
  const w=sim.world;let planted=false;
  for(let oy=-8;oy<=8&&!planted;oy+=2)for(let ox=-8;ox<=8&&!planted;ox+=2){
    const x=Math.max(1,Math.min(126,Math.floor(mate.x-10)+10+ox)),y=Math.max(1,Math.min(126,Math.floor(mate.y-10)+10+oy)),i=w.idx(x,y);
    if(w.water[i])continue;
    for(const kind of Object.keys(PLANTS))if(w.plants[kind])w.plants[kind][i]=kind==='bramble'?1:0;
    planted=true;
  }
  assert.ok(planted,'test needs nearby land vegetation');
  const decision=ctrl.autonomousDecision(mate);
  assert.equal(decision?.intent,'feed','Grazer adult seeks plants before deep hunger');
  assert.ok(PLANTS[decision?.target?.kind],'Grazer target is living plant food');
}

// Old save rows from before diet evidence existed must normalize safely instead of producing NaN evidence.
{
  const {sim}=readySim('GENVO8-DIET-LEGACY-ROW'),ctrl=sim.speciesLifestyle;
  ctrl.daily.set(ROOT_TAXON_ID,{distance:2.4,waterDistance:0,steps:4,waterSteps:0});
  const evidence=ctrl.evidenceFor(ROOT_TAXON_ID);
  assert.equal(evidence.row.huntAttempts,0);
  assert.equal(evidence.row.plantMeals,0);
  assert.ok(Number.isFinite(evidence.top.score),'legacy daily evidence normalizes to finite scores');
}

console.log('diet lifestyle checks: PASS');
