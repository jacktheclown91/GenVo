// Inspect natural predator recruitment; no bodies, food or populations are injected.
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
const sim=new Simulation(process.argv[2]||'GENVO8-TEST-A',{player:false});
const days=Number(process.argv[3]||1400),out=process.argv[4]||'reports/pass-a-predator-demography.json';
const births={},deaths={},lostPregnancies={},timeline=[];
const birth=sim.giveBirth.bind(sim),kill=sim.kill.bind(sim);
sim.giveBirth=(mother,...args)=>{const fatherMissing=!sim.animals.some(a=>a.alive&&a.id===mother.pregnant?.fatherId);const children=birth(mother,...args);if(fatherMissing&&!children.length)lostPregnancies[mother.species]=(lostPregnancies[mother.species]||0)+1;births[mother.species]=(births[mother.species]||0)+children.length;return children};
sim.kill=(a,cause,...args)=>{if(a.alive){const key=`${a.species}:${cause}`;deaths[key]=(deaths[key]||0)+1}return kill(a,cause,...args)};
let next=1;
while(sim.day<=days){sim.update(null);if(sim.day>=next){next+=100;
  const hunters=sim.animals.filter(a=>a.alive&&a.species==='needlejaw'),s=SPECIES.needlejaw;
  const rows=hunters.map(a=>{
    const kin={none:0,sibling:0,direct:0,close:0},unreachable={none:0,sibling:0,direct:0,close:0};
    for(const b of hunters)if(b!==a&&b.sex!==a.sex&&b.age>s.maturity&&b.reproCooldown<=0&&!b.pregnant){
      (sim.canReach(a,b.x,b.y)?kin:unreachable)[sim.recovery.kinship(a,b)]++;
    }
    return{id:a.id,sex:a.sex,region:sim.world.regionAt(a.x,a.y),age:a.age,energy:+(a.energy/s.maxEnergy).toFixed(3),health:+a.health.toFixed(1),cooldown:+a.reproCooldown.toFixed(1),pregnant:!!a.pregnant,drive:+(a.reproDrive||0).toFixed(2),prey:sim.localPreyCount(a,14),carrying:sim.carrying.breedingState(a),mate:!!sim.autonomousMateTarget(a,{far:true}),kin,unreachable,intent:a.intent};
  });
  timeline.push({day:sim.day,population:sim.population(),births:{...births},deaths:{...deaths},lostPregnancies:{...lostPregnancies},hunters:rows});
  fs.writeFileSync(out,JSON.stringify({seed:sim.seed,complete:false,timeline},null,2));
}}
fs.writeFileSync(out,JSON.stringify({seed:sim.seed,complete:true,timeline},null,2));
console.log(JSON.stringify({seed:sim.seed,population:sim.population(),births,deaths}));
