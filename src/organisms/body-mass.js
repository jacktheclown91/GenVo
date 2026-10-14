import {SPECIES} from './species.js';
import {developmentFor} from '../family/family.js';

// One developmental volume for rendering growth, tissue and physical costs.
// This does not alter genes, anatomy, speed, reserves or reproduction settings.
export function bodyMass(animal){
  return (SPECIES[animal?.species]?.mass||0)*developmentFor(animal).growth**3;
}
export function bodyMassFraction(animal){
  const adult=SPECIES[animal?.species]?.mass;
  return adult?bodyMass(animal)/adult:1;
}

// Draft structural assessment shares the mass module boundary; live bodyMass is
// unchanged until coefficients and legacy migration receive creator approval.
export {tissueInventory,evaluateTissueStructure,TISSUE_PARTS,TISSUE_SCHEMA} from './tissue-structure.js';
