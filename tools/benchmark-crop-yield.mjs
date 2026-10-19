// Alternated diagnostic of the exact observer workload; does not change its 500ms gate.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {ObserverController} from '../src/ui/observer.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const rebase=(text,base,override={})=>text.replace(/from '([^']+)'/g,(_,s)=>'from '+JSON.stringify(override[s]||new URL(s,base).href));
const handling=fs.readFileSync(new URL('../docs/performance/plant-handling-before-scalar-cost.txt',import.meta.url),'utf8');
const reference=fs.readFileSync(new URL('../docs/performance/crop-yield-before-scalar-cost.txt',import.meta.url),'utf8');
const {PlantDispersalController:Before}=await import(data(rebase(reference,new URL('../src/ecology/dispersal.js',import.meta.url),{'./plant-handling.js':data(rebase(handling,new URL('../src/ecology/plant-handling.js',import.meta.url)))})));
const results=[];
for(const mode of ['before','after','after','before','before','after']){
 const sim=new Simulation('GENVO8-OBSERVER-PERF',{player:true});sim.endOpeningGrace('test');
 if(mode==='before'){sim.dispersal.cropYield=Before.prototype.cropYield;sim.dispersal.receiptFromTissues=Before.prototype.receiptFromTissues}
 while(sim.animals.filter(a=>a.alive).length<CFG.performanceTarget)sim.spawnAnimal(['mosskip','rootling','genvo','mosskip'][sim.animals.length%4]);
 const obs=new ObserverController(()=>sim);obs.setSpeed(4);
 for(let i=0;i<40;i++)sim.update(null,{externalPlayerControl:true});
 if(global.gc)global.gc();
 const steps=Math.round(CFG.controlHz*2*obs.speed),ratio=Math.round(CFG.controlHz/CFG.simHz);let event=null;
 const started=performance.now();
 for(let i=0;i<steps;i++){sim.playerControlStep(null,CFG.controlHz);if(i%ratio===ratio-1)sim.update(null,{externalPlayerControl:true});if(i%32===31&&!event)event=obs.observe()}
 const cost=(performance.now()-started)/2;
 const snapshot=createSimulationSnapshot(sim,{savedAt:'fixed',reason:'performance-parity'});delete snapshot.meta;
 const sha256=createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
 results.push({mode,msPerRealSecond:cost,sha256});
}
const mean=mode=>{const rows=results.filter(r=>r.mode===mode);return rows.reduce((s,r)=>s+r.msPerRealSecond,0)/rows.length};
console.log(JSON.stringify({schema:'genvo.crop-yield-benchmark/1',gcBeforeTiming:!!global.gc,scope:'Alternated diagnostic; original observer-play test remains the gate',beforeMean:mean('before'),afterMean:mean('after'),changePercent:100*(mean('after')/mean('before')-1),identicalSnapshots:new Set(results.map(r=>r.sha256)).size===1,results},null,2));
