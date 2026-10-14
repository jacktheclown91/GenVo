import path from 'node:path';
import {pathToFileURL} from 'node:url';
import '../src/sim/simulation.js';
import {CarryingPressureController} from '../src/ecology/carrying.js';
import {loadCarryingDemandCandidate} from './carrying-demand-candidate.mjs';

// Apply only to this diagnostic process. The production files and canonical
// suite's separate process retain their exact validated source.
const Candidate=await loadCarryingDemandCandidate(path.resolve('src'));
const original=CarryingPressureController.prototype.breedingState;
CarryingPressureController.prototype.breedingState=Candidate.prototype.breedingState;
try{
  for(const file of ['carrying.mjs','freshwater-bank-capacity.mjs','freshwater-competition-demand.mjs','freshwater-hunter-capacity.mjs','save-persistence.mjs']){
    await import(pathToFileURL(path.resolve('tests',file)).href);
  }
}finally{CarryingPressureController.prototype.breedingState=original}
console.log('per-survey demand reuse candidate existing regression checks: PASS (production unchanged)');
