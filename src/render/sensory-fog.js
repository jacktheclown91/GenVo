import {creatureView,viewCanSee,viewReachesBeyond} from '../ecology/atmospheric-visibility.js';
import {rememberedCells,sensoryMemoryCellSize,sensorySignals} from '../ecology/sensory-world.js';
import {VIEW_MODES,viewMode} from './view-modes.js';

// Sensory fog (presentation). Which cells the creature sees, remembers or has
// never perceived comes from the shared perception authority on the same
// schedule as before. Viewing modes (view-modes.js) only choose how dark each
// state is drawn; live layers are separately clipped to the seen cells, so a
// lighter fog never exposes organisms, carrion, dens, sites or tracks.
// Edges are soft: one mask pixel per cell, scaled up with smoothing, and each
// cell's darkness eases over time (quick to reveal, slower to fade on turning).
const SEEN=2,REMEMBERED=1,UNKNOWN=0,MARGIN=6,REVEAL_RATE=12,HIDE_RATE=3.2;

function drawSignals(renderer,signals,tile){
 const c=renderer.ctx,x=renderer.w/2,y=renderer.h/2;
 c.save();c.textAlign='center';c.textBaseline='middle';c.font='12px sans-serif';
 for(const s of signals){
  // A consistent near-player bearing, never the exact source coordinate.
  const d=tile*2.45,px=x+Math.cos(s.angle)*d,py=y+Math.sin(s.angle)*d;
  const radius=Math.max(11,tile*(.24+s.uncertainty*.2));
  c.strokeStyle=s.kind==='heard'?'rgba(171,205,235,.66)':s.kind==='vibration'?'rgba(164,208,180,.72)':'rgba(216,192,115,.60)';
  c.lineWidth=2;c.beginPath();c.arc(px,py,radius,s.angle-.6-s.uncertainty,s.angle+.6+s.uncertainty);c.stroke();
  c.fillStyle=s.kind==='heard'?'#b7d9ef':s.kind==='vibration'?'#a4d0b4':'#e2cc91';
  c.fillText(s.kind==='heard'?'♪':s.kind==='vibration'?'∿':'≈',px,py);
  c.font='10px sans-serif';
  c.fillText(s.kind==='heard'?'sound':s.kind==='vibration'?'ground':'scent',px,py+radius+10);
  c.font='12px sans-serif';
 }
 c.restore();
}
function active(renderer){const sim=renderer.sim,animal=sim.player?.();return animal&&sim.sensoryFogEnabled===true&&typeof document!=='undefined'?animal:null}
// Per-cell perception for the window around the camera, rebuilt on the
// previous cadence (time, movement, facing, day, layer, depth, border views).
function perception(renderer,{cols,rows,startX,startY}){
 const sim=renderer.sim,animal=sim.player(),now=renderer.renderNow||performance.now(),last=renderer.sensoryFogCache;
 const stale=!last||last.sim!==sim||last.world!==sim.world||last.id!==animal.id||last.dir!==animal.dir||last.day!==sim.day||
  last.underground!==!!animal.underground||last.subsurfaceRevision!==(sim.world.subsurface?.revision||0)||
  last.depthBucket!==Math.floor((animal.diveDepth||0)*4)||last.borderViews!==(renderer.borderTerrain?.views.size||0)||
  now-last.time>240||Math.hypot(last.x-animal.x,last.y-animal.y)>.35||
  startX<last.left||startY<last.top||startX+cols>last.left+last.cols||startY+rows>last.top+last.rows;
 if(!stale)return last;
 const view=creatureView(sim,animal,8,{beyond:(x,y)=>renderer.borderTerrain?.cellWorld(x,y)}),memory=rememberedCells(sim,animal),world=sim.world;
 const left=startX-MARGIN,top=startY-MARGIN,w=cols+MARGIN*2,h=rows+MARGIN*2,state=new Uint8Array(w*h),runs=[];
 for(let j=0;j<h;j++){let run=-1;const y=top+j;
  for(let i=0;i<w;i++){const x=left+i;let s=UNKNOWN;
   if(x<0||y<0||x>=world.n||y>=world.n){if(renderer.borderTerrain?.cellWorld(x,y)&&viewReachesBeyond(view,x+.5,y+.5))s=SEEN}
   else if(viewCanSee(view,x+.5,y+.5))s=SEEN;
   else if(memory.get(Math.floor(x/sensoryMemoryCellSize)+','+Math.floor(y/sensoryMemoryCellSize)))s=REMEMBERED;
   state[j*w+i]=s;
   if(s===SEEN&&run<0)run=x;if(s!==SEEN&&run>=0){runs.push([run,y,x-run]);run=-1}}
  if(run>=0)runs.push([run,y,left+w-run])}
 return renderer.sensoryFogCache={sim,world:sim.world,id:animal.id,dir:animal.dir,day:sim.day,time:now,x:animal.x,y:animal.y,
  underground:!!animal.underground,subsurfaceRevision:sim.world.subsurface?.revision||0,depthBucket:Math.floor((animal.diveDepth||0)*4),
  borderViews:renderer.borderTerrain?.views.size||0,left,top,cols:w,rows:h,state,runs,signals:sensorySignals(sim,animal)};
}
// Called at the start of each frame so clipping uses this frame's perception.
export function prepareSensoryFog(renderer,args){if(active(renderer))perception(renderer,args)}
// Clip the canvas to the cells the creature currently sees. Returns false (and
// changes nothing) when there is no fog. Pair with ctx.restore().
export function clipToSensed(renderer,tile,{vegetation=false}={}){
 const animal=active(renderer),cache=renderer.sensoryFogCache;
 if(!animal||!cache||cache.sim!==renderer.sim||cache.id!==animal.id)return false;
 if(vegetation&&!VIEW_MODES[viewMode()].clipVegetation)return false;
 const c=renderer.ctx,cx=renderer.camera.x,cy=renderer.camera.y,hw=renderer.w/2,hh=renderer.h/2;
 c.save();c.beginPath();
 for(const [x,y,n] of cache.runs)c.rect(Math.floor((x-cx)*tile+hw),Math.floor((y-cy)*tile+hh),Math.ceil(n*tile)+1,Math.ceil(tile)+1);
 c.clip();return true;
}
export function drawSensoryFog(renderer,{tile,cols,rows,startX,startY}){
 if(!active(renderer))return false;
 const cache=perception(renderer,{tile,cols,rows,startX,startY}),now=renderer.renderNow||performance.now();
 const dt=Math.max(0,Math.min(.25,(now-(renderer.fogEasedAt??now))/1000));renderer.fogEasedAt=now;
 const levels=VIEW_MODES[viewMode()].fog,prev=renderer.fogAlpha?.world===renderer.sim.world?renderer.fogAlpha.cells:new Map(),cells=new Map();
 const w=cols+2,h=rows+2,ox=startX-1,oy=startY-1;
 let mask=renderer.fogMask;if(!mask||mask.width!==w||mask.height!==h){mask=renderer.fogMask=document.createElement('canvas');mask.width=w;mask.height=h}
 const mc=mask.getContext('2d'),img=mc.createImageData(w,h),d=img.data;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){
  const x=ox+i,y=oy+j,ci=x-cache.left,cj=y-cache.top,s=ci>=0&&cj>=0&&ci<cache.cols&&cj<cache.rows?cache.state[cj*cache.cols+ci]:UNKNOWN;
  const target=levels[s],key=x+','+y,was=prev.get(key);let a=was===undefined?target:was;
  a+=(target-a)*(1-Math.exp(-dt*(target<a?REVEAL_RATE:HIDE_RATE)));if(Math.abs(target-a)<.004)a=target;
  cells.set(key,a);const k=(j*w+i)*4;d[k]=9;d[k+1]=19;d[k+2]=14;d[k+3]=Math.round(a*255);
 }
 renderer.fogAlpha={world:renderer.sim.world,cells};mc.putImageData(img,0,0);
 const c=renderer.ctx,smooth=c.imageSmoothingEnabled;c.imageSmoothingEnabled=true;
 // Mask pixel centres land on cell centres; a margin cell hides the scaled edge.
 c.drawImage(mask,(ox-renderer.camera.x)*tile+renderer.w/2,(oy-renderer.camera.y)*tile+renderer.h/2,w*tile,h*tile);
 c.imageSmoothingEnabled=smooth;
 drawSignals(renderer,cache.signals||[],tile);
 return true;
}
