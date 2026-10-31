// Observe real births/deaths. No controller queries, extra RNG, or actor injection.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES} from '../../src/organisms/species.js';
const seed=process.argv[2]||'GENVO8-TEST-A',days=Number(process.argv[3]||1400),out=process.argv[4]||'reports/lifetime-recruitment.json';
assert.ok(Number.isInteger(days)&&days>0);
const hash=crypto.createHash('sha256'),root=path.resolve('src');
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(dir,e.name);if(e.isDirectory())visit(f);else hash.update(f).update(fs.readFileSync(f))}}
visit(root);
const sourceFingerprint=hash.digest('hex'),sim=new Simulation(seed,{player:false}),records=new Map();
function remember(a){records.set(a.id,{id:a.id,species:a.species,sex:a.sex,founder:!a.parentIds?.length,parentIds:[...a.parentIds],born:sim.day,initialAge:a.age,children:[],alive:true})}
for(const a of sim.animals)remember(a);
const spawn=sim.spawnAnimal.bind(sim),kill=sim.kill.bind(sim);
sim.spawnAnimal=(...args)=>{const a=spawn(...args);remember(a);for(const id of a.parentIds||[])records.get(id)?.children.push(a.id);return a};
sim.kill=(a,cause,...args)=>{if(a?.alive){const r=records.get(a.id);if(r)Object.assign(r,{alive:false,deathDay:sim.day,age:a.age,cause,energy:a.energy/SPECIES[a.species].maxEnergy,pregnant:!!a.pregnant,cooldown:a.reproCooldown,drive:a.reproDrive})}return kill(a,cause,...args)};
let next=100;
function persist(complete){
  for(const a of sim.animals)if(a.alive){const r=records.get(a.id);if(r)r.age=a.age}
  const rows=[...records.values()];
  const cohorts=Object.keys(SPECIES).map(species=>{
    const maturity=SPECIES[species].maturity;
    const completedFemales=rows.filter(r=>r.species===species&&r.sex==='F'&&!r.founder&&!r.alive&&r.age>=maturity);
    const offspring=r=>r.children.map(id=>records.get(id));
    const born=completedFemales.reduce((n,r)=>n+r.children.length,0);
    const adultDaughters=completedFemales.reduce((n,r)=>n+offspring(r).filter(c=>c.sex==='F'&&c.age>=maturity).length,0);
    const censoredYoung=completedFemales.reduce((n,r)=>n+offspring(r).filter(c=>c.alive&&c.age<maturity).length,0);
    return{species,completedFemales:completedFemales.length,born,adultDaughters,censoredYoung,meanBorn:completedFemales.length?born/completedFemales.length:null,meanAdultDaughters:completedFemales.length?adultDaughters/completedFemales.length:null,childless:completedFemales.filter(r=>!r.children.length).length,deaths:Object.fromEntries([...new Set(completedFemales.map(r=>r.cause))].map(c=>[c,completedFemales.filter(r=>r.cause===c).length]))};
  });
  const result={seed,days,day:sim.day,sourceFingerprint,player:false,complete,population:sim.population(),births:sim.stats.births,deaths:sim.stats.deaths,cohorts,records:rows};
  const tmp=out+'.tmp';fs.writeFileSync(tmp,JSON.stringify(result,null,2));fs.renameSync(tmp,out);return result;
}
while(sim.day<=days){sim.update(null);if(sim.day>=next){next+=100;persist(false)}}
const result=persist(true);console.log(JSON.stringify({...result,records:undefined}));
