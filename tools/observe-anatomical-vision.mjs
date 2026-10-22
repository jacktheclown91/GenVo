// Read-only natural observation of anatomical vision (anatomical-vision/1).
// Usage: node tools/observe-anatomical-vision.mjs <seed> <vision|control> <days> <out.ndjson> [originX originY]
// The same seed and region run with the policy recorded (vision) or absent
// (control); nothing is staged, edited or selected. Eye inventories and
// ecological counters are observations, not targets.
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {visionProfile,ADVANCED_EYES} from '../src/lineage/vision.js';
const [seed,mode,daysArg,out,ox='0',oy='0']=process.argv.slice(2);
if(!seed||!['vision','control'].includes(mode)||!out)throw Error('usage: <seed> <vision|control> <days> <out> [ox oy]');
const days=Number(daysArg),origin={x:Number(ox),y:Number(oy)};
const sim=new Simulation(seed,{player:false,worldGenerator:'planetary/1',planetOrigin:origin,anatomicalVision:mode==='vision'});
const EYES=['eyespot','simple-eye','display-eye','tracker-eye','glow-eye','stalk-eye','wide-field-eye','compound-eye','hunter-eye',...ADVANCED_EYES];
const seen=new Set(sim.animals.map(a=>a.id)),firstBorn={},everBorn={},started=Date.now();
const eyesOf=a=>(a.bodyPlan?.nodes||[]).filter(n=>n.socket?.startsWith('eye'));
const write=row=>fs.appendFileSync(out,JSON.stringify(row)+'\n');
fs.writeFileSync(out,'');
function sample(){
 const live=sim.animals.filter(a=>a.alive),bySpecies={},eyeCarriers={},ranges=[],fovs=[];let secondPair=0,hunters=0;
 for(const a of live){bySpecies[a.species]=(bySpecies[a.species]||0)+1;
  const eyes=eyesOf(a);for(const id of new Set(eyes.map(n=>n.partId)))eyeCarriers[id]=(eyeCarriers[id]||0)+1;
  if(eyes.some(n=>n.socket==='eye.left.2'||n.socket==='eye.right.2'))secondPair++;
  const p=visionProfile(a);ranges.push(p.range);fovs.push(p.fieldOfView);
 }
 const mean=v=>v.length?+(v.reduce((x,y)=>x+y,0)/v.length).toFixed(2):0;
 return{day:sim.day,population:live.length,bySpecies,births:sim.stats.births,deaths:sim.stats.deaths,byCause:{...sim.stats.byCause},threatStages:{...sim.stats.threatStages},
  eyeCarriers,secondPair,sightRange:{mean:mean(ranges),max:+Math.max(0,...ranges).toFixed(1)},fieldOfView:{mean:mean(fovs),max:Math.max(0,...fovs)},seconds:+((Date.now()-started)/1000).toFixed(1)};
}
write({kind:'start',seed,mode,origin,days,policy:sim.visionRules??null,mutationVision:mode==='vision',...sample()});
for(let d=1;d<=days;d++){
 for(let i=0;i<CFG.dayTicks;i++)sim.update(null);
 // Newborns this day: record every eye organ and second pair ever born.
 for(const a of sim.animals){if(seen.has(a.id))continue;seen.add(a.id);
  const eyes=eyesOf(a),kinds=new Set(eyes.map(n=>n.partId));if(eyes.some(n=>n.socket.endsWith('.2')))kinds.add('second-pair');
  for(const k of kinds){everBorn[k]=(everBorn[k]||0)+1;if(firstBorn[k]===undefined)firstBorn[k]={day:sim.day,id:a.id,species:a.species,generation:a.generation}}}
 if(d%10===0||d===days){const s=sample();write({kind:'sample',...s,everBorn:{...everBorn}});if(!s.population)break}
}
write({kind:'final',...sample(),everBorn,firstBorn,newbornsObserved:seen.size});
