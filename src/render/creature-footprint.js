import {adultSizeScale} from '../organisms/body-size.js';
import {drawGenvoSprite} from './genvo-draw.js';
import {phenotypeFor} from '../organisms/species.js';
import {creaturePalette} from './creature-palette.js';
// Measure the actual authored assembly, including its entire gait, for a stable fit.
export function creatureFootprint(animal,dir,{authoredParts,action='walk',moving=true,poseForFrame=null}={}){
  const cv=document.createElement('canvas');
  cv.width=cv.height=768;
  const c=cv.getContext('2d');
  c.imageSmoothingEnabled=false;
  c.translate(384,384);
  const ph=phenotypeFor(animal);
  for(let frame=0;frame<8;frame++){
    drawGenvoSprite(c,{animal,phenotype:ph,scale:6*adultSizeScale(animal),frame,moving,authoredParts,
      palette:creaturePalette(ph),pose:{dir,action,...(poseForFrame?.(frame)||{})}});
  }
  const data=c.getImageData(0,0,768,768).data;
  let x0=768,y0=768,x1=-1,y1=-1;
  for(let y=0;y<768;y++)for(let x=0;x<768;x++)if(data[(y*768+x)*4+3]){
    x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
  }
  return x1<0?{x:0,y:0,w:16,h:16}:
    {x:((x0+x1)/2-384)/6,y:((y0+y1)/2-384)/6,w:(x1-x0+1)/6,h:(y1-y0+1)/6};
}
