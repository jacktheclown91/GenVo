import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {hasPart} from '../src/lineage/part-abilities.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {checkEcologicalIntegrity} from '../tools/ecological-integrity.mjs';

// Run each long simulation in an isolated Node process to keep historical
// creature graphs and typed-array snapshots from inflating GC pressure.
if(!process.argv[2]){
 for(const seed of ['NATURAL-ENGINEERS-A','NATURAL-ENGINEERS-B']){
  const r=spawnSync(process.execPath,[fileURLToPath(import.meta.url),seed],{stdio:'inherit',timeout:65000});
  assert.equal(r.status,0,`${seed}: ecological worker failed or timed out (${r.error?.message||r.signal||r.status})`);
 }
 process.exit(0);
}

// A rational root-foraging choice has to come from functioning limbs, low
// food reserves, usable ground, and a distant alternative; not species names.
const fixture=new Simulation('EJ-ROOT-CHOICE',{player:false});
const digger=fixture.animals.find(a=>a.alive&&a.species==='rootling');
assert.ok(digger);
const spot=fixture.world.idx(digger.x,digger.y);
fixture.world.water[spot]=0;
fixture.world.fertility[spot]=.7;
digger.energy=SPECIES.rootling.maxEnergy*.32;
const far={x:digger.x+4,y:digger.y+1,kind:'sunmoss'};
assert.equal(fixture.partAbilities.digDecision(digger,{food:far})?.kind,'roots');
assert.equal(fixture.partAbilities.digDecision(digger,{food:{...far,x:digger.x+.8,y:digger.y}}),null,'close forage is preferable');
fixture.world.fertility[spot]=.1;
assert.equal(fixture.partAbilities.digDecision(digger,{food:far}),null,'poor soil favors known plants');
fixture.world.fertility[spot]=.7;
digger.energy=SPECIES.rootling.maxEnergy*.62;
assert.equal(fixture.partAbilities.digDecision(digger,{food:far}),null,'fed animals do not dig for surplus food');
digger.energy=SPECIES.rootling.maxEnergy*.32;
const withoutLimbs={...digger,bodyPlan:null};
assert.equal(fixture.partAbilities.digDecision(withoutLimbs,{food:far}),null,'ancestry alone does not grant digging');
fixture.world.water[spot]=1;
assert.equal(fixture.partAbilities.digDecision(digger,{food:far}),null,'water cannot be excavated');

function biomass(sim){
 const {world:w}=sim;let plant=0,seeds=0;
 for(let i=0;i<w.len;i++){plant+=w.plants.thistlepod[i];seeds+=w.seedBank.thistlepod[i];}
 return{plant,seeds};
}

const results=[];
for(const seed of [process.argv[2]]){
 const engineered=new Simulation(seed,{player:false}),control=new Simulation(seed,{player:false});
 const observed={digs:0,bySpecies:{},byGeneration:{},soilSeedlingEvents:0};
 const originalDig=engineered.partAbilities.dig.bind(engineered.partAbilities);
 engineered.partAbilities.dig=animal=>{
  const outcome=originalDig(animal);
  if(outcome.ok){assert.ok(hasPart(animal,'digging-forelimb'),'successful wild digging needs real anatomy');observed.digs++;observed.bySpecies[animal.species]=(observed.bySpecies[animal.species]||0)+1;observed.byGeneration[animal.generation]=(observed.byGeneration[animal.generation]||0)+1;}
  return outcome;
 };
 const originalGerminate=engineered.dispersal.germinate.bind(engineered.dispersal);
 engineered.dispersal.germinate=(kind,cell,moisture,fertility,temp)=>{
  const soil=kind==='thistlepod'?engineered.partAbilities.disturbedSoilAt(cell%engineered.world.n,Math.floor(cell/engineered.world.n)):0;
  const outcome=originalGerminate(kind,cell,moisture,fertility,temp);
  if(kind==='thistlepod'&&soil>0&&outcome>0)observed.soilSeedlingEvents++;
  return outcome;
 };
 // Research-only paired control: the SAME animals, dig actions, root-energy
 // rewards, habitat history, weather, seed-bank and growth rules. Only the
 // ecological response to disturbed soil is withheld, not digging itself.
 control.partAbilities.disturbedSoilAt=()=>0;
 let lastDay=0;
 while(engineered.day<=90){
  engineered.update(null);control.update(null);
  if(engineered.day!==lastDay){
   lastDay=engineered.day;
   if(lastDay%30===0){
    console.log(`${seed}: observation day ${lastDay}`);
    checkEcologicalIntegrity(engineered,132);checkEcologicalIntegrity(control,132);
   }
  }
 }
 assert.ok(observed.digs>=20,`${seed}: naturally hungry diggers must excavate in full ecology`);
 assert.ok((observed.bySpecies.rootling||0)>0,`${seed}: naturally occurring wild Diggers must excavate`);
 assert.ok(Object.keys(observed.byGeneration).some(g=>Number(g)>1),`${seed}: actual descendants must dig, not just founding wild animals`);
 assert.ok(observed.soilSeedlingEvents>0,`${seed}: at least one real natural seedling establishes in disturbed soil`);
 const withSoil=biomass(engineered),withoutSoil=biomass(control);
 assert.ok(withSoil.plant>withoutSoil.plant+1e-5,`${seed}: naturally disturbed habitat increases seed-funded plant biomass (${withSoil.plant} vs ${withoutSoil.plant})`);
 assert.ok(engineered.partAbilities.soilDisturbance.size>0,'living diggers leave persistent disturbance');
 assert.deepEqual(engineered.population(),control.population(),'small measured plant change must not be mistaken for population rescue');
 const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(engineered)));
 assert.deepEqual(restored.partAbilities.soilDisturbance,engineered.partAbilities.soilDisturbance,'autonomous soil patches survive ordinary saves');
 assert.ok(Math.abs(biomass(restored).plant-withSoil.plant)<1e-5,'actual extra plant biomass survives ordinary saves');
 results.push({seed,days:90,years:(90/32).toFixed(2),digs:observed.digs,bySpecies:observed.bySpecies,byGeneration:observed.byGeneration,soilSeedlingEvents:observed.soilSeedlingEvents,plantBiomassGain:+(withSoil.plant-withoutSoil.plant).toFixed(6),seedBankGain:+(withSoil.seeds-withoutSoil.seeds).toFixed(6),population:engineered.population()});
}
console.log('autonomous root foraging and natural paired 90-day ecology comparison: PASS');
console.log(JSON.stringify(results,null,2));
