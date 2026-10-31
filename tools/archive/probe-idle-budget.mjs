const R=new URL('../../src/',import.meta.url).href;
const {Simulation}=await import(R+'sim/simulation.js');const {CFG}=await import(R+'sim/config.js');const {SPECIES}=await import(R+'organisms/species.js');
const IDLE={up:false,down:false,left:false,right:false,sprint:false,brace:false};
const s=new Simulation('GENVO8-TEST-A',{player:true,worldGenerator:'planetary/1',regionalFrontier:true});s.setPlayerAutonomy(false);
const p=s.player(),S=SPECIES[p.species];console.log('start E',(p.energy/S.maxEnergy).toFixed(3),'W',(p.hydration/S.maxHydration).toFixed(3),'maxE',S.maxEnergy,'maxW',S.maxHydration);
let meals=0,lastMeal=p.lastPlantMeal,lastWet=p.lastFreshwaterMeal;
for(let d=0;d<24;d++){const e0=p.energy,w0=p.hydration;let up=0,upW=0;
 for(let t=0;t<CFG.dayTicks;t++){const e=p.energy,w=p.hydration;s.update(IDLE);if(p.energy>e)up+=p.energy-e;if(p.hydration>w)upW+=p.hydration-w;if(p.lastPlantMeal!==lastMeal){meals++;lastMeal=p.lastPlantMeal}}
 if(d%3===0)console.log('day',s.day,s.season,'dE',(p.energy-e0).toFixed(2),'gainE',up.toFixed(2),'dW',(p.hydration-w0).toFixed(2),'gainW',upW.toFixed(2),'E',(p.energy/S.maxEnergy).toFixed(3),'W',(p.hydration/S.maxHydration).toFixed(3),'intent',p.intent,'meals',meals,'temp',s.climate?.temp?.toFixed?.(2))}
