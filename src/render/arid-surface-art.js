import {pixel,snap} from './pixel-art.js';

// Strictly local sprite decoration. Canonical physiology supplies k.arid from
// the higher-level renderer; this low-level art module imports no simulation.
// Native authored parts retain their art, sockets, silhouettes and palettes.
export function drawNativeAridAccent(c,partId,k,mount){
 if(!mount||!k?.arid)return false;
 const s=k.s,x=mount.x,y=mount.y,fx=k.fx,fy=k.fy,p=k.perp;
 if(partId==='heat-frill'&&k.arid.frillFlushed){
  for(const i of [-1,0,1]){
   const dx=x-fx*2.4+p.x*i*1.7,dy=y-fy*2.4+p.y*i*1.7-1;
   pixel(c,snap(dx),snap(dy),1,1,s,i===0?'#ffe0ac':'#dc8262');
  }
  return true;
 }
 if(partId==='wax-plates'&&k.arid.waxSealed){
  for(const i of [-1,0,1]){
   const dx=x-fx*i*1.35,dy=y-fy*i*1.35;
   pixel(c,snap(dx),snap(dy),1,1,s,i===0?'#fff0c7':'#d4c99d');
  }
  return true;
 }
 return false;
}
