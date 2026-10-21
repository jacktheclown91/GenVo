import {CFG,PLANTS} from '../sim/config.js';
import {groundDiet} from './functional-diet.js';
import {creatureView,viewCanSee,atmosphereAt,visuallyObservable} from './atmospheric-visibility.js';
import {partEffectFactors} from '../lineage/part-abilities.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CELL=2,MAX_CELLS=800,MAX_REGIONS=4;
// This is remembered, observed information, not a copy of live world state.
// A creature's own survey is stored on its animal record and saved normally.
export function sensoryRegionKey(world){
 const origin=world.regionOrigin||{x:0,y:0};
 return String(world.seedHash||world.seed||0)+':'+origin.x+','+origin.y;
}
export function sensoryProfile(animal){
 const parts=new Set((animal?.bodyPlan?.nodes||[]).map(n=>n.partId));
 const scale=clamp(animal?.genes?.senses||1,.3,2.5),effect=partEffectFactors(animal)||{};
 const hearing=clamp(4.2*scale*(parts.has('echo-crest')?1.6:1)*(parts.has('sensory-bristle')?1.2:1),1.5,16);
 const scent=clamp(3.7*scale*(parts.has('sensory-quills')?1.4:1)*(parts.has('sensory-bristle')?1.2:1)*(effect.cue||1),1.4,16);
 return{hearing,scent,echo:parts.has('echo-crest'),vibration:parts.has('sensory-quills')};
}
function ensureMemory(animal){
 if(!animal.sensoryMemory||animal.sensoryMemory.schema!==1||!animal.sensoryMemory.regions||
   typeof animal.sensoryMemory.regions!=='object'){
  animal.sensoryMemory={schema:1,regions:{}};
 }
 return animal.sensoryMemory;
}
export function recordSensoryMemory(sim,animal=sim.player?.()){
 if(!animal||sim.sensoryFogEnabled===false||!sim.world)return 0;
 const world=sim.world,view=creatureView(sim,animal),memory=ensureMemory(animal),key=sensoryRegionKey(world);
 if(!view)return 0;
 const regions=memory.regions;
 if(!Object.hasOwn(regions,key)){
  const old=Object.keys(regions);
  if(old.length>=MAX_REGIONS)delete regions[old[0]];
  regions[key]=[];
 }
 const known=new Map(regions[key].map(row=>[row[0]+','+row[1],row]));
 const cx=Math.floor(animal.x/CELL),cy=Math.floor(animal.y/CELL),r=Math.min(14,Math.ceil(view.range/CELL)+1);
 let added=0;
 for(let y=Math.max(0,cy-r);y<=Math.min(Math.ceil(world.n/CELL)-1,cy+r);y++)
  for(let x=Math.max(0,cx-r);x<=Math.min(Math.ceil(world.n/CELL)-1,cx+r);x++){
   const wx=Math.min(world.n-.5,x*CELL+CELL/2),wy=Math.min(world.n-.5,y*CELL+CELL/2);
   if(!viewCanSee(view,wx,wy))continue;
   const kind=world.water[world.idx(wx,wy)]?1:0,k=x+','+y;
   if(known.has(k)){const row=known.get(k);row[2]=kind;row[3]=sim.tickCount}
   else {known.set(k,[x,y,kind,sim.tickCount]);added++}
  }
 const recent=[...known.values()].sort((a,b)=>b[3]-a[3]).slice(0,MAX_CELLS);
 regions[key]=recent;
 return added;
}
export function rememberedCells(sim,animal){
 const rows=animal?.sensoryMemory?.regions?.[sensoryRegionKey(sim.world)]||[];
 return new Map(rows.map(row=>[row[0]+','+row[1],row]));
}
export function sensorySignals(sim,animal=sim.player?.(),maxSignals=3){
 if(!animal||!sim.world)return[];
 const profile=sensoryProfile(animal),view=creatureView(sim,animal);
 const candidate=[],w=sim.world,weather=atmosphereAt(sim,animal.x,animal.y);
 for(const other of sim.animals||[]){
  if(!other.alive||other.id===animal.id||!!other.underground!==!!animal.underground)continue;
  const dx=other.x-animal.x,dy=other.y-animal.y,d=Math.hypot(dx,dy);
  if(d<1.6||d>Math.max(profile.hearing,profile.scent))continue;
  if(visuallyObservable(sim,animal,other))continue;
  const active=other.intent==='attack'||other.intent==='mate'||other.intent==='flee'||other.intent==='hunt'||other.intent==='escape';
  const audible=active?profile.hearing:profile.hearing*.55;
  if(d<audible)candidate.push({kind:'heard',angle:Math.atan2(dy,dx),score:(audible-d)/audible+(active?.4:0),uncertainty:active?.32:.55});
  if(d<profile.scent){
   const wind=weather.wind||{},moved=(animal.x-other.x)*(wind.east||0)+(animal.y-other.y)*(wind.south||0);
   const scentRange=profile.scent*(moved<-.1?.55:1)*(1-clamp(weather.liquid||0,0,.7)*.35);
   if(d<scentRange)candidate.push({kind:'scent',angle:Math.atan2(dy,dx),score:(scentRange-d)/scentRange,uncertainty:.65});
  }
 }
 // Plant odors originate from edible biomass, not synthetic quest markers.
 const diet=groundDiet(animal),edible=Object.keys(diet).filter(kind=>diet[kind]>0&&PLANTS[kind]&&w.plants?.[kind]);
 if(edible.length&&profile.scent>2){
  const radius=Math.min(8,Math.ceil(profile.scent));
  let best=null;
  for(let y=Math.max(0,Math.floor(animal.y-radius));y<=Math.min(w.n-1,Math.ceil(animal.y+radius));y+=2)
   for(let x=Math.max(0,Math.floor(animal.x-radius));x<=Math.min(w.n-1,Math.ceil(animal.x+radius));x+=2){
    const d=Math.hypot(x+.5-animal.x,y+.5-animal.y);
    if(d<2||d>profile.scent||viewCanSee(view,x+.5,y+.5))continue;
    const i=w.idx(x,y),stock=edible.reduce((sum,kind)=>sum+(w.plants[kind][i]||0)*diet[kind],0);
    if(stock<.35)continue;
    const score=Math.min(1,stock)/Math.max(1,d);
    if(!best||score>best.score)best={kind:'food scent',angle:Math.atan2(y+.5-animal.y,x+.5-animal.x),score,uncertainty:.7};
   }
  if(best)candidate.push(best);
 }
 candidate.sort((a,b)=>b.score-a.score);
 const seen=new Set();
 return candidate.filter(x=>{if(seen.has(x.kind))return false;seen.add(x.kind);return true}).slice(0,maxSignals);
}
export const sensoryMemoryCellSize=CELL;
