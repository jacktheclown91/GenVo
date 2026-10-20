import {CAVES} from '../world/cave-policy.js';
export function drawSubsurface(renderer,tile){
 const w=renderer.sim.world,s=w.subsurface;if(!s)return;const c=renderer.ctx,below=!!renderer.sim.player()?.underground;
 if(below){c.fillStyle='#111513';c.fillRect(0,0,renderer.w,renderer.h)}
 for(const p of s.passages.values()){
  if(!below&&!p.entry)continue;const x=p.i%w.n,y=p.i/w.n|0,px=(x-renderer.camera.x)*tile+renderer.w/2,py=(y-renderer.camera.y)*tile+renderer.h/2;
  if(px<-tile||py<-tile||px>renderer.w||py>renderer.h)continue;
  const natural=p.origin===CAVES.policy,u=tile/32;
  if(below){
   c.fillStyle=p.closed?'#30332d':natural?'#515c50':'#66513a';c.fillRect(px,py,tile,tile);
   for(let k=0;k<5;k++){const n=(Math.imul(p.i+1,7919+k*137)>>>0);c.fillStyle=k%2?'#ffffff0b':'#090e1640';c.fillRect(px+(n%26+2)*u,py+((n>>>8)%26+2)*u,(2+k%3)*u,u)}
   if(!p.closed)for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const q=s.passages.get((y+dy)*w.n+x+dx);if(q&&!q.closed&&Math.abs(q.floor-p.floor)<=.6)continue;c.fillStyle=natural?'#929783':'#9b8057';c.fillRect(px+(dx>0?28:0)*u,py+(dy>0?28:0)*u,(dx?4:32)*u,(dy?4:32)*u);c.fillStyle='#141b1955';c.fillRect(px+(dx>0?25:dx<0?4:0)*u,py+(dy>0?25:dy<0?4:0)*u,(dx?3:32)*u,(dy?3:32)*u)}
   if(w.water[p.i]){c.fillStyle='#255568aa';c.fillRect(px+2,py+2,tile-4,tile-4)}
  }
  if(p.entry&&!p.closed){c.fillStyle=natural?'#8b917f':'#9e8057';c.fillRect(px+7*u,py+11*u,18*u,9*u);c.fillRect(px+10*u,py+9*u,12*u,13*u);c.fillStyle='#131810';c.fillRect(px+9*u,py+12*u,14*u,7*u);c.fillRect(px+12*u,py+11*u,8*u,9*u);c.fillStyle='#b5baa0';c.fillRect(px+10*u,py+10*u,5*u,2*u);c.fillStyle='#eadfb9';c.font='11px sans-serif';c.textAlign='center';c.fillText(below?'EXIT':natural?'CAVE':'BURROW',px+tile/2,py+tile*.2)}
 }
 if(below){c.fillStyle='#d4ddc6';c.font='bold 14px sans-serif';c.textAlign='left';c.fillText('UNDERGROUND · follow connected passages · use an opening to surface',14,renderer.h-150)}
}
