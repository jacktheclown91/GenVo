// Original native-grid clutch art. Reads records; never advances reproduction.
import {pixel,pixelLine} from './pixel-art.js';
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const palettes={
 marshroot:['#665337','#ae965a','#817440'],sunmoss:['#424d2b','#92a05d','#657941'],
 thistlepod:['#665139','#bdab74','#8d8650'],bramble:['#4c3e2c','#9b8055','#6c6241'],
 rotcap:['#5f4b3c','#b69a78','#8e765d'],woodspire:['#493c2c','#ae8b57','#786343']
};
export function drawNestArt(c,nest,{scale=1}={}){
 const integrity=clamp(nest?.integrity);if(!integrity)return;
 const [dark,light,mid]=palettes[nest.material]||['#53452f','#ae965e','#7b7148'];
 const p=(x,y,w,h,col)=>pixel(c,x,y,w,h,scale,col),line=(x,y,xx,yy,col)=>pixelLine(c,x,y,xx,yy,scale,col,.5);
 p(-5,2.5,10,2,'rgba(18,24,16,.30)');p(-4.5,-3.5,9,7,dark);p(-6,-2,12,4,dark);
 p(-4,-2.5,8,5,mid);p(-3,-1.5,6,3,'#292c1e');p(-2,-1,4,2,'#22271b');
 // Fixed gaps follow recorded integrity; there is no timed decay or RNG.
 const rim=[[-5,-2,-3,-3],[-3,-3,0,-3.5],[0,-3.5,3,-3],[3,-3,5,-1.5],[5,-1.5,5.5,1],[5.5,1,3.5,3],[3.5,3,0,3.5],[0,3.5,-3,3],[-3,3,-5,1.5],[-5,1.5,-5,-2]];
 for(let k=0;k<rim.length;k++){
  if(integrity<.35&&k%3===1||integrity<.65&&k===4)continue;
  const [x,y,xx,yy]=rim[k];line(x,y,xx,yy,k%2?mid:light);line(x,y+.5,xx,yy+.5,mid);
  if(nest.material==='rotcap')p(x,y,1.5,1,light);
  else line(x-.5,y+.5,x+1,y-1,light);
 }
 if(nest.material==='sunmoss'){p(-4,1.5,1,1,'#9da968');p(3,-2,1.5,1,'#879e55')}
}
export function drawEggArt(c,egg,{scale=1}={}){
 const condition=clamp(egg?.condition),p=(x,y,w,h,col)=>pixel(c,x,y,w,h,scale,col);
 p(-2.5,2,5,1.5,'rgba(18,21,15,.40)');
 // A continuous shell silhouette, never an invented pipping/crack state.
 p(-1,-3,2,.5,'#8e7958');p(-2,-2.5,4,1,'#8e7958');p(-2.5,-1.5,5,3,'#8e7958');p(-2,1.5,4,1,'#8e7958');p(-1,2.5,2,.5,'#8e7958');
 const body=condition<.45?'#b6a88b':'#dfd2ad',shade=condition<.45?'#98896e':'#bca77d';
 p(-1,-2.5,2,1,body);p(-1.5,-1.5,3,3.5,body);p(-2,-1,4,2,body);p(1,-.5,1,2,shade);p(-1,2,2,.5,shade);
 p(-1,-2,1,.5,condition<.45?'#d1c3a4':'#faf0d2');p(-1.5,-1.5,.5,1,condition<.45?'#c8b99c':'#eee3c2');
}
