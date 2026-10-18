import fs from 'node:fs';
import path from 'node:path';
import {serialize} from 'node:v8';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {BODY_VARIATION,founderPlan} from '../src/lineage/body-inheritance.js';
import {canSwim} from '../src/lineage/lifestyle.js';
import {webbedLegCount} from '../src/lineage/aquatic.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {placeSupportedBreedingPair} from '../tests/helpers/breeding-pair.js';

const out=path.resolve('docs/living-planet-architecture/accessibility-experiment/current-policy');fs.mkdirSync(out,{recursive:true});
const trials=32,rows=[];let first=null;
for(let index=0;index<trials;index++){
 const seed=`ACCESSIBILITY-NEUTRAL-WATER-${String(index).padStart(3,'0')}`,sim=new Simulation(seed,{player:false,bootstrap:false});
 const mother=sim.spawnAnimal('genvo',32,32),father=sim.spawnAnimal('genvo',33,32),spec=SPECIES.genvo;
 Object.assign(mother,{sex:'F',age:spec.maturity+2,energy:spec.maxEnergy,hydration:spec.maxHydration,reproCooldown:0});
 Object.assign(father,{sex:'M',age:spec.maturity+2,energy:spec.maxEnergy,hydration:spec.maxHydration,reproCooldown:0});
 const row={index,seed,scope:'Two disclosed adult non-player founding organisms; ordinary resources, one conception attempt, normal gestation, no mutation-rate/editor/trait intervention.',parents:[mother,father].map(a=>({id:a.id,genes:structuredClone(a.genes),body:structuredClone(a.bodyPlan),lineage:a.lineage,swims:canSwim(a)})),placement:null,conceived:false,births:[]};
 if(row.parents.some(p=>p.body.id!==founderPlan().id||p.swims))throw Error('Founding precursor differs from declared simple body');
 try{row.placement=placeSupportedBreedingPair(sim,mother,father)}catch(e){row.failure=e.message;rows.push(row);continue}
 row.conceptionDay=sim.day;row.conceived=!!sim.tryMate(mother,father);row.pregnancy=structuredClone(mother.pregnant);
 if(row.conceived){
  const end=sim.day+spec.gestation+1;
  while(sim.day<end){sim.update(null);
   for(const child of sim.animals){if(!child.parentIds?.includes(mother.id)||!child.parentIds?.includes(father.id)||row.births.some(b=>b.id===child.id))continue;
    const birth={id:child.id,day:sim.day,age:child.age,sex:child.sex,genes:structuredClone(child.genes),body:structuredClone(child.bodyPlan),anatomy:structuredClone(child.anatomy),adaptations:[...child.adaptations],legacyWaterPhysiology:[...(child.legacyWaterPhysiology||[])],parentIds:[...child.parentIds],webbedLegs:webbedLegCount(child),swims:canSwim(child),energy:child.energy,hydration:child.hydration};row.births.push(birth);
    if(birth.swims&&!first){first={seed,index,childId:child.id,motherId:mother.id,fatherId:father.id,day:sim.day};fs.writeFileSync(path.join(out,'candidate-birth.snapshot.bin'),serialize(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'accessibility-candidate-birth'})))}
   }
  }
  row.final={day:sim.day,births:sim.stats.births,deaths:sim.stats.deaths,motherAlive:mother.alive,fatherAlive:father.alive,children:row.births.map(b=>{const a=sim.animals.find(a=>a.id===b.id);return{id:b.id,alive:!!a?.alive,age:a?.age??null}})};
 }
 rows.push(row);if((index+1)%8===0)console.log(JSON.stringify({completed:index+1,conceived:rows.filter(r=>r.conceived).length,births:rows.reduce((n,r)=>n+r.births.length,0),first}));
}
const report={schema:'genvo.accessibility-audit/1',scope:'Bounded targeted current-mechanism experiment, not a canonical integrated trial or player-guided/full-rule acceptance.',policy:{trials,seeds:'ACCESSIBILITY-NEUTRAL-WATER-000 through 031',mutationChance:BODY_VARIATION.mutationChance,selection:'All attempted seeds retained; first swimming offspring archived, not a guarantee or ordinary frequency claim.',interventions:'Two adult founders placed in supported existing habitat; no additional food, forced acceptance, repeated cooldown reset, accelerated gestation, editor, final-trait injection or mutation boost.',limitation:'Current neutral core/parental and supported-water rules. Tissue costs, a current-policy mature descendant branch and ordinary player-guided trial acceptance remain unproven. Historical legacy-rule outputs are retained in the parent directory.'},first,summary:{trials:rows.length,conceived:rows.filter(r=>r.conceived).length,births:rows.reduce((n,r)=>n+r.births.length,0),swimmingBirths:rows.reduce((n,r)=>n+r.births.filter(b=>b.swims).length,0)},rows};
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
