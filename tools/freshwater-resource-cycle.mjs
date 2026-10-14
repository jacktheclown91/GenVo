// Controlled resource dynamics; does not advance the animal simulation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const days=Number(process.argv[2]||3000),out=process.argv[3],root=path.resolve(process.argv[4]||'src');
assert.ok(Number.isInteger(days)&&days>0&&out);
const canonicalRoot=fileURLToPath(new URL('../src',import.meta.url)),hash=crypto.createHash('sha256');
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hash.update(path.join(canonicalRoot,path.relative(root,p))).update(fs.readFileSync(p))}}
walk(root);const sourceFingerprint=hash.digest('hex'),load=file=>import(pathToFileURL(path.join(root,file)).href);
const {Simulation}=await load('sim/simulation.js'),{advanceFreshwater,FRESHWATER_FOOD}=await load('ecology/freshwater-food.js');
const runs=[];
for(const seed of ['GENVO8-TEST-A','GENVO8-TEST-C','GENVO8-TEST-E']){
  const sim=new Simulation(seed,{player:false}),rng=sim.rng.state,timeline=[];
  for(let day=0;day<=days;day++){
    if(day%100===0||day===days){const resources={};
      for(const [kind,field] of Object.entries(sim.world.freshwaterFood)){
        let biomass=0,occupiedCells=0,invalidCells=0;
        for(const value of field){if(!Number.isFinite(value)||value<0||value>FRESHWATER_FOOD[kind].carry+1e-6)invalidCells++;else{biomass+=value;if(value>0)occupiedCells++}}
        resources[kind]={biomass,occupiedCells,invalidCells};
      }
      timeline.push({resourceUpdate:day,resources});
    }
    if(day<days)advanceFreshwater(sim.world);
  }
  assert.equal(sim.rng.state,rng,'resource dynamics draw no simulation RNG');
  const final=timeline.at(-1).resources;
  const run={seed,finiteBounded:timeline.every(t=>Object.values(t.resources).every(r=>r.invalidCells===0)),lowerPreyDepleted:final.larvae.occupiedCells===0,upperPreyDepleted:final.fry.occupiedCells===0,timeline};
  runs.push(run);console.log(JSON.stringify({seed,finiteBounded:run.finiteBounded,lowerPreyDepleted:run.lowerPreyDepleted,upperPreyDepleted:run.upperPreyDepleted,final}));
}
fs.writeFileSync(out,JSON.stringify({sourceFingerprint,days,controlledResourceOnly:true,animalSimulationAdvanced:false,climateAndSoilSimulationAdvanced:false,complete:true,runs},null,2));
