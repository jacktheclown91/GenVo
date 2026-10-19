// E11: finite cold-habitat producer founding and temperature limits.
// Ground temperature and actual slope determine suitability; a biome's LABEL
// provides no food, protection or colonization privilege.
import {coordNoise} from '../core/rng.js';
import {PLANTS} from '../sim/config.js';

export const COLD_FLORA=Object.freeze({
 frostlichen:Object.freeze({optimalTemperature:.16,tolerance:2.10,heatStressStart:.45,heatDieback:.16,minMoisture:.12,maxMoisture:.86}),
 snowberry:Object.freeze({optimalTemperature:.27,tolerance:2.6,heatStressStart:.52,heatDieback:.20,minMoisture:.27,maxMoisture:.84})
});
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
export function coldFloraSuitability(kind,{temperature,elevation,moisture,fertility}){
 const p=COLD_FLORA[kind];if(!p)return 0;
 if(![temperature,elevation,moisture,fertility].every(Number.isFinite))return 0;
 const cold=kind==='frostlichen'?temperature<=.36:temperature<=.36;
 const alpine=elevation>=(kind==='frostlichen'?.56:.48)&&temperature<=(kind==='frostlichen'?.51:.48);
 if(!cold&&!alpine)return 0;
 if(moisture<p.minMoisture||moisture>p.maxMoisture)return 0;
 if(kind==='snowberry'&&fertility<.28)return 0;
 const viableTemp=clamp(1-Math.abs(temperature-p.optimalTemperature)*p.tolerance);
 const habitat=kind==='frostlichen'?(.58+.42*clamp(elevation/.68)):(.62+.38*fertility);
 return viableTemp*habitat*clamp((moisture-p.minMoisture)/.15);
}
export function coldFloraTemperatureFactor(kind,temp){
 const p=COLD_FLORA[kind];
 return p?clamp(1-Math.abs(temp-p.optimalTemperature)*p.tolerance):clamp(1-Math.abs(temp-.58)*1.55);
}
export function coldFloraDieback(kind,temp){
 const p=COLD_FLORA[kind];return p?clamp((temp-p.heatStressStart)*p.heatDieback/.16,0,p.heatDieback):0;
}
// Called ONLY during a new world's generation, after real elevation,
// temperature and soil water are known. Existing saves must not be re-seeded.
export function initializeColdFlora(world){
 for(const kind of Object.keys(COLD_FLORA)){if(!PLANTS[kind]||!world.plants[kind])throw Error('Missing cold flora registry '+kind);
  const plants=world.plants[kind];
  for(let i=0;i<world.len;i++){
   if(world.water[i]){plants[i]=0;continue}
   const x=i%world.n,y=(i/world.n)|0,
     viability=coldFloraSuitability(kind,{temperature:world.temperature[i],elevation:world.terrain?.elevation?.[i]||0,moisture:world.moisture[i],fertility:world.fertility[i]});
   const noise=coordNoise(world.seedHash^(kind==='frostlichen'?0x4541311:0x4541322),x,y);
   const threshold=kind==='frostlichen'?.38:.60;
   plants[i]=viability>.08&&noise>threshold?Math.min(PLANTS[kind].carry,(kind==='frostlichen'?.20:.24)*viability*(.45+noise)):0;
  }
 }
}
