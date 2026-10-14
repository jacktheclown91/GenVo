import {canHunt} from '../ecology/functional-diet.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';

const TIER_META=[
  {id:'seed',label:'FOOTHOLD',minCells:0,minAdults:1},
  {id:'family',label:'FAMILY RANGE',minCells:3,minAdults:2},
  {id:'expanding',label:'EXPANDING',minCells:6,minAdults:3},
  {id:'population',label:'POPULATION',minCells:10,minAdults:5}
];

// Aggregates the founder-connected family's learned ranges into one readable
// footprint. This is presence, not tile ownership: cells only count while living
// lineage members keep using them, and ordinary ecology remains authoritative.
export class FamilyExpansionController{
  constructor(sim){this.sim=sim;this.lastScoutTargets=new Map()}
  members(){return this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo')}
  adults(){return this.members().filter(a=>a.age>=SPECIES.genvo.maturity)}
  occupiedCells(){
    const merged=new Map();
    for(const animal of this.members()){
      const state=this.sim.territory?.states?.get(animal.id);if(!state)continue;
      for(const cell of state.cells.values()){
        const familiarity=this.sim.territory.effective(cell);if(familiarity<.18)continue;
        let out=merged.get(cell.key);if(!out){out={key:cell.key,cx:cell.cx,cy:cell.cy,x:cell.x,y:cell.y,familiarity:0,visitors:0,memberIds:[]};merged.set(cell.key,out)}
        out.familiarity+=familiarity;out.visitors++;out.memberIds.push(animal.id);
      }
    }
    return [...merged.values()].sort((a,b)=>b.familiarity-a.familiarity||a.key.localeCompare(b.key));
  }
  tier(cells=this.occupiedCells(),adults=this.adults()){
    let tier=TIER_META[0];for(const candidate of TIER_META)if(cells.length>=candidate.minCells&&adults.length>=candidate.minAdults)tier=candidate;
    return tier;
  }
  scoutThreshold(){return this.sim.generationProgress?.hasUnlock?.('trail-scout')?{cells:4,adults:2,label:'Trail Scout'}:{cells:6,adults:3,label:'Scout'}}
  nestThreshold(){return this.sim.generationProgress?.hasUnlock?.('kin-network')?{cells:6,adults:3,label:'Kin Network'}:{cells:8,adults:4,label:'Satellite nest'}}
  scoutUnlocked(){const cells=this.occupiedCells(),adults=this.adults(),need=this.scoutThreshold();return cells.length>=need.cells&&adults.length>=need.adults}
  nestUnlocked(){const cells=this.occupiedCells(),adults=this.adults(),shelters=this.sim.shelter?.shelters?.filter?.(s=>s.integrity>0).length||0,need=this.nestThreshold();return shelters>0&&cells.length>=need.cells&&adults.length>=need.adults}
  shelterCapacity(){
    const cells=this.occupiedCells().length,adults=this.adults().length,p=this.sim.player?.(),pairedG2=!!(p&&(p.generation||1)>=2&&p.lastMate),earlyCapacity=pairedG2?2:1;
    if(!this.nestUnlocked())return earlyCapacity;
    return Math.max(earlyCapacity,Math.min(4,1+Math.max(1,Math.min(Math.floor((Math.max(0,adults-1))/3),Math.floor((Math.max(0,cells-2))/6)))));
  }
  nextUnlock(cells=this.occupiedCells(),adults=this.adults()){
    if(this.scoutUnlocked())return null;const need=this.scoutThreshold();
    return{label:need.label,cellsNeeded:Math.max(0,need.cells-cells.length),adultsNeeded:Math.max(0,need.adults-adults.length),targetCells:need.cells,targetAdults:need.adults};
  }
  span(cells=this.occupiedCells()){
    if(!cells.length)return 0;const cx=cells.reduce((n,c)=>n+c.x,0)/cells.length,cy=cells.reduce((n,c)=>n+c.y,0)/cells.length;
    return cells.reduce((m,c)=>Math.max(m,Math.hypot(c.x-cx,c.y-cy)),0);
  }
  frontierCells(){
    const occupied=this.occupiedCells(),known=new Set(occupied.map(c=>c.key)),out=new Map(),size=this.sim.territory.cellSize;
    if(!occupied.length){const p=this.sim.player();if(!p)return[];const cx=Math.floor(p.x/size),cy=Math.floor(p.y/size);occupied.push({cx,cy,key:`${cx},${cy}`,x:(cx+.5)*size,y:(cy+.5)*size})}
    for(const cell of occupied){
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        if(!ox&&!oy)continue;const cx=cell.cx+ox,cy=cell.cy+oy,key=`${cx},${cy}`;if(known.has(key)||out.has(key))continue;
        const x=(cx+.5)*size,y=(cy+.5)*size;if(x<2||y<2||x>CFG.worldSize-2||y>CFG.worldSize-2)continue;
        const i=this.sim.world.idx(x,y);if(this.sim.world.water[i])continue;
        let food=0;for(const [kind,meta] of Object.entries(PLANTS))food+=(this.sim.world.plants[kind]?.[i]||0)*(meta.nutrition||1);
        let danger=0;this.sim.forEachNearby({x,y},8,a=>{if(a.alive&&canHunt(a))danger+=1});
        const eco=this.sim.sustainability?.sampleCell?.({key,cx,cy,x,y},{cache:false})||null;
        const competitors=eco?.competitors||0,resource=eco?.foodIndex??Math.min(1,food/8);
        const score=resource*1.25-competitors*.18-danger*.9+(ox&&oy ? .08 : .12);out.set(key,{key,cx,cy,x,y,score,food,danger,competitors,resource});
      }
    }
    return [...out.values()].sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
  }
  scoutTarget(animal){
    if(!this.scoutUnlocked()||!animal?.alive)return null;const frontier=this.frontierCells();if(!frontier.length)return null;
    // Deterministic distribution keeps several scouts from marching as a stack.
    const safe=frontier.filter(c=>c.danger===0),pool=safe.length?safe:frontier,index=Math.abs(animal.id*3)%Math.min(pool.length,12),chosen=pool[index];
    const target={x:chosen.x,y:chosen.y,frontier:true,cellKey:chosen.key};this.lastScoutTargets.set(animal.id,target);return target;
  }
  snapshot(){
    const cells=this.occupiedCells(),members=this.members(),adults=this.adults(),tier=this.tier(cells,adults),frontier=this.frontierCells(),unlock=this.nextUnlock(cells,adults);
    const activeShelters=this.sim.shelter?.shelters?.filter?.(s=>s.integrity>0).length||0,projects=this.sim.shelter?.projects?.length||0,nestUnlocked=this.nestUnlocked(),shelterCapacity=this.shelterCapacity();
    const nestNeed=this.nestThreshold();
    return{cells,members:members.length,adults:adults.length,tier,frontier,span:this.span(cells),scoutUnlocked:!unlock,nextUnlock:unlock,scouting:this.sim.familyDirectives?.mode==='scout',nestUnlocked,shelterCapacity,activeShelters,nestAvailable:nestUnlocked&&(activeShelters+projects)<shelterCapacity,nestNeed:{cells:Math.max(0,nestNeed.cells-cells.length),adults:Math.max(0,nestNeed.adults-adults.length),targetCells:nestNeed.cells,targetAdults:nestNeed.adults,label:nestNeed.label}};
  }
}
