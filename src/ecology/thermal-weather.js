import {hashString} from '../core/rng.js';
import {weatherGaussian} from './weather.js';
import {localTemperature} from '../world/environment.js';
// Signed stationary anomalies. A separate stream preserves existing rainfall
// and biological RNG sequences; no event is scheduled to rescue organisms.
export const THERMAL_WEATHER=Object.freeze({policy:'persistent-temperature/1',fastPersistence:.82,slowPersistence:.97,fastSpread:.10,slowSpread:.06,spellThreshold:.14});
const anomaly=s=>THERMAL_WEATHER.fastSpread*s.fast+THERMAL_WEATHER.slowSpread*s.slow;
export function createThermalWeather(seed,day=0){
 if(!Number.isSafeInteger(day)||day<0)throw Error('Invalid thermal weather origin.');
 const s={schema:1,sinceDay:day,day,rngState:hashString(String(seed)+':thermal-weather')||0x9e3779b9,fast:0,slow:0,anomaly:0};s.fast=weatherGaussian(s);s.slow=weatherGaussian(s);s.anomaly=anomaly(s);return s;
}
export function validateThermalWeather(s,timeline=Infinity){
 if(s?.schema!==1||!Number.isSafeInteger(s.sinceDay)||s.sinceDay<0||!Number.isSafeInteger(s.day)||s.day<s.sinceDay||s.day>timeline||!Number.isSafeInteger(s.rngState)||s.rngState<0||s.rngState>0xffffffff||!['fast','slow','anomaly'].every(k=>Number.isFinite(s[k]))||Math.abs(s.anomaly-anomaly(s))>1e-12)throw Error('Invalid persistent temperature state.');
}
export function advanceThermalWeather(s,day){
 validateThermalWeather(s);if(!Number.isSafeInteger(day)||day<s.day)throw Error('Invalid thermal weather clock.');
 const p=THERMAL_WEATHER;while(s.day<day){s.fast=p.fastPersistence*s.fast+Math.sqrt(1-p.fastPersistence**2)*weatherGaussian(s);s.slow=p.slowPersistence*s.slow+Math.sqrt(1-p.slowPersistence**2)*weatherGaussian(s);s.day++}s.anomaly=anomaly(s);return s.anomaly;
}
export function thermalWeatherReading(sim,x,y){
 if(sim.thermalRules!==THERMAL_WEATHER.policy||!sim.climate)return null;
 const delta=sim.climate.temperatureAnomaly||0,temperature=localTemperature(sim.world,sim.climate,sim.world.idx(x,y)),active=Math.abs(delta)>=THERMAL_WEATHER.spellThreshold;
 return{delta,temperature,active,label:!active?'Seasonal weather':delta>0?(temperature>=.78?'Heatwave':'Warm spell'):(temperature<=.34?'Cold snap':'Cold spell')};
}
