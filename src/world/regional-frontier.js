// Physical bounds for newly created planetary worlds. Absent policy retains
// historical collision margins. A boundary point remains source-owned until
// canonical travel transfers the same planetary position to its neighbour.
export const REGIONAL_FRONTIER=Object.freeze({policy:'regional-frontier/1'});
export const physicalFrontier=world=>world?.frontierRules===REGIONAL_FRONTIER.policy;
export const continuousSoloFrontier=sim=>physicalFrontier(sim?.world)&&!sim.travelFamilyGroup;
export function frontierDistance(world,direction,a){
 const inset=physicalFrontier(world)?0:1.5,n=world.n;
 return direction==='west'?a.x-inset:direction==='east'?n-inset-a.x:direction==='north'?a.y-inset:n-inset-a.y;
}
export function frontierStep(world,fromX,fromY,toX,toY){
 if(!physicalFrontier(world))return{x:toX,y:toY};
 const n=world.n,dx=toX-fromX,dy=toY-fromY;
 let t=1;
 if(dx>0&&toX>n)t=Math.min(t,(n-fromX)/dx);else if(dx<0&&toX<0)t=Math.min(t,-fromX/dx);
 if(dy>0&&toY>n)t=Math.min(t,(n-fromY)/dy);else if(dy<0&&toY<0)t=Math.min(t,-fromY/dy);
 // Clamp roundoff at the line, never a partial-width leap or projection.
 return{x:Math.max(0,Math.min(n,fromX+dx*t)),y:Math.max(0,Math.min(n,fromY+dy*t))};
}
export function validateFrontierRules(rule,world){
 if(rule!==undefined&&rule!==REGIONAL_FRONTIER.policy)throw Error('Unknown regional frontier policy.');
 if(world.frontierRules!==undefined&&world.frontierRules!==REGIONAL_FRONTIER.policy)throw Error('Unknown world frontier policy.');
 if(rule!==world.frontierRules||rule&&world.generator!=='planetary/1')throw Error('Regional frontier fields disagree with their recorded policy.');
}

// At a corner choose the pressed outward edge among equally close lines.
// Canonical availability reads the actual control target set by paid movement.
export function nearestFrontier(world,a,input=a?.target||{}){
 const wanted={west:input.left||input.dx<0,east:input.right||input.dx>0,north:input.up||input.dy<0,south:input.down||input.dy>0};
 return ['west','east','north','south'].map(name=>({name,distance:frontierDistance(world,name,a)})).sort((x,y)=>x.distance-y.distance||Number(!!wanted[y.name])-Number(!!wanted[x.name]))[0];
}
