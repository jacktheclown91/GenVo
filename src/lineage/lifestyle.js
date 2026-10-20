import {undergroundPosition,undergroundReach} from './burrowing.js';
import {submerged,waterColumn,DIVING} from './diving.js';
import {terrainTravel} from '../world/topography.js';
import {snowFooting} from '../world/snowpack.js';
import {inclineGrip,aridFooting} from './terrain-cover-physiology.js';
import {paddleFactors,landSpeedFactor,partEffectFactors} from './part-abilities.js';
import {hasAdaptation} from './evolution.js';
import {swimsByBody,aquaticMovement} from './aquatic.js';
import {flightWindFactors} from './flight-wind.js';
import {wetSegment} from '../world/water-route.js';

// Traversal rules for major lifestyle adaptations. Kept separate from movement
// authority so simulation, family guidance, and rendering can ask the same questions.
// v1.61.0: two webbed legs also swim (the part's promise), for wild creatures and families alike.
export function canSwim(animal){return !!(animal?.alive!==false&&(hasAdaptation(animal,'webbed-limbs')||animal?.ecoLifestyle?.id==='aquatic'||swimsByBody(animal)))}

export function isWater(world,x,y){return !!world?.water?.[world.idx(x,y)]}

export function canOccupy(animal,world,x,y){
  if(!world||!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(!world.isPlayable(x,y))return false;
  if(animal?.underground)return undergroundPosition(world,animal,x,y);
  if(submerged(animal))return !!world.water[world.idx(x,y)]&&waterColumn(world,x,y)+1e-6>=animal.diveDepth+DIVING.clearance;
  if(animal?.perched)return Math.floor(animal.x)===Math.floor(x)&&Math.floor(animal.y)===Math.floor(y);
  return !!animal?.airborne||!isWater(world,x,y)||canSwim(animal);
}

export function canReach(animal,world,x,y){
  if(!animal||!world||!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(!world.isPlayable(x,y))return false;
  if(animal?.underground)return undergroundReach(world,animal,x,y);
  if(submerged(animal))return canOccupy(animal,world,x,y)&&wetSegment(world,animal.x,animal.y,x,y);
  if(animal.perched)return Math.floor(animal.x)===Math.floor(x)&&Math.floor(animal.y)===Math.floor(y);
  if(animal.airborne||canSwim(animal))return true;
  return world.sameLand(animal.x,animal.y,x,y);
}

export function movementProfile(animal,world,{fromX=animal?.x,fromY=animal?.y,toX=fromX,toY=fromY,sprint=false}={}){
  if(animal?.underground||animal?.burrowWork)return{allowed:false,swimming:false,speed:0,energy:1,sprint:1};
  if(animal?.perched)return{allowed:false,perched:true,swimming:false,speed:0,energy:0,sprint:1};
  if(animal?.aerialMode==='jump')return{allowed:true,jumping:true,flying:false,swimming:false,swimmer:canSwim(animal),speed:0,energy:0,sprint:1,grade:0,grip:0,authority:'ballistic-jumping/1'};
  if(animal?.aerialMode==='glide')return{allowed:true,gliding:true,flying:false,swimming:false,swimmer:canSwim(animal),speed:0,energy:0,sprint:1,grade:0,grip:0,authority:'finite-height-gliding/1'};
  if(animal?.airborne){const wind=flightWindFactors(animal,world,{fromX,fromY,toX,toY});return{allowed:true,flying:true,swimming:false,swimmer:canSwim(animal),speed:1.48*wind.speed,energy:1.85*wind.energy,sprint:1.12,grade:0,grip:0};}
  const swimming=isWater(world,fromX,fromY)||isWater(world,toX,toY),swimmer=canSwim(animal);
  if(swimming&&!swimmer)return{allowed:false,swimming:true,swimmer:false,speed:0,energy:1,sprint:1};
  const pad=paddleFactors(animal);
  const aq=aquaticMovement(animal);
  if(!swimming){const terrain=terrainTravel(world,fromX,fromY,toX,toY),grip=inclineGrip(animal,terrain.grade);
    const footing=aridFooting(animal,world.moisture[world.idx(toX,toY)]),snow=snowFooting(animal,world,toX,toY);
    return{allowed:true,swimming:false,swimmer,speed:landSpeedFactor(animal)*aq.land*terrain.speed*grip.speed*footing.speed*snow.speed,energy:terrain.energy*grip.energy*footing.energy*snow.energy,sprint:sprint?1.55:1,grade:terrain.grade,grip:grip.grip};}
  const pf=partEffectFactors(animal),underwater=submerged(animal);
  return{allowed:true,swimming:true,swimmer:true,speed:(underwater?.9:1)*.66*(pad?pad.swimSpeed:1)*(pf?.swimSpeed??1)*aq.swimSpeed,energy:(underwater?1.2:1)*1.48*(pad?pad.swimEnergy:1)*(pf?.swimEnergy??1)*aq.swimEnergy,sprint:sprint?1.16:1};
}
