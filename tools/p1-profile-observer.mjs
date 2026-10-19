// Diagnostic only. Exactly reproduce the observer-play population and tick
// workload, attributing CPU samples rather than weakening its 500ms assertion.
import {Session} from 'node:inspector';
import {promisify} from 'node:util';
import {performance} from 'node:perf_hooks';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {ObserverController} from '../src/ui/observer.js';

const sim=new Simulation('GENVO8-OBSERVER-PERF',{player:true});
sim.endOpeningGrace('test');
while(sim.animals.filter(a=>a.alive).length<CFG.performanceTarget){
 const k=['mosskip','rootling','genvo','mosskip'][sim.animals.length%4];
 sim.spawnAnimal(k);
}
const obs=new ObserverController(()=>sim);
obs.setSpeed(4);
for(let i=0;i<40;i++)sim.update(null,{externalPlayerControl:true});
const session=new Session();session.connect();
const post=promisify(session.post.bind(session));
await post('Profiler.enable');
await post('Profiler.setSamplingInterval',{interval:1000});
await post('Profiler.start');
const t0=performance.now(),steps=Math.round(CFG.controlHz*2*obs.speed),ratio=Math.round(CFG.controlHz/CFG.simHz);
let result=null;
for(let i=0;i<steps;i++){
 sim.playerControlStep(null,CFG.controlHz);
 if(i%ratio===ratio-1)sim.update(null,{externalPlayerControl:true});
 if(i%32===31&&!result)result=obs.observe();
}
const ms=(performance.now()-t0)/2;
const profile=(await post('Profiler.stop')).profile;
session.disconnect();
const frames=new Map(profile.nodes.map(n=>[n.id,n.callFrame])),hits=new Map();
for(const id of profile.samples||[]){
 const f=frames.get(id);
 if(!f)continue;
 const key=`${f.functionName||'(anonymous)'}@${(f.url||'').split('/').slice(-2).join('/')}`;
 hits.set(key,(hits.get(key)||0)+1);
}
const top=[...hits].sort((a,b)=>b[1]-a[1]).slice(0,24);
console.log(JSON.stringify({kind:'p1-profiler-observer',msPerRealSecond:Math.round(ms),alive:sim.animals.filter(a=>a.alive).length,samples:profile.samples?.length||0,top},null,2));
