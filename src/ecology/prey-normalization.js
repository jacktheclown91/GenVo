import {preyPreference} from './functional-diet.js';
import {remainingPreyBiomass} from './prey-biomass.js';
import {FRESHWATER_FOOD} from './freshwater-food.js';
// One existing carcass/detritus nutritional unit. This is a unit conversion,
// not a reference animal, a supplied resource or an assertion of SI kilograms.
export function preyNormalization(){return{energyPerUnit:FRESHWATER_FOOD.detritus.nutrition,source:'local-edible-biomass/1'}}
// Potential nutritional carcass-equivalent units, before capture probability.
// Diet efficiency weights food energy here; this is not a material-mass ledger. Already eaten tissue,
// inaccessible animals and distant populations cannot become local supply.
export function localPreyOpportunity(sim,hunter,radius){let foodUnits=0,animals=0;const r2=radius*radius;
 sim.forEachNearby(hunter,radius,prey=>{if(prey===hunter||!prey.alive)return;const dx=prey.x-hunter.x,dy=prey.y-hunter.y;if(dx*dx+dy*dy>r2||!sim.canReach(hunter,prey.x,prey.y))return;const preference=preyPreference(hunter,prey);if(!(preference>0))return;const edible=remainingPreyBiomass(prey)*preference;if(edible>0){foodUnits+=edible;animals++}});
 return{foodUnits,energy:foodUnits*FRESHWATER_FOOD.detritus.nutrition,animals};
}
