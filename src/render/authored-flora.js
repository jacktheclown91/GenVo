// Paint only. Stock, season, inherited traits and growth stages come from the caller.
import {overheadFlora} from '../../assets/art/environment/overhead-flora.js';
const cache=new Map(),colors=new Map();let colorContext=null;
const wood=[[117,99,61],[169,144,82],[200,175,98],[223,196,125]];
export function floraArtState({shape,amount,season='SPRING',seedAllocation=.2,coatAllocation=.25}){
 if(!(amount>0)||!overheadFlora[shape])return null;
 return{shape,frame:shape==='shrub'?(season==='AUTUMN'||amount>.58?1:0):shape==='pod'?(coatAllocation<.25?0:coatAllocation>.25?2:1):0,gold:shape==='shrub'&&seedAllocation>.2,greenShell:shape==='pod'&&coatAllocation===.25&&!['SUMMER','AUTUMN'].includes(season)};
}
function rgb(color){
 if(colors.has(color))return colors.get(color);
 if(!colorContext){if(typeof document==='undefined')return null;const canvas=document.createElement('canvas');canvas.width=canvas.height=1;colorContext=canvas.getContext('2d')}
 // Canvas normalizes CSS/HSL to sRGB without painting or reading GPU pixels.
 colorContext.fillStyle=color;const m=/^#([\da-f]{6})$/i.exec(colorContext.fillStyle);if(!m)return null;
 const n=parseInt(m[1],16),value=[n>>16&255,n>>8&255,n&255];colors.set(color,value);if(colors.size>4096)colors.delete(colors.keys().next().value);return value;
}
function sourceCanvas(state,{body,light,shade,deep}){
 const tones=[deep||shade,shade,body,light].map(rgb);if(tones.some(c=>!c))return null;
 tones.push(tones[3].map(v=>Math.round(v*.8+255*.2)));
 const fruit=state.gold?[[132,104,54],[189,156,88],[223,196,125]]:[[101,36,62],[166,53,89],[220,100,127]];
 const shell=state.greenShell?[tones[1],tones[2],tones[3],tones[4]]:wood;
 const palette=[[0,0,0],...tones,...fruit,...shell],key=JSON.stringify([state.shape,state.frame,palette]);
 if(cache.has(key))return cache.get(key);
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d'),data=ctx.createImageData(32,32),indices=overheadFlora[state.shape].frames[state.frame];
 for(let i=0;i<indices.length;i++){const p=indices[i];if(p)data.data.set([...palette[p],255],i*4)}
 ctx.putImageData(data,0,0);cache.set(key,c);if(cache.size>192)cache.delete(cache.keys().next().value);return c;
}
export function drawAuthoredFlora(ctx,{shape,u,density=1,amount,season='SPRING',seedAllocation=.2,coatAllocation=.25,body,light,shade,deep,center={x:8,y:8},turn=0,mini=false,sizeFactor=null}){
 if(typeof ctx.drawImage!=='function')return false;
 const state=floraArtState({shape,amount,season,seedAllocation,coatAllocation});if(!state)return false;
 const canvas=sourceCanvas(state,{body,light,shade,deep});if(!canvas)return false;
 const size=(sizeFactor??(mini ? .40 : .68+.32*Math.max(1,Math.min(5,density))/5))*u/2,[ax,ay]=overheadFlora[shape].pivot;
 ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.translate(center.x*u,center.y*u);if(turn)ctx.rotate(turn);ctx.drawImage(canvas,-ax*size,-ay*size,32*size,32*size)}finally{ctx.restore()}return true;
}
// Existing public helpers continue through the same current plant-art path.
export function drawAuthoredShrub(ctx,options){return drawAuthoredFlora(ctx,{...options,shape:'shrub'})}
export function drawAuthoredMoss(ctx,options){return drawAuthoredFlora(ctx,{...options,shape:'tuft'})}
