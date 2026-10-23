// Usage: node tools/probe-thirst-deaths.mjs [winter]: 40 days under all v1 rules (winter adds winter water); every thirst and starvation death with species, water distance and recent intents.
const R=new URL('../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {isWaterDweller}=await import(R+'lineage/aquatic.js');
const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:true,metabolism:true,foodProperties:true,tissueWater:true,winterWater:process.argv[2]==='winter',worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const recent=new Map();const deaths=[];const kill=s.kill.bind(s);
s.kill=(a,c)=>{if(a?.alive&&(c==='dehydration'||c==='starvation')){const w=s.world,i=w.idx(a.x,a.y);deaths.push({day:s.day,cause:c,species:a.species,dweller:isWaterDweller(a),lineage:!!a.lineage,waterDist:w.waterDistance[i],drinkableHere:w.isDrinkable(a.x,a.y),intents:recent.get(a.id)})}return kill(a,c)};
for(let t=0;t<CFG.dayTicks*40;t++){s.update(null);if(t%CFG.lifeStride===0)for(const a of s.animals)if(a.alive){const r=recent.get(a.id)||{};r[a.intent]=(r[a.intent]||0)+1;recent.set(a.id,r)}if(t%(CFG.dayTicks)===0)for(const [id,r] of recent)if(!s.animals.find(a=>a.id===id&&a.alive))recent.delete(id)}
const by={};for(const d of deaths){const k=d.species+' '+d.cause;by[k]=(by[k]||0)+1}console.log(by);
const byDay={};for(const d of deaths){const k=d.cause+' days '+(Math.floor((d.day-1)/5)*5+1)+'-'+(Math.floor((d.day-1)/5)*5+5);byDay[k]=(byDay[k]||0)+1}console.log(byDay);
for(const d of deaths.filter(d=>d.cause==='dehydration').slice(0,10))console.log(d.day,d.species,'dweller',d.dweller,'waterDist',d.waterDist,'drinkableHere',d.drinkableHere,Object.entries(d.intents||{}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+':'+v).join(' '));
let drink=0,dry=0;const w=s.world;for(let i=0;i<w.len;i++){if(w.isDrinkable(i%w.n+.5,(i/w.n|0)+.5))drink++}console.log('drinkable cells at day',s.day,drink);
