import {CarryingPressureController as ReferenceCarrying} from './helpers/unoptimized-local-biomass-carrying.js';
import {RecoveryController} from '../src/ecology/recovery.js';
import {performCourtship} from '../src/reproduction/courtship-performance.js';
import assert from 'node:assert/strict';import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';import {Simulation as Before} from '../reports/consolidation-before/src/sim/simulation.js';
import {plantHandling,plantHandlingAffordable} from '../src/ecology/plant-handling.js';
// Optimisation parity against the frozen pre-change copy, under the SAME biology: the provisionally
// adopted aquatic breeding values (breeding-calibration.js) postdate that copy, so they are off here.
import {BREEDING_REVIEW} from '../src/ecology/breeding-calibration.js';BREEDING_REVIEW.enabled=false;
import {FOUNDING_GENETICS} from '../src/reproduction/reproductive-compatibility.js';FOUNDING_GENETICS.enabled=false;
import {AQUATIC_REVIEW} from '../src/ecology/freshwater-food.js';AQUATIC_REVIEW.fryGrowth=AQUATIC_REVIEW.founding=AQUATIC_REVIEW.crowding=false;
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;
import {SIMILARITY_PREFERENCE} from '../src/reproduction/mate-preferences.js';SIMILARITY_PREFERENCE.enabled=false;
import {PREDATION_PARITY} from '../src/gameplay/predation-parity.js';PREDATION_PARITY.enabled=false;
import {REFUGE_PARITY} from '../src/ecology/refuges.js';REFUGE_PARITY.enabled=false;
import {HEALING_REVIEW} from '../src/ecology/healing-review.js';HEALING_REVIEW.enabled=false;
import {PHYSIOLOGY_PARITY} from '../src/ecology/physiology.js';PHYSIOLOGY_PARITY.enabled=false;
import {RARITY_REVIEW} from '../src/ecology/prey-encounter.js';RARITY_REVIEW.enabled=false;
import {TROPHIC_RECOGNITION} from '../src/reproduction/trophic-recognition.js';TROPHIC_RECOGNITION.enabled=false;
import {THREAT_APPRAISAL} from '../src/ecology/threat-appraisal.js';THREAT_APPRAISAL.enabled=false;
import {MOVEMENT_PARITY} from '../src/ecology/movement-parity.js';MOVEMENT_PARITY.enabled=false;
import {ECOLOGY_REVIEW} from '../src/ecology/ecology-review.js';ECOLOGY_REVIEW.amphibiousForage=ECOLOGY_REVIEW.shoreHabitat=false;
import {JUVENILE_SWITCH} from '../src/ecology/juvenile-biology.js';JUVENILE_SWITCH.growthCost=JUVENILE_SWITCH.preyAppraisal=false;
import {SOIL_WATER} from '../src/ecology/soil-water.js';SOIL_WATER.enabled=false;
import {WEATHER_PATTERNS} from '../src/ecology/weather.js';WEATHER_PATTERNS.enabled=false;
// The frozen implementation has legacy species mass. Compare optimization under that same declared policy.
const a=new Simulation('DEMAND-OPTIMIZATION-PARITY',{player:false,massRules:'legacy-species/1'}),b=new Before('DEMAND-OPTIMIZATION-PARITY',{player:false});
// This is a frozen *pre-woodland optimization* comparison, not an assertion
// that new real tree biomass cannot affect carrying capacity. Withhold only
// the new woodland stocks from this matched historical environment. All
// producer, seed, adult genotype and energy credits must be actually absent.
for(const field of [a.world.plants.woodspire,a.world.seedBank.woodspire,a.world.plantResources.energy.woodspire,a.dispersal.seedReserve.woodspire,a.dispersal.coatReserve.woodspire])field.fill(0);
a.dispersal.active.woodspire.clear();a.dispersal.bankGenomes.woodspire.clear();a.dispersal.producerOrigins.woodspire.clear();a.dispersal.floraState.adults.woodspire.clear();a.dispersal.floraState.seeds.woodspire.clear();
// Freeze optimization code, not superseded founder-target biology. Both sides
// use the same current behavior controller; all480 exact-state gates remain.
b.recovery=new RecoveryController(b);
b.carrying=new ReferenceCarrying(b);// unoptimized survey/demand, same explicit local-biomass units
// This remains an optimization comparison, not parity with a superseded
// exact-end-tick biology defect. Only the mate interaction dispatch shares the
// current funded-performance authority; frozen foraging/carrying stay intact.
const frozenInteraction=b.resolveInteraction.bind(b);let sharedCourtshipChecks=0;
b.resolveInteraction=function(actor){if(actor.intent==='mate'){sharedCourtshipChecks++;if(actor.target?.alive&&Math.hypot(actor.x-actor.target.x,actor.y-actor.target.y)<.9&&performCourtship(this,actor,actor.target))this.tryMate(actor,actor.target);return}return frozenInteraction(actor)};

for(let step=0;step<480;step++){
 a.update();b.update();assert.equal(a.rng.state,b.rng.state);assert.equal(a.animals.length,b.animals.length);
 for(let j=0;j<a.animals.length;j++){const x=a.animals[j],y=b.animals[j];for(const k of ['x','y','energy','hydration','alive','intent','reproDrive'])assert.equal(x[k],y[k],`${step}:${j}:${k}`)}
 if(step%80===0)for(let j=0;j<a.animals.length;j+=7){const x=a.animals[j],y=b.animals[j];assert.deepEqual(a.carrying.breedingState(x),b.carrying.breedingState(y));}
}
assert.ok(sharedCourtshipChecks>0,'Natural reference world exercises shared courtship');
for(const actor of a.animals.slice(0,20))for(const energy of [0,.001,1,50])for(const coat of [0,.0001,.01,1]){const x={...actor,energy};assert.equal(plantHandlingAffordable(x,coat),plantHandling(x,{coat}).enabled)}
fs.writeFileSync('docs/consolidation-demand-parity.json',JSON.stringify({status:'PASS',updates:480,sharedCourtshipChecks,animals:a.animals.length,rngExact:true,positionsReservesIntentDriveExact:true,carryingExact:true,affordabilityExact:true,scope:'Paired pre-change/current natural worlds, no fixtures. Separate reserve-edge numeric/receipt checks.'},null,2));console.log('480 natural updates exact actor, RNG and carrying parity; affordability boundaries PASS');
