import {CAVES} from '../world/cave-policy.js';
import {caveArtwork,openPassage} from './cave-surface.js';
import {caveRoofSupport} from '../world/cave-roof.js';

function opening(c,px,py,tile,p,natural,below){
 // Real mapped entrance with broken geological rim and falloff, not a
 // square room doorway or a painted CAVE/EXIT label.
 const u=tile/32,x=px+tile/2,y=py+tile/2;
 const hash=(v)=>Math.imul(p.i+v*113,2246822519)>>>0;
 c.save();
 c.translate(x,y);
 c.fillStyle=natural?'#4c5b50':'#65513b';
 c.beginPath();
 for(let k=0;k<12;k++){
  const a=k/12*Math.PI*2,depth=10+(hash(k)%6);
  k?c.lineTo(Math.cos(a)*depth*u,Math.sin(a)*depth*u):c.moveTo(Math.cos(a)*depth*u,Math.sin(a)*depth*u);
 }
 c.closePath();c.fill();
 c.fillStyle='#0c1516';
 c.beginPath();
 for(let k=0;k<12;k++){
  const a=k/12*Math.PI*2,depth=7+(hash(k+16)%4);
  k?c.lineTo(Math.cos(a)*depth*u,Math.sin(a)*depth*u):c.moveTo(Math.cos(a)*depth*u,Math.sin(a)*depth*u);
 }
 c.closePath();c.fill();
 c.strokeStyle=below?'#aeb79a':'#84947a';c.lineWidth=Math.max(1,u*1.1);
 c.beginPath();c.arc(-2*u,-2*u,8*u,Math.PI*1.10,Math.PI*1.72);c.stroke();
 // This highlight describes a skylight from an actually recorded opening.
 if(below){c.fillStyle='#d2cba144';c.beginPath();c.ellipse(0,-4*u,7*u,3*u,0,0,Math.PI*2);c.fill()}
 c.restore();
}
export function drawSubsurface(renderer,tile){
 const w=renderer.sim.world,s=w.subsurface;
 if(!s)return;
 const c=renderer.ctx,below=!!renderer.sim.player()?.underground;
 const camera=renderer.camera,cols=Math.ceil(renderer.w/tile)+2,rows=Math.ceil(renderer.h/tile)+2;
 const startX=Math.max(0,Math.floor(camera.x-cols/2)),startY=Math.max(0,Math.floor(camera.y-rows/2));
 const endX=Math.min(w.n,Math.ceil(camera.x+cols/2)),endY=Math.min(w.n,Math.ceil(camera.y+rows/2));
 if(below){c.fillStyle='#121a19';c.fillRect(0,0,renderer.w,renderer.h)}
 // Geographic viewport lookup avoids iterating all underground cells every
 // frame in a mature planet. Passage connectivity and artwork share the
 // actual saved subsurface, never an invented floor-plan.
 for(let y=startY;y<endY;y++)for(let x=startX;x<endX;x++){
  const p=openPassage(w,x,y);if(!p||!below&&!p.entry)continue;
  const px=Math.round((x-camera.x)*tile+renderer.w/2),py=Math.round((y-camera.y)*tile+renderer.h/2);
  const natural=p.origin===CAVES.policy;
  if(below){
   const art=caveArtwork(renderer,p);
   if(art){c.imageSmoothingEnabled=false;c.drawImage(art,px,py,tile,tile)}
   const support=caveRoofSupport(w,p);
   if(support&&!support.legacy&&support.utilization>.65){
    // Live structural stress uses the simulation's query, not an art-only
    // danger roll. Fog still hides stress the creature cannot observe.
    c.strokeStyle=support.unstable?'#d6a075':'#a99c7d';c.lineWidth=Math.max(1,tile/40);
    c.beginPath();c.moveTo(px+tile*.22,py+tile*.14);c.lineTo(px+tile*.46,py+tile*.4);c.lineTo(px+tile*.39,py+tile*.64);c.lineTo(px+tile*.65,py+tile*.85);c.moveTo(px+tile*.46,py+tile*.4);c.lineTo(px+tile*.72,py+tile*.3);c.stroke();
    const observer=renderer.sim.player();
    if(w.idx(observer.x,observer.y)===p.i){c.save();c.font='11px sans-serif';c.textAlign='center';c.fillStyle='#241c17dd';c.fillRect(px+tile/2-63,py-22,126,18);c.fillStyle='#e2bf92';c.fillText('Roof under strain',px+tile/2,py-9);c.restore()}
   }
   if(p.entry)opening(c,px,py,tile,p,natural,true);
  }else if(p.entry)opening(c,px,py,tile,p,natural,false);
 }
 if(below){
  c.fillStyle='#c0cdbb';c.font='12px sans-serif';c.textAlign='left';
  c.fillText('UNDERGROUND · follow natural openings to return to the surface',14,renderer.h-150);
 }
}
