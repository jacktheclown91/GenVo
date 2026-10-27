import {CFG} from '../sim/config.js';
import {dayTicksFor} from '../sim/day-clock.js';
import {HOME_FAMILIARITY,weightedHomeRange} from '../cognition/learned-range.js';

// Population memory observes real occupied time. It does not enable territorial
// behavior, player lineage ownership, food, movement or a second range controller.
export function observePopulationResidence(memory,rules){
 const {sim,natural:state}=memory,weight=CFG.lifeStride/dayTicksFor(sim);
 state.spatialResidence??=new Map();state.spatialAnchors??=new Map();
 if(state.spatialDay!==sim.day){
  state.spatialDay=sim.day;state.spatialAnchors.clear();
  for(const [id,days] of state.spatialResidence){
   for(const day of days.keys())if(day<=sim.day-rules.residenceDays)days.delete(day);
   if(!days.size)state.spatialResidence.delete(id);
  }
 }
 const size=sim.territory.cellSize;
 for(const animal of sim.animals){
  if(!animal.alive)continue;
  let days=state.spatialResidence.get(animal.id);
  if(!days){days=new Map();state.spatialResidence.set(animal.id,days)}
  let cells=days.get(sim.day);if(!cells){cells=new Map();days.set(sim.day,cells)}
  const cx=Math.floor(animal.x/size),cy=Math.floor(animal.y/size),key=`${cx},${cy}`;
  let cell=cells.get(key);
  if(!cell){cell={key,x:(cx+.5)*size,y:(cy+.5)*size,visits:0,lastTick:sim.tickCount,
   actualX:animal.x,actualY:animal.y};cells.set(key,cell)}
  cell.visits+=weight;cell.lastTick=sim.tickCount;cell.actualX=animal.x;cell.actualY=animal.y;
  if(state.spatialAnchors.get(animal.id)?.qualified===false)state.spatialAnchors.delete(animal.id);
 }
}
export function populationResidencePoint(memory,animal,rules){
 const {sim,natural:state}=memory,days=state?.spatialResidence?.get(animal.id);
 if(!days)return animal;
 const cached=state.spatialAnchors.get(animal.id);
 if(cached?.day===sim.day&&cached.qualified)return cached;
 if(cached?.tick===sim.tickCount&&!cached.qualified)return animal;
 state.spatialAnchors.set(animal.id,{day:sim.day,tick:sim.tickCount,qualified:false});
 const merged=new Map();
 for(const [day,cells] of days){
  if(day<=sim.day-rules.residenceDays)continue;
  for(const [key,cell] of cells){
   const previous=merged.get(key);
   if(!previous)merged.set(key,{...cell});
   else{
    previous.visits+=cell.visits;
    if(cell.lastTick>previous.lastTick){previous.lastTick=cell.lastTick;previous.actualX=cell.actualX;previous.actualY=cell.actualY}
   }
  }
 }
 const cells=[...merged.values()].sort((a,b)=>b.visits-a.visits).slice(0,16);
 const range=weightedHomeRange(cells.map(cell=>({cell,weight:cell.visits})));
 if(!range?.established)return animal;
 // Use a real occupied point, never a centroid in water or across an obstacle.
 const anchor=cells.slice().sort((a,b)=>Math.hypot(a.actualX-range.x,a.actualY-range.y)-
  Math.hypot(b.actualX-range.x,b.actualY-range.y)||a.key.localeCompare(b.key))[0];
 const local=cells.filter(cell=>Math.hypot(cell.actualX-anchor.actualX,cell.actualY-anchor.actualY)<=rules.radius);
 const recent=local.some(cell=>sim.tickCount-cell.lastTick<=dayTicksFor(sim));
 if(!recent||local.reduce((sum,cell)=>sum+cell.visits,0)<HOME_FAMILIARITY||
    !sim.canReach(animal,anchor.actualX,anchor.actualY))return animal;
 const point={id:animal.id,day:sim.day,tick:sim.tickCount,qualified:true,x:anchor.actualX,y:anchor.actualY};state.spatialAnchors.set(animal.id,point);
 return point;
}

// An unfounded candidate is a census cohort, not a settlement. Follow an actual
// cohesive subgroup of its known residents BEFORE testing today's membership;
// otherwise crossing the old centre between daily censuses renames the cohort.
// Established geographic populations retain their existing site/merger rules.
export function followResidentCandidates(memory,living,rules){
 const byId=new Map(living.map(a=>[a.id,a]));
 for(const record of memory.natural.records.values()){
  if(record.status!=='candidate'||record.establishedDay!==null||record.scope==='regional-source')continue;
  const points=[...record.memberIds].map(id=>byId.get(id)).filter(Boolean)
   .map(animal=>populationResidencePoint(memory,animal,rules));
  if(points.length<2)continue;
  const clusters=points.map(seed=>({seed,members:points.filter(point=>
   Math.hypot(point.x-seed.x,point.y-seed.y)<=rules.radius&&
   memory.sim.canReach(byId.get(point.id),seed.x,seed.y))}));
  clusters.sort((a,b)=>b.members.length-a.members.length||
   Math.hypot(a.seed.x-record.x,a.seed.y-record.y)-Math.hypot(b.seed.x-record.x,b.seed.y-record.y)||
   a.seed.id-b.seed.id);
  const cluster=clusters[0].members;if(cluster.length<2)continue;
  const x=cluster.reduce((sum,p)=>sum+p.x,0)/cluster.length;
  const y=cluster.reduce((sum,p)=>sum+p.y,0)/cluster.length;
  const anchor=cluster.slice().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.id-b.id)[0];
  record.x=anchor.x;record.y=anchor.y;
 }
}
