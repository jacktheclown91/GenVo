import {terrainTravel} from '../world/topography.js';
import {inclineGrip} from './terrain-cover-physiology.js';
import {paddleFactors,landSpeedFactor,partEffectFactors} from './part-abilities.js';
import {hasAdaptation} from './evolution.js';
import {swimsByBody,aquaticMovement} from './aquatic.js';

// Traversal rules for major lifestyle adaptations. Kept separate from movement
// authority so simulation, family guidance, and rendering can ask the same questions.
// v1.61.0: two webbed legs also swim (the part's promise), for wild creatures and families alike.
export function canSwim(animal){return !!(animal?.alive!==false&&(hasAdaptation(animal,'webbed-limbs')||animal?.ecoLifestyle?.id==='aquatic'||swimsByBody(animal)))}

export function isWater(world,x,y){return !!world?.water?.[world.idx(x,y)]}

export function canOccupy(animal,world,x,y){
  if(!world||!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(!world.isPlayable(x,y))return false;
  return !isWater(world,x,y)||canSwim(animal);
}

export function canReach(animal,world,x,y){
  if(!animal||!world||!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(!world.isPlayable(x,y))return false;
  if(canSwim(animal))return true;
  return world.sameLand(animal.x,animal.y,x,y);
}

export function movementProfile(animal,world,{fromX=animal?.x,fromY=animal?.y,toX=fromX,toY=fromY,sprint=false}={}){
  const swimming=isWater(world,fromX,fromY)||isWater(world,toX,toY),swimmer=canSwim(animal);
  if(swimming&&!swimmer)return{allowed:false,swimming:true,swimmer:false,speed:0,energy:1,sprint:1};
  const pad=paddleFactors(animal);
  const aq=aquaticMovement(animal);
  if(!swimming){const terrain=terrainTravel(world,fromX,fromY,toX,toY),grip=inclineGrip(animal,terrain.grade);return{allowed:true,swimming:false,swimmer,speed:landSpeedFactor(animal)*aq.land*terrain.speed*grip.speed,energy:terrain.energy*grip.energy,sprint:sprint?1.55:1,grade:terrain.grade,grip:grip.grip};}
  const pf=partEffectFactors(animal);
  return{allowed:true,swimming:true,swimmer:true,speed:.66*(pad?pad.swimSpeed:1)*(pf?.swimSpeed??1)*aq.swimSpeed,energy:1.48*(pad?pad.swimEnergy:1)*(pf?.swimEnergy??1)*aq.swimEnergy,sprint:sprint?1.16:1};
}
