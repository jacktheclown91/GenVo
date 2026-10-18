// Drink-trip audit (decision-coordination audit; read-only). A trip starts when an adult takes intent
// 'drink' away from drinkable ground and ends when it drinks (hydration rises on drinkable ground) or its
// intent changes. Records start distance to the target, ecology steps taken, outcome and hydration.
// Usage: node tools/drink-trip-audit.mjs <seed> [days=120]
import {THREAT_STAGES} from '../src/ecology/threat-perception.js';import {MOVEMENT_PARITY} from '../src/ecology/movement-parity.js';
// Env STAGES=0 / MOVEMENT=0 switch off staged threat perception / movement parity (Phase 3K).
if(process.env.STAGES==='0')THREAT_STAGES.enabled=false;if(process.env.MOVEMENT==='0')MOVEMENT_PARITY.enabled=false;
import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';import {CFG} from '../src/sim/config.js';
const [seed='DRINK-A',daysArg='120']=process.argv.slice(2),sim=new Simulation(seed,{player:false}),w=sim.world,open=new Map(),done=[];
for(let d=0;d<Number(daysArg);d++){const d0=sim.day;while(sim.day===d0){sim.update(null);if(sim.tickCount%CFG.lifeStride!==0)continue;
  for(const a of sim.animals){const s=SPECIES[a.species];if(a.age<s.maturity||s.hunter)continue;const e=open.get(a.id),drinking=a.alive&&a.intent==='drink'&&a.target;
    if(e){e.steps++;if(a.alive&&w.isDrinkable(a.x,a.y)&&a.hydration>e.lastH+.5){e.end='drank';e.hEnd=+(a.hydration/s.maxHydration).toFixed(2);done.push(e);open.delete(a.id);continue}e.lastH=a.hydration;
      if(!drinking){e.end=a.alive?'switched:'+a.intent:'died';if(a.intent==='escape'){const t=sim.findNearest(a,b=>sim.isPredatorTo(b,a),12);e.fled=t?t.species+':'+(/hunt|stalk|chase|charge|windup/.test(t.intent||'')&&t.target?.id===a.id?'hunting THIS animal':/hunt|stalk|chase|charge|windup/.test(t.intent||'')?'hunting another':t.intent)+'@'+Math.hypot(t.x-a.x,t.y-a.y).toFixed(0):'none<12'}done.push(e);open.delete(a.id);continue}}
    if(drinking&&!open.has(a.id)&&!w.isDrinkable(a.x,a.y))open.set(a.id,{species:a.species,startDist:Math.hypot(a.target.x-a.x,a.target.y-a.y),steps:0,lastH:a.hydration,hStart:+(a.hydration/s.maxHydration).toFixed(2)})}}}
const by={};for(const e of done){const r=by[e.species]??={trips:0,drank:0,dist:[],stepsDrank:[],switched:{}};r.trips++;if(e.end==='drank'){r.drank++;r.stepsDrank.push(e.steps)}else r.switched[e.end]=(r.switched[e.end]||0)+1;r.dist.push(e.startDist);if(e.fled){const k=e.fled.split('@')[0];(r.fledFrom??={})[k]=(r.fledFrom[k]||0)+1}}
const med=v=>{v.sort((a,b)=>a-b);return v.length?+v[v.length>>1].toFixed(1):null};
console.log(JSON.stringify({seed,bySpecies:Object.fromEntries(Object.entries(by).map(([k,r])=>[k,{trips:r.trips,drankShare:+(r.drank/r.trips).toFixed(2),medianStartDist:med(r.dist),medianStepsToDrink:med(r.stepsDrank),medianDaysToDrink:r.stepsDrank.length?+(med(r.stepsDrank)/(CFG.dayTicks/CFG.lifeStride)).toFixed(2):null,abandoned:Object.fromEntries(Object.entries(r.switched).sort((a,b)=>b[1]-a[1]).slice(0,4)),fledFrom:Object.fromEntries(Object.entries(r.fledFrom||{}).sort((a,b)=>b[1]-a[1]).slice(0,5))}]))}));
