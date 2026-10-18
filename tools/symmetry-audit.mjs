// Bilateral symmetry audit (read-only). For every living animal with a body plan, compares each mirrored socket
// pair (limb 1/7, 2/6, 3/5 and named left/right sockets such as eyes and flanks): a pair is asymmetric when
// one side is filled and the other empty, or the two sides hold different parts or different child parts
// (spurs, joints). Reports the share of asymmetric bodies by species at intervals, and which pairs differ.
// Usage: node tools/symmetry-audit.mjs <seed> [days=200] [every=50]
import {Simulation} from '../src/sim/simulation.js';import {mirrorSocket} from '../src/lineage/evolution-draft.js';
const [seed='SYM-A',daysArg='200',everyArg='50']=process.argv.slice(2),sim=new Simulation(seed,{player:false});
export function asymmetries(plan){
  if(!plan?.nodes)return[];const top=new Map();for(const n of plan.nodes)if(n.parent==='root')top.set(n.socket,n);
  const sub=id=>plan.nodes.filter(n=>n.parent===id).map(n=>n.socket+':'+n.partId).sort().join(',');
  const out=[],seen=new Set();
  for(const socket of new Set([...top.keys(),'limb.1','limb.2','limb.3','eye.left','flank.left'])){const m=mirrorSocket(socket);if(m===socket||seen.has(socket))continue;seen.add(socket);seen.add(m);
    const a=top.get(socket),b=top.get(m);if(!a&&!b)continue;
    if(!a||!b)out.push(`${socket}/${m}: ${a?a.partId:'empty'} vs ${b?b.partId:'empty'}`);
    else if(a.partId!==b.partId)out.push(`${socket}/${m}: ${a.partId} vs ${b.partId}`);
    else if(sub(a.id)!==sub(b.id))out.push(`${socket}/${m}: children ${sub(a.id)||'-'} vs ${sub(b.id)||'-'}`)}
  return out}
const rows=[];const snap=()=>{const by={};for(const a of sim.animals){if(!a.alive||!a.bodyPlan)continue;const r=by[a.species]??={n:0,asym:0,kinds:{}};r.n++;const as=asymmetries(a.bodyPlan);if(as.length){r.asym++;for(const k of as){const key=k.replace(/: .*/,'')+': '+k.split(': ')[1];r.kinds[key]=(r.kinds[key]||0)+1}}}
  rows.push({day:sim.day,bySpecies:Object.fromEntries(Object.entries(by).map(([k,r])=>[k,{n:r.n,asymmetric:r.asym,top:Object.fromEntries(Object.entries(r.kinds).sort((a,b)=>b[1]-a[1]).slice(0,5))}]))})};
if(process.argv[1]?.endsWith('symmetry-audit.mjs')){for(let d=0;d<=Number(daysArg);d++){if(d%Number(everyArg)===0)snap();const d0=sim.day;while(sim.day===d0)sim.update(null)}console.log(JSON.stringify({seed,rows}))}
