export const overlapArea=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
export function chooseOverlayPlacement({width,height,viewport,preferred,previous=null,protectedRects=[],obstacles=[],gap=10}){
 const clamp=(value,low,high)=>Math.max(low,Math.min(Math.max(low,high),value)),candidates=[preferred];if(previous)candidates.push(previous);
 const left=viewport.left+gap,top=viewport.top+gap,right=viewport.right-gap-width,bottom=viewport.bottom-gap-height;
 candidates.push({left,top},{left:right,top},{left,top:bottom},{left:right,top:bottom});
 for(const r of [...protectedRects,...obstacles])candidates.push({left:r.left-width-gap,top:preferred.top},{left:r.right+gap,top:preferred.top},{left:preferred.left,top:r.top-height-gap},{left:preferred.left,top:r.bottom+gap});
 const scored=candidates.map(p=>{const r=rect(clamp(p.left,left,right),clamp(p.top,top,bottom),width,height);return{...r,score:[protectedRects.reduce((n,p)=>n+overlapArea(r,p),0),obstacles.reduce((n,p)=>n+overlapArea(r,p),0),Math.hypot(r.left-preferred.left,r.top-preferred.top)]}});
 scored.sort((a,b)=>{for(let i=0;i<a.score.length;i++){const d=a.score[i]-b.score[i];if(Math.abs(d)>.1)return d}return 0});return scored[0];
}
export function canvasClientPoint(renderer,point){
 if(!point)return null;const r=renderer.canvas.getBoundingClientRect();return{x:r.left+point.x*r.width/renderer.w,y:r.top+point.y*r.height/renderer.h};
}
export function gameplayProtectedRects(renderer){
 const result=[];if(!renderer)return result;
 const r=renderer.canvas.getBoundingClientRect(),world=renderer.sim?.world;
 let selected=false;if(renderer.screenBoundsWorld===world){for(const id of new Set([renderer.sim.playerId,renderer.overlayTargetId])){const body=renderer.screenBounds?.get(id);if(body){const x=r.width/renderer.w,y=r.height/renderer.h;result.push(rect(r.left+body.left*x-14,r.top+body.top*y-14,body.width*x+28,body.height*y+28));if(id===renderer.overlayTargetId)selected=true}}}
 const ring=document.querySelector('.creature-selection-ring:not([hidden])');if(ring&&!selected){const b=ring.getBoundingClientRect(),padding=22*renderer.zoom+16;if(b.width&&b.height)result.push(rect(b.left-padding,b.top-padding,b.width+padding*2,b.height+padding*2))}
 return result;
}
