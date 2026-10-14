// Pass ES: passive receipts for wild engineering reproduction. Read-only: this
// instrument does not alter decision logic, resource stocks or RNG calls.
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {partnerAvailability} from '../src/reproduction/partner-encounters.js';
const seed=process.argv[2]||'NATURAL-ENGINEERS-A';
const limit=Number(process.argv[3]||130);
const sim=new Simulation(seed,{player:false}),conceptions=new Map(),births=[],deaths=[],samples=[];
const completedPregnancies=new Set();
const counts={attempts:0,success:0,refusals:{},conceptions:0,completedPregnancies:0,unresolvedPregnancies:0,motherDeaths:0,births:0,localBirths:0,adjacentBirths:0,bornOutsideRegion:0,juvenileDeaths:0,postpartumLiving:0};
const engineer=a=>a?.alive&&!a.player&&!a.lineage&&hasPart(a,'digging-forelimb')&&SPECIES[a.species]?.social?.mode==='colony';
const noteMate=sim.tryMate.bind(sim);
sim.tryMate=(a,b)=>{const tracked=engineer(a)&&engineer(b),reason=tracked?partnerAvailability(sim,a,b).reason:null;
  const success=noteMate(a,b);if(tracked){counts.attempts++;if(success){counts.success++;const female=a.sex==='F'?a:b;conceptions.set(female.id,{day:sim.day,id:female.id,partnerId:(a.id===female.id?b.id:a.id),region:sim.regionalEcology.keyAt(female.x,female.y),x:female.x,y:female.y,generation:female.generation});counts.conceptions++;}else counts.refusals[reason]=(counts.refusals[reason]||0)+1;}return success;};
const noteBirth=sim.regionalEcology.noteBirth.bind(sim.regionalEcology);
sim.regionalEcology.noteBirth=child=>{const mother=sim.animals.find(a=>a.id===child.parentIds?.[0]);const conception=conceptions.get(mother?.id);if(conception){completedPregnancies.add(`${mother.id}:${mother.pregnant?.startedDay}`);const region=sim.regionalEcology.keyAt(child.x,child.y);const distance=Math.hypot(child.x-conception.x,child.y-conception.y);births.push({id:child.id,day:sim.day,generation:child.generation,region,conceptionRegion:conception.region,distance,energy:child.energy/SPECIES[child.species].maxEnergy,hydration:child.hydration/SPECIES[child.species].maxHydration});counts.births++;if(region===conception.region)counts.localBirths++;else if(distance<=16)counts.adjacentBirths++;else counts.bornOutsideRegion++;}return noteBirth(child);};
const noteDeath=sim.regionalEcology.noteDeath.bind(sim.regionalEcology);
sim.regionalEcology.noteDeath=(a,cause)=>{if(conceptions.has(a.id)&&a.pregnant)counts.motherDeaths++;if(births.some(b=>b.id===a.id))counts.juvenileDeaths++;if(engineer(a)||births.some(b=>b.id===a.id))deaths.push({day:sim.day,id:a.id,cause,generation:a.generation,age:a.age});return noteDeath(a,cause);};
let prev=-1;
while(sim.day<=limit){sim.update(null);if(sim.day===prev)continue;prev=sim.day;
  if(sim.day%10===0){const d=sim.animals.filter(engineer),ready=d.filter(a=>a.age>=SPECIES[a.species].maturity&&!a.pregnant&&a.reproCooldown<=0),hydrated=ready.filter(a=>a.hydration/SPECIES[a.species].maxHydration>=.65),energetic=hydrated.filter(a=>a.energy/SPECIES[a.species].maxEnergy>(SPECIES[a.species].reproduction?.energy??.72)),healthy=energetic.filter(a=>a.health>=65&&!a.infected);const pregnant=d.filter(a=>a.pregnant);
    samples.push({day:sim.day,engineers:d.length,readyByAgeCooldown:ready.length,hydrated:hydrated.length,energized:energetic.length,healthy:healthy.length,pregnant:pregnant.length,meanHealth:d.length?+(d.reduce((n,a)=>n+a.health,0)/d.length).toFixed(2):null});
    console.error('day',sim.day,'engineers',d.length,'ready',healthy.length,'pregnant',pregnant.length);
  }
}
counts.completedPregnancies=completedPregnancies.size;
counts.unresolvedPregnancies=[...conceptions.keys()].filter(id=>sim.animals.some(a=>a.id===id&&a.alive&&a.pregnant)).length;
const survivors=births.filter(b=>sim.animals.some(a=>a.id===b.id&&a.alive));
counts.postpartumLiving=survivors.length;
const colonies=[...sim.regionalEcology.records.values()].flatMap(r=>sim.regionalEcology.engineerColonyEvidence(r.key));
const summary={seed,days:limit,counts,recordedLifeHistory:sim.regionalEcology.engineerLifeHistoryEvidence(),regionReturns:colonies.length,coloniesEstablished:colonies.filter(c=>c.establishedDay!==null).length,locallyObservedBirths:colonies.reduce((n,c)=>n+c.localBirths,0),samples,birthFates:{born:births.length,living:survivors.length,matured:survivors.filter(b=>sim.animals.find(a=>a.id===b.id)?.age>=SPECIES.rootling.maturity).length,deathByCause:Object.fromEntries([...new Set(deaths.map(d=>d.cause))].map(c=>[c,deaths.filter(d=>d.cause===c).length]))},births:births.slice(0,60)};
console.log(JSON.stringify(summary,null,2));
