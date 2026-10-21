import {SURFACE_ICE,iceAmount} from '../world/surface-ice.js';
// Derived native 32-grid art. No weather, phase or fracture state is authored here.
export function drawSurfaceIce(renderer,{tile,startX,startY,cols,rows}){
 const w=renderer.sim.world,e=w.environment;if(e?.icePolicy!==SURFACE_ICE.policy)return 0;
 const c=renderer.ctx,q=tile/32;let drawn=0;c.save();
 for(let y=Math.max(0,startY);y<Math.min(w.n,startY+rows);y++)for(let x=Math.max(0,startX);x<Math.min(w.n,startX+cols);x++){
  const i=y*w.n+x,amount=iceAmount(e,i);if(!w.water[i]||amount<=.003)continue;
  const px=Math.round((x-renderer.camera.x)*tile+renderer.w/2),py=Math.round((y-renderer.camera.y)*tile+renderer.h/2),broken=e.iceBroken[i],strong=amount>.08;
  c.globalAlpha=strong?.9:Math.min(.78,.25+amount*4);c.fillStyle=strong?'#c9e2e7':'#9ebfc9';
  if(broken){for(const [bx,by,bw,bh] of [[0,0,32,5],[0,5,5,27],[27,5,5,27],[5,27,22,5]])c.fillRect(px+bx*q,py+by*q,bw*q,bh*q)}else c.fillRect(px,py,tile,tile);
  c.globalAlpha=.65;c.fillStyle='#e0edf0';
  if(!broken){c.fillRect(px+(3+(x*7+y*3)%11)*q,py+5*q,9*q,1*q);c.fillRect(px+18*q,py+23*q,8*q,1*q)}
  // Pale fracture branches remain visible around the exposed dark-water hole.
  if(broken||!strong){c.fillStyle='#507f91';for(const [bx,by,bw,bh] of [[6,8,7,1],[12,9,1,6],[13,14,6,1],[19,15,1,8]]){if(broken&&bx>7&&bx<26&&by>7&&by<26)continue;c.fillRect(px+bx*q,py+by*q,bw*q,bh*q)}}
  drawn++;
 }
 c.restore();return drawn;
}
