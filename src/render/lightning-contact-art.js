// Paint retained native indexed artwork at the observed real event coordinate.
// Batched pixel runs avoid an offscreen-canvas source in the full-frame path.
import {lightningContactArt as art} from '../../assets/art/environment/lightning-contact.js';
const styles=Array.from({length:32},(_,v)=>'rgba('+art.palette[v>>3].join(',')+','+(Math.round((v&7)/art.alphaSteps*255)/255)+')');
const batches=art.frames.map(frame=>{const groups=new Map();for(let y=0;y<art.height;y++)for(let x=0;x<art.width;){const v=frame[y*art.width+x];let end=x+1;while(end<art.width&&frame[y*art.width+end]===v)end++;if(v&7){if(!groups.has(v))groups.set(v,[]);groups.get(v).push([x-art.root[0],y-art.root[1],end-x,1])}x=end}return groups});
export function lightningContactPhase(age){return !Number.isFinite(age)||age<0||age>.55?-1:Math.min(3,Math.floor(age/.55*4))}
export function drawLightningContact(renderer,{x,y,event,age,alpha}){const phase=lightningContactPhase(age);if(phase<0)return;const c=renderer.ctx,s=renderer.zoom*2;c.save();c.globalAlpha=Math.sqrt(Math.max(0,Math.min(1,alpha)));c.translate(Math.round(x),Math.round(y));c.rotate((event.i%4)*Math.PI/2);c.scale(s,s);for(const [value,runs] of batches[phase]){c.fillStyle=styles[value];c.beginPath();for(const run of runs)c.rect(...run);c.fill()}c.restore()}
