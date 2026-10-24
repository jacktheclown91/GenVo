import {thermalWeatherReading} from '../ecology/thermal-weather.js';
import {atmosphereReadout} from './atmosphere.js';
import {chooseOverlayPlacement,gameplayProtectedRects} from '../ui/overlay-placement.js';
// One explanatory label above fog; atmospheric artwork stays in its weather layer.
export function weatherReadoutModel(sim){
 const a=sim.player();if(!a||a.underground||(a.diveDepth||0)>.03)return null;
 const t=thermalWeatherReading(sim,a.x,a.y),thermal=t?.active?t:null,air=atmosphereReadout(sim,a);if(!thermal&&!air)return null;
 return{title:thermal?.label||air.text,detail:air?(thermal?air.text+' · reduced sight':'Reduced sight'):(thermal.delta>0?'Above':'Below')+' seasonal temperature',thermal:!!thermal,warm:!!thermal&&thermal.delta>0};
}
export function weatherReadoutPlacement({width,height,protectedRects=[],obstacles=[]}){
 return chooseOverlayPlacement({width:Math.min(250,Math.max(1,width-20)),height:38,viewport:{left:0,top:0,right:width,bottom:height},preferred:{left:12,top:height-212},protectedRects,obstacles,gap:10});
}
export function drawWeatherReadout(renderer){
 const model=weatherReadoutModel(renderer.sim);if(!model)return;
 const c=renderer.ctx,bounds=renderer.canvas.getBoundingClientRect(),sx=renderer.w/bounds.width,sy=renderer.h/bounds.height,convert=r=>({left:(r.left-bounds.left)*sx,top:(r.top-bounds.top)*sy,right:(r.right-bounds.left)*sx,bottom:(r.bottom-bounds.top)*sy});
 const protectedRects=gameplayProtectedRects(renderer).map(convert),obstacles=[...document.querySelectorAll('#hud,#tutorial:not([hidden]),#interactionDock:not([hidden]),#notificationStack:not([hidden]),#stageUtilities:not([hidden]),#stageUtilities #quickMenu:not([hidden]),.knowledge-panel:not([hidden]),.journal-page,.context-radial:not([hidden])>*:not([hidden])')].filter(e=>e.getClientRects().length).map(e=>convert(e.getBoundingClientRect()));
 const box=weatherReadoutPlacement({width:renderer.w,height:renderer.h,protectedRects,obstacles}),x=Math.round(box.left),y=Math.round(box.top),accent=model.warm?'#e5b67c':'#abd2df';
 c.save();c.fillStyle='#17291ff2';c.fillRect(x,y,box.width,box.height);c.fillStyle=accent;c.fillRect(x,y,2,box.height);
 if(model.thermal){c.fillRect(x+12,y+9,2,15);c.fillRect(x+10,y+23,6,5);c.fillStyle='#edf0d4';c.fillRect(x+12,y+10,1,5)}else{for(let k=0;k<3;k++)c.fillRect(x+8+(k%2)*2,y+12+k*5,9-(k%2)*2,1)}
 c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle=accent;c.font='bold 13px Georgia';c.fillText(model.title,x+25,y+15);c.fillStyle='#e5dfbd';c.font='11px sans-serif';c.fillText(model.detail,x+25,y+30);c.restore();
}
