// E1: A spatially moving rainfall front, applied to the existing regional
// precipitation and existing conserved hydrology. The front is a pure function
// of world seed, world coordinate and absolute simulation day. It owns no water,
// RNG, creatures or persistent state and cannot mint biological resources.
export const RAIN_FRONTS=Object.freeze({schema:1,amplitude:.45,cyclesAcrossWorld:2,travelRadiansPerDay:.31});
const TAU=2*Math.PI;
export function rainFrontFactor(world,day,index){
 if(!world?.environment||!Number.isSafeInteger(day)||day<0)return 1;
 const n=world.n;
 if(!Number.isSafeInteger(n)||n<=0||!Number.isSafeInteger(index)||index<0||index>=world.len)throw Error('Invalid regional rain front position.');
 // Planetary regions share one absolute front field. Localized inland
 // worlds retain their established n-relative rainfall pattern unchanged.
 const x=((world.regionOrigin?.x||0)+(index%n)+.5)/n,
   y=((world.regionOrigin?.y||0)+Math.floor(index/n)+.5)/n;
 const seedPhase=TAU*((world.seedHash>>>0)/4294967296);
 // Two traveling wet/dry bands wrap across the current world. Fixed latitude
 // shear keeps the bands broad and contiguous. A complete x-row has mean 1,
 // before the real regional rain-shadow scale is applied.
 const phase=TAU*(RAIN_FRONTS.cyclesAcrossWorld*x+.4*y)+seedPhase-day*RAIN_FRONTS.travelRadiansPerDay;
 return 1+RAIN_FRONTS.amplitude*Math.sin(phase);
}
export function regionalRainfall(world,climate,index){
 if(!climate||!Number.isFinite(climate.rain))throw Error('Invalid rain climate.');
 const staticRain=Math.max(0,climate.rain)*(world.environment?.rainScale[index]??1);
 const front=rainFrontFactor(world,climate.frontDay,index);
 return Math.max(0,staticRain*front);
}

// A spatial wind derived from the SAME moving rain-front phase. No second
// weather clock, RNG stream or persistent atmosphere is introduced.
// Absolute terrain coordinates keep neighboring planetary regions aligned.
export const WIND_SEED_POLICIES=Object.freeze({
 legacy:'legacy-local/1',planetary:'planetary-wind/1'
});
export function planetaryWindAt(world,day,index){
 if(world?.generator!=='planetary/1')return null;
 const n=world.n;
 if(!Number.isSafeInteger(day)||day<0||!Number.isSafeInteger(index)||
    index<0||index>=world.len||!Number.isSafeInteger(n)||n<=0)
  throw Error('Invalid planetary wind observation.');
 const x=(world.regionOrigin?.x||0)+(index%n)+.5;
 const y=(world.regionOrigin?.y||0)+Math.floor(index/n)+.5;
 const seedPhase=TAU*((world.seedHash>>>0)/4294967296);
 const phase=TAU*(RAIN_FRONTS.cyclesAcrossWorld*x/n+.4*y/n)+seedPhase-day*RAIN_FRONTS.travelRadiansPerDay;
 // A persistent zonal drift plus the moving wet/dry front, with a cross-front
 // component. The field is deterministic and permits easterly/westerly gusts.
 const latitude=world.planet?.descriptor?.anchor?.latitude-TAU*y/1048576||0;
 const east=.38*Math.cos(latitude*3)+.72*Math.cos(phase);
 const south=.22*Math.sin(latitude*4)+.60*Math.sin(phase+.6);
 return{east,south,strength:Math.hypot(east,south)};
}
export function planetaryWindSeedOffset(world,day,index,variation=.5){
 if(!Number.isFinite(variation)||variation<0||variation>=1)
  throw Error('Invalid seed wind variation.');
 const wind=planetaryWindAt(world,day,index);
 if(!wind)return null;
 const angle=Math.atan2(wind.south,wind.east)+(variation-.5)*.9;
 const dx=Math.round(Math.cos(angle)),dy=Math.round(Math.sin(angle));
 return[dx,dy];
}
