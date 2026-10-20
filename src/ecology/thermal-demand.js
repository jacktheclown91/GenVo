import {thermalCoverFactor} from '../lineage/terrain-cover-physiology.js';
import {thermoregulation,neonatalWarmthFactor,neonatalColdExposure} from './mammalian-care.js';
import {CFG} from '../sim/config.js';
// Shared composition of existing thermal physiology. This query never advances
// coats, consumes reserves, moves an actor or rolls weather/evolution randomness.
export function thermalDemand(sim,a,{temperature,comfort=.55*a.genes.climate,shelter=1,coat={},young=null,sleep={coldExposure:1,heat:1}}){
 const kind=temperature>comfort?'heat':'cold',heat=thermoregulation(a,temperature),maternalWarmth=temperature<comfort?neonatalWarmthFactor(a,sim.tickCount,CFG.lifeStride):1;
 const thermal=Math.abs(temperature-comfort)*.12*sleep.coldExposure*shelter*(sim.protoSpeciation?.thermalMultiplier?.(a,kind)||1)*thermalCoverFactor(a,temperature,comfort,coat)*(temperature<comfort
 ?heat.coldFactor*(young?.coldMultiplier??neonatalColdExposure(a,temperature))
 :(young?.heatMultiplier??1))*maternalWarmth;
 return{thermal,extraEnergy:heat.extraEnergy*sleep.heat};
}
