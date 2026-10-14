// Surface evidence of real movement and feeding. No actor locations are inferred.
export function drawWorldTraces(renderer,tile){
 const sim=renderer.sim,a=sim.player(),c=renderer.ctx;if(!a)return;const traces=sim.discovery.visibleTraces(a).sort((p,q)=>q.tick-p.tick).slice(0,96);
 for(const t of traces){if(t.type==='seed'&&sim.discovery.seedObservations?.some(o=>o.id===t.id))continue;const x=renderer.w/2+(t.x-renderer.camera.x)*tile,y=renderer.h/2+(t.y-renderer.camera.y)*tile;if(x<0||y<0||x>renderer.w||y>renderer.h)continue;
  const age=sim.tickCount-t.tick,fade=1-age/sim.discovery.traceLifetime(t),scale=renderer.zoom;c.save();c.translate(x,y);c.rotate((t.dir&7)*Math.PI/4);c.globalAlpha=(t.ownerId===a.id&&t.type!=='seed'?.28:.72)*fade;
  c.strokeStyle=t.medium==='water'?'#9bc4bb':'#bfa576';c.fillStyle=t.medium==='water'?'#aecbc1':'#493a24';c.lineWidth=Math.max(1,scale*.6);
  if(t.type==='seed'){c.fillStyle='#d3bc74';for(const [dx,dy] of [[-2,1],[1,-1],[2,2]]){c.beginPath();c.ellipse(dx*scale,dy*scale,scale*.65,scale,0,0,Math.PI*2);c.fill()}}
  else if(t.type==='feed'){c.beginPath();c.moveTo(-2*scale,2*scale);c.lineTo(0,-2*scale);c.lineTo(2*scale,scale);c.stroke();c.fillStyle='#b5bd7b';c.fillRect(-scale,-scale,scale,scale)}
  else if(t.medium==='water'){c.beginPath();c.ellipse(0,0,3*scale,scale,0,0,Math.PI*1.6);c.stroke()}
  else if(t.limbs){const size=Math.max(1,Math.min(2.5,Math.sqrt(t.mass)*.45))*scale;for(const side of [-1,1]){c.beginPath();c.ellipse(side*1.6*scale,side*scale,size*.55,size,0,0,Math.PI*2);c.fill();c.stroke()}}
  else{c.beginPath();c.moveTo(0,2*scale);c.quadraticCurveTo(scale,0,0,-2*scale);c.stroke()}
  c.restore();
 }
 // Remembered locations remain after surface marks fade, within current sensory reach.
 for(const o of sim.discovery.visibleSeedPatches(a)){const x=renderer.w/2+(o.x-renderer.camera.x)*tile,y=renderer.h/2+(o.y-renderer.camera.y)*tile;if(x<0||y<0||x>renderer.w||y>renderer.h)continue;const u=renderer.zoom;c.save();c.translate(x,y);c.lineWidth=Math.max(1,u*.6);c.strokeStyle=o.status==='established'?'#a5ce80':'#d3bc74';c.beginPath();c.arc(0,0,3*u,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(0,2*u);c.lineTo(0,-2*u);c.lineTo(-2*u,-3*u);c.moveTo(0,-1*u);c.lineTo(2*u,-2*u);c.stroke();c.restore();}

}
