import {bodyMass,bodyMassFraction} from '../organisms/body-mass.js';
import {preyPreference} from './functional-diet.js';
import {PARTS} from '../lineage/part-registry.js';
// Unit reference only, never supply. Existing living-prey normalization wins.
// With no living eligible prey, adult mounted anatomy provides a conservative,
// stable mass scale. No species-name lookup, virtual prey, reserve or energy grant.
export function preyNormalization(sim,predator){let living=0;for(const prey of sim.animals){if(!prey.alive||preyPreference(predator,prey)<=0)continue;const fraction=bodyMassFraction(prey),mass=fraction>0?bodyMass(prey)/fraction:0;if(Number.isFinite(mass)&&mass>living)living=mass;}if(living>0)return{mass:living,source:'living-eligible-adult-unit'};let mass=0;for(const node of predator?.bodyPlan?.nodes||[]){const part=PARTS[node.partId];if(part)mass+=part.mass;}return{mass,source:mass>0?'mounted-adult-anatomy':'no-physical-reference'};}
