// Usage: node tools/measure-first-legacy-timing.mjs <seed> [maxDays=150]
// Read-only timing for The First Legacy: a native New World built with the
// game's own options (planetary/1 with the regional frontier), the founder
// driven by AUTO with no player input, until a descendant is grown enough to
// inherit control. Prints days and minutes at 1x (one day = 6 s).
import {Simulation} from '../src/sim/simulation.js';import {CFG} from '../src/sim/config.js';import {SPECIES} from '../src/organisms/species.js';
const seed=process.argv[2],maxDays=Number(process.argv[3]||150);
const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true});sim.setPlayerAutonomy(true);
const t={};const p0=sim.player();const founder=p0.id;const secPerDay=CFG.dayTicks/CFG.simHz;
for(let d=1;d<=maxDays;d++){for(let i=0;i<CFG.dayTicks;i++){sim.update(null);const p=sim.player();
 if(!t.pregnant&&sim.animals.some(a=>a.lineage&&a.pregnant&&(a.id===founder||a.pregnant?.fatherId===founder||a.pregnant?.paternalInheritance?.id===founder)))t.pregnant=sim.day;
 if(!t.birth&&sim.animals.some(a=>a.parentIds?.includes(founder)))t.birth=sim.day;
 if(!t.heir&&sim.lineage.eligibleHeirs({fromId:founder}).length)t.heir=sim.day;
 if(!t.founderDeath&&!sim.animals.find(a=>a.id===founder)?.alive){t.founderDeath=sim.day;t.deathCause=sim.animals.find(a=>a.id===founder)?.deathCause||sim.animals.find(a=>a.id===founder)?.cause}
 if(!t.handoff&&sim.lineage.handoffs.length){t.handoff=sim.day;t.handoffTo=sim.lineage.handoffs[0].to;t.handoffReason=sim.lineage.handoffs[0].reason}}
 if(t.heir&&t.handoff)break;if(t.heir&&!t.handoff&&d>t.heir+2)break}
const kids=sim.animals.filter(a=>a.parentIds?.includes(founder));
console.log(JSON.stringify({seed,species:p0.species,maturity:SPECIES[p0.species].maturity,gestation:SPECIES[p0.species].gestation,secondsPerDay:secPerDay,...t,heirMinutesAt1x:t.heir?+(t.heir*secPerDay/60).toFixed(1):null,childrenBorn:kids.length,childrenAlive:kids.filter(a=>a.alive).length,day:sim.day,founderAlive:!!sim.animals.find(a=>a.id===founder)?.alive}));
