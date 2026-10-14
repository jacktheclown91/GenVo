import {artForPart} from '../render/runtime-part-art.js';
import {PARTS} from '../lineage/part-registry.js';
import {drawPartAlone} from '../render/part-sprites.js';
import {creaturePalette} from '../render/creature-palette.js';
import {phenotypeFor} from '../organisms/species.js';
// Depicts actual mounted anatomy; this never determines whether an action is allowed.
export function actionIconPart(animal,action){
 action=action.replace(/^Approach & /,'');
 if(/Eat|Feed|Crush|Break nest/.test(action))return animal?.bodyPlan?.nodes?.find(n=>n.socket==='mouth')?.partId||null;
 const capabilities={'Read marks':['see'],'Follow trail':['track'],Observe:['see'],Attack:['strike','bite'],Pounce:['pounce'],'Hold Brace':['brace','walk'],Court:['display','call','dance']};
 for(const capability of capabilities[action]||[])for(const node of animal?.bodyPlan?.nodes||[])if(PARTS[node.partId]?.actionCapabilities.includes(capability))return node.partId;
 return null;
}
export function appendActionIcon(button,animal,action){
 const partId=actionIconPart(animal,action);if(!partId)return;const native=artForPart(partId);if(!native)return;
 const source=document.createElement('canvas');source.width=64;source.height=64;const c=source.getContext('2d');c.imageSmoothingEnabled=false;c.translate(32,32);
 if(!native.rig)native.draw(c,{scale:2,facing:2,state:'idle',timeMs:0});else drawPartAlone(c,partId,{type:PARTS[partId].compatibleSocketTypes[0],s:3,p:creaturePalette(phenotypeFor(animal))});
 const pixels=c.getImageData(0,0,64,64).data;let x0=64,y0=64,x1=-1,y1=-1;
 for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
 if(x1<0)return;const icon=document.createElement('canvas');icon.width=32;icon.height=32;icon.setAttribute('aria-hidden','true');icon.dataset.partId=partId;
 const ctx=icon.getContext('2d');ctx.imageSmoothingEnabled=false;const w=x1-x0+1,h=y1-y0+1,scale=Math.min(28/w,28/h);ctx.drawImage(source,x0,y0,w,h,(32-w*scale)/2,(32-h*scale)/2,w*scale,h*scale);button.prepend(icon);
}
