// Predation pressure on the player vs wild GenVo adults (Phase 3H Milestone E, diagnostic). The player
// runs on AUTO (the same decision rules as wildlife). Counts predator attacks (health drops with a hunter
// within 2.5 tiles) per animal-day, and kills. Usage: node tools/predation-pressure-compare.mjs <seed> [days]
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';
const seed=process.argv[2]||'PRED-A',days=Number(process.argv[3]||60);
const sim=new Simulation(seed,{player:true});sim.endOpeningGrace?.('diagnostic');sim.setPlayerAutonomy(true);
const r={player:{days:0,attacks:0,damage:0,kills:0,byIntent:{}},wild:{days:0,attacks:0,damage:0,kills:0,byIntent:{}}},last=new Map();let ticks=0;
const kl=sim.kill.bind(sim);sim.kill=(a,c)=>{if(a.alive&&a.species==='genvo'&&a.age>=SPECIES.genvo.maturity&&c==='predation')r[a.player?'player':'wild'].kills++;return kl(a,c)};
for(let d=0;d<days;d++){const d0=sim.day;while(sim.day===d0){sim.update(null);ticks++;
  for(const a of sim.animals){if(!a.alive||a.species!=='genvo'||a.age<SPECIES.genvo.maturity)continue;const k=a.player?'player':'wild';r[k].days+=1/48;const h=last.get(a.id);last.set(a.id,a.health);
    if(h!=null&&a.health<h-.5){const hunter=sim.animals.find(b=>b.alive&&b!==a&&SPECIES[b.species]?.hunter&&Math.hypot(b.x-a.x,b.y-a.y)<2.5);if(hunter){r[k].attacks++;r[k].damage+=h-a.health;r[k].byIntent[hunter.intent]=(r[k].byIntent[hunter.intent]||0)+1}}}}
  if(!sim.player())break}
for(const k of ['player','wild']){const x=r[k];x.attacksPerAnimalDay=+(x.attacks/Math.max(1e-9,x.days)).toFixed(4);x.meanDamage=x.attacks?+(x.damage/x.attacks).toFixed(1):null;x.days=+x.days.toFixed(1);delete x.damage}
console.log(JSON.stringify({seed,days:sim.day,playerAlive:!!sim.player(),...r}));
