import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import v8 from 'node:v8';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [checkpoint,out,sourceArg]=process.argv.slice(2);
assert.ok(checkpoint&&out,'checkpoint and output paths required');
const saved=v8.deserialize(fs.readFileSync(checkpoint));
assert.ok(saved.snapshot,'completed checkpoints have no active snapshot to audit');
const canonicalRoot=fileURLToPath(new URL('../src',import.meta.url)),root=path.resolve(sourceArg||canonicalRoot),hash=crypto.createHash('sha256');
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else hash.update(path.join(canonicalRoot,path.relative(root,p))).update(fs.readFileSync(p))}}
walk(root);const sourceFingerprint=hash.digest('hex');assert.equal(sourceFingerprint,saved.contract.sourceFingerprint,'audit requires the exact checkpoint source');
const load=file=>import(pathToFileURL(path.join(root,file)).href);
const {restoreSimulationSnapshot}=await load('persistence/save-manager.js'),{SPECIES}=await load('organisms/species.js'),{bestFreshwaterFood}=await load('ecology/freshwater-food.js');
const sim=restoreSimulationSnapshot(saved.snapshot),rng=sim.rng.state;
const resources={};
for(const [kind,field] of Object.entries({...sim.world.freshwaterFood,detritus:sim.world.carrion})){
  let biomass=0,occupiedCells=0,invalidCells=0;
  for(let i=0;i<field.length;i++){if(!sim.world.water[i])continue;const amount=field[i];if(!Number.isFinite(amount)||amount<0)invalidCells++;else{biomass+=amount;if(amount>0)occupiedCells++}}
  resources[kind]={biomass,occupiedCells,invalidCells};
}
const origins={};
for(const a of sim.animals.filter(a=>a.alive)){
  const group=origins[a.species]??={alive:0,inWater:0,lowEnergy:0,lowEnergyWithReachableWaterFood:0,recordedFreshwaterMeals:0};group.alive++;
  if(sim.world.water[sim.world.idx(a.x,a.y)])group.inWater++;
  if(a.lastFreshwaterMeal)group.recordedFreshwaterMeals++;
  if(a.energy/SPECIES[a.species].maxEnergy<.30){group.lowEnergy++;if(bestFreshwaterFood(sim,a,9*a.genes.senses))group.lowEnergyWithReachableWaterFood++}
}
assert.equal(sim.rng.state,rng,'detached audit must not draw simulation RNG');
const result={sourceFingerprint,seed:sim.seed,day:sim.day,checkpoint: path.resolve(checkpoint),detached:true,intervention:false,resources,origins};
fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
