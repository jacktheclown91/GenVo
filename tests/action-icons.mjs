import assert from 'node:assert/strict';
import {actionIconPart,appendActionIcon} from '../src/ui/action-icons.js';
const a={bodyPlan:{nodes:[{partId:'walking-leg'},{partId:'simple-eye'},{partId:'tearing-jaw'}]}};
assert.equal(actionIconPart(a,'Observe'),'simple-eye');assert.equal(actionIconPart(a,'Attack'),'tearing-jaw');assert.equal(actionIconPart(a,'Pounce'),null,'no invented spring anatomy');assert.equal(actionIconPart(a,'Hold Brace'),'walking-leg','baseline stance depicts an actual support limb');assert.equal(actionIconPart({bodyPlan:{nodes:[]}},'Attack'),null);
const before=JSON.stringify(a);a.species='unlisted-emergent-organism';assert.equal(actionIconPart(a,'Attack'),'tearing-jaw');delete a.species;assert.equal(JSON.stringify(a),before,'icon selection does not mutate the animal');console.log('Actual anatomy icon sources, absent-part fallback, species independence and read-only selection PASS');

assert.doesNotThrow(()=>appendActionIcon({prepend(){throw Error('Unloaded artwork must not create a fallback icon')}},a,'Attack'),'unloaded native catalog keeps the action text without magnifying procedural scraps');
