// Usage: node tools/simulation-parity.mjs <root containing src/> <seed> <days>
// Value-identity check for optimizations: runs a native New World (planetary/1,
// regional frontier, AUTO founder) and prints a canonical digest of every day's
// full snapshot plus tick timing. Run it against an unmodified copy of src/
// (git archive HEAD src | tar -x -C <dir>) and the working tree; equal digests
// mean identical simulation state on every day.
import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import path from 'node:path';
const root=pathToFileURL(path.resolve(process.argv[2])+'/src/').href,seed=process.argv[3],days=Number(process.argv[4]);
const {Simulation}=await import(root+'sim/simulation.js');const {CFG}=await import(root+'sim/config.js');const {createSimulationSnapshot}=await import(root+'persistence/save-manager.js');
const sim=new Simulation(seed,{player:true,worldGenerator:'planetary/1',regionalFrontier:true});sim.setPlayerAutonomy(true);
const h=createHash('sha256');
// Canonical value hash: numbers by value (V8 may store 4 as int or double),
// typed arrays by bytes, Maps/Sets in order, objects by sorted keys, cycles by path.
function canon(h,v,seen=new Map(),path='$'){
 if(v===null||typeof v!=='object'){h.update(typeof v+':'+(typeof v==='number'?(Object.is(v,-0)?'-0':String(v)):String(v))+';');return}
 if(seen.has(v)){h.update('ref:'+seen.get(v)+';');return}seen.set(v,path);
 if(ArrayBuffer.isView(v)){h.update(v.constructor.name+':');h.update(Buffer.from(v.buffer,v.byteOffset,v.byteLength));h.update(';');return}
 if(v instanceof Map){h.update('M'+v.size+'{');let i=0;for(const [k,x] of v){canon(h,k,seen,path+'<k'+i);canon(h,x,seen,path+'<'+i++)}h.update('}');return}
 if(v instanceof Set){h.update('S'+v.size+'{');let i=0;for(const x of v)canon(h,x,seen,path+'{'+i++);h.update('}');return}
 if(Array.isArray(v)){h.update('A'+v.length+'[');v.forEach((x,i)=>canon(h,x,seen,path+'['+i));h.update(']');return}
 h.update('O{');for(const k of Object.keys(v).sort()){h.update(k+'=');canon(h,v[k],seen,path+'.'+k)}h.update('}');
}
const one=o=>{const h=createHash('sha1');canon(h,o);return h.digest('hex')};
const digest=s=>one(s).slice(0,16);
const slow=[];let total=0;const t0=performance.now();
for(let d=0;d<days;d++){for(let i=0;i<CFG.dayTicks;i++){const t=performance.now();sim.update(null);const dt=performance.now()-t;total+=dt;if(d>=days-10)slow.push(dt)}h.update(digest(createSimulationSnapshot(sim,{savedAt:'p',reason:'p'})))}
slow.sort((a,b)=>b-a);console.log(JSON.stringify({seed,days,digest:h.digest('hex').slice(0,24),day:sim.day,animals:sim.animals.filter(a=>a.alive).length,tickMs:+total.toFixed(0),last10DaysTop:slow.slice(0,6).map(x=>+x.toFixed(0)),last10DaysSum:+slow.reduce((s,x)=>s+x,0).toFixed(0)}));
