// Artwork only. The caller supplies actual biomass, season and inherited allocation.
import {shrubFrames} from '../../assets/art/environment/berry-shrub.js';
import {mossFrames} from '../../assets/art/environment/moss.js';
const cache=new Map();
function sourceCanvas(frame,{body,light,shade,deep,gold},kind='shrub'){
 const key=[kind,frame,body,light,shade,deep,gold].join('|');if(cache.has(key))return cache.get(key);
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d'),data=ctx.createImageData(32,32),raw=(kind==='moss'?mossFrames:shrubFrames)[frame];
 // Keep generated shape and material planes; foliage color follows existing seasonal biology.
 const sample=color=>{ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)};
 const tones=[deep,shade,body,light].map(sample),fruit=gold?[[132,104,54],[189,156,88],[223,196,125]]:[[101,36,62],[166,53,89],[220,100,127]];
 for(let i=0;i<1024;i++){let r=raw[i*4],g=raw[i*4+1],b=raw[i*4+2],a=raw[i*4+3];if(!a)continue;
  const l=r*.2126+g*.7152+b*.0722;
  const berry=r>g*1.5&&b>g*1.2,wood=r>g*1.12&&r>b*1.35;
  const rgb=berry?fruit[Math.min(2,Math.floor(l/60))]:wood?[r,g,b]:tones[l<58?0:l<95?1:l<145?2:3];
  data.data.set([...rgb,a],i*4);
 }
 ctx.clearRect(0,0,32,32);ctx.putImageData(data,0,0);cache.set(key,c);if(cache.size>192)cache.delete(cache.keys().next().value);return c;
}
export function drawAuthoredShrub(ctx,{u,density,amount,season,seedAllocation,body,light,shade,deep}){
 // Retain the established fruit-display predicate, winter presentation and test/export fallback.
 if(!(amount>0)||season==='WINTER'||typeof ctx.drawImage!=='function')return false;
 const frame=season==='AUTUMN'||amount>.58?1:0,canvas=sourceCanvas(frame,{body,light,shade,deep,gold:seedAllocation>.2});if(!canvas)return false;
 const size=(.68+.32*density/5)*u/2;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(canvas,8*u-16*size,14*u-30*size,32*size,32*size);ctx.restore();return true;
}
export function drawAuthoredMoss(ctx,{u,density,amount,season,body,light,shade}){
 if(!(amount>0)||season==='WINTER'||typeof ctx.drawImage!=='function')return false;
 const canvas=sourceCanvas(0,{body,light,shade,deep:shade,gold:false},'moss');if(!canvas)return false;
 const size=(.62+.38*density/5)*u/2;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(canvas,8*u-16*size,14*u-30*size,32*size,32*size);ctx.restore();return true;
}
