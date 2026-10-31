// Usage: node tools/probe-water-census.mjs [6s|30s] [seed]: water cells, potable, salty, iced and drinkable land every 4 days.
const R=new URL('../../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {salinityAt,potableWater}=await import(R+'world/environment.js');const {surfaceIceCovered}=await import(R+'world/surface-ice.js');
const clock=process.argv[2]==='6s'?false:true;
const s=new Simulation(process.argv[3]||'GENVO8-TEST-A',{player:true,dayClock:clock,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
for(let d=0;d<=44;d++){if(d%4===0){const w=s.world;let water=0,potable=0,salty=0,ice=0,drinkLand=0;for(let i=0;i<w.len;i++){if(w.water[i]){water++;if(potableWater(w,i)){potable++;if(w.environment&&surfaceIceCovered(w.environment,i))ice++}else salty++}else if(w.isDrinkable(i%w.n+.5,(i/w.n|0)+.5))drinkLand++}
 console.log((clock?'30s':'6s'),'day',s.day,s.season,'water',water,'potable',potable,'salty',salty,'iced',ice,'drinkableLand',drinkLand)}for(let t=0;t<CFG.dayTicks;t++)s.update(null)}
