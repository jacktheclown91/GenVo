// Usage: node tools/probe-grazing-bands.mjs [days=200] [every=50]: GENVO8-TEST-A under all v1 rules with tissue energy; sunmoss by
// distance from drinkable water (mean amount and share of bare tiles) and the animals' mean distance from water. Measurement only.
const R=new URL('../../src/',import.meta.url).href,days=Number(process.argv[2]||200),every=Number(process.argv[3]||50);
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');
const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,winterWater:true,escapeLanding:true,tissueEnergy:true,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const w=s.world,bands=[[0,6],[6,12],[12,20],[20,35],[35,65534]];
const show=()=>{const m=w.plants.sunmoss,out=[];for(const [lo,hi] of bands){let sum=0,n=0,low=0;for(let i=0;i<w.len;i++){if(w.water[i])continue;const d=w.waterDistance[i];if(d<lo||d>=hi)continue;n++;sum+=m[i];if(m[i]<.05)low++}out.push(`${lo}-${hi===65534?'far':hi}: mean ${(sum/Math.max(1,n)).toFixed(2)} bare ${(low/Math.max(1,n)*100).toFixed(0)}% (${n} tiles)`)}const al=s.animals.filter(a=>a.alive&&!a.player);let wd=0;for(const a of al)wd+=Math.min(60,w.waterDistance[w.idx(a.x,a.y)]);console.log('day',s.day,'animals',al.length,'mean animal water distance',(wd/Math.max(1,al.length)).toFixed(1),'| '+out.join(' | '))};
show();for(let d=1;d<=days;d++){for(let t=0;t<CFG.dayTicks;t++)s.update(null);if(d%every==0)show()}
