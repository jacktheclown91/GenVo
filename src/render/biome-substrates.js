// Read-only native material interpretation, not a biome/terrain or resource authority.
import {biomeSubstrateArt} from '../../assets/art/environment/biome-substrates.js';
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=(lo,hi,v)=>{const q=clamp((v-lo)/(hi-lo));return q*q*(3-2*q)};
const cacheByWorld=new WeakMap(),MAX_TILES=1024;
function fieldAt(w,field,wx,wy,fallback=0){
 if(!field)return fallback;
 const fx=wx-.5,fy=wy-.5,x=Math.floor(fx),y=Math.floor(fy),u=fx-x,v=fy-y;
 const get=(dx,dy)=>{const k=w.idx(Math.max(0,Math.min(w.n-1,x+dx)),Math.max(0,Math.min(w.n-1,y+dy))),q=field[k];return Number.isFinite(q)?q:fallback};
 return(get(0,0)*(1-u)+get(1,0)*u)*(1-v)+(get(0,1)*(1-u)+get(1,1)*u)*v;
}
export function substrateWeightsAt(world,wx,wy,{moisture=null}={}){
 const zero={dry:0,cold:0,rock:0};if(!world?.temperature||!world.moisture||!Number.isFinite(wx+wy)||typeof world.idx!=='function')return zero;
 const m=Number.isFinite(moisture)?moisture:fieldAt(world,world.moisture,wx,wy,.5),t=fieldAt(world,world.temperature,wx,wy,.54),h=fieldAt(world,world.terrain?.elevation,wx,wy,0);
 const dry=(1-smooth(.14,.38,m))*smooth(.2,.42,t),cold=1-smooth(.15,.33,t),rock=smooth(.58,.83,h),sum=Math.max(1,dry+cold+rock);
 return{dry:dry/sum,cold:cold/sum,rock:rock/sum};
}
function corners(w,x,y){return[[x,y],[x+1,y],[x,y+1],[x+1,y+1]].map(([wx,wy])=>substrateWeightsAt(w,wx,wy))}
const mix=(a,b,c,d,u,v)=>(a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
export function substrateTileData(world,x,y){
 if(!world?.water||world.water[world.idx(x,y)])return null;
 const points=corners(world,x,y);if(!points.some(p=>p.dry+p.cold+p.rock>.005))return null;
 const origin=world.regionOrigin||{x:0,y:0},variant=(((y+origin.y)&1)*2)+((x+origin.x)&1),materials=biomeSubstrateArt.materials;
 const entries=[['dry','dry-earth'],['cold','cold-earth'],['rock','highland-rock']],pixels=new Uint8ClampedArray(4096);
 for(let py=0;py<32;py++)for(let px=0;px<32;px++){
  const u=(px+.5)/32,v=(py+.5)/32,i=py*32+px;let r=0,g=0,b=0,total=0;
  for(const [key,name] of entries){const weight=mix(points[0][key],points[1][key],points[2][key],points[3][key],u,v);if(weight<=0)continue;const art=materials[name],rgb=art.palette[art.frames[variant][i]];r+=rgb[0]*weight;g+=rgb[1]*weight;b+=rgb[2]*weight;total+=weight}
  if(total>.005){pixels[i*4]=Math.round(r/total);pixels[i*4+1]=Math.round(g/total);pixels[i*4+2]=Math.round(b/total);pixels[i*4+3]=Math.round(Math.min(1,total)*.25*255)}
 }
 return{pixels,width:32,height:32,variant,signature:points.map(p=>[p.dry,p.cold,p.rock].map(v=>Math.round(v*1024)).join(',')).join('|')};
}
export function drawNativeSubstrate(ctx,{world,px,py,u,x,y}){
 if(!world?.water||world.water[world.idx(x,y)])return false;
 const weights=corners(world,x,y);if(!weights.some(p=>p.dry+p.cold+p.rock>.005))return false;
 const signature=weights.map(p=>[p.dry,p.cold,p.rock].map(v=>Math.round(v*1024)).join(',')).join('|'),key=world.idx(x,y);
 let cache=cacheByWorld.get(world);if(!cache){cache=new Map();cacheByWorld.set(world,cache)}let entry=cache.get(key);
 if(!entry||entry.signature!==signature){
  const data=substrateTileData(world,x,y);if(!data)return false;let canvas=null;
  if(typeof document!=='undefined'&&typeof ctx.drawImage==='function'){
   canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d');if(c){const image=c.createImageData(32,32);image.data.set(data.pixels);c.putImageData(image,0,0)}else canvas=null;
  }
  entry={signature,pixels:data.pixels,canvas};if(cache.size>=MAX_TILES)cache.delete(cache.keys().next().value);cache.set(key,entry);
 }
 ctx.save();try{
  if(entry.canvas&&typeof ctx.drawImage==='function'){ctx.imageSmoothingEnabled=false;ctx.drawImage(entry.canvas,px,py,16*u,16*u)}
  else for(let i=0;i<1024;i++)if(entry.pixels[i*4+3]){const k=i*4;ctx.fillStyle='rgba('+entry.pixels.slice(k,k+3).join(',')+','+(entry.pixels[k+3]/255)+')';ctx.fillRect(px+(i%32)*u/2,py+(i/32|0)*u/2,u/2,u/2)}
 }finally{ctx.restore()}return true;
}
