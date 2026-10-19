// Pinned-parent exact high-population comparison with NO timing or acceptance
// threshold. It measures biological outcome identity over the real observer
// playback, including all 560 living actors and finite resource inventories.
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {ObserverController} from '../src/ui/observer.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {createHash} from 'node:crypto';
import {serialize} from 'node:v8';
const sim=new Simulation('GENVO8-OBSERVER-PERF',{player:true});
sim.endOpeningGrace('test');
while(sim.animals.filter(a=>a.alive).length<CFG.performanceTarget){
 const k=['mosskip','rootling','genvo','mosskip'][sim.animals.length%4];
 sim.spawnAnimal(k);
}
const obs=new ObserverController(()=>sim);obs.setSpeed(4);
for(let i=0;i<40;i++)sim.update(null,{externalPlayerControl:true});
const steps=Math.round(CFG.controlHz*2*obs.speed),ratio=Math.round(CFG.controlHz/CFG.simHz);
let seen=null;
for(let i=0;i<steps;i++){
 sim.playerControlStep(null,CFG.controlHz);
 if(i%ratio===ratio-1)sim.update(null,{externalPlayerControl:true});
 if(i%32===31&&!seen)seen=obs.observe();
}
const saved=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'p1-full-pop-parity'}));
const hash=createHash('sha256').update(serialize(saved)).digest('hex');
console.log(`OBSERVER_WORLD ${sim.animals.filter(a=>a.alive).length} ${sim.tickCount} ${hash}`);
