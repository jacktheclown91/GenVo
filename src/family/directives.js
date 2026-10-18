import {groundDiet,canHunt,preyPreference} from '../ecology/functional-diet.js';
import {SPECIES} from '../organisms/species.js';
import {CFG,PLANTS} from '../sim/config.js';
import {ROOT_TAXON_ID} from '../lineage/evolution-tree.js';

const MODES={
  auto:{id:'auto',label:'AUTO',short:'Autonomous',help:'Family follows its own needs and learned behavior.'},
  follow:{id:'follow',label:'FOLLOW',short:'Stay with me',help:'Independent relatives regroup around the active GenVo8.'},
  forage:{id:'forage',label:'FORAGE',short:'Spread + feed',help:'Independent relatives fan out for food while keeping survival needs first.'},
  home:{id:'home',label:'HOME',short:'Return home',help:'Independent relatives return to the family shelter or learned home range.'},
  scout:{id:'scout',label:'SCOUT',short:'Expand range',help:'Independent adults probe the edge of the family’s learned range. Unlocks as the family grows.'}
};

const AREA_ACTIONS={
  gather:{id:'gather',label:'Gather here',short:'Gather',radius:2.2,durationDays:2},
  forage:{id:'forage',label:'Forage here',short:'Forage here',radius:5.5,durationDays:3},
  scout:{id:'scout',label:'Scout here',short:'Scout here',radius:4.0,durationDays:4,requiresScout:true},
  nest:{id:'nest',label:'Nest here',short:'New nest',radius:2.3,durationDays:8,requiresNest:true},
  avoid:{id:'avoid',label:'Avoid area',short:'Avoid',radius:4.4,durationDays:6}
};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class FamilyDirectiveController{
  constructor(sim){this.sim=sim;this.mode='auto';this.scope='taxon';this.changedTick=-1;this.changedBy=null;this.areaOrder=null;this.avoidZones=[];this.nextZoneId=1;this.lastAreaMessage=''}
  modes(){return Object.values(MODES)}
  areaActions(){return Object.values(AREA_ACTIONS)}
  set(mode,source='player'){
    if(!MODES[mode])return false;
    if(mode==='scout'&&!this.sim.expansion?.scoutUnlocked?.())return false;
    if(this.mode===mode)return true;
    this.mode=mode;this.sim.tendency?.noteDirective?.(mode);this.changedTick=this.sim.tickCount;this.changedBy=source;
    const p=this.sim.player();
    if(p)this.sim.cognition?.record?.(p,'family-directive',`Family direction: ${MODES[mode].short}`,{mode});
    return true;
  }
  setByIndex(index){const ids=['auto','follow','forage','home','scout'];const id=ids[index];return id?this.set(id):false}
  taxonId(animal){return this.sim.evolutionTree?.taxonFor?.(animal)||ROOT_TAXON_ID}
  activeTaxon(){const p=this.sim.player?.();return p?{id:this.taxonId(p),label:this.sim.evolutionTree?.taxonLabel?.(p)||'GenVo8'}:{id:ROOT_TAXON_ID,label:'GenVo8'}}
  multipleTaxa(){return (this.sim.evolutionTree?.livingTaxa?.().length||0)>1}
  effectiveScope(){return this.multipleTaxa()?this.scope:'lineage'}
  scopeMeta(){const active=this.activeTaxon(),scope=this.effectiveScope();return{scope,taxonId:active.id,label:scope==='taxon'?active.label:'Whole lineage',multipleTaxa:this.multipleTaxa()}}
  setScope(scope='taxon'){if(!['taxon','lineage'].includes(scope))return false;this.scope=scope;return true}
  toggleScope(){this.scope=this.effectiveScope()==='taxon'?'lineage':'taxon';return this.scopeMeta()}
  matchesScope(animal,scope=this.effectiveScope(),taxonId=this.activeTaxon().id){return scope==='lineage'||this.taxonId(animal)===taxonId}
  eligible(animal,{respectScope=true,scope=this.effectiveScope(),taxonId=this.activeTaxon().id}={}){
    if(!animal?.alive||this.sim.isManualPlayer?.(animal)||!animal.lineage||animal.species!=='genvo')return false;
    const spec=SPECIES[animal.species];
    return animal.age>=spec.maturity&&!this.sim.family?.isDependent?.(animal)&&(!respectScope||this.matchesScope(animal,scope,taxonId));
  }
  commandable(opts={}){return this.sim.animals.filter(a=>this.eligible(a,opts))}
  status(){
    const members=this.commandable(),responding=members.filter(a=>a.familyDirective===this.mode&&this.sim.tickCount-(a.familyDirectiveTick??-999)<=12).length;
    const reach=this.sim.expansion?.snapshot?.()||null,scope=this.scopeMeta();
    return{mode:this.mode,...MODES[this.mode],count:members.length,responding,available:members.length>0,scope,scoutUnlocked:!!reach?.scoutUnlocked,nestUnlocked:!!reach?.nestUnlocked,nestAvailable:!!reach?.nestAvailable,reach,area:this.areaStatus()};
  }
  targetValid(target){
    if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return false;
    const x=clamp(target.x,1,CFG.worldSize-2),y=clamp(target.y,1,CFG.worldSize-2);
    return !this.sim.world.water[this.sim.world.idx(x,y)];
  }
  setAreaOrder(type,target,source='player'){
    this.lastAreaMessage='';const meta=AREA_ACTIONS[type];if(!meta||!this.commandable().length){this.lastAreaMessage='No grown relative can respond yet.';return false}
    if(meta.requiresScout&&!this.sim.expansion?.scoutUnlocked?.()){this.lastAreaMessage='Scout is not unlocked yet.';return false}
    if(meta.requiresNest&&!this.sim.expansion?.snapshot?.().nestAvailable){const reach=this.sim.expansion?.snapshot?.();this.lastAreaMessage=reach?.nestUnlocked?'The family is already supporting its current nest capacity.':reach?.nestNeed?`New nest needs ${reach.nestNeed.targetAdults} adults across ${reach.nestNeed.targetCells} familiar cells.`:'New nest is not unlocked yet.';return false}
    if(!this.targetValid(target)){this.lastAreaMessage='Choose dry ground for family guidance.';return false}
    const x=clamp(target.x,1,CFG.worldSize-2),y=clamp(target.y,1,CFG.worldSize-2),untilTick=this.sim.tickCount+CFG.dayTicks*meta.durationDays,scope=this.scopeMeta(),preference=scope.scope==='taxon'&&scope.multipleTaxa?this.sim.speciesCoexistence?.settlementPreference?.(scope.taxonId,{x,y}):null;
    if(type==='nest'){const started=this.sim.shelter?.beginNestProject?.({x,y},source,{scope:scope.scope,taxonId:scope.scope==='taxon'?scope.taxonId:null,taxonLabel:scope.scope==='taxon'?scope.label:null,preference});if(!started?.ok){this.lastAreaMessage=started?.reason||'That site cannot support a new nest.';return false}}
    this.sim.tendency?.noteDirective?.(type);
    if(type==='avoid'){
      const near=this.avoidZones.find(z=>Math.hypot(z.x-x,z.y-y)<meta.radius*.65);
      if(near){near.x=x;near.y=y;near.untilTick=untilTick;near.radius=meta.radius;near.scope=scope.scope;near.taxonId=scope.taxonId;near.scopeLabel=scope.label}
      else{this.avoidZones.push({id:this.nextZoneId++,type:'avoid',x,y,radius:meta.radius,setTick:this.sim.tickCount,untilTick,scope:scope.scope,taxonId:scope.taxonId,scopeLabel:scope.label});if(this.avoidZones.length>3)this.avoidZones.shift()}
      if(this.areaOrder&&Math.hypot(this.areaOrder.x-x,this.areaOrder.y-y)<meta.radius)this.areaOrder=null;
    }else this.areaOrder={type,x,y,radius:meta.radius,setTick:this.sim.tickCount,untilTick,source,scope:scope.scope,taxonId:scope.taxonId,scopeLabel:scope.label,settlementPreference:preference};
    this.changedTick=this.sim.tickCount;this.changedBy=source;
    const p=this.sim.player();if(p)this.sim.cognition?.record?.(p,'family-area-guidance',`${meta.short} marked`,{type,x,y});
    return true;
  }
  clearLocalGuidance(){const had=!!this.areaOrder||this.avoidZones.length>0;if(this.areaOrder?.type==='nest')this.sim.shelter?.cancelProjectAt?.(this.areaOrder.x,this.areaOrder.y,2.5);this.areaOrder=null;this.avoidZones=[];return had}
  pruneLocalGuidance(){
    if(this.areaOrder&&this.areaOrder.untilTick<=this.sim.tickCount)this.areaOrder=null;
    this.avoidZones=this.avoidZones.filter(z=>z.untilTick>this.sim.tickCount);
    if(this.areaOrder?.type==='scout'&&!this.sim.expansion?.scoutUnlocked?.())this.areaOrder=null;
    if(this.areaOrder?.type==='nest'){const project=this.sim.shelter?.nearestProject?.(this.areaOrder.x,this.areaOrder.y,2.5);if(!project)this.areaOrder=null}
  }
  // Render-time read of just the marks drawn on the map (Phase 3H performance): same pruning as
  // areaStatus(), without the expansion snapshot, commandable scan and scope metadata.
  guidanceMarks(){this.pruneLocalGuidance();return{order:this.areaOrder,avoid:this.avoidZones}}
  areaStatus(){this.pruneLocalGuidance();const reach=this.sim.expansion?.snapshot?.()||null,scope=this.scopeMeta();return{order:this.areaOrder?{...this.areaOrder}:null,avoid:this.avoidZones.map(z=>({...z})),available:this.commandable().length>0,scope,scoutUnlocked:!!reach?.scoutUnlocked,nestUnlocked:!!reach?.nestUnlocked,nestAvailable:!!reach?.nestAvailable,nestCapacity:reach?.shelterCapacity||1}}
  avoidDecision(animal){
    this.pruneLocalGuidance();const zones=this.avoidZones;if(!zones.length)return null;
    let best=null,bestD=Infinity;for(const z of zones){if(!this.matchesScope(animal,z.scope||'lineage',z.taxonId||this.activeTaxon().id))continue;const d=Math.hypot(animal.x-z.x,animal.y-z.y);if(d<z.radius+1.4&&d<bestD){best=z;bestD=d}}
    if(!best)return null;
    const dx=animal.x-best.x,dy=animal.y-best.y,len=Math.hypot(dx,dy)||1,escape=Math.max(3,best.radius+1.8-bestD);
    return{intent:'family-area-avoid',target:{x:clamp(animal.x+dx/len*escape,1,CFG.worldSize-2),y:clamp(animal.y+dy/len*escape,1,CFG.worldSize-2),directive:true,areaGuidance:true}};
  }
  areaFoodTarget(animal,order){
    const s=SPECIES[animal.species],w=this.sim.world,range=order.type==='forage'?order.radius*(this.sim.tendency?.forageRangeMultiplier?.()||1):order.radius,r=Math.ceil(range),cx=Math.round(order.x),cy=Math.round(order.y);let best=null,bestScore=.025;
    for(let y=cy-r;y<=cy+r;y+=2)for(let x=cx-r;x<=cx+r;x+=2){
      if(x<=1||y<=1||x>=CFG.worldSize-2||y>=CFG.worldSize-2||Math.hypot(x-order.x,y-order.y)>range||w.water[w.idx(x,y)]||!this.sim.canReach(animal,x,y))continue;
      const risk=this.sim.stalkerTerritory?.forageAdjustment?.(animal,x,y)||0;
      for(const [kind,eff] of Object.entries(groundDiet(animal))){
        if(!PLANTS[kind]||eff<=0)continue;const amount=w.plants[kind]?.[w.idx(x,y)]||0,score=amount*eff*PLANTS[kind].nutrition*.08+risk-Math.hypot(x-animal.x,y-animal.y)*.012;
        if(score>bestScore){bestScore=score;best={x:x+.5,y:y+.5,kind,score,areaGuidance:true,directive:true}}
      }
      if(groundDiet(animal).carrion>0){const amount=w.carrion[w.idx(x,y)]||0,score=amount*groundDiet(animal).carrion*2+risk-Math.hypot(x-animal.x,y-animal.y)*.012;if(score>bestScore){bestScore=score;best={x:x+.5,y:y+.5,kind:'carrion',score,areaGuidance:true,directive:true}}}
    }
    return best;
  }
  areaOrderDecision(animal){
    this.pruneLocalGuidance();const order=this.areaOrder;if(!order||!this.matchesScope(animal,order.scope||'lineage',order.taxonId||this.activeTaxon().id))return null;
    if(order.type==='gather'){
      const angle=(animal.id%8)*(Math.PI/4),r=.75+(animal.id%3)*.38,target={x:order.x+Math.cos(angle)*r,y:order.y+Math.sin(angle)*r,directive:true,areaGuidance:true};
      return Math.hypot(animal.x-target.x,animal.y-target.y)>.72?{intent:'family-area-gather',target}:{intent:'family-area-hold',target:null};
    }
    if(order.type==='forage'){
      const inside=Math.hypot(animal.x-order.x,animal.y-order.y)<=order.radius;
      if(inside){const food=this.areaFoodTarget(animal,order);if(food)return{intent:'feed',target:food}}
      const angle=((animal.id*5)%8)*(Math.PI/4),r=inside?Math.max(2.2,order.radius*.72):1.3,target={x:order.x+Math.cos(angle)*r,y:order.y+Math.sin(angle)*r,directive:true,areaGuidance:true};
      return{intent:'family-area-forage',target};
    }
    if(order.type==='scout'){
      if(!this.sim.expansion?.scoutUnlocked?.())return null;const angle=((animal.id*3)%8)*(Math.PI/4),r=1.6+(animal.id%3)*.62,target={x:order.x+Math.cos(angle)*r,y:order.y+Math.sin(angle)*r,directive:true,areaGuidance:true,frontier:true};
      return Math.hypot(animal.x-target.x,animal.y-target.y)>1.05?{intent:'family-area-scout',target}:{intent:'family-area-hold',target:null};
    }
    if(order.type==='nest'){
      const project=this.sim.shelter?.nearestProject?.(order.x,order.y,2.5);if(!project)return null;const angle=(animal.id%8)*(Math.PI/4),r=.75+(animal.id%2)*.28,target={x:project.x+Math.cos(angle)*r,y:project.y+Math.sin(angle)*r,directive:true,areaGuidance:true,nestProjectId:project.id};
      return Math.hypot(animal.x-target.x,animal.y-target.y)>.68?{intent:'family-area-nest',target}:{intent:'family-area-hold',target:null};
    }
    return null;
  }
  decision(animal){
    if(!this.eligible(animal,{respectScope:false}))return null;
    const p=this.sim.player();if(!p)return null;
    const localMatch=(this.areaOrder&&this.matchesScope(animal,this.areaOrder.scope||'lineage',this.areaOrder.taxonId||this.activeTaxon().id))||this.avoidZones.some(z=>this.matchesScope(animal,z.scope||'lineage',z.taxonId||this.activeTaxon().id));
    const broadMatch=this.matchesScope(animal);if(!localMatch&&!broadMatch)return null;
    const spec=SPECIES[animal.species],energy=animal.energy/spec.maxEnergy,water=animal.hydration/spec.maxHydration;
    // Leadership never overrides immediate survival. Local marks then refine the
    // broader family stance, so the radial wheel remains guidance rather than puppeteering.
    if(animal.health<42||energy<.46||water<.46)return null;
    const avoid=this.avoidDecision(animal);if(avoid){animal.familyDirective='area-avoid';animal.familyDirectiveTick=this.sim.tickCount;return avoid}
    const area=this.areaOrderDecision(animal);if(area){animal.familyDirective=`area-${this.areaOrder?.type||'local'}`;animal.familyDirectiveTick=this.sim.tickCount;return area}
    if(this.mode==='auto'||!broadMatch)return null;
    let result=null;
    if(this.mode==='follow'){
      const angle=(animal.id%8)*(Math.PI/4),radius=(2.0+(animal.id%3)*.35)*(this.sim.tendency?.cohesionMultiplier?.()||1),target={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,directive:true};
      const d=Math.hypot(animal.x-target.x,animal.y-target.y);
      result=d>1.15?{intent:'family-follow',target}:{intent:'family-hold',target:null};
    }else if(this.mode==='forage'){
      const relief=this.sim.sustainability?.reliefTarget?.(animal)||null;
      if(relief&&Math.hypot(animal.x-relief.x,animal.y-relief.y)>2.2){
        result={intent:'family-relief-forage',target:{...relief,directive:true}};
      }else{
        const remembered=this.sim.cognition?.foodTarget?.(animal),food=remembered||this.sim.bestFood(animal);
        if(food)result={intent:'feed',target:{...food,directive:true}};
        else{
          const angle=((animal.id*3)%8)*(Math.PI/4),radius=(5.5+(animal.id%4)*1.1)*(this.sim.tendency?.forageRangeMultiplier?.()||1),target={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,directive:true};
          result={intent:'family-forage',target};
        }
      }
    }else if(this.mode==='scout'){
      const target=this.sim.expansion?.scoutTarget?.(animal)||null;
      if(target){const d=Math.hypot(animal.x-target.x,animal.y-target.y);result=d>1.25?{intent:'family-scout',target}:{intent:'family-scout-hold',target:null}}
    }else if(this.mode==='home'){
      const shelter=this.sim.shelter?.nearest?.(animal,{radius:Infinity,familyOnly:true})||null;
      const activeHome=this.sim.territory?.state?.(p)?.home||null;
      const ownHome=this.sim.territory?.state?.(animal)?.home||null;
      const anchor=shelter?{x:shelter.x,y:shelter.y,shelterId:shelter.id}:activeHome||ownHome;
      if(anchor){const d=Math.hypot(animal.x-anchor.x,animal.y-anchor.y);result=d>1.5?{intent:'family-home',target:{...anchor,directive:true}}:{intent:'family-hold',target:null}}
    }
    if(result){animal.familyDirective=this.mode;animal.familyDirectiveTick=this.sim.tickCount}
    return result;
  }
}

export function familyDirectiveMeta(mode){return MODES[mode]||MODES.auto}
export function familyAreaActionMeta(type){return AREA_ACTIONS[type]||null}
