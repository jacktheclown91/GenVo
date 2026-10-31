// Usage: node tools/probe-feed-travel.mjs <6s|30s>: 8 days on GENVO8-TEST-A under real needs and food properties; tiles per animal-day
// walked on a feeding intent, by the food walked to and whether the animal was sated or thirsty. Measurement only.
const R=new URL('../../src/',import.meta.url).href,clock=process.argv[2]||'30s';
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');
const s=new Simulation('GENVO8-TEST-A',{player:true,dayClock:clock==='30s',metabolism:true,foodProperties:true,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const by={},bites={},pos=new Map();let ad=0;const reasons={};
for(let t=0;t<CFG.dayTicks*8;t++){for(const a of s.animals)if(a.alive)pos.set(a.id,[a.x,a.y,a.intent,a.target?.kind||(a.target?.species?'prey':a.target?.foodX!=null?'aquatic':'none'),a.hydration/SPECIES[a.species].maxHydration,a.energy/SPECIES[a.species].maxEnergy]);s.update(null);if(t%CFG.dayTicks===0)ad+=s.animals.filter(a=>a.alive&&!a.player).length;
 for(const a of s.animals){const p=pos.get(a.id);if(!a.alive||!p||a.player||p[2]!=='feed')continue;const d=Math.hypot(a.x-p[0],a.y-p[1]);if(!d||d>3)continue;const k=p[3]+(p[5]>=.72?' (sated)':'')+(p[4]<.6?' (thirsty)':'');by[k]=(by[k]||0)+d}}
console.log(clock,'feed tiles per animal-day by target:');for(const [k,v] of Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,12))console.log('  ',k,(v/ad).toFixed(2));
