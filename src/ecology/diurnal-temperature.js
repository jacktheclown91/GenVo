// diurnal-temperature/1 (morphology S4/S5 follow-up): the air warms by day and
// cools by night around each cell's daily mean temperature, which soil, plants,
// seasons, migration and founding keep using unchanged. Animals feel the hour:
// metabolism and heat-water cost, thermal refuge choice, torpor, aestivation's
// heat check and infant cold exposure read the air temperature instead.
//
// Air = mean + amplitude * cos(2 pi (time of day - 0.58)), so the warmest hour
// is mid-afternoon and the coldest just before dawn. Dry ground swings widely
// (clear, dry air radiates heat away at night): the amplitude is
// 0.06 + 0.12 * (1 - soil moisture), about +/-3 C on wet ground and up to +/-9 C
// on bare dry ground at 1 unit = 50 C, the contrast real deserts show. Open
// water swings a quarter as much. Burrows already damp temperature by 75%.
// Metabolism samples the day at 8 evenly spaced biological steps, over which
// the cosine averages to exactly zero, so daily mean exposure is unchanged and
// only its timing differs.
//
// Time of day is derived from the tick count (no new saved state): sunrise at
// 0.25 of the day, noon at 0.5, sunset at 0.75.
import {dayTicksFor} from '../sim/day-clock.js';

export const DIURNAL=Object.freeze({policy:'diurnal-temperature/1',peak:.58,wetAmplitude:.06,dryAmplitude:.12,waterShare:.25,sunrise:.25,sunset:.75});
export const diurnalEnabled=sim=>sim?.diurnalRules===DIURNAL.policy;
export function timeOfDay(sim){const day=dayTicksFor(sim);return((sim?.tickCount||0)%day)/day}
export function diurnalOffset(sim,i){
 if(!diurnalEnabled(sim))return 0;const w=sim.world,m=Math.max(0,Math.min(1,w.moisture[i]??1));
 const amplitude=(DIURNAL.wetAmplitude+DIURNAL.dryAmplitude*(1-m))*(w.water[i]?DIURNAL.waterShare:1);
 return amplitude*Math.cos(2*Math.PI*(timeOfDay(sim)-DIURNAL.peak));
}
// The temperature an animal at cell i feels now (the daily mean without the rule).
export function airTemperature(sim,i){return diurnalEnabled(sim)?sim.world.temperature[i]+diurnalOffset(sim,i):sim.world.temperature[i]}
// Read-only day phase (Codex lighting; inspection). Presentation never writes it.
export function dayPhaseOf(sim){
 const f=timeOfDay(sim),daylight=Math.max(0,Math.sin(2*Math.PI*(f-DIURNAL.sunrise)));
 return Object.freeze({policy:diurnalEnabled(sim)?DIURNAL.policy:null,timeOfDay:f,daylight,night:f<DIURNAL.sunrise||f>=DIURNAL.sunset});
}
export function restoreDiurnalRules(sim,core){
 if(core.diurnalRules===undefined)delete sim.diurnalRules;
 else if(core.diurnalRules!==DIURNAL.policy)throw Error('Unknown saved diurnal temperature rules.');
}
