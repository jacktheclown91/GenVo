import {World} from '../world/world.js';
import {regionKey,planetRegionOrigin,PLANET_REGION_SIZE} from '../world/planet-regions.js';
import {restorePresentationWorld} from '../persistence/save-manager.js';

// Presentation of the eight regions around the active planetary region, so a
// creature near a border sees the real neighbouring ground instead of a void.
// Each neighbour is drawn by a terrain-only Renderer bound to an independent
// copy of that region's actual World: a resident archived region's saved
// World, or the deterministic generated World of a region nobody has entered
// yet (its genuine initial state). Nothing here is
// installed into or written back to any simulation, and no creatures,
// plants-as-food or hidden information are created: neighbouring wildlife is
// not drawn, and fog only reveals cells within the creature's actual view.
export const BORDER_TERRAIN=Object.freeze({chunk:4,stepBudgetMs:3,refreshDays:4,reach:48});
const DIRECTIONS=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];

export class BorderTerrain{
 constructor(RendererClass){this.RendererClass=RendererClass;this.views=new Map();this.pending=null;this.work=null;this.sim=null}
 reset(){this.views.clear();this.pending=null;this.work=null;this.sim=null}
 // Neighbour origins with their offsets (in cells) from the active region.
 neighbours(sim){
  const here=planetRegionOrigin(sim.world.regionOrigin),out=[];
  for(const [dx,dy] of DIRECTIONS){
   let origin;try{origin=planetRegionOrigin({x:here.x+dx*PLANET_REGION_SIZE,y:here.y+dy*PLANET_REGION_SIZE});
    // The finite projection has no terrain beyond its edge.
    for(const x of [origin.x,origin.x+PLANET_REGION_SIZE-1])for(const y of [origin.y,origin.y+PLANET_REGION_SIZE-1])sim.world.planet.localToGeo(x,y);
   }catch{continue}
   out.push({key:regionKey(origin),origin,ox:origin.x-here.x,oy:origin.y-here.y});
  }
  return out;
 }
 // Where the real World for a neighbour comes from right now, and a stamp
 // that changes when that source should be redrawn.
 source(sim,n){
  const session=sim.planetaryTravel?.sessions?.find(s=>s.key===n.key);
  if(session){const day=session.snapshot.core.day;return{kind:'resident',stamp:'resident|'+Math.floor(day/BORDER_TERRAIN.refreshDays),build:()=>restorePresentationWorld(sim.seed,session.snapshot.world,session.snapshot.schema)}}
  if(sim.planetaryTravel?.unloaded?.some(e=>e.key===n.key))return null;
  return{kind:'generated',stamp:'generated',build:()=>new World(sim.seed,{generator:'planetary/1',planetOrigin:n.origin,planetDescriptor:sim.world.planet.descriptor,frontierRules:sim.regionalFrontierRules})};
 }
 // At most one World build per call; call from idle time.
 prepareNext(sim){
  if(!sim?.world?.planet)return false;
  if(this.sim!==sim){this.reset();this.sim=sim}
  // Only regions the player is close enough to see across, nearest first.
  const p=sim.player?.(),gap=n=>p?Math.hypot(Math.max(n.ox-p.x,0,p.x-(n.ox+sim.world.n)),Math.max(n.oy-p.y,0,p.y-(n.oy+sim.world.n))):Infinity;
  const wanted=this.neighbours(sim).map(n=>({...n,gap:gap(n)})).filter(n=>n.gap<=BORDER_TERRAIN.reach).sort((a,b)=>a.gap-b.gap),keys=new Set(wanted.map(n=>n.key));
  for(const key of [...this.views.keys()])if(!keys.has(key))this.views.delete(key);
  for(const n of wanted){
   const src=this.source(sim,n);if(!src)continue;
   const cached=this.views.get(n.key);if(cached?.stamp===src.stamp&&cached.world)continue;
   const world=src.build();
   const view=this.createView(sim,n,world,src);
   if(!view)return false;
   this.views.set(n.key,view);
   return true;
  }
  return false;
 }
 // A detached terrain renderer owns no resize listener or viewport surface.
 createView(sim,n,world,src,terrainState=null){
  const facade={world,seed:sim.seed,day:sim.day,seasonIndex:sim.seasonIndex,get season(){return sim.season},climate:sim.climate,tickCount:sim.tickCount,planetaryTravel:null,animals:[],player:()=>null,
   dispersal:{genomeAt:()=>null,litter:new Float32Array(world.len)},history:null};
  const canvas=typeof document!=='undefined'?document.createElement('canvas'):null;
  if(!canvas)return null;
  const renderer=new this.RendererClass(canvas,facade,{terrainOnly:true});
  if(terrainState){Object.assign(renderer,terrainState);renderer.sceneShown=true;renderer.motionSim=facade}
  else renderer.prepareTerrainOnly();
  return{...n,world,renderer,stamp:src.stamp,kind:src.kind};
 }
 // Rebase the existing neighbouring scene around a newly active region.
 // The departed view comes from its actual canonical archive, never a second
 // biological Simulation or a regenerated replacement of visited ecology.
 rebase(previous,next,terrainState){
  const neighbours=this.neighbours(next),wanted=new Map(neighbours.map(n=>[n.key,n]));
  const sourceKey=regionKey(previous.world.regionOrigin),source=wanted.get(sourceKey);
  const session=next.planetaryTravel?.sessions?.find(s=>s.key===sourceKey);
  if(!source||!session)return false;
  const world=restorePresentationWorld(next.seed,session.snapshot.world,session.snapshot.schema);
  const departing=this.createView(next,source,world,{kind:'resident',stamp:'resident|'+Math.floor(session.snapshot.core.day/BORDER_TERRAIN.refreshDays)},terrainState);
  if(!departing)return false;
  const rebased=new Map();
  if(this.sim===previous)for(const [key,view] of this.views){const n=wanted.get(key);if(n&&key!==sourceKey){Object.assign(view,n);rebased.set(key,view)}}
  rebased.set(sourceKey,departing);
  this.views=rebased;this.work=null;this.pending=null;this.sim=next;
  return true;
 }
 // The real World owning an absolute active-region cell outside the region.
 cellWorld(x,y){
  for(const v of this.views.values()){const lx=x-v.ox,ly=y-v.oy;if(lx>=0&&ly>=0&&lx<v.world.n&&ly<v.world.n)return{view:v,lx,ly}}
  return null;
 }
 // Draw neighbour ground (or its vegetation layer) for the visible window.
 draw(main,tile,startX,startY,cols,rows,vegetation=false){
  if(this.sim!==main.sim)return;
  const size=BORDER_TERRAIN.chunk,c=main.ctx,started=performance.now();
  for(const v of this.views.values()){
   const x0=Math.max(startX-1,v.ox),x1=Math.min(startX+cols+1,v.ox+v.world.n-1),y0=Math.max(startY-1,v.oy),y1=Math.min(startY+rows+1,v.oy+v.world.n-1);
   if(x0>x1||y0>y1)continue;
   for(let cy=Math.floor((y0-v.oy)/size);cy<=Math.floor((y1-v.oy)/size);cy++)for(let cx=Math.floor((x0-v.ox)/size);cx<=Math.floor((x1-v.ox)/size);cx++){
    const px=Math.round((v.ox+cx*size-main.camera.x)*tile+main.w/2),py=Math.round((v.oy+cy*size-main.camera.y)*tile+main.h/2);
    const entry=v.renderer.terrainChunkCache.get(`${cx},${cy},${size}`);
    if(entry){c.drawImage(vegetation?entry.vegetation:entry.canvas,px,py,size*tile,size*tile);continue}
    if(vegetation)continue;
    // Bounded native chunk construction; a land/water placeholder meanwhile.
    if(!this.work&&performance.now()-started<BORDER_TERRAIN.stepBudgetMs)this.work={view:v,job:v.renderer.createTerrainChunkWork(cx,cy,size,v.renderer.terrainChunkSignature(cx,cy,size))};
    const own=v.renderer.ctx;v.renderer.ctx=c;try{v.renderer.drawPendingTerrainChunk(cx,cy,size,tile,px,py)}finally{v.renderer.ctx=own}
   }
  }
  if(this.work&&!vegetation){const {view,job}=this.work;if(!job||!this.views.has(view.key)||view.renderer.stepTerrainChunkWork(job,BORDER_TERRAIN.stepBudgetMs,64))this.work=null}
 }
}
