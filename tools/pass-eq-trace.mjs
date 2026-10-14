import {Simulation} from '../src/sim/simulation.js';
import {engineeringCourtshipSpecies,partnerAvailability} from '../src/reproduction/partner-encounters.js';
import {SPECIES} from '../src/organisms/species.js';
const seed=process.argv[2]||'NATURAL-ENGINEERS-A',limit=Number(process.argv[3]||65);
const sim=new Simulation(seed,{player:false});
const counters={ticks:0,searching:0,near5:0,near3_5:0,near2:0,near1:0,reciprocal:0,partnerAvailable:0,partnerNotAvailable:{},attempts:0,success:0,failed:{},targetReassigned:0,targetLost:0,started:0};
const last=new Map();
const original=sim.tryMate.bind(sim);
sim.tryMate=(a,b)=>{const success=original(a,b);if(engineeringCourtshipSpecies(a)||engineeringCourtshipSpecies(b)){counters.attempts++;counters.success+=Number(success);if(!success){const availability=partnerAvailability(sim,a,b);const p1=sim.carrying.breedingState(a),p2=sim.carrying.breedingState(b);const reason=!availability.available?availability.reason:(!p1.allowed||!p2.allowed?'carrying':'other');counters.failed[reason]=(counters.failed[reason]||0)+1;}}return success;};
let currentDay=0;
while(sim.day<=limit){sim.update(null);counters.ticks++;
 for(const a of sim.animals){if(!engineeringCourtshipSpecies(a))continue;
  if(a.intent==='mate'&&a.target?.alive){const b=a.target,dist=Math.hypot(a.x-b.x,a.y-b.y);counters.searching++;if(dist<5)counters.near5++;if(dist<3.5)counters.near3_5++;if(dist<2)counters.near2++;if(dist<1)counters.near1++;if(b.target?.id===a.id&&b.intent==='mate')counters.reciprocal++;const available=partnerAvailability(sim,a,b);if(available.available)counters.partnerAvailable++;else counters.partnerNotAvailable[available.reason]=(counters.partnerNotAvailable[available.reason]||0)+1;
   const prev=last.get(a.id);if(prev&&prev!==b.id)counters.targetReassigned++;if(!prev)counters.started++;last.set(a.id,b.id);
  }else if(last.has(a.id)){last.delete(a.id);counters.targetLost++;}
 }
 if(sim.day!==currentDay){currentDay=sim.day;if(currentDay%20===0)console.error('diagnostic day',currentDay);}
}
console.log(JSON.stringify({seed,day:sim.day,counters, births:sim.stats.births},null,2));
