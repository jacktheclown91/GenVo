import {iceAmount,liquidVolume,surfaceIceCovered} from '../world/surface-ice.js';
// Live presentation of the actual owned liquid column, never a water source,
// shoreline, collision or sediment authority. Old worlds without volume stay exact.
const MASK_LIMIT=256,runsByMask=new Map(),EMPTY=Object.freeze([]),FULL=Object.freeze([Object.freeze([0,0,16,16])]);
export function waterColumnReading(world,i){
  if(!world?.water?.[i]||surfaceIceCovered(world.environment,i))return null;
  const stored=world.environment?.volume?.[i];if(!Number.isFinite(stored)||stored<0)return null;
  const liquid=liquidVolume(world.environment,i,stored);
  if(!Number.isFinite(liquid)||liquid<0)return null;
  if(liquid<=1e-8){
    // A frozen column is ice, never an exposed dry bed.
    return iceAmount(world.environment,i)>0?null:{kind:'dry',liquid:0,alpha:1,color:'#615e46'};
  }
  const clarity=Math.max(0,1-liquid/.6),alpha=.30*clarity*clarity;
  return alpha<.015?null:{kind:'shallow',liquid,alpha,color:'#9c9770'};
}
export function waterColumnRuns(mask){
  if(!mask||mask.empty)return EMPTY;if(mask.full)return FULL;
  const cached=runsByMask.get(mask);if(cached)return cached;
  const res=Math.sqrt(mask.length);if(!Number.isInteger(res)||res<1||res>64)return EMPTY;
  const rows=[],step=16/res;
  for(let y=0;y<res;y++){
    let start=-1;
    for(let x=0;x<=res;x++){
      const on=x<res&&mask[y*res+x]===1;
      if(start>=0&&!on){rows.push(Object.freeze([start*step,y*step,(x-start)*step,step]));start=-1;}
      if(on&&start<0)start=x;
    }
  }
  const result=Object.freeze(rows);if(runsByMask.size>=MASK_LIMIT)runsByMask.delete(runsByMask.keys().next().value);runsByMask.set(mask,result);return result;
}
export function drawWaterColumn(ctx,{world,x,y,mask,px,py,u}){
  const reading=waterColumnReading(world,world.idx(x,y));if(!reading)return false;
  const runs=waterColumnRuns(mask);if(!runs.length)return false;
  ctx.save();try{
    ctx.globalAlpha*=reading.alpha;ctx.fillStyle=reading.color;
    for(const [rx,ry,w,h] of runs)ctx.fillRect(px+rx*u,py+ry*u,w*u,h*u);
  }finally{ctx.restore()}
  return true;
}
