// E1: Biomes are interpretations of real physical habitat, not hardcoded
// species memberships or granted survival bonuses. Current soil water, local
// season temperature, moving precipitation, terrain and actual vegetation
// determine the label. Changes in those fields may change the local biome.
import {localTemperature,localRain,salinityAt} from './environment.js';
import {snowDepth} from './snowpack.js';
import {GROUNDWATER_SPRINGS} from './groundwater-springs.js';

export const BIOMES=Object.freeze({
 ocean:'Saline waters',freshwater:'Fresh water',alpine:'Alpine slopes',
 tundra:'Cold open ground',arid:'Arid plain',steppe:'Dry steppe',
 wetland:'Wetland',woodland:'Woodland',thicket:'Dense thicket',meadow:'Moist meadow',
 grassland:'Grassland'
});
export function biomeAt(world,index,climate){
 if(!world||!Number.isSafeInteger(world.len)||!Number.isSafeInteger(index)||index<0||index>=world.len||
    !climate||!Number.isFinite(climate.temp)||!Number.isFinite(climate.rain))
   throw Error('Invalid biome observation.');
 const w=world,temp=localTemperature(w,climate,index),rain=localRain(w,climate,index);
 const moisture=w.moisture[index],height=w.terrain?.elevation[index]??0,fertility=w.fertility[index];
 if(![temp,rain,moisture,height,fertility].every(Number.isFinite))throw Error('Invalid physical biome fields.');
 const bramble=w.plants?.bramble?.[index]||0,marshroot=w.plants?.marshroot?.[index]||0,woodspire=w.plants?.woodspire?.[index]||0;
 // Emergent wet ground is backed by real accumulated surface water and
 // a high groundwater table. Neither biome IDs nor plant species create water.
 const springWet=w.soilWater?.springPolicy===GROUNDWATER_SPRINGS.policy&&
  (w.soilWater.groundwater[index]>=.68)&&
  (w.environment?.overland?.[index]||0)>=.015;
 let code;
 if(w.water[index])code=salinityAt(w,index)>.15?'ocean':'freshwater';
 else if(height>=.7&&temp<.55)code='alpine';
 else if(temp<.24)code='tundra';
 else if(moisture<.24&&rain<.45)code='arid';
 else if(moisture<.39&&rain<.7)code='steppe';
 else if(moisture>=.58&&(w.seepage?.[index]>=.5||marshroot>=.16||springWet))code='wetland';
 else if(woodspire>=.30&&moisture>=.30)code='woodland';
 else if(moisture>=.51&&bramble>=.18)code='thicket';
 else if(moisture>=.51&&rain>=.53)code='meadow';
 else code='grassland';
 return{code,label:BIOMES[code],temperature:temp,rain,moisture,elevation:height,snowDepth:snowDepth(w,index),fertility,
  salinity:w.water[index]?salinityAt(w,index):0};
}
export function countBiomes(world,climate){
 if(!world||!Number.isSafeInteger(world.len)||world.len<=0)throw Error('Invalid biome world.');
 const counts=Object.fromEntries(Object.keys(BIOMES).map(id=>[id,0]));
 for(let i=0;i<world.len;i++)counts[biomeAt(world,i,climate).code]++;
 return counts;
}
