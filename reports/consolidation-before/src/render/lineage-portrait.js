import {creatureFootprint} from './creature-footprint.js';
import {migrateLegacyReadings} from '../lineage/readings.js';
import {SPECIES,phenotypeFor} from '../organisms/species.js';
import {drawGenvoSprite} from './genvo-draw.js';
import {deserializePlan} from '../lineage/body-plan.js';
import {founderPlan} from '../lineage/body-inheritance.js';

// v1.57.0: portraits draw the creature's real body (its body plan), never the old gene-based body.
export function drawLineagePortrait(canvas,genes,{frame=1,dir=2,emphasis=false,adaptations=[],divergence=null,protoTrait=null,speciesBranch=null,lifestyle=null,bodyPlan=null,anatomy=null,fitScale=null}={}){
  if(!canvas?.getContext||!genes)return;
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);
  // Portraits intentionally stay transparent so a generation handoff reads as a scene, not a card.
  c.fillStyle=emphasis?'rgba(221,197,111,.28)':'rgba(116,136,102,.16)';c.fillRect(18,h-25,w-36,1);
  c.fillStyle=emphasis?'rgba(170,154,91,.34)':'rgba(78,96,71,.26)';for(let x=25;x<w-22;x+=17)c.fillRect(x,h-21-(x%4),1,2);
  const animal=migrateLegacyReadings({id:1,dir,genes,anatomy:anatomy?{...anatomy}:undefined,adaptations:[...adaptations],lineageForm:divergence?{...divergence}:null,populationTrait:protoTrait?{...protoTrait}:null,speciesBranch:speciesBranch?{...speciesBranch}:null,ecoLifestyle:lifestyle?{...lifestyle}:null});let plan=bodyPlan;if(typeof plan==='string')try{plan=deserializePlan(plan)}catch{plan=null}animal.bodyPlan=plan||founderPlan();const ph=phenotypeFor(animal),base=SPECIES.genvo.color,palette={body:tintHex(base,ph.hueShift,ph.lightShift),shade:tintHex(base,ph.hueShift,ph.lightShift-16),light:tintHex(base,ph.hueShift,ph.lightShift+12)};
  const bounds=portraitFootprint(animal),scale=Math.min(fitScale??Infinity,(w-36)/bounds.w,(h-36)/bounds.h,8);
  c.save();c.translate(Math.round(w/2-bounds.x*scale),Math.round(h/2-bounds.y*scale));c.fillStyle='rgba(0,0,0,.22)';c.fillRect(-14*scale/2,6*scale,14*scale,2*scale);drawGenvoSprite(c,{animal,phenotype:ph,scale,frame,moving:false,palette,pose:{dir,action:'idle',life:{breath:.5}}});c.restore();
}

function tintHex(hex,hueShift=0,lightShift=0){const raw=hex.replace('#',''),n=parseInt(raw,16),r=(n>>16)&255,g=(n>>8)&255,b=n&255,[h,s,l]=rgbToHsl(r/255,g/255,b/255);return`hsl(${(h+hueShift+360)%360} ${Math.max(18,Math.min(86,s))}% ${Math.max(28,Math.min(78,l+lightShift))}%)`}
function rgbToHsl(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4)}if(h<0)h+=360;return[h,s*100,l*100]}

const footprintCache=new Map();
function portraitFootprint(animal){const key=(animal.bodyPlan?.id||'legacy')+'|'+animal.dir+'|'+JSON.stringify(animal.genes)+'|'+JSON.stringify(animal.adaptations)+'|'+JSON.stringify(animal.anatomy);if(!footprintCache.has(key)){if(footprintCache.size>=128)footprintCache.delete(footprintCache.keys().next().value);footprintCache.set(key,creatureFootprint(animal,animal.dir))}return footprintCache.get(key)}
