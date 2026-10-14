import {visualCompositionAt} from './composition.js';

// Pure renderer-side habitat scene interpretation. A scene is a visual summary of
// ecology that already exists: moisture, plant biomass, environmental history and
// water adjacency. It never creates resources, alters pathing, or consumes sim RNG.
const FOOD=['sunmoss','bramble','marshroot','thistlepod'];
const STRUCTURAL=['bramble','marshroot','thistlepod'];

export function habitatSceneAt(sim,x,y,habitatField=null,radius=2){
  const w=sim.world,ix=Math.max(0,Math.min(w.n-1,Math.round(x))),iy=Math.max(0,Math.min(w.n-1,Math.round(y)));
  if(w.water[w.idx(ix,iy)])return {kind:'water',score:0,x:ix,y:iy};
  const comp=visualCompositionAt(w,x+.5,y+.5,habitatField),sum={moisture:0,fertility:0,food:0,structural:0,marshroot:0,bramble:0,rotcap:0,thistlepod:0,traffic:0,grazing:0,nutrient:0,recovery:0,waterEdge:0},r=Math.max(1,radius|0);let count=0;
  for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){
    const nx=ix+ox,ny=iy+oy;if(nx<0||ny<0||nx>=w.n||ny>=w.n)continue;const i=w.idx(nx,ny);if(w.water[i]){sum.waterEdge++;continue}count++;
    sum.moisture+=w.moisture[i];sum.fertility+=w.fertility[i];
    for(const k of FOOD)sum.food+=w.plants[k]?.[i]||0;
    for(const k of STRUCTURAL)sum.structural+=w.plants[k]?.[i]||0;
    for(const k of ['marshroot','bramble','rotcap','thistlepod'])sum[k]+=w.plants[k]?.[i]||0;
    const h=sim.history?.cell(i);if(h){sum.traffic+=h.traffic;sum.grazing+=h.grazing;sum.nutrient+=h.nutrient;sum.recovery+=h.recovery}
  }
  const n=Math.max(1,count),area=Math.max(1,(r*2+1)**2),avg={};for(const k of Object.keys(sum))avg[k]=k==='waterEdge'?sum[k]/area:sum[k]/n;
  avg.food/=FOOD.length;avg.structural/=STRUCTURAL.length;
  const scores={
    'watering-margin':clamp01((avg.waterEdge-.05)*2.15+Math.max(0,avg.moisture-.52)*.90+avg.marshroot*.44+comp.wetPocket*.28),
    'feeding-ground':clamp01(avg.food*.98+Math.max(0,avg.fertility-.48)*.52+avg.grazing*.34+comp.richPocket*.20-comp.thicket*.12),
    'game-trail':clamp01(avg.traffic*1.45+comp.corridor*.25+avg.grazing*.09),
    'fungal-hollow':clamp01(avg.rotcap*5.8+avg.nutrient*.78+Math.max(0,avg.moisture-.42)*.16),
    'recovery-patch':clamp01(avg.recovery*1.72+avg.grazing*.16+avg.fertility*.10),
    'thicket-pocket':clamp01(avg.structural*.82+avg.bramble*.38+comp.thicket*.48-comp.openness*.28),
    'open-clearing':clamp01(comp.openness*.82+(1-Math.min(1,avg.structural))* .32+(1-Math.min(1,avg.food))* .14)
  };
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);let [kind,score]=ranked[0];
  // Open clearings are valuable negative space, but should not displace a meaningful
  // ecological scene unless they are strongly open.
  if(kind==='open-clearing'&&score<.70){const alt=ranked.find(([k,v])=>k!=='open-clearing'&&v>.43);if(alt)[kind,score]=alt}
  if(score<.40){kind='mixed';score=.40}
  return {kind,score,x:ix,y:iy,...avg,composition:comp,scores};
}

export function collectHabitatScenes(sim,habitatField,{startX,startY,cols,rows,block=8}={}){
  const w=sim.world,b=Math.max(6,block|0),minX=Math.max(0,Math.floor((startX??0)/b)*b),minY=Math.max(0,Math.floor((startY??0)/b)*b),maxX=Math.min(w.n,(startX??0)+(cols??w.n)+b),maxY=Math.min(w.n,(startY??0)+(rows??w.n)+b),out=[];
  const offsets=[[.25,.30],[.72,.27],[.34,.70],[.74,.72],[.50,.50]];
  for(let by=minY;by<maxY;by+=b)for(let bx=minX;bx<maxX;bx+=b){let best=null;
    for(const [fx,fy] of offsets){const x=Math.min(w.n-1,Math.max(0,Math.floor(bx+fx*b))),y=Math.min(w.n-1,Math.max(0,Math.floor(by+fy*b))),i=w.idx(x,y);if(w.water[i])continue;const scene=habitatSceneAt(sim,x,y,habitatField,2),bias=anchorBias(w.seedHash,bx,by,x,y),rank=scene.score+bias*.075;if(!best||rank>best.rank)best={...scene,rank}}
    if(!best)continue;
    const threshold=best.kind==='open-clearing'?.84:best.kind==='game-trail'?.50:best.kind==='fungal-hollow'?.43:.44;if(best.score<threshold)continue;if(best.kind==='open-clearing'&&anchorBias(w.seedHash^0x51f15e,bx,by,best.x,best.y)<.42)continue;
    out.push(best);
  }
  return out;
}

function anchorBias(seed,bx,by,x,y){let n=(seed^Math.imul(bx+374761393,668265263)^Math.imul(by+1274126177,2246822519)^Math.imul(x*31+y,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function clamp01(v){return Math.max(0,Math.min(1,v))}
