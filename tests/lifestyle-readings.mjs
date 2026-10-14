import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';

// v1.32 consolidation Stage F: a lifestyle is a reading of the taxon's average body,
// adaptations and habits (plus lived pressure and residence), and stays once formed.

function readySim(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();
  p.age=SPECIES.genvo.maturity+8;p.generation=5;sim.lineage.highestGeneration=5;
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
  mate.lineage=true;mate.age=SPECIES.genvo.maturity+6;mate.generation=5;
  if(!sim.lineage.records.has(mate.id))sim.lineage.register(mate,[p.id]);
  sim.populationMemory.histories.set('home',{key:'home',label:'Home Range',kind:'home',centerId:null,days:5,firstDay:1,lastDay:5,exposure:{},peak:{},recent:{},last:{},lastAssessment:null});
  return{sim,p,mate,ctrl:sim.speciesLifestyle};
}
const score=(ctrl,id)=>ctrl.evidenceFor(ROOT_TAXON_ID).ranked.find(r=>r.id===id);

// The day's travel, meals and hunts no longer move the reading.
{
  const {sim,p,mate,ctrl}=readySim('GENVO8-LIFE-READ-DAILY');
  const before=ctrl.evidenceFor(ROOT_TAXON_ID).ranked.map(r=>[r.id,r.score]);
  const prey=sim.animals.find(a=>a.alive&&a.species==='mosskip');
  for(let i=0;i<6;i++){ctrl.noteMovement(p,{swimming:true,distance:4});ctrl.noteFeeding(mate,{kind:'bramble',amount:.2});ctrl.noteHunt(p,{prey,killed:true})}
  assert.deepEqual(ctrl.evidenceFor(ROOT_TAXON_ID).ranked.map(r=>[r.id,r.score]),before,'daily counts are play-loop data, not lifestyle evidence');
}

// Bodies and habits do move it: a webbed taxon under wet pressure reads Aquatic,
// a ranging Forager taxon reads Nomadic.
{
  const {sim,p,mate,ctrl}=readySim('GENVO8-LIFE-READ-BODY');
  const dry=score(ctrl,'aquatic').score;
  for(const a of [p,mate])a.adaptations=[...new Set([...(a.adaptations||[]),'water-sacs','webbed-limbs'])];
  sim.populationMemory.histories.get('home').recent={wetness:.8};
  const wet=score(ctrl,'aquatic');assert.ok(wet.score>dry+.3,'webbed bodies and wet pressure raise the Aquatic reading');assert.equal(wet.gate,true);
  assert.match(wet.detail,/water-holding body \d+%/,'the reading names the body part');
  const nomadBefore=score(ctrl,'nomadic');assert.equal(nomadBefore.gate,false);
  for(const a of [p,mate]){setForm(a,{kind:'forager',strength:.8,sourceGeneration:4});sim.habits.ensure(a).range=.6}
  const nomad=score(ctrl,'nomadic');assert.ok(nomad.score>nomadBefore.score,'a ranging habit and long reach raise the Nomadic reading');
  const ev=ctrl.evidenceFor(ROOT_TAXON_ID);assert.ok(ev.body.reach>=.79,'form strength is read from the body');assert.ok(ev.habit.range>=.59);
}

// Once formed, a lifestyle stays even when the bodies that formed it change.
{
  const {sim,p,mate,ctrl}=readySim('GENVO8-LIFE-READ-STAYS');
  for(const a of [p,mate]){a.adaptations=[...new Set([...(a.adaptations||[]),'water-sacs','webbed-limbs'])]}
  sim.populationMemory.histories.get('home').recent={wetness:.8};
  for(let day=1;day<=3;day++){sim.day=day;ctrl.advanceDay()}
  assert.equal(ctrl.lifestyleFor(p)?.id,'aquatic');
  for(const a of [p,mate]){a.adaptations=[];a.anatomy=null}sim.populationMemory.histories.get('home').recent={};
  for(let day=4;day<=6;day++){sim.day=day;ctrl.advanceDay()}
  assert.equal(ctrl.lifestyleFor(p)?.id,'aquatic','an established lifestyle is kept');
}
console.log('lifestyle readings ok');
