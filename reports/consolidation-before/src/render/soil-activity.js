import {disturbanceAt} from '../ecology/soil-disturbance.js';

// Live ground marks use the same decaying habitat value as germination.
// Visual only: no RNG, ecology mutation, or additional plant stock.
export function drawDisturbedSoil(ctx,{records,cell,day,x,y,px,py,u}){
 const strength=disturbanceAt(records,cell,day);
 if(strength<=.03)return false;
 const pattern=hash2(x,y),opacity=Math.min(.58,.18+strength*.42);
 ctx.save();
 ctx.fillStyle=`rgba(94,63,39,${opacity.toFixed(3)})`;
 ctx.fillRect(px+(3+pattern%3)*u,py+(8+(pattern>>3)%2)*u,(5+(pattern>>5)%4)*u,3*u);
 ctx.fillRect(px+(7+(pattern>>7)%3)*u,py+(11+(pattern>>9)%2)*u,4*u,u);
 ctx.fillStyle=`rgba(173,128,76,${Math.min(.52,opacity*.85).toFixed(3)})`;
 for(let k=0;k<3;k++){
  const hx=2+((pattern>>k*5)%11),hy=6+((pattern>>k*3)%7);
  ctx.fillRect(px+hx*u,py+hy*u,u,u);
 }
 ctx.restore();
 return true;
}
function hash2(x,y){let h=(Math.imul(x+197,374761393)^Math.imul(y+211,668265263))>>>0;h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0}
