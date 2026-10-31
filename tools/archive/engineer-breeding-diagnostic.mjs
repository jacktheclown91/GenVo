import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES} from '../../src/organisms/species.js';
// Passive read-only diagnostics; no change to mating, resource, or movement behavior.
const seed=process.argv[2]||'NATURAL-ENGINEERS-A',limit=+(process.argv[3]||130);
const sim=new Simulation(seed,{player:false}),matings=[],births=[];
const originalMate=sim.regionalEcology.noteMating.bind(sim.regionalEcology);
sim.regionalEcology.noteMating=(mother,father)=>{matings.push({day:sim.day,mother:mother.id,father:father.id,region:sim.regionalEcology.keyAt(mother.x,mother.y)});return originalMate(mother,father);};
const originalBirth=sim.regionalEcology.noteBirth.bind(sim.regionalEcology);
sim.regionalEcology.noteBirth=child=>{births.push({day:sim.day,id:child.id,parents:[...(child.parentIds||[])],region:sim.regionalEcology.keyAt(child.x,child.y)});return originalBirth(child);};
const episodes=new Map();let lastDay=-1;
while(sim.day<=limit){sim.update(null);if(sim.day===lastDay)continue;lastDay=sim.day;
  for(const [key,region] of sim.regionalEcology.records){for(const event of region.engineerSuccession?.events||[]){if(event.type!=='reoccupation'||event.day>sim.day)continue;
    const id=`${key}/${event.day}/${event.individualId}`;
    const ep=episodes.get(id)||{key,day:event.day,founderId:event.individualId,species:event.species,observations:0,alive:0,local:0,ready:0,mateIntent:0,compatibleGlobal:0,compatibleRegion:0,compatibleNear:0,readyMateRegion:0,readyMateNear:0};
    ep.observations++;
    const founder=sim.animals.find(a=>a.alive&&a.id===event.individualId);
    if(founder){ep.alive++;if(sim.regionalEcology.keyAt(founder.x,founder.y)===key)ep.local++;
      const s=SPECIES[founder.species];if(founder.age>=s.maturity&&!founder.pregnant&&founder.reproCooldown<=0&&founder.energy/s.maxEnergy>(s.reproduction?.energy??.72))ep.ready++;
      if(founder.intent==='mate')ep.mateIntent++;
      const candidates=sim.animals.filter(a=>a.alive&&a.species===founder.species&&a.id!==founder.id&&a.sex!==founder.sex&&a.age>=s.maturity&&sim.recovery.kinship(founder,a)==='none');
      if(candidates.length)ep.compatibleGlobal++;
      if(candidates.some(a=>sim.regionalEcology.keyAt(a.x,a.y)===key))ep.compatibleRegion++;
      if(candidates.some(a=>Math.hypot(founder.x-a.x,founder.y-a.y)<=12))ep.compatibleNear++;
      const readyMate=a=>a.reproCooldown<=0&&!a.pregnant&&sim.carrying.breedingState(a).allowed;
      if(candidates.some(a=>sim.regionalEcology.keyAt(a.x,a.y)===key&&readyMate(a)))ep.readyMateRegion++;
      if(candidates.some(a=>Math.hypot(founder.x-a.x,founder.y-a.y)<=12&&readyMate(a)))ep.readyMateNear++;
    }
    episodes.set(id,ep);
  }}
  if(lastDay%30===0)console.log('day',lastDay);
}
const e=[...episodes.values()];const keys=['observations','alive','local','ready','mateIntent','compatibleGlobal','compatibleRegion','compatibleNear','readyMateRegion','readyMateNear'];
const aggregates=Object.fromEntries(keys.map(k=>[k,e.reduce((n,a)=>n+a[k],0)]));
const events=e.map(ep=>({...ep,matings:matings.filter(m=>m.day>=ep.day&&(m.mother===ep.founderId||m.father===ep.founderId)),births:births.filter(b=>b.day>=ep.day&&b.parents.includes(ep.founderId))}));
console.log(JSON.stringify({seed,days:limit,events:e.length,aggregates,totalMatings:matings.length,totalBirths:births.length,returnEpisodes:events}));
