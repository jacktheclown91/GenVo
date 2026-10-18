import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {PROTO_TRAITS} from '../src/lineage/proto-speciation.js';
import {FORM_AXES,PROTO_AXES,formFromAnatomy,protoFromAnatomy,formReading,protoReading,writeForm,writeProto,setForm,setProto,migrateLegacyReadings} from '../src/lineage/readings.js';
import {createSimulationSnapshot,restoreSimulationSnapshot,SAVE_SCHEMA} from '../src/persistence/save-manager.js';

// v1.32 consolidation Stages E and G: forms and proto-traits are readings of inherited anatomy.
// The body holds their strength; history (origin, generation, gene flow) sits beside it.

// Every form and every proto-trait has its own body axis.
for(const def of Object.values(PROTO_TRAITS))assert.ok(PROTO_AXES[def.id],`${def.id} has a body axis`);
assert.equal(new Set(Object.values(PROTO_AXES)).size,Object.keys(PROTO_AXES).length,'proto-trait axes are distinct');
assert.deepEqual(Object.keys(FORM_AXES).sort(),['colony','forager']);

const sim=new Simulation('GENVO8-ANATOMY-READINGS',{player:true}),p=sim.player();

// Writers put strength on the body and history beside it; readings combine the two.
{
  const a={adaptations:[]};
  writeForm(a,'forager',.64,{sourceGeneration:3,bornDay:12});
  assert.equal(a.anatomy.reach,.64);assert.equal(a.anatomy.compact,0);
  assert.deepEqual(formFromAnatomy(a.anatomy),{kind:'forager',strength:.64});
  assert.deepEqual(formReading(a),{sourceGeneration:3,bornDay:12,kind:'forager',strength:.64});
  assert.deepEqual(a.formHistory,{sourceGeneration:3,bornDay:12},'history holds no kind or strength');
  writeProto(a,'watch-crest',.41,{populationKey:'outer',lineageDepth:2});
  assert.equal(a.anatomy.watchCrest,.41);assert.equal(protoReading(a).populationKey,'outer');assert.equal(protoReading(a).strength,.41);
  assert.equal('lineageForm' in a,false);assert.equal('populationTrait' in a,false,'no cached copies are kept');
  // Labels come from the body.
  assert.equal(sim.divergence.formFor(a).label,'Forager form');assert.equal(sim.protoSpeciation.traitFor(a).label,'Watch Crest');
  a.anatomy.reach=0;assert.equal(sim.divergence.formFor(a),null,'a body with no reach has no form');
}

// Readings are pure, and setting a new form or trait replaces the old one.
{
  const a={adaptations:['heavy-jaw']};setForm(a,{kind:'colony',strength:.8,sourceGeneration:2});
  const before=JSON.stringify(a);formReading(a);protoReading(a);sim.divergence.formFor(a);assert.equal(JSON.stringify(a),before,'reading never changes the animal');
  assert.equal(a.anatomy.compact,.8);assert.ok(a.anatomy.jaw>=.5,'adaptation anatomy is kept');
  setForm(a,{kind:'forager',strength:.5});assert.equal(a.anatomy.compact,0);assert.equal(a.anatomy.reach,.5);
  setForm(a,null);assert.equal(formReading(a),null);assert.equal(a.formHistory,undefined,'clearing the form clears its history');
  setProto(a,{id:'dryland-skin',strength:.3});setProto(a,{id:'cold-mantle',strength:.5});assert.equal(a.anatomy.dryMantle,0);assert.equal(a.anatomy.coldMantle,.5);
}

// Real births write the form onto the newborn's body, and lineage records keep the reading.
{
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id&&a.sex!==p.sex);
  setForm(p,{kind:'forager',strength:.9,sourceGeneration:2});setForm(mate,{kind:'forager',strength:.9,sourceGeneration:2});p.generation=3;
  const mother=p.sex==='F'?p:mate,father=p.sex==='F'?mate:p;mother.pregnant={fatherId:father.id,days:0,totalDays:16};
  const kids=sim.giveBirth(mother).filter(k=>k.lineage);assert.ok(kids.length,'a lineage litter was born');
  for(const k of kids){assert.ok(k.anatomy.reach>0,'newborn form strength is on its body');assert.equal(formReading(k).sourceGeneration,2,'inherited source generation is preserved rather than rewritten at every birth');assert.equal(formReading(k).bornDay,sim.day);assert.deepEqual(sim.lineage.records.get(k.id).divergence,formReading(k))}
}

// Saves: schema 7 caches (and older) become body axes plus history, with nothing gained or lost.
{
  assert.ok(SAVE_SCHEMA>=8);
  const kid=sim.animals.find(a=>a.alive&&a.lineage&&a.id!==p.id);setProto(kid,{id:'frugal-frame',pressure:'scarcity',populationKey:'home',strength:.44,lineageDepth:3,inheritanceState:'reinforced'});
  const old=structuredClone(createSimulationSnapshot(sim));old.schema=7;
  // Rebuild what a schema 7 save looked like: cached objects, history on them, no history fields.
  for(const a of old.animals){
    const f=formReading(a),t=protoReading(a);
    if(a.anatomy)for(const ax of [...Object.values(FORM_AXES),...Object.values(PROTO_AXES)])delete a.anatomy[ax];
    delete a.formHistory;delete a.protoHistory;if(f)a.lineageForm=f;if(t)a.populationTrait=t;
  }
  // v1.39.0 (creator decision 2026-10-09): saves start fresh; an older save is refused with a clear message.
  assert.throws(()=>restoreSimulationSnapshot(old),/predates GenVo's modular creature bodies/,'older saves are refused, not migrated');
  // Lineage-record shaped objects (portraits) convert the same way.
  const portrait=migrateLegacyReadings({adaptations:[],lineageForm:{kind:'colony',strength:.6}});assert.equal(formReading(portrait).kind,'colony');
}
console.log('anatomy readings ok');
