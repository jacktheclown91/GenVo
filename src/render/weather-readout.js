import {thermalWeatherReading} from '../ecology/thermal-weather.js';
import {atmosphereReadout} from './atmosphere.js';
import {chooseOverlayPlacement,gameplayProtectedRects} from '../ui/overlay-placement.js';
// One explanatory label above fog; atmospheric artwork stays in its weather layer.
export function weatherReadoutModel(sim){
 const a=sim.player();if(!a||a.underground||(a.diveDepth||0)>.03)return null;
 const t=thermalWeatherReading(sim,a.x,a.y),thermal=t?.active?t:null,air=atmosphereReadout(sim,a);if(!thermal&&!air)return null;
 return{title:thermal?.label||air.text,detail:air?(thermal?air.text+' · reduced sight':'Reduced sight'):(thermal.delta>0?'Above':'Below')+' seasonal temperature',thermal:!!thermal,warm:!!thermal&&thermal.delta>0};
}
export function wrapWeatherText(text,maxWidth,measure){
 const lines=[];let line='';for(const word of String(text).split(/\s+/)){const next=line?line+' '+word:word;if(line&&measure(next)>maxWidth){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines;
}
export function weatherReadoutPlacement({width,height,protectedRects=[],obstacles=[],model=null,measureTitle=t=>t.length*7,measureDetail=t=>t.length*6}){
 const widths=width<=480?[250,120]:[250],candidates=widths.map(requested=>{const labelWidth=Math.min(requested,Math.max(1,width-20)),titleLines=model?wrapWeatherText(model.title,labelWidth-35,measureTitle):[],detailLines=model?wrapWeatherText(model.detail,labelWidth-35,measureDetail):[],labelHeight=model?14*titleLines.length+13*Math.max(0,detailLines.length-1)+24:38;
 return{...chooseOverlayPlacement({width:labelWidth,height:labelHeight,viewport:{left:0,top:0,right:width,bottom:height},preferred:{left:12,top:height-212},protectedRects,obstacles,gap:10}),titleLines,detailLines};});
 candidates.sort((a,b)=>a.score[0]-b.score[0]||a.score[1]-b.score[1]||b.width-a.width||a.score[2]-b.score[2]);return candidates[0];
}
export function drawWeatherReadout(renderer){
 const model=weatherReadoutModel(renderer.sim);if(!model)return;
 const c=renderer.ctx,bounds=renderer.canvas.getBoundingClientRect(),sx=renderer.w/bounds.width,sy=renderer.h/bounds.height,convert=r=>({left:(r.left-bounds.left)*sx,top:(r.top-bounds.top)*sy,right:(r.right-bounds.left)*sx,bottom:(r.bottom-bounds.top)*sy});
 const protectedRects=gameplayProtectedRects(renderer).map(convert),obstacles=[...document.querySelectorAll('#hud,#tutorial:not([hidden]),#interactionDock:not([hidden]),#notificationStack:not([hidden]),#stageUtilities:not([hidden]),#stageUtilities #quickMenu:not([hidden]),.knowledge-panel:not([hidden]),.journal-page,.context-radial:not([hidden])>*:not([hidden])')].filter(e=>e.getClientRects().length).map(e=>convert(e.getBoundingClientRect()));
 c.save();const measureTitle=t=>{c.font='bold 13px Georgia';return c.measureText(t).width},measureDetail=t=>{c.font='11px sans-serif';return c.measureText(t).width};
 const box=weatherReadoutPlacement({width:renderer.w,height:renderer.h,protectedRects,obstacles,model,measureTitle,measureDetail}),x=Math.round(box.left),y=Math.round(box.top),accent=model.warm?'#e5b67c':'#abd2df';
 c.fillStyle='#17291ff2';c.fillRect(x,y,box.width,box.height);c.fillStyle=accent;c.fillRect(x,y,2,box.height);
 if(model.thermal){c.fillRect(x+12,y+9,2,15);c.fillRect(x+10,y+23,6,5);c.fillStyle='#edf0d4';c.fillRect(x+12,y+10,1,5)}else{for(let k=0;k<3;k++)c.fillRect(x+8+(k%2)*2,y+12+k*5,9-(k%2)*2,1)}
 c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle=accent;c.font='bold 13px Georgia';for(const [i,line] of box.titleLines.entries())c.fillText(line,x+25,y+15+i*14);c.fillStyle='#e5dfbd';c.font='11px sans-serif';for(const [i,line] of box.detailLines.entries())c.fillText(line,x+25,y+16+box.titleLines.length*14+i*13);c.restore();
}
