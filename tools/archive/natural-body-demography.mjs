// Observe normal births and deaths; no actors, RNG draws or physiology changes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [seed,limit,output,root='src']=process.argv.slice(2),days=Number(limit);
if(!seed||!Number.isInteger(days)||days<1||!output)throw Error('seed days output [source-root] required');
const canonical=fileURLToPath(new URL('../../src',import.meta.url)),source=path.resolve(root);
const load=f=>import(pathToFileURL(path.join(source,f)).href);
const {Simulation}=await load('sim/simulation.js'),{wildStartPlan,isWildSpecies}=await load('organisms/wild-bodies.js');
const hash=crypto.createHash('sha256');
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else hash.update(path.join(canonical,path.relative(source,p))).update(fs.readFileSync(p))}}
scan(source);
const sim=new Simulation(seed,{player:false}),events=[],trajectory=[],hunts={},births=sim.giveBirth.bind(sim),kill=sim.kill.bind(sim),tryKill=sim.tryKill.bind(sim);
const evolved=a=>isWildSpecies(a.species)&&a.bodyPlan?.id!==wildStartPlan(a.species).id;
sim.giveBirth=(a,...rest)=>{const children=births(a,...rest);for(const c of children)events.push({type:'birth',day:sim.day,id:c.id,species:c.species,evolved:evolved(c),parts:c.bodyPlan.nodes.map(n=>n.partId)});return children};
sim.tryKill=(a,b,...rest)=>{const wasAlive=b?.alive,energy=a.energy,hit=tryKill(a,b,...rest),row=hunts[a.id]??={attempts:0,hits:0,kills:0,energyGain:0};row.attempts++;row.hits+=!!hit;row.kills+=!!(wasAlive&&!b.alive);row.energyGain+=a.energy-energy;return hit};
sim.kill=(a,cause,...rest)=>{if(a?.alive)events.push({type:'death',day:sim.day,id:a.id,species:a.species,age:a.age,cause,evolved:evolved(a),x:a.x,y:a.y,intent:a.intent,target:a.target?{id:a.target.id,kind:a.target.kind,x:a.target.x,y:a.target.y,alive:a.target.alive}:null,route:a.navigationRoute,energy:a.energy,hydration:a.hydration});return kill(a,cause,...rest)};
let lastDay=0;
while(sim.day<=days){sim.update(null);if(sim.day!==lastDay){lastDay=sim.day;for(const a of sim.animals)if(a.alive&&a.species==='needlejaw'&&evolved(a))trajectory.push({day:sim.day,id:a.id,x:a.x,y:a.y,energy:a.energy,health:a.health,intent:a.intent,target:a.target?{id:a.target.id,kind:a.target.kind,x:a.target.x,y:a.target.y,alive:a.target.alive}:null,route:a.navigationRoute})}}
const result={seed,days,complete:true,sourceFingerprint:hash.digest('hex'),population:sim.population(),births:sim.stats.births,events,hunts,trajectory,survivors:sim.animals.filter(a=>a.alive).map(a=>({id:a.id,species:a.species,age:a.age,evolved:evolved(a),parts:a.bodyPlan.nodes.map(n=>n.partId)}))};
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({complete:true,seed,days,population:result.population,births:result.births}));
