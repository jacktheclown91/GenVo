// Staged only: attach a discovery marker to existing carrion, never create food.
import {DiscoveryController} from '../../src/gameplay/discovery.js';
export class FiniteCarcassDiscoveryCandidate extends DiscoveryController{
 spawnCarcass(p){
  const w=this.sim.world;this.lastCarcassDay=this.sim.day;
  let best=null;
  for(let y=Math.max(2,Math.floor(p.y-22));y<=Math.min(w.n-3,Math.floor(p.y+22));y++)for(let x=Math.max(2,Math.floor(p.x-22));x<=Math.min(w.n-3,Math.floor(p.x+22));x++){
   const i=w.idx(x,y),distance=Math.hypot(x+.5-p.x,y+.5-p.y);
   if(distance>22||w.water[i]||!(w.carrion[i]>=.1)||this.sites.some(s=>s.kind==='carcass'&&!s.gone&&Math.floor(s.x)===x&&Math.floor(s.y)===y))continue;
   if(!best||distance<best.distance)best={x,y,distance};
  }
  if(!best)return false;
  this.sites.push({id:this.nextSiteId++,kind:'carcass',x:best.x+.5,y:best.y+.5,stock:0,day:this.sim.day});return true;
 }
}
