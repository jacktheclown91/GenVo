// Proposed shared renderer. Staged at src/render/lineage-portrait.js for review.
import {creatureFootprint} from './creature-footprint.js';
import {migrateLegacyReadings} from '../lineage/readings.js';
import {phenotypeFor} from '../organisms/species.js';
import {creaturePalette} from './creature-palette.js';
import {drawGenvoSprite} from './genvo-draw.js';
import {deserializePlan} from '../lineage/body-plan.js';
import {founderPlan} from '../lineage/body-inheritance.js';
import {nativeArtStatus} from './runtime-part-art.js';
// Pure read adapter. Missing pigment stays on the established legacy-gene appearance path.
export function lineagePortraitReading(genes,{dir=2,adaptations=[],divergence=null,protoTrait=null,speciesBranch=null,lifestyle=null,bodyPlan=null,anatomy=null,pigmentGenome=null}={}){
 const animal=migrateLegacyReadings({id:1,dir,genes:{...genes},pigmentGenome:pigmentGenome?structuredClone(pigmentGenome):null,anatomy:anatomy?{...anatomy}:undefined,adaptations:[...adaptations],lineageForm:divergence?{...divergence}:null,populationTrait:protoTrait?{...protoTrait}:null,speciesBranch:speciesBranch?{...speciesBranch}:null,ecoLifestyle:lifestyle?{...lifestyle}:null});let plan;try{plan=bodyPlan?deserializePlan(bodyPlan):null}catch{plan=null}animal.bodyPlan=plan||founderPlan();const phenotype=phenotypeFor(animal);return{animal,phenotype,palette:creaturePalette(phenotype)};
}
const cache=new Map();let boundsMeasurements=0;
export function lineagePortraitCacheStats(){return{entries:cache.size,boundsMeasurements}}
function dataFor(genes,options){const {dir=2,adaptations=[],divergence=null,protoTrait=null,speciesBranch=null,lifestyle=null,bodyPlan=null,anatomy=null,pigmentGenome=null}=options,key=JSON.stringify([nativeArtStatus().revision,genes,dir,adaptations,divergence,protoTrait,speciesBranch,lifestyle,bodyPlan,anatomy,pigmentGenome]);if(!cache.has(key)){if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(key,lineagePortraitReading(genes,options))}return cache.get(key)}
export function lineagePortraitBounds(genes,options={}){const data=dataFor(genes,options);if(!data.bounds){boundsMeasurements++;data.bounds=Object.freeze(creatureFootprint(data.animal,options.dir??2))}return data.bounds}
export function drawLineagePortrait(canvas,genes,options={}){
 if(!canvas?.getContext||!genes)return;const{frame=1,dir=2,emphasis=false,fitScale=null}=options,data=dataFor(genes,options),bounds=lineagePortraitBounds(genes,options),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);
 c.fillStyle=emphasis?'rgba(221,197,111,.28)':'rgba(116,136,102,.16)';c.fillRect(18,h-25,w-36,1);c.fillStyle=emphasis?'rgba(170,154,91,.34)':'rgba(78,96,71,.26)';for(let x=25;x<w-22;x+=17)c.fillRect(x,h-21-(x%4),1,2);
 const scale=Math.min(fitScale??Infinity,(w-36)/bounds.w,(h-36)/bounds.h,8);c.save();c.translate(Math.round(w/2-bounds.x*scale),Math.round(h/2-bounds.y*scale));c.fillStyle='rgba(0,0,0,.22)';c.fillRect(-14*scale/2,6*scale,14*scale,2*scale);drawGenvoSprite(c,{animal:data.animal,phenotype:data.phenotype,scale,frame,moving:false,palette:data.palette,pose:{dir,action:'idle',life:{breath:.5}}});c.restore();
}
