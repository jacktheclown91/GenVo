import {GIANT_SIZE,bodyDimensions,contactReach} from '../organisms/body-size.js';
import {developmentFor} from '../family/family.js';
// Cosmetic contact with the existing foreground fringe. No biomass, collision,
// movement, resource or biological event is written by this field.
export function foliageContactRadius(sim,animal){
  if(!animal?.alive||animal.underground||animal.airborne||animal.perched||animal.climb||(animal.diveDepth||0)>.03)return 0;
  const current=bodyDimensions(animal,developmentFor(animal)).currentScale;
  const radius=contactReach(sim,1.15,current,1);
  return Number.isFinite(radius)&&radius>0?radius:0;
}
export class FoliageContactField{
  constructor({maxCells=32768}={}){this.maxCells=maxCells;this.owners=[];this.strengths=new Float32Array(0);this.width=0;this.height=0;}
  prepare(sim,{startX,startY,cols,rows,animals=sim.animals,positionFor=null}={}){
    if(sim.bodySizeRules!==GIANT_SIZE.policy){this.clear();return false;}
    const n=sim.world.n,x0=Math.max(0,startX),y0=Math.max(0,startY),x1=Math.min(n,startX+cols),y1=Math.min(n,startY+rows);
    const width=Math.max(0,x1-x0),height=Math.max(0,y1-y0),cells=width*height;
    if(!Number.isSafeInteger(cells)||cells>this.maxCells){this.clear();return false;}
    if(this.strengths.length<cells){this.strengths=new Float32Array(cells);this.owners=new Array(cells);}
    this.owners.fill(null);this.strengths.fill(0,0,cells);
    this.x0=x0;this.y0=y0;this.width=width;this.height=height;this.stats={actors:0,probes:0,activeCells:0,cells};
    for(const animal of animals||[]){
      const radius=foliageContactRadius(sim,animal);if(!radius)continue;
      const position=positionFor?positionFor(animal):animal;if(!Number.isFinite(position?.x)||!Number.isFinite(position?.y))continue;
      const ax=position.x,ay=position.y,left=Math.max(x0,Math.ceil(ax-radius-.5)),right=Math.min(x1-1,Math.floor(ax+radius-.5)),top=Math.max(y0,Math.ceil(ay-radius-.5)),bottom=Math.min(y1-1,Math.floor(ay+radius-.5));
      if(left>right||top>bottom)continue;
      const contact={animal,x:ax,y:ay,radius};this.stats.actors++;
      for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
        this.stats.probes++;const dx=x+.5-ax,dy=y+.5-ay,d2=dx*dx+dy*dy;if(d2>=radius*radius)continue;
        const strength=1-Math.sqrt(d2)/radius,index=(y-y0)*width+x-x0;
        if(strength<=this.strengths[index])continue;
        if(!this.owners[index])this.stats.activeCells++;
        this.owners[index]=contact;this.strengths[index]=strength;
      }
    }
    return true;
  }
  clear(){if(this.width||this.height)this.owners.fill(null);this.width=this.height=0;}
  at(x,y){
    const dx=x-this.x0,dy=y-this.y0;if(dx<0||dy<0||dx>=this.width||dy>=this.height)return null;
    const index=dy*this.width+dx,contact=this.owners[index];if(!contact)return null;
    const ox=x+.5-contact.x,oy=y+.5-contact.y,distance=Math.hypot(ox,oy),length=Math.max(.001,distance);
    return{animal:contact.animal,distance,x:ox/length,y:oy/length,strength:this.strengths[index]};
  }
}

// Unsigned, deterministic tile variation. The old signed right shift folded
// the upper half into [0,.5], making moss/bramble fringe thresholds unreachable.
export function foliageFringeHash(x,y,salt=1213){
  let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(salt|0,1442695041))>>>0;
  n=Math.imul(n^(n>>>13),1274126177)>>>0;
  return ((n^(n>>>16))>>>0)/4294967295;
}
