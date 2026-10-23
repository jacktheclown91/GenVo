// Presentation-only native precipitation; no particle state enters simulation.
import {precipitationArt as art} from '../../assets/art/environment/precipitation.js';
let cache=null;
function sprites(){if(cache)return cache;if(typeof document==='undefined')return null;cache={};for(const [kind,group] of Object.entries(art.groups))cache[kind]=group.frames.map(frame=>{const canvas=document.createElement('canvas');canvas.width=group.width;canvas.height=group.height;const c=canvas.getContext('2d'),image=c.createImageData(group.width,group.height);for(let i=0;i<frame.length;i++){const v=frame[i],rgb=art.palette[v>>2],k=i*4;image.data[k]=rgb[0];image.data[k+1]=rgb[1];image.data[k+2]=rgb[2];image.data[k+3]=Math.round((v&3)/art.alphaSteps*255)}c.putImageData(image,0,0);return canvas});return cache}
const wrap=(value,size)=>((value%size)+size)%size;
// Exposed pure layout for inspection: local weather in, bounded paint out.
export function precipitationParticles(renderer,sample,snow){
 const intensity=snow?sample.snow:sample.liquid;if(!(intensity>=.01))return [];
 const count=Math.round((snow?110:100)*intensity*(renderer.lowDetail?.35:1)),t=renderer.renderNow/1000,w=renderer.w,h=renderer.h,east=sample.wind?.east??.3,south=sample.wind?.south??0,particles=[];
 for(let k=0;k<count;k++){const near=k%3===0,depth=near?1:.72,drift=east*(snow?20:40)*depth,fall=(snow?26:200)*depth+south*(snow?9:20),sway=snow?Math.sin(t*(near?1:.65)+k)*5:0;
  particles.push({x:wrap(k*97+t*drift,w+80)-40+sway,y:wrap(k*53+t*fall,h+60)-30,frame:k%4,scale:snow?(near?1:.65):(near?.95:.7),angle:snow?0:-Math.atan2(drift,fall),alpha:(snow?.5:.33)+intensity*(near?.38:.22)})}
 return particles;
}
export function drawPrecipitation(renderer,sample){const native=sprites();if(!native)return;const c=renderer.ctx;c.save();c.imageSmoothingEnabled=false;for(const [snow,kind] of [[false,'rain'],[true,'snow']])for(const p of precipitationParticles(renderer,sample,snow)){const img=native[kind][p.frame];c.save();c.globalAlpha=p.alpha;c.translate(Math.round(p.x),Math.round(p.y));c.rotate(p.angle);c.drawImage(img,-img.width*p.scale/2,-img.height*p.scale/2,img.width*p.scale,img.height*p.scale);c.restore()}c.restore()}
