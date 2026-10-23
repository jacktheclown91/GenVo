import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {birthComparisonModels} from '../assets/ui/birth-comparison.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
// Explicit model fixtures, not a claimed natural reproduction event.
const s=new Simulation('BIRTH-COMPARISON-MODEL',{player:true}),p=s.player(),mates=s.animals.filter(a=>a.alive&&a.species==='genvo'&&a.id!==p.id).slice(0,2);assert.equal(mates.length,2);
const add=mate=>{const child=s.spawnAnimal('genvo',p.x+.2,p.y+.2,[p,mate]);s.lineage.registerBirth(child,[p,mate]);return child},a=add(mates[0]),b=add(mates[0]),c=add(mates[1]),snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(s,{savedAt:'birth-comparison-model'}))),before=snap();
const same=birthComparisonModels(s,[a.id,b.id]);assert.equal(same.groups.length,1);assert.deepEqual(same.groups[0].children,[a.id,b.id]);assert.deepEqual(same.groups[0].parents.map(v=>v.id),[p.id,mates[0].id]);assert.equal(birthComparisonModels(s,[a.id,c.id]).groups.length,2,'different actual parent records cannot be merged into an invented family');assert.deepEqual(birthComparisonModels(s,[99999999]).missing,[99999999]);assert.equal(snap(),before,'comparison reads cannot alter any canonical state');
const frozen=JSON.stringify(same.groups[0].parents);p.genes.motion+=.1;assert.equal(JSON.stringify(birthComparisonModels(s,[a.id]).groups[0].parents),frozen,'conception observations stay fixed after living parent changes');const r=s.lineage.records.get(a.id);r.parentPhenotypes[1]=null;const partial=birthComparisonModels(s,[a.id]);assert.deepEqual(partial.incomplete,[a.id]);delete r.parentBodyPlans;assert.deepEqual(birthComparisonModels(s,[a.id]).missing,[a.id]);console.log('Birth comparison model PASS: actual conception groups, immutable records, no fabricated missing parents and complete snapshot parity.');
