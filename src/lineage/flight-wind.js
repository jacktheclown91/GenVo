// One observation of the existing planetary atmosphere, shared by player,
// autonomous movement and presentation. No RNG, resources or second clock.
import {planetaryWindAt} from '../world/weather-fronts.js';

export const FLIGHT_WIND=Object.freeze({policy:'directional-flight-wind/1',speedGain:.22,headCost:.30,crossCost:.08,tailSaving:.08});
export function validateFlightWindPolicy(world,environment){
 const policy=environment?.flightWindPolicy;
 if(policy!==undefined&&(policy!==FLIGHT_WIND.policy||world.generator!=='planetary/1'||environment.schema!==6))
  throw Error('Invalid planetary flight-wind policy.');
}
export function flightWindAt(world,x,y){
 if(world?.environment?.flightWindPolicy!==FLIGHT_WIND.policy||world.generator!=='planetary/1')return null;
 if(!Number.isFinite(x)||!Number.isFinite(y)||!world.isPlayable(x,y))return null;
 const day=world.soilWater?.day??world.environment.day??0;
 return planetaryWindAt(world,day,world.idx(x,y));
}
export function flightWindFactors(animal,world,{fromX=animal?.x,fromY=animal?.y,toX=fromX,toY=fromY}={}){
 const neutral={speed:1,energy:1,along:0,cross:0,wind:null};
 if(!animal?.airborne)return neutral;
 const wind=flightWindAt(world,fromX,fromY);
 if(!wind)return neutral;
 const dx=toX-fromX,dy=toY-fromY,length=Math.hypot(dx,dy);
 if(!Number.isFinite(length)||length<1e-9)return{...neutral,wind};
 const ux=dx/length,uy=dy/length,along=wind.east*ux+wind.south*uy,
  cross=Math.abs(wind.east*uy-wind.south*ux),bounded=Math.max(-1.5,Math.min(1.5,along));
 return{speed:1+FLIGHT_WIND.speedGain*bounded,
  energy:1+FLIGHT_WIND.headCost*Math.max(0,-bounded)+FLIGHT_WIND.crossCost*Math.min(1.5,cross)-FLIGHT_WIND.tailSaving*Math.max(0,bounded),
  along,cross,wind};
}
export function flightWindReading(animal,world){
 const wind=flightWindAt(world,animal?.x,animal?.y);
 if(!wind)return null;
 const directions=['E','SE','S','SW','W','NW','N','NE'];
 const direction=directions[((Math.round(Math.atan2(wind.south,wind.east)/(Math.PI/4))%8)+8)%8];
 return{...wind,direction,label:`Wind toward ${direction}`,description:`Wind toward ${direction}. Flying into it slows travel and costs more food energy; follow it for faster travel.`};
}
