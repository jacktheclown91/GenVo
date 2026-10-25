import {chooseOverlayPlacement,overlapArea} from '../ui/overlay-placement.js';
import {readoutScreenConstraints,reserveReadout} from './readout-layout.js';

// Screen-space wayfinding only: the marker always stays on the real target.
export function tutorialGuideMode({player,target,tile,width,height,obstacles=[]}){
 const r=Math.max(13,Math.round(tile*.6)),x=Math.round(target.x),y=Math.round(target.y),marker={left:x-r-3,top:y-r-3,right:x+r+3,bottom:y+r+3};
 const obscured=marker.left<0||marker.top<0||marker.right>width||marker.bottom>height||obstacles.some(o=>overlapArea(marker,o)>0);
 const dx=target.x-player.x,dy=target.y-player.y;
 return{marker,r,direction:obscured&&Math.hypot(dx,dy)>1?((Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8):null};
}
// Native two-pixel strokes, precomputed for the eight screen directions.
const arrows=Array.from({length:8},(_,direction)=>{
 const angle=direction*Math.PI/4,cos=Math.cos(angle),sin=Math.sin(angle);
 return [...Array.from({length:6},(_,i)=>[i-3,0]),[1,-2],[2,-1],[3,0],[2,1],[1,2]].map(([x,y])=>[Math.round(x*cos-y*sin),Math.round(x*sin+y*cos)]);
});
export function drawTutorialGuide(renderer,{tile,player,target,label}){
 const c=renderer.ctx,constraints=readoutScreenConstraints(renderer),mode=tutorialGuideMode({player,target,tile,width:renderer.w,height:renderer.h,obstacles:constraints.obstacles}),{r,marker,direction}=mode,x=Math.round(target.x),y=Math.round(target.y),ink=label==='Water'?'#a7e7ed':'#f4dc85';
 c.strokeStyle='#07120c';c.lineWidth=5;c.strokeRect(x-r,y-r,r*2,r*2);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(x-r,y-r,r*2,r*2);
 const text=direction===null?label:'To '+label;c.font='bold 13px Verdana,sans-serif';
 const textWidth=Math.ceil(c.measureText(text).width),width=textWidth+18+(direction===null?0:22),placed=chooseOverlayPlacement({width,height:23,viewport:{left:0,top:0,right:renderer.w,bottom:renderer.h},preferred:direction===null?{left:x-width/2,top:y-r-27}:{left:player.x-width/2,top:player.y+Math.max(36,r+16)},protectedRects:[...constraints.protectedRects,marker],obstacles:constraints.obstacles}),left=Math.round(placed.left),top=Math.round(placed.top);
 reserveReadout(renderer,{left,top,right:left+width,bottom:top+23});reserveReadout(renderer,marker);
 c.fillStyle='#102017';c.fillRect(left,top,width,23);c.strokeStyle=ink;c.lineWidth=1;c.strokeRect(left+.5,top+.5,width-1,22);c.fillStyle=ink;c.textAlign='left';c.textBaseline='middle';c.fillText(text,left+9,top+12);
 if(direction!==null){const ax=left+width-14,ay=top+11;for(const [dx,dy] of arrows[direction])c.fillRect(ax+dx*2,ay+dy*2,2,2)}
 return mode;
}
