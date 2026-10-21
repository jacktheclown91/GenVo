import {creatureView,viewCanSee} from '../ecology/atmospheric-visibility.js';
import {rememberedCells,sensoryMemoryCellSize,sensorySignals} from '../ecology/sensory-world.js';

function drawSignals(renderer,signals,tile){
 const c=renderer.ctx,x=renderer.w/2,y=renderer.h/2;
 c.save();c.textAlign='center';c.textBaseline='middle';c.font='12px sans-serif';
 for(const s of signals){
  // A consistent near-player bearing, never the exact source coordinate.
  const d=tile*2.45,px=x+Math.cos(s.angle)*d,py=y+Math.sin(s.angle)*d;
  const radius=Math.max(11,tile*(.24+s.uncertainty*.2));
  c.strokeStyle=s.kind==='heard'?'rgba(171,205,235,.66)':'rgba(216,192,115,.60)';
  c.lineWidth=2;c.beginPath();c.arc(px,py,radius,s.angle-.6-s.uncertainty,s.angle+.6+s.uncertainty);c.stroke();
  c.fillStyle=s.kind==='heard'?'#b7d9ef':'#e2cc91';
  c.fillText(s.kind==='heard'?'♪':'≈',px,py);
 }
 c.restore();
}
export function drawSensoryFog(renderer,{tile,cols,rows,startX,startY}){
 const sim=renderer.sim,animal=sim.player?.();
 if(!animal||sim.sensoryFogEnabled===false||typeof document==='undefined')return false;
 const view=creatureView(sim,animal),memory=rememberedCells(sim,animal),now=renderer.renderNow||performance.now();
 const w=renderer.w,h=renderer.h,pad=Math.ceil(tile*3);
 const last=renderer.sensoryFogCache;
 const stale=!last||last.sim!==sim||last.world!==sim.world||last.id!==animal.id||
  last.w!==w||last.h!==h||last.tile!==tile||last.dir!==animal.dir||last.day!==sim.day||
  now-last.time>240||Math.hypot(last.x-animal.x,last.y-animal.y)>.35||
  Math.hypot(last.cameraX-renderer.camera.x,last.cameraY-renderer.camera.y)>2;
 if(stale){
  const canvas=last?.canvas&&last.w===w&&last.h===h&&last.tile===tile?last.canvas:document.createElement('canvas');
  canvas.width=w+pad*2;canvas.height=h+pad*2;
  const c=canvas.getContext('2d');if(!c)return false;
  c.imageSmoothingEnabled=false;
  c.fillStyle='#09130ef4';c.fillRect(0,0,canvas.width,canvas.height);
  const left=startX-3,top=startY-3,right=startX+cols+3,bottom=startY+rows+3;
  const world=sim.world;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
   if(x<0||y<0||x>=world.n||y>=world.n)continue;
   const px=Math.floor((x-renderer.camera.x)*tile+w/2+pad),py=Math.floor((y-renderer.camera.y)*tile+h/2+pad);
   if(viewCanSee(view,x+.5,y+.5)){
    c.clearRect(px-1,py-1,Math.ceil(tile)+2,Math.ceil(tile)+2);
   }else{
    const remembered=memory.get(Math.floor(x/sensoryMemoryCellSize)+','+Math.floor(y/sensoryMemoryCellSize));
    if(remembered){
      // Solid remembered terrain class, never live hidden plants/creatures.
      const wet=remembered[2]===1;
      c.fillStyle=wet?'#1c353b':'#26362b';
      c.fillRect(px,py,Math.ceil(tile)+1,Math.ceil(tile)+1);
      c.fillStyle=wet?'#2d4b52':'#334736';
      if((x+y)%3===0)c.fillRect(px+tile*.4,py+tile*.6,Math.max(1,tile*.12),Math.max(1,tile*.08));
    }
   }
  }
  renderer.sensoryFogCache={sim,world:sim.world,id:animal.id,canvas,w,h,tile,pad,dir:animal.dir,day:sim.day,time:now,
   x:animal.x,y:animal.y,cameraX:renderer.camera.x,cameraY:renderer.camera.y,signals:sensorySignals(sim,animal)};
 }
 const cache=renderer.sensoryFogCache,c=renderer.ctx;
 const dx=Math.round((cache.cameraX-renderer.camera.x)*tile)-cache.pad;
 const dy=Math.round((cache.cameraY-renderer.camera.y)*tile)-cache.pad;
 c.drawImage(cache.canvas,dx,dy);
 drawSignals(renderer,cache.signals||[],tile);
 return true;
}
