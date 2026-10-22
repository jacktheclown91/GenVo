// Read-side views of actual canonical resident populations. No actors are
// spawned, cloned into a Simulation, stepped or written back by this module.
import {CFG} from '../sim/config.js';
import {World} from './world.js';
import {regionKey} from './planet-regions.js';
import {canSwim} from '../lineage/lifestyle.js';
import {creatureView,viewReachesBeyond,atmosphereAt,visuallyObservable} from '../ecology/atmospheric-visibility.js';
import {VISIBILITY} from '../ecology/atmospheric-visibility.js';
const facades=new WeakMap();
function facadeFor(sim,snapshot){
 let facade=facades.get(snapshot);if(facade)return facade;
 const state=snapshot.world,world=Object.assign(Object.create(World.prototype),state,{n:sim.world.n,len:sim.world.len,water:state.surfaceWater.mask,seed:sim.seed,seedHash:sim.world.seedHash,planet:sim.world.planet});
 facade={...snapshot.core,seed:sim.seed,world,animals:snapshot.animals,player:()=>null,canSwim,get season(){return CFG.seasons[this.seasonIndex]}};
 facades.set(snapshot,facade);return facade;
}
export function regionalFaunaOwners(sim,border){
 if(!sim?.world?.planet||border?.sim!==sim)return[];
 const here=sim.world.regionOrigin,owners=[];
 for(const session of sim.planetaryTravel?.sessions||[]){
  const snapshot=session.snapshot,core=snapshot?.core,origin=snapshot?.world?.regionOrigin;
  if(session.biologicalMode!=='canonical-ticks/1'||session.parked||!origin||!core||!Number.isSafeInteger(core.tickCount)||core.tickCount<0||core.tickCount>sim.tickCount||sim.tickCount-core.tickCount>CFG.lifeStride)continue;
  const view=border.views.get(session.key);
  if(!view||session.key!==regionKey(origin)||Math.max(Math.abs(origin.x-here.x),Math.abs(origin.y-here.y))!==sim.world.n)continue;
  owners.push({session,snapshot,view,facade:facadeFor(sim,snapshot),ox:origin.x-here.x,oy:origin.y-here.y});
 }
 return owners;
}
export function regionalCreatureVisible(sim,owner,actor,preparedView=null){
 const observer=sim.player();if(!observer?.alive||observer.underground||(observer.diveDepth||0)>.03||!actor?.alive||actor.underground||(actor.diveDepth||0)>.03)return false;
 const x=actor.x+owner.ox,y=actor.y+owner.oy,view=preparedView||creatureView(sim,observer,8,{beyond:(px,py)=>{const lx=px-owner.ox,ly=py-owner.oy;return owner.view?.world&&lx>=0&&ly>=0&&lx<owner.view.world.n&&ly<owner.view.world.n?{view:owner.view,lx,ly}:null}});
 if(!viewReachesBeyond(view,x,y))return false;
 // Sample each side's actual physical atmosphere. Never clamp a remote ray
 // onto the active world's last tile or borrow its water/underground optics.
 if(sim.visibilityRules===VISIBILITY.policy){
  const distance=Math.hypot(x-observer.x,y-observer.y),steps=Math.min(8,Math.max(1,Math.ceil(distance/4)));let depth=0;
  for(let k=0;k<steps;k++){
   const t=(k+.5)/steps,px=observer.x+(x-observer.x)*t,py=observer.y+(y-observer.y)*t,n=sim.world.n;
   if(px>=0&&py>=0&&px<n&&py<n)depth+=atmosphereAt(sim,px,py).extinction*distance/steps;
   else if(px>=owner.ox&&py>=owner.oy&&px<owner.ox+n&&py<owner.oy+n)depth+=atmosphereAt(owner.facade,px-owner.ox,py-owner.oy).extinction*distance/steps;
   else return false;
  }
  if(distance>view.range*Math.exp(-depth))return false;
 }
 return true;
}
export function visibleRegionalFauna(sim,border){
 const owners=regionalFaunaOwners(sim,border);if(!owners.length)return[];
 const result=[],ids=new Set(sim.animals.map(a=>a.id)),view=creatureView(sim,sim.player(),8,{beyond:(x,y)=>border?.cellWorld?.(x,y)});
 for(const owner of owners)for(const actor of owner.snapshot.animals){
  if(ids.has(actor.id)||actor.player||!regionalCreatureVisible(sim,owner,actor,view))continue;
  ids.add(actor.id);result.push({actor,owner,x:actor.x+owner.ox,y:actor.y+owner.oy});
 }
 return result;
}
export function resolveRegionalCreature(sim,border,target){
 if(target?.kind!=='regional-creature'||target.seed!==sim.seed||!Number.isSafeInteger(target.id))return null;
 const local=sim.animals.find(a=>a.id===target.id&&a.alive);
 if(local){if(local.id===sim.playerId||!visuallyObservable(sim,sim.player(),local))return null;return{actor:local,local:true,x:local.x,y:local.y,planetX:sim.world.regionOrigin.x+local.x,planetY:sim.world.regionOrigin.y+local.y}}
 for(const owner of regionalFaunaOwners(sim,border)){
  const actor=owner.snapshot.animals.find(a=>a.id===target.id);
  if(actor&&regionalCreatureVisible(sim,owner,actor))return{actor,owner,local:false,x:actor.x+owner.ox,y:actor.y+owner.oy,planetX:owner.snapshot.world.regionOrigin.x+actor.x,planetY:owner.snapshot.world.regionOrigin.y+actor.y};
 }
 return null;
}
export function regionalCreatureAt(sim,renderer,x,y){
 let selected=null,distance=24;
 for(const [id,at] of renderer.regionalScreenPos||[]){const d=Math.hypot(at.x-x,at.y-y);if(d>=distance)continue;
  const target={kind:'regional-creature',seed:sim.seed,id},live=resolveRegionalCreature(sim,renderer.borderTerrain,target);if(!live||live.local)continue;
  distance=d;selected={...target,label:'Neighbouring creature',x:live.x,y:live.y,planetX:live.planetX,planetY:live.planetY};
 }
 return selected;
}
