// Multigenerational selection observation (Phase 3K Priority 5; read-only hooks, no world edits, no
// simulation RNG). Separates three causes of change in heritable genes (GENE_KEYS) by species:
//  - Fecundity (mating) selection: at every birth, the parents' gene values against the mean of the adults
//    of that species alive at that moment. Under random parentage the summed difference is noise; it is
//    reported as a z-score (sum of differences / sqrt(sum of per-birth sampling variance)). |z| > 2 is a
//    signal, not proof (repeat parents are not independent; see `distinctParents`).
//  - Viability selection: genes of offspring born in the run that reached maturity against all offspring
//    born early enough to have had time to mature (two-sample z).
//  - Predation selection: genes of adults killed by predators against the adults of that species alive at
//    that moment (z as for fecundity).
//  - Drift and founder effects: each founding animal starts a matriline; offspring inherit the mother's.
//    Reported: surviving matrilines, their effective number (1 / sum of squared shares), the share held by
//    the largest, and gene-mean trajectories every 60 days. A large change in a gene mean with |z| < 2 on
//    every selection channel, under few matrilines, points to drift / founder effects rather than
//    selection.
// Usage: node tools/selection-observation.mjs <seed> [days=720]
const [seed='SELECT-A',daysArg='720']=process.argv.slice(2),days=Number(daysArg);
const {Simulation}=await import('../../src/sim/simulation.js');const {SPECIES,GENE_KEYS}=await import('../../src/organisms/species.js');
const sim=new Simulation(seed,{player:false}),adult=a=>a.age>=SPECIES[a.species].maturity;
const G=GENE_KEYS,founders={};for(const a of sim.animals)founders[a.species]=(founders[a.species]||0)+1;const line=new Map();for(const a of sim.animals)line.set(a.id,'F'+a.id);
const popStats=(species,filter=adult)=>{const xs=sim.animals.filter(a=>a.alive&&a.species===species&&filter(a));const n=xs.length,m={},v={};for(const k of G){const vals=xs.map(a=>a.genes[k]??1);const mean=vals.reduce((s,x)=>s+x,0)/Math.max(1,n);m[k]=mean;v[k]=n>1?vals.reduce((s,x)=>s+(x-mean)**2,0)/(n-1):0}return{n,m,v}};
const R={};const rec=sp=>R[sp]??={births:0,parents:new Set(),fec:Object.fromEntries(G.map(k=>[k,{d:0,var:0}])),pred:Object.fromEntries(G.map(k=>[k,{d:0,var:0}])),kills:0,born:[],trajectory:[]};
const sp0=sim.spawnAnimal.bind(sim);sim.spawnAnimal=(species,x,y,parents)=>{const c=sp0(species,x,y,parents);if(!parents||!c)return c;const r=rec(species),P=popStats(species);r.births++;
  const ps=parents.filter(Boolean);for(const p of ps)r.parents.add(p.id);
  if(P.n>=3)for(const k of G){const pm=ps.reduce((s,p)=>s+(p.genes?.[k]??1),0)/ps.length;r.fec[k].d+=pm-P.m[k];r.fec[k].var+=P.v[k]/ps.length}
  const mother=ps.find(p=>p.sex==='F')||ps[0];line.set(c.id,line.get(mother?.id)||'F'+(mother?.id??c.id));
  r.born.push({id:c.id,day:sim.day,genes:Object.fromEntries(G.map(k=>[k,c.genes[k]??1])),matured:false});return c};
const kl=sim.kill.bind(sim);sim.kill=(a,cause)=>{if(a.alive&&cause==='predation'&&adult(a)){const r=rec(a.species),P=popStats(a.species);if(P.n>=3){r.kills++;for(const k of G){r.pred[k].d+=(a.genes[k]??1)-P.m[k];r.pred[k].var+=P.v[k]}}}if(a.alive&&adult(a)){const b=R[a.species]?.born.find(x=>x.id===a.id);if(b)b.matured=true}return kl(a,cause)};
const species=[...new Set(sim.animals.map(a=>a.species))];
const snap=()=>{for(const s of species){const P=popStats(s,()=>true);rec(s).trajectory.push({day:sim.day,n:P.n,...Object.fromEntries(G.map(k=>[k,+P.m[k].toFixed(3)]))})}};
for(let d=0;d<days;d++){if(d%60===0)snap();const d0=sim.day;while(sim.day===d0)sim.update(null);
  for(const a of sim.animals)if(a.alive&&adult(a)){const b=R[a.species]?.born.find(x=>x.id===a.id&&!x.matured);if(b)b.matured=true}}
snap();
const z=(o)=>o.var>0?+(o.d/Math.sqrt(o.var)).toFixed(2):null;
const out={};for(const s of species){const r=rec(s),mat=SPECIES[s].maturity,eligible=r.born.filter(b=>sim.day-b.day>=mat+5);const m=eligible.filter(b=>b.matured);
  const viability={};if(m.length>=3&&eligible.length-m.length>=3)for(const k of G){const all=eligible.map(b=>b.genes[k]),mm=m.map(b=>b.genes[k]),mean=v=>v.reduce((a,b)=>a+b,0)/v.length,va=v=>{const x=mean(v);return v.reduce((a,b)=>a+(b-x)**2,0)/(v.length-1)};const rest=eligible.filter(b=>!b.matured).map(b=>b.genes[k]);viability[k]=+((mean(mm)-mean(rest))/Math.sqrt(va(mm)/mm.length+va(rest)/rest.length)).toFixed(2)}
  const alive=sim.animals.filter(a=>a.alive&&a.species===s),shares={};for(const a of alive){const l=line.get(a.id)||'F'+a.id;shares[l]=(shares[l]||0)+1}const vals=Object.values(shares),tot=vals.reduce((a,b)=>a+b,0)||1;
  const t0=r.trajectory[0],t1=r.trajectory.at(-1);
  out[s]={births:r.births,distinctParents:r.parents.size,fecundityZ:Object.fromEntries(G.map(k=>[k,z(r.fec[k])])),predationKills:r.kills,predationZ:Object.fromEntries(G.map(k=>[k,z(r.pred[k])])),
    viability:{eligible:eligible.length,matured:m.length,z:viability},matrilines:{founders:founders[s],surviving:vals.length,effective:+(1/vals.reduce((a,b)=>a+(b/tot)**2,0)||0).toFixed(1),largestShare:vals.length?+(Math.max(...vals)/tot).toFixed(2):null},
    geneChange:t0&&t1&&t1.n?Object.fromEntries(G.map(k=>[k,+(t1[k]-t0[k]).toFixed(3)])):null,trajectory:r.trajectory}}
console.log(JSON.stringify({seed,days,day:sim.day,species:out}));
