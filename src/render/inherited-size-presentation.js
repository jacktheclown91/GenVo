import {adultSizeScale} from '../organisms/body-size.js';

// Renderer-only presentation scale. The existing phenotype renderer already
// applies developmental growth to torso, limb and sensory proportions; applying
// currentScale here would count that growth a second time. This factor supplies
// only the missing inherited adult-size component, without reading or writing
// biological state. Legacy animals without inherited size always return 1.
export function inheritedVisualScale(animal){return adultSizeScale(animal)}

// The world renderer calls gaitTravelFor with limb length multiplied by the
// same inherited scale that is shown on the canvas, so contact footfalls do not
// cycle three times as fast for a giant body moving the same world distance.
export function inheritedGaitLength(limbScale,animal){return limbScale*inheritedVisualScale(animal)}
// Draw offscreen-centered giant silhouettes until their visible edges leave the
// view. Reference/legacy bodies retain the old two-tile culling margin.
// A normal 44-pixel sprite is about 1.375 world tiles in radius.
export function inheritedViewMargin(animal){return Math.max(2,1.4*inheritedVisualScale(animal))}
