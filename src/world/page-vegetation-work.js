// D1: REAL daily vegetation work is partitioned by existing World pages, while
// retaining the original global row-major cell order and one canonical World.
// No virtual flora, offscreen budget, skipped cells, asynchronous task or RNG.
import {WORLD_PAGE_SIZE} from './pages.js';
export const PAGE_VEGETATION_WORK_SCHEMA=1;
const safe=n=>Number.isSafeInteger(n)&&n>=0;
function geometry(w){
 if(!safe(w?.n)||!w.n||!safe(w.len)||w.len!==w.n*w.n||!(w.water instanceof Uint8Array)||w.water.length!==w.len)throw Error('Invalid vegetation page geometry.');
 return Math.ceil(w.n/WORLD_PAGE_SIZE);
}
export function beginPageVegetationDay(sim){
 const grid=geometry(sim.world),day=sim.day,previous=sim.pageDayWork;
 if(!safe(day))throw Error('Invalid vegetation work day.');
 if(previous!==undefined)validatePageDayWork(previous,sim.world);
 if(previous?.pendingDay!==null&&previous?.pendingDay!==undefined)throw Error('Incomplete vegetation day: restore a pre-step checkpoint before retry.');
 if(previous?.lastDay===day)return false;
 if(previous&&previous.lastDay>day)throw Error('Vegetation day moved backwards.');
 sim.pageDayWork={schema:PAGE_VEGETATION_WORK_SCHEMA,lastDay:previous?.lastDay??-1,
   pendingDay:day,counts:previous?.counts||new Uint32Array(grid*grid),processed:previous?.processed??0};
 return true;
}
// Called only by the producer phase. Traversal is still exact i=0,1,...,len-1
// so all legacy random draws, resource allocation and dispersal effects are
// deterministic and in the same order regardless of page cache/window.
export function visitLandByWorldPage(w,visitor){
 const grid=geometry(w),counts=new Uint32Array(grid*grid),n=w.n;
 if(typeof visitor!=='function')throw Error('Vegetation page work requires a visitor.');
 for(let y=0;y<n;y++){
  const row=y*n,pageRow=Math.floor(y/WORLD_PAGE_SIZE)*grid;
  for(let px=0;px<grid;px++){
   const x0=px*WORLD_PAGE_SIZE,x1=Math.min(n,x0+WORLD_PAGE_SIZE),page=pageRow+px;
   for(let x=x0;x<x1;x++){const i=row+x;if(w.water[i])continue;visitor(i);counts[page]++;}
  }
 }
 return counts;
}
export function completePageVegetationDay(sim,counts){
 const w=sim.world,grid=geometry(w),previous=sim.pageDayWork,day=sim.day;
 if(previous?.schema!==PAGE_VEGETATION_WORK_SCHEMA||previous.pendingDay!==day||
   !(counts instanceof Uint32Array)||counts.length!==grid*grid)throw Error('Invalid vegetation completion.');
 let total=0;
 for(let py=0;py<grid;py++)for(let px=0;px<grid;px++){
  const width=Math.min(WORLD_PAGE_SIZE,w.n-px*WORLD_PAGE_SIZE),height=Math.min(WORLD_PAGE_SIZE,w.n-py*WORLD_PAGE_SIZE);
  const count=counts[py*grid+px];if(count>width*height)throw Error('Vegetation page processed beyond its bounds.');
  total+=count;
 }
 // Completion is recorded AFTER the original finite-resource producer work and
 // dispersal finish. A failed step remains pending and cannot be silently replayed.
 sim.pageDayWork={schema:PAGE_VEGETATION_WORK_SCHEMA,lastDay:day,pendingDay:null,counts,processed:total};
 return sim.pageDayWork;
}
export function validatePageDayWork(state,w){
 if(state===undefined)return;
 const grid=geometry(w);
 if(state?.schema!==PAGE_VEGETATION_WORK_SCHEMA||!Number.isSafeInteger(state.lastDay)||state.lastDay< -1||
   !(state.counts instanceof Uint32Array)||state.counts.length!==grid*grid||!safe(state.processed)||
   state.pendingDay!==null)throw Error('Invalid saved vegetation page work receipt.');
 let total=0;
 for(let py=0;py<grid;py++)for(let px=0;px<grid;px++){
  const cap=Math.min(WORLD_PAGE_SIZE,w.n-px*WORLD_PAGE_SIZE)*Math.min(WORLD_PAGE_SIZE,w.n-py*WORLD_PAGE_SIZE);
  const v=state.counts[py*grid+px];if(v>cap)throw Error('Invalid vegetation page work counts.');
  total+=v;
 }
 if(total!==state.processed)throw Error('Vegetation page totals do not reconcile.');
}
