import {PARTS} from '../lineage/part-registry.js';
import {mouthOf} from './functional-diet.js';
// Provisional effort units, separate from diet eligibility and finite tissue accounting.
export const PLANT_HANDLING=Object.freeze({energyPerCoat:16,crushFactor:.25,peckFactor:.5});
function handlingFactor(animal){const capabilities=PARTS[mouthOf(animal)]?.actionCapabilities||[];return capabilities.includes('crush')?PLANT_HANDLING.crushFactor:capabilities.includes('peck')?PLANT_HANDLING.peckFactor:1}
const effort=(coat,factor)=>Math.max(0,coat||0)*PLANT_HANDLING.energyPerCoat*factor;
const affordable=(animal,cost)=>cost<=1e-9||Math.max(0,animal?.energy||0)+1e-9>=cost;
export function plantHandling(animal,receipt){const coat=Math.max(0,receipt?.coat||0),factor=handlingFactor(animal),energyCost=effort(coat,factor);return{energyCost,resistant:coat>1e-8,specialized:factor<1,factor,enabled:affordable(animal,energyCost),reason:energyCost>0?`Working through the seed coat costs ${energyCost.toFixed(2)} energy${factor<1?' with this specialized mouth':''}.`:''}}
// Same canonical effort and reserve check, without allocating explanation strings.
export function plantHandlingCostAffordable(animal,cost){return affordable(animal,cost)}
export function plantHandlingEnergyCost(animal,coat){return effort(coat,handlingFactor(animal))}
export function plantHandlingAffordable(animal,coat){const amount=Math.max(0,coat||0);return amount===0||affordable(animal,plantHandlingEnergyCost(animal,amount))}
