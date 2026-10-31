// Usage: node tools/probe-winter-water.mjs: 42 days under all v1 rules plus winter water on GENVO8-TEST-A; from day 30, one line a day with
// snow, open water cells, mean ice, alive, thirsty animals, thirst deaths that day, snow water eaten and ice breaks/attempts. Measurement only.
const R=new URL('../../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');
const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:true,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
let dead=0;const kill=s.kill.bind(s);s.kill=(a,c)=>{if(a?.alive&&c==='dehydration')dead++;return kill(a,c)};
for(let d=1;d<=42;d++){for(let t=0;t<CFG.dayTicks;t++)s.update(null);if(d<30)continue;const w=s.world,e=w.environment;let snow=0,snowy=0,open=0,ice=0,n=0;for(let i=0;i<w.len;i++){const v=w.soilWater?.snowpack?.[i]||0;snow+=v;if(v>.002)snowy++;if(w.water[i]){n++;ice+=e.ice[i];if(w.isDrinkable(i%w.n+.5,(i/w.n|0)+.5))open++}}
 const al=s.animals.filter(a=>a.alive);const thirsty=al.filter(a=>a.hydration/SPECIES[a.species].maxHydration<.2).length;const l=s.stats.winterWater||{};
 console.log(d,s.climate?.season??'',`temp ${(s.climate?.temp??0).toFixed(2)} snow ${snow.toFixed(1)} snowyCells ${snowy} openWater ${open}/${n} meanIce ${(ice/n).toFixed(3)} alive ${al.length} thirsty<20% ${thirsty} thirstDeaths(since last line) ${dead} snowWater ${(l.snowWater||0).toFixed(0)} ice ${l.iceBreaks||0}/${l.iceAttempts||0}`);dead=0}
