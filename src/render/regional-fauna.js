// Draw the same published body through its owning World's read-only facade.
// Presentation caches belong to the existing terrain-only neighbour renderer;
// no second biological Simulation, active actor or mutable owner is installed.
export function drawRegionalAnimal(main,entry,tile){
 const {actor,owner}=entry,r=owner.view.renderer;
 const keys=['sim','ctx','camera','w','h','zoom','renderNow','screenPos','screenBounds','overlayTargetId'],saved=keys.map(k=>r[k]),owned=keys.map(k=>Object.hasOwn(r,k));
 try{
  r.sim=owner.facade;r.ctx=main.ctx;r.camera={x:main.camera.x-owner.ox,y:main.camera.y-owner.oy};r.w=main.w;r.h=main.h;r.zoom=main.zoom;r.renderNow=main.renderNow;
  r.screenPos=new Map();r.screenBounds=new Map();r.overlayTargetId=main.overlayRegionalTargetId;
  r.drawAnimal(actor,tile);
  const point=r.screenPos.get(actor.id);if(point)main.regionalScreenPos.set(actor.id,point);
  const bounds=r.screenBounds.get(actor.id);if(bounds)main.screenBounds.set(actor.id,bounds);
 }finally{keys.forEach((key,i)=>{if(owned[i])r[key]=saved[i];else delete r[key]})}
}
