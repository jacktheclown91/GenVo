// Usage: node tools/probe-wildfire-clock.mjs <6s|30s> [seed=PLANET-OBS-3]: 90 days with the recorded physiology; every 15 days the
// standing plant biomass, the biomass burned and ignitions so far, to compare a fire season on both day clocks. Measurement only.
const R=new URL('../../src/',import.meta.url).href,dayClock=process.argv[2]==='30s',seed=process.argv[3]||'PLANET-OBS-3';
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');
const s=new Simulation(seed,{player:true,dayClock,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const out=[];for(let d=1;d<=90;d++){for(let t=0;t<CFG.dayTicks;t++)s.update(null);if(d%15==0){let p=0;for(const k of Object.keys(s.world.plants))for(const v of s.world.plants[k])p+=v;out.push(`${d}: plants ${Math.round(p)} burned ${Math.round(s.wildfire?.burned||0)} ignitions ${s.wildfire?.ignitions||0}`)}}
console.log((dayClock?'30s':'6s ')+' '+seed+' | '+out.join(' | '));
