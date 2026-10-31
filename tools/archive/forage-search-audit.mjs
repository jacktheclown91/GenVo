// Forage search audit (decision-coordination audit; read-only). At each ecology step, for hungry adults
// (energy below 52% of maximum) that are not feeding, records whether the ordinary food search
// (Simulation.bestFood: 36 random cells within 9 x senses tiles) finds a target, and the true distance to the
// nearest cell holding a bite of food that body can eat. Separates lineage (memory-using) from other wildlife.
// Usage: node tools/forage-search-audit.mjs <seed> [days=120] [player=0]
import {Simulation} from '../../src/sim/simulation.js';import {SPECIES} from '../../src/organisms/species.js';import {CFG,PLANTS} from '../../src/sim/config.js';import {groundDiet} from '../../src/ecology/functional-diet.js';
const [seed='FORAGE-A',daysArg='120',playerArg='0']=process.argv.slice(2),sim=new Simulation(seed,{player:playerArg==='1'});if(playerArg==='1'){sim.endOpeningGrace?.('audit');sim.setPlayerAutonomy(true)}
const w=sim.world,R={};
function nearestFood(a){const diet=Object.entries(groundDiet(a)).filter(([k,e])=>PLANTS[k]&&e>0).map(([k])=>k);if(!diet.length)return null;
  for(let r=0;r<=30;r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=Math.floor(a.x)+dx+.5,y=Math.floor(a.y)+dy+.5;if(!w.isPlayable(x,y))continue;const i=w.idx(x,y);if(w.water[i])continue;for(const k of diet)if((w.plants[k][i]||0)>=.16&&sim.canReach(a,x,y))return Math.hypot(x-a.x,y-a.y)}}return Infinity}
for(let d=0;d<Number(daysArg);d++){const d0=sim.day;while(sim.day===d0){sim.update(null);if(sim.tickCount%(CFG.lifeStride*4)!==0)continue;
  for(const a of sim.animals){const s=SPECIES[a.species];if(!a.alive||a.player||a.age<s.maturity||SPECIES[a.species].hunter||a.energy/s.maxEnergy>=.52||a.intent==='feed'||a.intent==='dig')continue;
    const key=a.species+(a.lineage?' (family)':''),r=R[key]??={hungryNotFeeding:0,searchFound:0,nearest:[],intents:{}};r.hungryNotFeeding++;r.intents[a.intent]=(r.intents[a.intent]||0)+1;
    const st=sim.rng.state;const f=sim.bestFood(a);sim.rng.state=st;if(f)r.searchFound++;const nf=nearestFood(a);if(nf!=null)r.nearest.push(nf)}}}
const out={};for(const [k,r] of Object.entries(R)){const v=r.nearest.sort((a,b)=>a-b),q=p=>v.length?+(Number.isFinite(v[Math.floor(p*(v.length-1))])?v[Math.floor(p*(v.length-1))].toFixed(1):Infinity):null;
  out[k]={samples:r.hungryNotFeeding,searchWouldFindFood:+(r.searchFound/r.hungryNotFeeding).toFixed(2),nearestFoodTiles:{p25:q(.25),median:q(.5),p75:q(.75)},topIntents:Object.fromEntries(Object.entries(r.intents).sort((a,b)=>b[1]-a[1]).slice(0,4))}}
console.log(JSON.stringify({seed,hungryAdultsNotFeeding:out}));
