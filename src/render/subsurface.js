export function drawSubsurface(renderer,tile){
 const w=renderer.sim.world,s=w.subsurface;if(!s)return;const c=renderer.ctx,below=!!renderer.sim.player()?.underground;
 if(below){c.fillStyle='#100e0c';c.fillRect(0,0,renderer.w,renderer.h)}
 for(const p of s.passages.values()){
  if(!below&&!p.entry)continue;const x=p.i%w.n,y=p.i/w.n|0,px=(x-renderer.camera.x)*tile+renderer.w/2,py=(y-renderer.camera.y)*tile+renderer.h/2;
  if(px<-tile||py<-tile||px>renderer.w||py>renderer.h)continue;
  if(below){c.fillStyle=p.closed?'#342c22':'#66513a';c.fillRect(px+1,py+1,tile-2,tile-2);c.strokeStyle='#9b8057';c.lineWidth=2;c.strokeRect(px+3,py+3,tile-6,tile-6);if(w.water[p.i]){c.fillStyle='#255568aa';c.fillRect(px+2,py+2,tile-4,tile-4)}}
  if(p.entry&&!p.closed){c.fillStyle='#1b1510';c.beginPath();c.ellipse(px+tile/2,py+tile/2,tile*.25,tile*.16,0,0,Math.PI*2);c.fill();c.strokeStyle='#c1a46d';c.lineWidth=2;c.stroke();c.fillStyle='#ead5a2';c.font='11px sans-serif';c.textAlign='center';c.fillText(below?'EXIT':'BURROW',px+tile/2,py+tile*.2)}
 }
 if(below){c.fillStyle='#e0cda2';c.font='bold 14px sans-serif';c.textAlign='left';c.fillText('UNDERGROUND · move to excavate · return to an entrance to exit',14,renderer.h-150)}
}
