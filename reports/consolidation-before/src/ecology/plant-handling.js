import {PARTS} from '../lineage/part-registry.js';
import {mouthOf} from './functional-diet.js';
// Provisional effort units, separate from diet eligibility and finite tissue accounting.
export const PLANT_HANDLING=Object.freeze({energyPerCoat:16,crushFactor:.25,peckFactor:.5});
export function plantHandling(animal,receipt){const coat=Math.max(0,receipt?.coat||0),capabilities=PARTS[mouthOf(animal)]?.actionCapabilities||[],factor=capabilities.includes('crush')?PLANT_HANDLING.crushFactor:capabilities.includes('peck')?PLANT_HANDLING.peckFactor:1,energyCost=coat*PLANT_HANDLING.energyPerCoat*factor;return{energyCost,resistant:coat>1e-8,specialized:factor<1,factor,enabled:energyCost<=1e-9||Math.max(0,animal?.energy||0)+1e-9>=energyCost,reason:energyCost>0?`Working through the seed coat costs ${energyCost.toFixed(2)} energy${factor<1?' with this specialized mouth':''}.`:''}}
