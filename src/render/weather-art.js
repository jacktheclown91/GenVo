// Native transparent fog paint. Meteorology and optical extinction stay with
// atmospheric-visibility.js; this cache contains presentation canvases only.
import {weatherMistArt as art} from '../../assets/art/environment/weather-mist.js';
let frames=null;
function mistFrames(){
 if(frames)return frames;
 if(typeof document==='undefined')return null;
 frames=art.frames.map(frame=>{const canvas=document.createElement('canvas');canvas.width=art.width;canvas.height=art.height;const c=canvas.getContext('2d'),img=c.createImageData(art.width,art.height);
  for(let i=0;i<frame.length;i++){const value=frame[i],rgb=art.palette[value>>3],k=i*4;img.data[k]=rgb[0];img.data[k+1]=rgb[1];img.data[k+2]=rgb[2];img.data[k+3]=Math.round((value&7)/art.alphaSteps*255)}
  c.putImageData(img,0,0);return canvas});return frames;
}
const wrap=(v,size)=>((v%size)+size)%size;
export function drawMistWisps(renderer,sample){
 const native=mistFrames();if(!native||sample.fog<=.01)return;
 const c=renderer.ctx,w=renderer.w,h=renderer.h,t=renderer.renderNow/1000,quality=renderer.lowDetail?3:5;
 c.save();c.imageSmoothingEnabled=false;c.globalAlpha=sample.fog*.55;
 // Deliberately broad, broken overhead sheets, rather than opaque cloud bodies.
 // The same observed horizontal wind advects both axes; no simulation RNG.
 for(let k=0;k<quality;k++){const scale=4+(k%2),sw=art.width*scale,sh=art.height*scale;
  const x=wrap(k*317+t*(sample.wind?.east??.2)*16,w+sw)-sw;
  const y=wrap(k*139+t*(sample.wind?.south??.05)*10,h+sh)-sh;
  c.drawImage(native[k%native.length],Math.round(x),Math.round(y),sw,sh)}
 c.restore();
}
