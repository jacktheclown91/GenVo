// Exact old full-clone E17 transport versus detached, independently owned
// restore. This deliberately uses the same weather, hydrology and soil laws,
// not synthetic plant, animal or reproductive outcomes.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {advanceRemoteEnvironment,offscreenCalendar,planetaryWeatherForDay} from '../src/world/planetary-offscreen-environment.js';
import {advanceEnvironmentWater,localTemperature} from '../src/world/environment.js';
import {advanceSoilDay} from '../src/ecology/soil-water.js';

const save=sim=>structuredClone(createSimulationSnapshot(sim,{reason:'e17-detached-parity',savedAt:'fixed'}));
const equal=(a,b,label)=>assert.ok(isDeepStrictEqual(a,b),label);
// Freeze the pre-change reference behavior in the test, including transport
// clone and new checkpoint creation. Keep independent snapshot/ledger owners.
function originalPhysicalReplay(active,session,{maxDays=2}={}){
 const steps=Math.min(active.day-session.snapshot.core.day,maxDays);
 if(!steps)return{days:0};
 const temp=restoreSimulationSnapshot(structuredClone(session.snapshot));
 const old=session.environmentalLedger;
 const firstDay=old?.firstDay??temp.day;
 const ledger=old?{...old}:{schema:1,firstDay,lastDay:temp.day-1,days:0,rain:0,
  saltInput:0,saltOutput:0,soilMaxAbsClosure:0,saltMaxAbsClosure:0,
  lastSoilClosure:0,lastSaltClosure:0};
 for(let i=0;i<steps;i++){
  const day=temp.day,{climate,weather}=planetaryWeatherForDay(temp.seed,day,temp.weatherPattern);
  temp.weatherPattern=weather;
  const salt=advanceEnvironmentWater(temp.world,climate,day);
  const soil=advanceSoilDay(temp.world,climate,day);
  for(let j=0;j<temp.world.len;j++)if(temp.world.environment||!temp.world.water[j])
   temp.world.temperature[j]+=(localTemperature(temp.world,climate,j)-temp.world.temperature[j])*
    (temp.world.water[j]?.04:.12);
  ledger.rain+=soil.lastDay.rain;
  ledger.saltInput+=salt?.input||0;
  ledger.saltOutput+=salt?.output||0;
  ledger.lastSoilClosure=soil.lastDay.closure;
  ledger.lastSaltClosure=salt?.closure||0;
  ledger.soilMaxAbsClosure=Math.max(ledger.soilMaxAbsClosure,Math.abs(soil.lastDay.closure));
  ledger.saltMaxAbsClosure=Math.max(ledger.saltMaxAbsClosure,Math.abs(salt?.closure||0));
  ledger.days++;ledger.lastDay=day;
  temp.day=day+1;
  const cal=offscreenCalendar(temp.day);
  temp.seasonIndex=cal.seasonIndex;temp.year=cal.year;
  temp.tickCount+=CFG.dayTicks;temp.climate=climate;
 }
 const after=createSimulationSnapshot(temp,{reason:session.snapshot.reason,savedAt:session.snapshot.savedAt});
 after.key=session.snapshot.key;
 delete after.regionalWorlds;
 session.snapshot=after;
 session.environmentalLedger=ledger;
 return{days:steps};
}
for(const beginDay of [1,25,33]){
 const sim=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1'});
 sim.day=beginDay;
 sim.tickCount=(beginDay-1)*CFG.dayTicks;
 sim.year=offscreenCalendar(beginDay).year;
 sim.seasonIndex=offscreenCalendar(beginDay).seasonIndex;
 const initial=save(sim),originalInput=structuredClone(initial);
 const a={key:'0,0',snapshot:structuredClone(initial)};
 const b={key:'0,0',snapshot:structuredClone(initial)};
 const baselineArchive=structuredClone(a);
 const active={day:beginDay+6};
 for(const maxDays of [2,1,2,1]){
  assert.equal(advanceRemoteEnvironment(active,a,{maxDays}).days,
    originalPhysicalReplay(active,b,{maxDays}).days,
    'each real weather day is scheduled identically');
  equal(a,b,'detached replay matches the original full-clone hydrology and all stored authorities at day '+a.snapshot.core.day);
 }
 equal(initial,originalInput,'input checkpoint stays untouched after independent archived seasons');
 equal(baselineArchive.snapshot,initial,'original shared checkpoint remains unchanged');
 assert.equal(a.snapshot.core.day,active.day);
 assert.equal(a.environmentalLedger.days,6);
 assert.equal(a.snapshot.animals.length,0,'physical replay never creates wildlife');
 const before=a.snapshot.world.moisture.slice();
 b.snapshot.world.moisture[0]=0.123456;
 equal(a.snapshot.world.moisture,before,'live historical archives are separately owned');
}
// Malformed already-persisted ledger cannot partly mutate an archive.
const broken=new Simulation('PLANET-B0-A',{player:false,bootstrap:false,worldGenerator:'planetary/1'});
const bad={key:'0,0',snapshot:save(broken),environmentalLedger:{schema:1,firstDay:1,lastDay:1,days:1,rain:-3}};
const unchanged=structuredClone(bad);
assert.throws(()=>advanceRemoteEnvironment({day:2},bad,{maxDays:1}),/environmental conservation ledger/);
equal(bad,unchanged,'failed remote conservation validation leaves input unchanged');
console.log('E17 detached physical replay: old-clone exact parity through winter, spring and summer, archived genotype/material identity, independent buffer ownership, and transactional rejection PASS');
