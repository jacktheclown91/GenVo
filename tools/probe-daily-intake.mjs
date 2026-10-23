// Usage: node tools/probe-daily-intake.mjs [seed] [days=8] [food|nofood]: one AUTO creature under 30-second days and real needs,
// energy and water gained and lost per day, ground covered, and time per intent.
const R=new URL('../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');
const seed=process.argv[2]||'PLANET-OBS-2',days=Number(process.argv[3]||8),food=process.argv[4]!=='nofood';
const s=new Simulation(seed,{player:true,dayClock:true,metabolism:true,foodProperties:food,worldGenerator:'planetary/1'});s.setPlayerAutonomy(true);
const p=s.player(),S=SPECIES[p.species];
for(let d=0;d<days&&p.alive;d++){let gainE=0,gainW=0,lossE=0,lossW=0;const intents={};let dist=0;
 for(let t=0;t<CFG.dayTicks&&p.alive;t++){const e=p.energy,w=p.hydration,x=p.x,y=p.y;s.update(null);if(p.energy>e)gainE+=p.energy-e;else lossE+=e-p.energy;if(p.hydration>w)gainW+=p.hydration-w;else lossW+=w-p.hydration;intents[p.intent]=(intents[p.intent]||0)+1;dist+=Math.hypot(p.x-x,p.y-y)}
 console.log('day',s.day,'E',(p.energy/S.maxEnergy).toFixed(2),'gain',gainE.toFixed(1),'loss',lossE.toFixed(1),'| W',(p.hydration/S.maxHydration).toFixed(2),'gain',gainW.toFixed(1),'loss',lossW.toFixed(1),'| tiles',dist.toFixed(0),'|',Object.entries(intents).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>k+':'+v).join(' '))}
