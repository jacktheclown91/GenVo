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
 const x=(index%n+.5)/n,y=(Math.floor(index/n)+.5)/n;
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
