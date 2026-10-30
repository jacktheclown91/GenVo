// Measured plant regrowth (breeding-support/2, stabilization October 30).
// The vegetation step already computes each producer's realised growth: water,
// minerals, stored energy, temperature, moisture, season and snow all applied.
// Under breeding-support/2 it is recorded per producer kind and per 4 x 4-cell
// block, and each vegetation day rolls the day's totals into a running mean over
// the last 15 days (a plain mean until 15 days exist). Breeding support reads
// this measured renewable food instead of a logistic estimate that ran up to
// seventeen times the real regrowth.
export const MEASURED_BREEDING_SUPPORT='breeding-support/2';
export const PLANT_REGROWTH=Object.freeze({schema:1,block:4,days:15});
export const measuredRegrowth=sim=>sim?.breedingSupportRules===MEASURED_BREEDING_SUPPORT;
const blocksFor=w=>Math.ceil(w.n/PLANT_REGROWTH.block);
const blockOf=(w,i)=>{const b=PLANT_REGROWTH.block,n=blocksFor(w);return Math.floor((i/w.n|0)/b)*n+Math.floor(i%w.n/b)};
function regrowthRecord(w,kinds){
 const r=w.plantResources;if(r.regrowth)return r.regrowth;const size=blocksFor(w)**2;
 return r.regrowth={schema:PLANT_REGROWTH.schema,block:PLANT_REGROWTH.block,days:0,
  average:Object.fromEntries(kinds.map(k=>[k,new Float64Array(size)])),today:Object.fromEntries(kinds.map(k=>[k,new Float64Array(size)]))};
}
// Start of a vegetation day: yesterday's realised growth joins the running mean.
export function rollPlantRegrowth(sim,kinds){
 if(!measuredRegrowth(sim))return;const g=regrowthRecord(sim.world,kinds),weight=1/Math.min(PLANT_REGROWTH.days,g.days+1);
 if(g.started){for(const k of Object.keys(g.today)){const avg=g.average[k],day=g.today[k];for(let b=0;b<avg.length;b++){avg[b]+=(day[b]-avg[b])*weight;day[b]=0}}g.days++}
 g.started=true;
}
export function notePlantRegrowth(sim,kind,i,before,after){
 if(!(after>before)||!measuredRegrowth(sim))return;const g=sim.world.plantResources.regrowth,day=g?.today[kind];if(day)day[blockOf(sim.world,i)]+=after-before;
}
// Measured daily regrowth biomass per cell of the block holding (x, y); null
// before a full day has been measured.
export function regrowthPerCell(w,kind,x,y){
 const g=w.plantResources?.regrowth;if(!g?.days||!g.average[kind])return null;
 const i=w.idx(x,y);return g.average[kind][blockOf(w,i)]/PLANT_REGROWTH.block**2;
}
export function validatePlantRegrowth(w,g){
 if(g===undefined)return;const size=blocksFor(w)**2;
 if(g?.schema!==PLANT_REGROWTH.schema||g.block!==PLANT_REGROWTH.block||!Number.isSafeInteger(g.days)||g.days<0||(g.started!==undefined&&g.started!==true))throw Error('Invalid measured plant regrowth.');
 for(const field of [g.average,g.today])for(const a of Object.values(field||{}))if(!(a instanceof Float64Array)||a.length!==size||a.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid measured plant regrowth.');
}
