import {pixel as px0,pixelLine as line0} from './pixel-art.js';
// Places are drawn half again as large as their unit design so they read at the wide view.
const K=1.5,pixel=(c,x,y,w,h,u,col)=>px0(c,x*K,y*K,w*K,h*K,u,col),pixelLine=(c,x0,y0,x1,y1,u,col,wt=1)=>line0(c,x0*K,y0*K,x1*K,y1*K,u,col,wt);

// Phase G places, drawn on the 32-pixel grid. Positions are in 16-grid units around the site centre.
const BROWN='#7a5636',DARK='#4a3322',PALE='#d9c79a',GREEN='#3f6b38',ROCK='#8a8d86',ROCKL='#c3c6bd',ROCKD='#55584f';
const DRAW={
  'root-mound'(c,u){for(let r=0;r<4;r++){const w=8-r*1.6;pixel(c,-w/2,-r*.9,w,1,u,r%2?'#8a6440':BROWN)}pixel(c,-2,-3.4,4,.5,u,'#a07a4e');pixelLine(c,-3,.6,-4.5,1.8,u,DARK,.5);pixelLine(c,2.5,.6,4,1.6,u,DARK,.5);pixelLine(c,0,.8,.5,2.2,u,DARK,.5)},
  'pod-grove'(c,u){for(const [x,h] of [[-3,5],[0,6.5],[3,4.5]]){pixelLine(c,x,1,x,1-h,u,'#6f7d3a',.5);pixel(c,x-.5,-h,1.5,1.5,u,'#d8b04a');pixel(c,x,-h,.5,.5,u,'#f2d68a')}},
  'still-pool'(c,u){pixel(c,-4,-1,8,3,u,'#2f6f86');pixel(c,-3,-1.5,6,.5,u,'#2f6f86');pixel(c,-3,1.5,6,.5,u,'#2f6f86');pixel(c,-2.5,-.5,5,1.5,u,'#4f9ab0');pixel(c,-1,0,2,.5,u,'#bfe3e8')},
  'hollow-log'(c,u){pixel(c,-5,-1.5,10,3.5,u,BROWN);pixel(c,-5,-1.5,10,.5,u,'#9a7148');pixel(c,-5,1.5,10,.5,u,DARK);pixel(c,3,-1,2,2.5,u,DARK);pixel(c,3.5,-.5,1,1.5,u,'#1d140c');pixelLine(c,-3,-.5,0,-.5,u,'#5e4129',.5)},
  'thorn-brake'(c,u){for(const [x,y] of [[-3,0],[0,-1.5],[3,0],[-1.5,1.5],[1.5,1.5]]){pixel(c,x-1.5,y-1.5,3,3,u,GREEN);pixel(c,x-1,y-1.5,1,.5,u,'#5a8a4a')}for(const [x,y,dx,dy] of [[-4.5,0,-1,-.5],[4.5,0,1,-.5],[0,-3,0,-1],[-2,2.8,-.6,.8],[2,2.8,.6,.8],[-1.5,-2.5,-.6,-.8],[1.5,-2.5,.6,-.8]])pixelLine(c,x,y,x+dx,y+dy,u,PALE,.5)},
  'lookout'(c,u){pixel(c,-4,-2,8,4,u,ROCK);pixel(c,-3,-4,6,2,u,ROCK);pixel(c,-2,-5,3,1,u,ROCKL);pixel(c,-3,-4,2,.5,u,ROCKL);pixel(c,-4,1.5,8,.5,u,ROCKD);pixel(c,2,-3,1.5,4.5,u,ROCKD)},
  'nest-ruin'(c,u){for(let k=0;k<6;k++){const a=k*Math.PI/3,x=Math.cos(a)*3.2,y=Math.sin(a)*1.8;pixelLine(c,x-Math.sin(a)*1.6,y+Math.cos(a)*.9,x+Math.sin(a)*1.6,y-Math.cos(a)*.9,u,k%2?BROWN:'#a07a4e',.5)}pixel(c,-1.5,-.5,3,1,u,DARK)},
  'relic'(c,u){pixel(c,-1.5,-3,3,4,u,'#c9a86a');pixel(c,-1,-2.5,2,3,u,'#f0d889');pixel(c,-.5,-2,1,1,u,'#fff6c8');pixel(c,-2.5,1,5,1,u,'#7a5636');pixelLine(c,-2,-4,-3,-5,u,'#f0d889',.5);pixelLine(c,2,-4,3,-5,u,'#f0d889',.5)},
  'carcass'(c,u){pixel(c,-4,-1,7,2.5,u,'#8b554d');pixel(c,-3.5,-1,6,.5,u,'#a8675c');for(const x of [-2.5,-1,.5,2])pixelLine(c,x,-1,x+.4,-2.6,u,PALE,.5);pixel(c,3,-1.5,2,2,u,PALE);pixel(c,3.5,-1,.5,.5,u,DARK)}
};
function paintSite(c,kind,u,found){DRAW[kind](c,u);
  // A small gold mark once the place is in the field guide.
  if(found){pixel(c,-.5,-7,1,1,u,'#f0d889');pixel(c,0,-7.5,.5,.5,u,'#fff3c2')}}
// World art pass (v1.51.0): places get the same dark outline as creatures and plants. Each kind is
// drawn once per zoom into a cached sprite; contexts without drawImage get the plain drawing.
const cache=new Map();
function siteSprite(kind,u,found){
  const key=kind+'|'+u+'|'+(found?1:0);if(cache.has(key))return cache.get(key);if(typeof document==='undefined'){cache.set(key,null);return null}
  const n=Math.ceil(32*K*u/2)*2,h=n/2,mk=()=>{const cv=document.createElement('canvas');cv.width=n;cv.height=n;return cv},a=mk(),b=mk(),ac=a.getContext('2d'),bc=b.getContext('2d');if(!ac||!bc){cache.set(key,null);return null}
  ac.imageSmoothingEnabled=false;ac.translate(h,h);paintSite(ac,kind,u,found);const o=Math.max(1,Math.round(u/2));
  for(const [dx,dy] of [[o,0],[-o,0],[0,o],[0,-o]])bc.drawImage(a,dx,dy);bc.globalCompositeOperation='source-in';bc.fillStyle='#16120c';bc.fillRect(0,0,n,n);bc.globalCompositeOperation='source-over';bc.drawImage(a,0,0);
  const out={canvas:b,h};cache.set(key,out);return out;
}
export function drawSite(c,site,{px,py,u,found}){
  const fn=DRAW[site.kind];if(!fn)return;const sp=typeof c.drawImage==='function'?siteSprite(site.kind,u,found):null;
  if(sp){c.drawImage(sp.canvas,px-sp.h,py-sp.h);return}
  c.save();c.translate(px,py);paintSite(c,site.kind,u,found);c.restore();
}
