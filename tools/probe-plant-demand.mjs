// Usage: node tools/probe-plant-demand.mjs <30s|v1f|v1fw>[+e][+t][-B] [days=40] [every=4]: days on GENVO8-TEST-A; every 4 days, standing plant biomass by kind and
// what animals ate of each since the last line. Measurement only.
const R=new URL('../src/',import.meta.url).href,arg=process.argv[2]||'v1fw';
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');
const rules=arg.match(/^[a-z0-9]+/)[0];const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:rules.startsWith('v1')&&(arg.includes('-B')?'fasting-1':true),foodProperties:rules.startsWith('v1f'),winterWater:rules.endsWith('w'),escapeLanding:arg.includes('+e'),tissueEnergy:arg.includes('+t'),worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const tot=()=>{const o={};for(const k of Object.keys(s.world.plants)){let t=0;for(const v of s.world.plants[k])t+=v;o[k]=Math.round(t)}return o};
const eaten={};const nc=s.history.notePlantConsumption.bind(s.history);s.history.notePlantConsumption=(k,x,y,got)=>{eaten[k]=(eaten[k]||0)+got;return nc(k,x,y,got)};
const out=[];const days=Number(process.argv[3]||40),every=Number(process.argv[4]||4);for(let d=1;d<=days;d++){for(let t=0;t<CFG.dayTicks;t++)s.update(null);if(d%every==0){const g=s.animals.filter(a=>a.alive).length;out.push(`${d} temp ${(s.climate?.temp??0).toFixed(2)} alive ${g} plants ${JSON.stringify(tot())} eaten ${JSON.stringify(Object.fromEntries(Object.entries(eaten).map(([k,v])=>[k,Math.round(v)])))}`);for(const k in eaten)eaten[k]=0}}
console.log(arg+'\n'+out.join('\n'));
