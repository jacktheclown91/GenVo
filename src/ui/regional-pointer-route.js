import {continuousSoloFrontier} from '../world/regional-frontier.js';
import {PLANET_REGION_SIZE,regionKey} from '../world/planet-regions.js';
import {canPlanPlanetaryPassage} from '../world/planetary-travel.js';
import {canOccupy} from '../lineage/lifestyle.js';
import {creatureView,viewReachesBeyond} from '../ecology/atmospheric-visibility.js';
const originAt=(x,y)=>({x:Math.floor(x/PLANET_REGION_SIZE)*PLANET_REGION_SIZE,y:Math.floor(y/PLANET_REGION_SIZE)*PLANET_REGION_SIZE});
export function regionalGroundTarget(sim,renderer,x,y){
 const observer=sim.player(),border=renderer.borderTerrain;
 if(!observer?.alive||!sim.world.planet||border?.sim!==sim||!viewReachesBeyond(creatureView(sim,observer,8,{beyond:(px,py)=>border.cellWorld(px,py)}),x,y))return null;
 const cell=border.cellWorld(x,y);if(!cell)return null;
 const localX=Math.floor(cell.lx)+.5,localY=Math.floor(cell.ly)+.5,origin=cell.view.world.regionOrigin;
 return{kind:'regional-ground',label:'Neighbouring ground',seed:sim.seed,x:cell.view.ox+localX,y:cell.view.oy+localY,planetX:origin.x+localX,planetY:origin.y+localY};
}
// Mouse intent retains a real planetary coordinate across canonical owner
// changes. This is a route planner, never a physics or ecology controller.
export function regionalPointerPlan(sim,goal,{getRegionWorld,route}){
 const a=sim.player(),here=sim.world.regionOrigin;
 if(!a?.alive||!sim.world.planet||goal?.seed!==sim.seed||!Number.isFinite(goal.planetX)||!Number.isFinite(goal.planetY))return null;
 const destination=originAt(goal.planetX,goal.planetY),dx=destination.x-here.x,dy=destination.y-here.y,local={x:goal.planetX-destination.x,y:goal.planetY-destination.y};
 if(!dx&&!dy){const path=route(local);return path?{path,goal,step:null}:null}
 if(Math.max(Math.abs(dx),Math.abs(dy))>PLANET_REGION_SIZE)return null;
 const finalWorld=getRegionWorld(destination);if(!finalWorld||regionKey(finalWorld.regionOrigin)!==regionKey(destination)||!canOccupy({...a,...local},finalWorld,local.x,local.y))return null;
 const direction=dx<0?'west':dx>0?'east':dy<0?'north':'south',next={x:here.x+(dx?Math.sign(dx)*PLANET_REGION_SIZE:0),y:here.y+(!dx?Math.sign(dy)*PLANET_REGION_SIZE:0)},world=getRegionWorld(next);
 if(!world||regionKey(world.regionOrigin)!==regionKey(next))return null;
 const n=sim.world.n,coordinate=Math.max(3.5,Math.min(n-3.5,dx?goal.planetY-here.y:goal.planetX-here.x));
 for(const offset of [0,-1,1,-2,2]){
  const c=Math.max(3.5,Math.min(n-3.5,coordinate+offset)),frontier={x:dx?(dx>0?n-(continuousSoloFrontier(sim)?0:2.5):(continuousSoloFrontier(sim)?0:2.5)):c,y:dx?c:(dy>0?n-(continuousSoloFrontier(sim)?0:2.5):(continuousSoloFrontier(sim)?0:2.5))};
  if(!canPlanPlanetaryPassage(sim,direction,frontier.x,frontier.y,world))continue;
  const path=route(frontier);if(path)return{path,goal,step:{direction,frontier,to:regionKey(next)}};
 }
 return null;
}
export const regionalControls=direction=>({up:direction==='north',down:direction==='south',left:direction==='west',right:direction==='east'});
