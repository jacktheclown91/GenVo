import {planPartCounts} from './part-abilities.js';
import {wetSegment} from '../world/water-route.js';

// Aquatic bodies (v1.61.0, creator direction 2026-10-10: "a purely aquatic stalker or hopper should
// be able to evolve"). Built only from parts that already exist, so it emerges through ordinary
// mutation and selection, never by script. Each step towards water pays off on its own, with a cost,
// so selection can climb the path one part at a time:
//  - webbed legs: two of them swim; the more legs webbed, the higher the aquatic score;
//  - a paddle tail and gill slits each add to the score;
//  - the score sets how fast and cheaply the body swims, how much food a filter or grazing mouth
//    finds in open water, and (rising steeply) how slow it is on land;
//  - a water dweller (score 1: every leg webbed, a paddle tail and gills) lives in water: it takes
//    its water from where it lives but dries out ashore. Flesh mouths still have to hunt.
export const AQUATIC=Object.freeze({
  swimLegs:2,
  weights:{legs:.4,tail:.25,gills:.35},
  swimSpeed:.35,swimEnergy:.3,landCost:.5,
  // Per life stride: water regained in water and extra water lost ashore (gills only).
  waterRefill:.6,dryRate:2.2,
  // Energy from open water per life stride, as a multiple of base metabolism, at score 1.
  waterFood:{'filter-mouth':1.7,'reed-sieve-mouth':1.35,'grazing-mouth':.9,'nibbler-mouth':.9,'beak-mouth':.6,'sucker-mouth':.6},
  // How far a creature looks for water to return to, flee into, or feed in.
  seek:16,refuge:8,feed:10
});
const legsOf=animal=>(animal?.bodyPlan?.nodes||[]).filter(n=>n.parent==='root'&&n.socket?.startsWith('limb.'));
export function webbedLegCount(animal){return legsOf(animal).filter(n=>n.partId==='webbed-leg').length}
export function swimsByBody(animal){return webbedLegCount(animal)>=AQUATIC.swimLegs}
export function aquaticScore(animal){
  const legs=legsOf(animal);if(!legs.length)return 0;const c=planPartCounts(animal),W=AQUATIC.weights;
  return W.legs*webbedLegCount(animal)/legs.length+((c['paddle-tail']||0)>0?W.tail:0)+((c['gill-slits']||0)>0?W.gills:0);
}
export function hasGills(animal){return (planPartCounts(animal)['gill-slits']||0)>0}
// Salt excretion lets gills keep the body watered in seawater (marine-food-web/1).
export function hasSaltGland(animal){return (planPartCounts(animal)['salt-gland']||0)>0}
export function isWaterDweller(animal){return swimsByBody(animal)&&aquaticScore(animal)>=.999}
// Movement multipliers from the aquatic score (applied by lifestyle.movementProfile).
export function aquaticMovement(animal){const s=swimsByBody(animal)?aquaticScore(animal):0;return{swimSpeed:1+AQUATIC.swimSpeed*s,swimEnergy:1-AQUATIC.swimEnergy*s,land:1-AQUATIC.landCost*s*s}}
export function waterFoodRate(animal){
  if(!swimsByBody(animal))return 0;const mouth=(animal.bodyPlan.nodes.find(n=>n.socket==='mouth')||{}).partId;
  return (AQUATIC.waterFood[mouth]||0)*aquaticScore(animal);
}
// The nearest water cell within `radius` (scanned in growing rings), or null.
export function nearestWater(world,x,y,radius=AQUATIC.seek){
  const cx=Math.floor(x),cy=Math.floor(y),n=world.n;
  for(let r=0;r<=radius;r++)for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){
    if(Math.max(Math.abs(ox),Math.abs(oy))!==r)continue;const px=cx+ox,py=cy+oy;if(px<1||py<1||px>=n-1||py>=n-1)continue;
    if(world.water[world.idx(px,py)])return{x:px+.5,y:py+.5};
  }
  return null;
}
// A water cell to roam to, near (x,y), or null.
export function roamWater(world,rng,x,y,radius=6){
  for(let k=0;k<14;k++){const px=x+rng.range(-radius,radius),py=y+rng.range(-radius,radius);if(px<1||py<1||px>=world.n-1||py>=world.n-1)continue;if(wetSegment(world,x,y,px,py))return{x:px,y:py}}
  return null;
}
