// Decorative seasonal surface marks only. Real plants and finite stocks stay separate.
import {pixel} from './pixel-art.js';
const hash=(seed,x,y,salt)=>{let n=(seed^Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295};
export function seasonalMarkAnchor(world,x,y,q,salt){
 const ax=x+(world.regionOrigin?.x||0),ay=y+(world.regionOrigin?.y||0),seed=world.seedHash||0;
 return{x:1+Math.floor(hash(seed,ax+q*19,ay-q*7,salt)*26)/2,y:1+Math.floor(hash(seed^0x7391,ay+q*13,ax-q*11,salt+3)*26)/2,variant:Math.min(3,Math.floor(hash(seed,ax+q,ay-q,salt+7)*4))};
}
export function drawSeasonalGroundMarks(c,{world,profile:p,px,py,u,x,y}){
 const h=hash(world.seedHash,x,y,4517),paint=(a,dx,dy,w,hh,color)=>pixel(c,px/u+a.x+dx,py/u+a.y+dy,w,hh,u,color);
 const mark=(q,salt)=>seasonalMarkAnchor(world,x,y,q,salt);
 c.save();try{
  if(p.shoots>.20&&h>.57)for(let q=0;q<(p.shoots>.48?2:1);q++){
   const a=mark(q,4523),col='rgba(170,204,103,.28)';
   if(a.variant===0){paint(a,0,0,1,.5,col);paint(a,.5,-.5,.5,.5,col)}
   else if(a.variant===1){paint(a,0,0,.5,1,col);paint(a,1,.5,.5,.5,col)}
   else if(a.variant===2){paint(a,0,0,.5,.5,col);paint(a,1,-.5,.5,1,col)}
   else{paint(a,0,0,1,.5,col);paint(a,-.5,.5,.5,.5,col)}
  }
  if(p.dry>.20&&h<.48)for(let q=0;q<(p.dry>.5?2:1);q++){const a=mark(q,4547);paint(a,0,0,1+(a.variant===3?.5:0),.5,'rgba(194,160,91,.20)');if(a.variant===1)paint(a,.5,-.5,.5,.5,'rgba(194,160,91,.20)')}
  if(p.litter>.16&&h>.43)for(let q=0;q<(p.litter>.42?3:1);q++){const a=mark(q,4561),color=['rgba(163,112,61,.28)','rgba(112,84,48,.24)','rgba(188,143,72,.22)'][q%3];paint(a,0,0,a.variant%2?1:.5,.5,color);if(a.variant===2)paint(a,.5,-.5,.5,.5,color)}
  if(p.frost>.18&&h>.60){const a=mark(0,4573),color='rgba(190,214,202,.18)';paint(a,0,0,p.frost>.42?2:1,.5,color);if(p.frost>.38)paint(a,a.variant%2?.5:1,-.5,.5,.5,color)}
 }finally{c.restore()}
}
