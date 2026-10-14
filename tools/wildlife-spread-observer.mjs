import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import {Simulation} from '../src/sim/simulation.js';
import {checkEcologicalIntegrity} from './ecological-integrity.mjs';

const [seed='WILDLIFE-SPREAD-A',horizon='120',output='reports/wildlife-spread.json']=process.argv.slice(2);
const days=Number(horizon);
assert.ok(Number.isInteger(days)&&days>0);
assert.ok(!fs.existsSync(output),'Preserve existing observation reports');
function fingerprint(){const h=crypto.createHash('sha256');function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else h.update(p).update(fs.readFileSync(p));}}walk(path.resolve('src'));return h.digest('hex')}
const sourceFingerprint=fingerprint();
const sim=new Simulation(seed,{player:false}),started=performance.now();
const initialPopulation=sim.animals.filter(a=>a.alive).length;
const departures=[],arrivals=[],conceptions=[],births=[],timeline=[];
const arrivalById=new Map();
const begin=sim.migration.begin.bind(sim.migration),progress=sim.migration.progress.bind(sim.migration);
sim.migration.begin=(animal,target,...args)=>{const result=begin(animal,target,...args);if(result)departures.push({id:animal.id,species:animal.species,day:sim.day,origin:{x:animal.x,y:animal.y},target:{x:target.x,y:target.y},reason:args[0]});return result};
sim.migration.progress=(animal,state=sim.migration.ensure(animal))=>{
 const was=state.status,target=state.target?{...state.target}:null;
 const result=progress(animal,state);
 if(was!=='settled'&&state.status==='settled'&&state.reason==='reached habitat'){
  assert.ok(target&&Math.hypot(animal.x-target.x,animal.y-target.y)<=1,'Physical arrival within migration tolerance');
  const row={id:animal.id,species:animal.species,day:sim.day,x:animal.x,y:animal.y,target,region:sim.regionalEcology.keyAt(animal.x,animal.y)};
  arrivals.push(row);arrivalById.set(animal.id,row);
 }
 return result;
};
const mate=sim.tryMate.bind(sim),birth=sim.giveBirth.bind(sim);
sim.tryMate=(a,b,...args)=>{const result=mate(a,b,...args);if(result)conceptions.push({day:sim.day,ids:[a.id,b.id],species:a.species,positions:[{x:a.x,y:a.y},{x:b.x,y:b.y}],priorArrivals:[arrivalById.get(a.id)||null,arrivalById.get(b.id)||null]});return result};
sim.giveBirth=(mother,...args)=>{const children=birth(mother,...args);for(const child of children)births.push({id:child.id,species:child.species,day:sim.day,parentIds:[...child.parentIds],region:sim.regionalEcology.keyAt(child.x,child.y),parentsPriorArrivals:child.parentIds.map(id=>arrivalById.get(id)||null)});return children};
let lastDay=-1;
function persist(complete){assert.equal(fingerprint(),sourceFingerprint,'Source changed during observation');fs.writeFileSync(output,JSON.stringify({sourceFingerprint,seed,days,day:sim.day,complete,acceptance:false,player:false,elapsedSeconds:(performance.now()-started)/1000,
 scope:'Unmodified player-free world; actual migration departures, physical arrivals, conception and birth observations. Earlier arrival does not alone establish permanent residence or reproduction at the destination.',departures,arrivals,conceptions,births,timeline},null,2))}
while(sim.day<=days){sim.update(null);if(sim.day!==lastDay){const integrity=checkEcologicalIntegrity(sim,initialPopulation);assert.ok(!sim.animals.some(a=>a.player));timeline.push({day:sim.day,population:sim.population(),integrity,mortality:{...sim.stats.byCause}});lastDay=sim.day;if(sim.day%20===1){persist(false);console.log(JSON.stringify({seed,day:sim.day,departures:departures.length,arrivals:arrivals.length,births:births.length}))}}}
persist(true);
console.log(JSON.stringify({seed,day:sim.day,complete:true,departures:departures.length,arrivals:arrivals.length,births:births.length}));
