// Read-only coaching targets use the same drawn plants, sight and access rules
// as ordinary world interactions. Never mark the player's own body as a resource.
import {CFG} from '../sim/config.js';
import {groundDiet} from '../ecology/functional-diet.js';
import {visuallyObservable} from '../ecology/atmospheric-visibility.js';
import {approachGoal,worldResourceAt} from './world-resource-target.js';
const cache=new WeakMap();
function clickedResource(sim,renderer,x,y){const b=renderer.canvas?.getBoundingClientRect();if(!b)return null;const tile=CFG.tileSize*renderer.zoom,sx=renderer.w/2+(x-renderer.camera.x)*tile,sy=renderer.h/2+(y-renderer.camera.y)*tile;return worldResourceAt(sim,renderer,b.left+sx*b.width/renderer.w,b.top+sy*b.height/renderer.h)}
export function visibleTutorialResource(sim,renderer,actor,kind){
 if(!actor||!renderer?.camera||!renderer.visiblePlantTargets)return null;
 const w=sim.world,key=[actor.id,Math.floor(actor.x),Math.floor(actor.y),actor.dir,kind,renderer.w,renderer.h,renderer.zoom].join('|'),prior=cache.get(renderer),now=performance.now();
 if(prior?.world===w&&prior.key===key&&now<prior.until){const t=prior.target,tile=CFG.tileSize*renderer.zoom,sx=t?renderer.w/2+(t.x-renderer.camera.x)*tile:0,sy=t?renderer.h/2+(t.y-renderer.camera.y)*tile:0;if(!t||clickedResource(sim,renderer,t.x,t.y)?.kind===t.resource.kind&&visuallyObservable(sim,actor,{x:t.x,y:t.y,underground:!!actor.underground})&&![...(renderer.screenPos?.values()||[])].some(p=>Math.hypot(sx-p.x,sy-p.y)<42))return t;}
 const tile=CFG.tileSize*renderer.zoom,diet=groundDiet(actor),bodies=renderer.screenBoundsWorld===w?[...(renderer.screenBounds?.values()||[])]:[],points=[...(renderer.screenPos?.values()||[])];
 let best=null,bestScore=Infinity;
 for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){
  const x=Math.floor(actor.x)+dx,y=Math.floor(actor.y)+dy;if(x<0||y<0||x>=w.n||y>=w.n)continue;const i=w.idx(x,y);
  const candidates=kind==='water'?(w.water[i]&&w.isDrinkable(x+.5,y+.5)?[{kind:'water',i,x:x+.5,y:y+.5}]:[]):Object.keys(diet).filter(food=>diet[food]>0&&w.plants[food]?.[i]>.02).map(food=>renderer.plantTargetWorld===w?renderer.visiblePlantTargets.get(i+'|'+food):null).filter(Boolean).map(p=>({kind:'plant',...p}));
  if(kind==='food'&&diet.carrion>0&&w.carrion[i]>.08)candidates.push({kind:'corpse',i,food:'carrion',x:x+.5,y:y+.5});
  for(const resource of candidates){const hx=resource.hitX??resource.x,hy=resource.hitY??resource.y;if(!visuallyObservable(sim,actor,{x:hx,y:hy,underground:!!actor.underground}))continue;
   const sx=renderer.w/2+(hx-renderer.camera.x)*tile,sy=renderer.h/2+(hy-renderer.camera.y)*tile;
   if(sx<32||sy<42||sx>renderer.w-32||sy>renderer.h-80)continue;
   if(bodies.some(body=>sx>body.left-20&&sx<body.right+20&&sy>body.top-20&&sy<body.bottom+20)||points.some(p=>Math.hypot(sx-p.x,sy-p.y)<42))continue;
   const goal=kind==='water'?approachGoal(sim,resource):resource;if(!goal||!sim.canReach(actor,goal.x,goal.y))continue;
   const distance=Math.hypot(hx-actor.x,hy-actor.y);if(distance<bestScore){const hit=clickedResource(sim,renderer,hx,hy);if(hit?.kind!==resource.kind||kind==='food'&&!(diet[hit.food]>0))continue;let score=distance;
    if(kind==='food'){const probe=Object.assign(Object.create(Object.getPrototypeOf(actor)),actor,{x:hit.x,y:hit.y}),meals=sim.foraging.options(probe,{index:hit.i,kind:hit.food});if(!meals.some(m=>m.handling.enabled))continue;if(!meals.some(m=>m.handling.enabled&&m.handling.energyCost===0))score+=16;}
    if(score<bestScore){bestScore=score;best={x:hx,y:hy,resource:hit};}}

  }
 }
 cache.set(renderer,{world:w,key,target:best,until:now+250});return best;
}
