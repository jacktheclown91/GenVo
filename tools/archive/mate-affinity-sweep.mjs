// Same-taxon affinity sweep (diagnostic). Real genotypes from natural worlds, random positions in a
// mate radius; one candidate per set is labelled cross-taxon. Reports how often that hybrid ranks
// first versus its neutral share 1/n, across set sizes and inherited-preference strengths.
// Usage: node tools/mate-affinity-sweep.mjs [out.json]
import fs from 'node:fs';
import {Simulation} from '../../src/sim/simulation.js';import {compareMateOptions} from '../../src/reproduction/mate-preferences.js';import {RNG} from '../../src/core/rng.js';
const pools=[];for(const seed of ['MP-A','MP-B','MP-C']){const s=new Simulation(seed,{player:false});for(let d=0;d<20;d++){const d0=s.day;while(s.day===d0)s.update(null)}for(const sp of ['genvo','mosskip'])pools.push([s.seed,s.animals.filter(a=>a.alive&&a.species===sp)])}
const R=11,rows=[];
for(const strength of [{label:'weak',k:.35},{label:'natural',k:1},{label:'strong',k:2}])for(const n of [2,4,8])for(const aff of [0,.01,.04]){
  const rng=new RNG(`affinity-sweep|${strength.label}|${n}`);let trials=0,hybrid=0;
  for(const [seed,g] of pools)for(let t=0;t<1500;t++){const chooser=g[Math.floor(rng.next()*g.length)],others=g.filter(b=>b!==chooser&&b.sex!==chooser.sex);if(others.length<n)continue;
    const scale=w=>Object.fromEntries(Object.entries(w).map(([k,v])=>[k,Math.max(-1,Math.min(1,v*strength.k))]));
    const c={...chooser,matePreferences:chooser.matePreferences?{...chooser.matePreferences,weights:scale(chooser.matePreferences.weights)}:undefined};
    const set=[...others].sort(()=>rng.next()-.5).slice(0,n).map((b,i)=>{const ang=rng.next()*6.283,r=1+rng.next()*(R-1);return{...b,x:chooser.x+Math.cos(ang)*r,y:chooser.y+Math.sin(ang)*r,__h:i===0}});
    set.sort((p,q)=>compareMateOptions(c,p,q,seed,R,{affinity:b=>b.__h?0:aff}));trials++;if(set[0].__h)hybrid++}
  rows.push({preferences:strength.label,candidates:n,affinity:aff,hybridFirst:+(hybrid/trials).toFixed(3),neutralShare:+(1/n).toFixed(3),trials});
}
for(const r of rows)console.log(r.preferences.padEnd(8),'n',r.candidates,'affinity',String(r.affinity).padEnd(5),'hybrid first',(100*r.hybridFirst).toFixed(1).padStart(5)+'%','(neutral share '+(100*r.neutralShare).toFixed(0)+'%)');
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({schema:'genvo.mate-affinity-sweep/1',rows},null,1));
