import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';

// Learned home ranges for the founder-connected lineage. A home range is not a
// hard ownership tile-map: it emerges from repeated use, fades with time, and
// only its familiar core can produce non-lethal territorial pressure.
export class TerritoryController{
  constructor(sim){
    this.sim=sim;
    this.states=new Map();
    this.cellSize=8;
    this.showOverlay=false;
  }
  enabled(animal){return !!(animal&&animal.species==='genvo'&&(animal.lineage||animal.player))}
  ensure(animal){
    if(!animal)return null;
    let state=this.states.get(animal.id);
    if(!state){state={cells:new Map(),home:null,radius:0,established:false,totalFamiliarity:0,intruder:null,lastRecompute:-1};this.states.set(animal.id,state)}
    return state;
  }
  state(animal){return this.states.get(animal?.id)||this.ensure(animal)}
  observe(){
    for(const animal of this.sim.animals){
      if(!this.enabled(animal)||!animal.alive)continue;
      const state=this.ensure(animal);
      this.visit(animal,state);
      if(state.lastRecompute!==this.sim.day){this.recompute(animal,state);state.lastRecompute=this.sim.day}
      state.intruder=this.findIntruder(animal,state);
      if(state.intruder)this.sim.cognition.recordOnce(animal,`intruder:${state.intruder.id}`,`Found intruder #${state.intruder.id} near home`,{id:state.intruder.id});
    }
  }
  visit(animal,state=this.ensure(animal)){
    if(this.sim.world.water[this.sim.world.idx(animal.x,animal.y)])return null;
    const cx=Math.floor(animal.x/this.cellSize),cy=Math.floor(animal.y/this.cellSize),key=`${cx},${cy}`;
    let cell=state.cells.get(key);
    if(!cell){cell={key,cx,cy,x:(cx+.5)*this.cellSize,y:(cy+.5)*this.cellSize,visits:0,lastTick:this.sim.tickCount};state.cells.set(key,cell)}
    // Eight observations at 8 Hz amount to roughly one familiarity unit/day.
    cell.visits+=CFG.lifeStride/CFG.dayTicks;cell.lastTick=this.sim.tickCount;
    return cell;
  }
  effective(cell){
    const ageDays=Math.max(0,(this.sim.tickCount-cell.lastTick)/CFG.dayTicks);
    return cell.visits*Math.max(.18,1-ageDays/160);
  }
  recompute(animal,state=this.ensure(animal)){
    let cells=[...state.cells.values()].map(c=>({cell:c,weight:this.effective(c)})).filter(v=>v.weight>.04).sort((a,b)=>b.weight-a.weight).slice(0,16);
    const arrival=this.sim.migration.states.get(animal.id)?.dispersalArrival;
    const anchor=arrival||state.residenceAnchor;
    if(anchor&&Math.hypot(animal.x-anchor.x,animal.y-anchor.y)<=6){
      const local=cells.filter(v=>Math.hypot(v.cell.x-anchor.x,v.cell.y-anchor.y)<=8);
      const newVisits=arrival?local.reduce((n,v)=>n+v.cell.visits,0)-(arrival.visitBaseline||0):Infinity;
      if(local.reduce((n,v)=>n+v.weight,0)>=2.5&&newVisits>=2.5){
        if(arrival&&state.residenceAnchor?.arrivalDay!==arrival.day){
          state.homeHistory=state.homeHistory||[];if(state.home)state.homeHistory.push({home:{...state.home},day:this.sim.day});
          state.residenceAnchor={x:arrival.x,y:arrival.y,arrivalDay:arrival.day,establishedDay:this.sim.day};
        }
        cells=local;
      }
    }
    const total=cells.reduce((n,v)=>n+v.weight,0);state.totalFamiliarity=total;
    if(!cells.length){state.home=null;state.radius=0;return state}
    let x=0,y=0;for(const v of cells){x+=v.cell.x*v.weight;y+=v.cell.y*v.weight}x/=total;y/=total;
    let variance=0;for(const v of cells){const d=Math.hypot(v.cell.x-x,v.cell.y-y);variance+=d*d*v.weight}variance/=total;
    const wasEstablished=state.established;
    state.home={x,y};state.radius=clamp(5,18,5+Math.sqrt(variance)*.72);state.established=total>=2.5;
    if(state.established&&!wasEstablished)this.sim.cognition.recordOnce(animal,'home-established','Settled into a home range',{x,y,radius:state.radius});
    return state;
  }
  familiarityAt(animal,x,y){
    const state=this.state(animal);if(!state)return 0;
    const key=`${Math.floor(x/this.cellSize)},${Math.floor(y/this.cellSize)}`,cell=state.cells.get(key);
    if(!cell)return 0;return clamp(0,1,this.effective(cell)/8);
  }
  coreRadius(animal){const s=this.state(animal);return s?.established?Math.max(3,Math.min(8,s.radius*.55)):0}
  findIntruder(animal,state=this.state(animal)){
    if(!state?.established||animal.age<SPECIES[animal.species].maturity)return null;
    const radius=this.coreRadius(animal),home=state.home;if(!home)return null;
    let best=null,bestD=Infinity;
    this.sim.forEachNearby({x:home.x,y:home.y},radius,b=>{
      if(!b.alive||b.id===animal.id||b.species!==animal.species)return;
      if(this.sim.cognition.relation(animal,b)!=='unrelated')return;
      const d=Math.hypot(b.x-home.x,b.y-home.y);if(d<bestD){bestD=d;best=b}
    });
    return best;
  }
  returnTarget(animal){
    if(!this.enabled(animal)||this.sim.isManualPlayer?.(animal))return null;
    const state=this.state(animal);if(!state?.established||!state.home)return null;
    const d=Math.hypot(animal.x-state.home.x,animal.y-state.home.y);
    const range=this.sim.specialization?.rangeMultiplier(animal)??1;
    return d>state.radius*1.2*range?{x:state.home.x,y:state.home.y,home:true}:null;
  }
  pressureTarget(animal){
    const p=animal?.territoryPressure;if(!p||this.sim.isManualPlayer?.(animal))return null;
    if(p.untilTick<=this.sim.tickCount){animal.territoryPressure=null;return null}
    const dx=animal.x-p.x,dy=animal.y-p.y,len=Math.hypot(dx,dy)||1;
    return{x:animal.x+dx/len*6,y:animal.y+dy/len*6,pressure:true};
  }
  intrusionResponse(animal){
    if(!this.enabled(animal)||this.sim.isManualPlayer?.(animal))return null;
    const state=this.state(animal);if(!state?.established)return null;
    const intruder=this.findIntruder(animal,state);state.intruder=intruder;
    if(!intruder)return null;
    const profile=this.sim.cognition.temperament(animal);
    if(profile.boldness>=.98)return{intent:'ward',target:intruder,intruder};
    const dx=animal.x-intruder.x,dy=animal.y-intruder.y,len=Math.hypot(dx,dy)||1;
    const home=state.home;
    return{intent:'avoid-intruder',target:{x:(home?.x??animal.x)+dx/len*3,y:(home?.y??animal.y)+dy/len*3},intruder};
  }
  applyWard(owner,intruder){
    if(!owner||!intruder||!owner.alive||!intruder.alive)return false;
    intruder.territoryPressure={x:owner.x,y:owner.y,ownerId:owner.id,untilTick:this.sim.tickCount+CFG.simHz*2};
    owner.energy=Math.max(0,owner.energy-.25);
    this.sim.cognition.recordOnce(owner,`warded:${intruder.id}`,`Drove intruder #${intruder.id} away from home`,{id:intruder.id});
    return true;
  }
  roamTarget(animal,baseDistance){
    const state=this.state(animal);if(!state?.established||!state.home)return null;
    const range=this.sim.specialization?.rangeMultiplier(animal)??1;
    const familiar=[...state.cells.values()].map(c=>({cell:c,weight:this.effective(c)})).filter(v=>v.weight>.12).sort((a,b)=>b.weight-a.weight).slice(0,8);
    if(familiar.length&&this.sim.rng.chance(.62)){
      const total=familiar.reduce((n,v)=>n+v.weight,0),pick=this.sim.rng.range(0,total);let acc=0,chosen=familiar[0].cell;
      for(const v of familiar){acc+=v.weight;if(acc>=pick){chosen=v.cell;break}}
      const target={x:chosen.x+this.sim.rng.range(-this.cellSize*.35,this.cellSize*.35),y:chosen.y+this.sim.rng.range(-this.cellSize*.35,this.cellSize*.35),familiar:true};
      return this.sim.stalkerTerritory?.adjustRoamTarget?.(animal,target)||target;
    }
    const angle=this.sim.rng.range(0,Math.PI*2),distance=Math.min(state.radius*.9*range,Math.max(2,baseDistance*range));
    const target={x:state.home.x+Math.cos(angle)*distance,y:state.home.y+Math.sin(angle)*distance,homeRoam:true};
    return this.sim.stalkerTerritory?.adjustRoamTarget?.(animal,target)||target;
  }
  snapshot(animal){
    const state=this.state(animal);if(!state)return null;
    const cells=[...state.cells.values()].map(c=>({...c,familiarity:this.effective(c)})).sort((a,b)=>b.familiarity-a.familiarity);
    const home=state.home?{...state.home,radius:state.radius,coreRadius:this.coreRadius(animal),distance:Math.hypot(animal.x-state.home.x,animal.y-state.home.y)}:null;
    return{established:state.established,totalFamiliarity:state.totalFamiliarity,home,cells,intruder:state.intruder,familiarityHere:this.familiarityAt(animal,animal.x,animal.y)};
  }
}

function clamp(min,max,v){return Math.max(min,Math.min(max,v))}
