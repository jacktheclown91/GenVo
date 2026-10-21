// E17: bounded background PHYSICAL seasons for archived planetary regions.
// This never calls the fauna, reproduction, seed dispersal or plant-growth
// phases, and never invents births or plants. It reuses the same canonical
// soil/snow and salt transports as the active World, one historical day at a
// time, with a ledger retained in the unique region session archive.
import {CFG} from '../sim/config.js';
import {markRegionalOwnerDirty} from './regional-revision.js';
import {createWeatherState,advanceWeatherTo,validWeatherState} from '../ecology/weather.js';
import {advanceEnvironmentWater,localTemperature} from './environment.js';
import {advanceSoilDay} from '../ecology/soil-water.js';
import {createSimulationSnapshot,restoreDetachedSimulationSnapshot} from '../persistence/save-manager.js';

export const OFFSCREEN_ENVIRONMENT=Object.freeze({
 schema:1,regionsPerPass:2,daysPerRegionPass:2,maxEntryBacklogDays:24
});
const seasonalTemp=[.54,.78,.58,.30],seasonalRain=[.58,.35,.46,.26];
const validDay=d=>Number.isSafeInteger(d)&&d>=1&&d<=100000000;
const abs=n=>Math.abs(n);

export function validateRemoteEnvironmentalLedger(session){
 const ledger=session?.environmentalLedger;
 if(ledger===undefined)return;
 if(ledger?.schema!==1||!validDay(ledger.firstDay)||!validDay(ledger.lastDay)||
    !Number.isSafeInteger(ledger.days)||ledger.days<1||
    ledger.lastDay-ledger.firstDay+1!==ledger.days||
    !validDay(session.snapshot?.core?.day)||session.snapshot.core.day!==ledger.lastDay+1||
    !['rain','saltInput','saltOutput','soilMaxAbsClosure','saltMaxAbsClosure'].every(k=>Number.isFinite(ledger[k])&&ledger[k]>=0)||
    !Number.isFinite(ledger.lastSoilClosure)||!Number.isFinite(ledger.lastSaltClosure))
  throw Error('Invalid archived environmental conservation ledger.');
}
export function offscreenCalendar(day){
 if(!validDay(day))throw Error('Invalid absolute planetary day.');
 return{year:Math.floor((day-1)/(CFG.seasonDays*4))+1,
  seasonIndex:Math.floor((day-1)/CFG.seasonDays)%4,
  seasonDay:(day-1)%CFG.seasonDays};
}
export function planetaryWeatherForDay(seed,day,state=null){
 const c=offscreenCalendar(day),st=validWeatherState(state)?state:createWeatherState(seed);
 advanceWeatherTo(st,day);
 return{climate:{
   temp:seasonalTemp[c.seasonIndex]+.04*Math.sin(c.seasonDay/CFG.seasonDays*Math.PI*2),
   rain:seasonalRain[c.seasonIndex]*st.factor,weatherFactor:st.factor},
  weather:st,calendar:c};
}
export function remoteEnvironmentDue(active,session){
 const d=session?.snapshot?.core?.day;
 if(!validDay(d)||!validDay(active?.day)||d>active.day)
  throw Error('Invalid archived planetary calendar or future remote environment.');
 return active.day-d;
}
// Mutates a single session ONLY after a complete local archive restoration and
// field-ledger pass. The final snapshot remains the canonical owner.
export function advanceRemoteEnvironment(active,session,{maxDays=OFFSCREEN_ENVIRONMENT.daysPerRegionPass}={}){
 if(session?.biologicalMode)throw Error('Biological region cannot replay duplicate environmental days.');
 if(!Number.isSafeInteger(maxDays)||maxDays<0||maxDays>OFFSCREEN_ENVIRONMENT.maxEntryBacklogDays)
  throw Error('Unbounded remote environmental replay.');
 const due=remoteEnvironmentDue(active,session),steps=Math.min(due,maxDays);
 if(!steps)return{days:0,remaining:due,key:session.key};
 validateRemoteEnvironmentalLedger(session);
 // The region snapshot is read-only until the full hydrology ledger validates.
 // Detached restore clones every mutable authority while decoding packed seed
 // columns directly and adopting only its separately owned world buffers.
 // The old full-snapshot clone duplicated large mature seed tables unnecessarily.
 const temp=restoreDetachedSimulationSnapshot(session.snapshot);
 const beforeIds=temp.animals.map(a=>a.id),beforeCount=temp.animals.length;
 const old=session.environmentalLedger;
 const firstDay=old?.firstDay??temp.day;
 const ledger=old?{...old}:{schema:1,firstDay,lastDay:temp.day-1,days:0,rain:0,
  saltInput:0,saltOutput:0,soilMaxAbsClosure:0,saltMaxAbsClosure:0,
  lastSoilClosure:0,lastSaltClosure:0};
 for(let i=0;i<steps;i++){
  const day=temp.day;
  const {climate,weather}=planetaryWeatherForDay(temp.seed,day,temp.weatherPattern);
  temp.weatherPattern=weather;
  // Reuse the real hydrological flows and their day-local conservation audits.
  const salt=advanceEnvironmentWater(temp.world,climate,day);
  const soil=advanceSoilDay(temp.world,climate,day);
  for(let j=0;j<temp.world.len;j++)if(temp.world.environment||!temp.world.water[j])
   temp.world.temperature[j]+=(localTemperature(temp.world,climate,j)-temp.world.temperature[j])*
     (temp.world.water[j]?.04:.12);
  if(!Number.isFinite(soil.lastDay.closure)||abs(soil.lastDay.closure)>1||
    salt&&(!Number.isFinite(salt.closure)||abs(salt.closure)>1e-5))
   throw Error('Offscreen environment violates water or salt conservation.');
  ledger.rain+=soil.lastDay.rain;
  ledger.saltInput+=salt?.input||0;ledger.saltOutput+=salt?.output||0;
  ledger.lastSoilClosure=soil.lastDay.closure;
  ledger.lastSaltClosure=salt?.closure||0;
  ledger.soilMaxAbsClosure=Math.max(ledger.soilMaxAbsClosure,abs(soil.lastDay.closure));
  ledger.saltMaxAbsClosure=Math.max(ledger.saltMaxAbsClosure,abs(salt?.closure||0));
  ledger.days++;ledger.lastDay=day;
  temp.day=day+1;
  const cal=offscreenCalendar(temp.day);
  temp.seasonIndex=cal.seasonIndex;temp.year=cal.year;
  temp.tickCount+=CFG.dayTicks;
  temp.climate=climate;
 }
 if(temp.animals.length!==beforeCount||temp.animals.some((a,i)=>a.id!==beforeIds[i]))
  throw Error('Inactive wildlife must never reproduce, die, move or be replaced by weather replay.');
 // Restore/create snapshot packs resource ownership via the normal canonical
 // save format. Keep save-level identity fields of the existing archive.
 const after=createSimulationSnapshot(temp,{reason:session.snapshot.reason,savedAt:session.snapshot.savedAt});
 after.key=session.snapshot.key;
 delete after.regionalWorlds;
 if(after.core.planetaryTravel)throw Error('Recursive offscreen archive.');
 const copy={...session,snapshot:after,environmentalLedger:ledger};
 validateRemoteEnvironmentalLedger(copy);
 markRegionalOwnerDirty(session);session.snapshot=after;session.environmentalLedger=ledger;
 return{days:steps,remaining:remoteEnvironmentDue(active,session),key:session.key,
  soilMaxAbsClosure:ledger.soilMaxAbsClosure,saltMaxAbsClosure:ledger.saltMaxAbsClosure};
}
// Called on bounded biology strides instead of the hot rendering path.
// Prioritize the oldest regions, letting up to 16 archived regions each catch
// up one day within 8 strides of an active simulation day.
export function advanceOffscreenEnvironments(sim,{
 maxRegions=OFFSCREEN_ENVIRONMENT.regionsPerPass,
 daysPerRegion=OFFSCREEN_ENVIRONMENT.daysPerRegionPass
}={}){
 if(!sim?.planetaryTravel?.sessions?.length)return[];
 if(!Number.isSafeInteger(maxRegions)||maxRegions<0||maxRegions>2||
    !Number.isSafeInteger(daysPerRegion)||daysPerRegion<0||daysPerRegion>2)
  throw Error('Invalid bounded offscreen scheduler.');
 const due=sim.planetaryTravel.sessions.filter(s=>!s.biologicalMode&&remoteEnvironmentDue(sim,s)>0)
  .sort((a,b)=>a.snapshot.core.day-b.snapshot.core.day||a.key.localeCompare(b.key));
 return due.slice(0,maxRegions).map(s=>advanceRemoteEnvironment(sim,s,{maxDays:daysPerRegion}));
}
