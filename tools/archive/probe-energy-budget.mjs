// Usage: node tools/probe-energy-budget.mjs <6s|30s|v1f|v1fw>[+e][@6s][-s] [species=mosskip] (@6s runs the rules on the recorded 6-second day): 16 days on GENVO8-TEST-A; energy spent and gained per
// animal-day (share of maximum) for one species, total and by simulation phase. Measurement only.
const R=new URL('../../src/',import.meta.url).href,arg=process.argv[2]||'v1fw';
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');
const rules=arg.match(/^[a-z0-9]+/)[0];const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:rules!=='6s'&&!arg.includes('@6s'),metabolism:rules.startsWith('v1'),foodProperties:rules.startsWith('v1f'),winterWater:rules.endsWith('w'),escapeLanding:arg.includes('+e'),worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);s.correctionExperiment={socialAllowance:!arg.includes('-s')};
const sp=process.argv[3]||'mosskip',acc={},snap=()=>new Map(s.animals.filter(a=>a.alive&&a.species===sp).map(a=>[a.id,a.energy]));
const wrap=(name)=>{const f=s[name].bind(s);s[name]=(...args)=>{const b=snap();const r=f(...args);for(const a of s.animals){if(!b.has(a.id)||!a.alive)continue;const d=b.get(a.id)-a.energy;(acc[name]??={spent:0,gained:0});if(d>0)acc[name].spent+=d;else acc[name].gained-=d}return r}};
for(const n of ['phaseMetabolism','phaseMovement','phaseLifecycle','phasePerception','phaseClimate'])if(typeof s[n]==='function')wrap(n);
let ad=0;const total={spent:0,gained:0};
for(let d=1;d<=16;d++){for(let t=0;t<CFG.dayTicks;t++){const b=snap();s.update(null);for(const a of s.animals){if(!b.has(a.id)||!a.alive)continue;const dd=b.get(a.id)-a.energy;if(dd>0)total.spent+=dd;else total.gained-=dd}}ad+=s.animals.filter(a=>a.alive&&a.species===sp).length}
const m=SPECIES[sp].maxEnergy,f=v=>+(v/ad/m).toFixed(3);console.log(arg,sp,'per animal-day share of max: total spent',f(total.spent),'gained',f(total.gained));for(const [k,v] of Object.entries(acc))console.log('  ',k,'spent',f(v.spent),'gained',f(v.gained));
