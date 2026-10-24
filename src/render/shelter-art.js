// Original overhead native-grid shelter art; no resource, world or RNG writes.
import {pixel,pixelLine} from './pixel-art.js';
import {VISIBILITY,atmosphereAt} from '../ecology/atmospheric-visibility.js';
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
export function shelterLiquidRain(sim,sh){return sim?.visibilityRules===VISIBILITY.policy&&sim?.climate&&sim?.world?.temperature?clamp(atmosphereAt(sim,sh.x,sh.y).liquid):0}
export function shelterArtState(sh,{seal=.78,rain=0}={}){const integrity=clamp(sh?.integrity/100),fill=sh?.capacity>0?clamp(sh.foodStore/sh.capacity):0;return{integrity,fill,seal:clamp(seal),rain:clamp(rain),burrow:sh?.denStyle==='burrow',satellite:sh?.kind==='satellite',dripping:integrity>0&&clamp(seal)<.52&&clamp(rain)>=.01,seed:((sh?.id||0)*17+Math.floor(sh?.x||0)*13+Math.floor(sh?.y||0)*7)>>>0}}
export function drawShelterArt(c,sh,{scale=1,seal=.78,rain=0}={}){
 const m=shelterArtState(sh,{seal,rain});if(!m.integrity)return;const p=(x,y,w,h,col)=>pixel(c,x,y,w,h,scale,col),line=(x,y,xx,yy,col,w=.5)=>pixelLine(c,x,y,xx,yy,scale,col,w);
 p(-7.5,4,15,2,'rgba(17,24,17,.30)');
 if(m.burrow){
  p(-5,-5.5,10,1.5,'#756143');p(-7,-4,14,6,'#685238');p(-7.5,-2,15,4,'#55432f');p(-5.5,2,11,2,'#80613e');p(-4,4,8,1,'#9a784b');
  for(let k=0;k<9;k++){const x=-6+k*1.5,y=-3+(k%3)*.5;line(x,y,x+1,y-.5,k%2?'#8f7550':'#4c412d')}
  p(-3,-1,6,4,'#22271d');p(-2.5,-1.5,5,1,'#171f19');p(-2,0,4,2,'#101a16');line(-3.5,2,-1.5,3,'#b08a54');line(1.5,3,3.5,2,'#9c7848');
  for(const [x,y] of [[-6,-4],[4,-4],[-7,1]]){p(x,y,2,.5,'#76804d');line(x,y,x+1,y-1,'#8c9560')}
 }else{
  p(-4.5,-6,9,1,'#4a4b2d');p(-6,-5,12,2,'#676b3b');p(-7,-3,14,5,'#737c43');p(-6,2,12,2,'#61683a');p(-4,4,8,1,'#3d472b');
  for(let k=0;k<12;k++){const x=-5.5+(k%6)*2,y=-4+Math.floor(k/6)*3+(m.seed%3)*.25;line(x,y,x+1.5,y+2,k%3===0?'#b0aa6a':k%2?'#8e9854':'#5b6037')}
  line(-5,-3,4,3,'#b4a268');line(-4,3,5,-3,'#545438');p(1,1.5,4,2,'#283624');p(2,1,2.5,.5,'#414c2d');
  if(m.satellite){line(-6,-3,-4,-4,'#d0b575');line(4,-4,6,-3,'#d0b575')}
 }
 // Fixed native damage locations reveal the actual integrity; no timed decay.
 for(let k=0;k<4;k++)if(m.integrity<[.82,.62,.42,.24][k]){const x=[-4,3,-1,4][k],y=[-2,-3,2,0][k];p(x,y,1.5,1,'#302e21');line(x,y,x+1,y+1,'#b09a60')}
 if(m.seal>.86){line(-4,-4.5,4,-4.5,'#c3af76');line(-4,-4.5,-5,-2,'#655538');line(4,-4.5,5,-2,'#655538')}
 if(m.dripping){const alpha=.35+m.rain*.5;p(-3,2,.5,1.5,`rgba(137,189,197,${alpha})`);p(3,3,.5,1,`rgba(137,189,197,${alpha})`)}
 // Generic ration bundles communicate quantity, never unrecorded food identity.
 const bundles=Math.ceil(m.fill*6);for(let k=0;k<bundles;k++){const x=-6.5+(k%3)*1.5,y=3.5+Math.floor(k/3);p(x,y,1,.75,k%2?'#a69b63':'#8e9255');p(x,y,.5,.5,'#ccc08a')}
}
