import {PLANTS} from '../sim/config.js';
import {SOIL_WATER} from '../ecology/soil-water.js';
import {snowCover,snowFraction} from '../world/snowpack.js';
import {localTemperature} from '../world/environment.js';
import {seasonalMarkAnchor} from './seasonal-ground-art.js';
import {pixel,pixelLine} from './pixel-art.js';
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=(lo,hi,v)=>{const t=clamp((v-lo)/(hi-lo));return t*t*(3-2*t)};
export function groundMoistureReading(world,i,{climate=null}={}){
 if(!world?.water||world.water[i])return null;
 const moisture=world.moisture?.[i];if(!Number.isFinite(moisture))return null;
 const capacity=world.soilWater?.fieldCapacity?.[i],available=Number.isFinite(capacity)&&capacity>SOIL_WATER.wiltingPoint?clamp((moisture-SOIL_WATER.wiltingPoint)/(capacity-SOIL_WATER.wiltingPoint)):clamp(moisture);
 let biomass=0,foliage=0;for(const [kind,values] of Object.entries(world.plants||{})){const amount=Math.max(0,values?.[i]||0);biomass+=amount;if(PLANTS[kind]?.render!=='fungus')foliage+=amount}
 const cover=clamp(biomass*1.5),snow=snowCover(world,i),surfaceWetness=clamp((world.environment?.overland?.[i]||0)/.02),temperature=Number.isFinite(climate?.temp)?localTemperature(world,climate,i):world.temperature?.[i];
 // Biomass is not a solid occlusion mask. The plant layer itself hides soil;
 // real dry ground can remain visible between standing stems.
 return{available,cover,greenCover:clamp(foliage*1.5),snow,surfaceWetness,temperature,exposure:(1-smooth(.08,.45,available))*(1-cover*.65)*(1-snow)*(1-surfaceWetness),retentive:Number.isFinite(capacity)&&capacity>.46};
}
export function conditionSeasonalGround(profile,reading){
 if(!reading)return{...profile,shoots:0,frost:0};
 return{...profile,shoots:profile.shoots*reading.greenCover*smooth(.03,.40,reading.available)*(1-reading.snow),frost:profile.frost*(Number.isFinite(reading.temperature)?snowFraction(reading.temperature):0)};
}
export function drawParchedGround(ctx,{world,reading,px,py,u,x,y}){
 if(!reading||reading.exposure<.2)return false;
 const e=reading.exposure,cold=Number.isFinite(reading.temperature)&&reading.temperature<.3,shade=cold?'rgba(63,66,60,.28)':'rgba(78,56,36,.30)',light=cold?'rgba(157,160,139,.25)':'rgba(192,157,105,.28)',count=e>.65?3:e>.4?2:1;
 ctx.save();try{ctx.globalAlpha*=e;
  for(let q=0;q<count;q++){
   const a=seasonalMarkAnchor(world,x,y,q,6103),sx=Math.max(4,Math.min(11,a.x)),sy=Math.max(4,Math.min(11,a.y)),sign=a.variant%2?1:-1;
   if(reading.retentive){
    const p=(dx,dy)=>{const v=a.variant%4,xx=v===0?dx:v===1?-dy:v===2?-dx:dy,yy=v===0?dy:v===1?dx:v===2?-dy:-dx;return{x:px/u+sx+xx,y:py/u+sy+yy}},line=(a,b)=>pixelLine(ctx,a.x,a.y,b.x,b.y,u,shade,.5);
    line(p(0,0),p(sign*2,1));line(p(sign*2,1),p(sign,3));const edge=p(sign*2,.5);pixel(ctx,edge.x,edge.y,.5,.5,u,light);
    if(e>.55)line(p(sign*2,1),p(sign*3.5,.5));
   }else{
    pixel(ctx,px/u+sx,py/u+sy,1.5,.5,u,light);pixel(ctx,px/u+sx+sign*1.5,py/u+sy+1,.5,.5,u,shade);if(e>.5)pixel(ctx,px/u+sx-sign,py/u+sy+2,1,.5,u,light);
   }
  }
 }finally{ctx.restore()}return true;
}
