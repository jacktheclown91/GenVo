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
