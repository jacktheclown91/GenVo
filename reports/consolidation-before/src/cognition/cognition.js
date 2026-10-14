import {groundDiet,canHunt,preyPreference} from '../ecology/functional-diet.js';
import {bestFreshwaterFood,FRESHWATER_FOOD} from '../ecology/freshwater-food.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {usableKnownFoodTarget} from '../ecology/food-commitment.js';

// v1.33 Knowledge: the water banks and shelters a creature itself knows. A place is learned by
// using it or by being shown it by a caregiver (imperfectly: a little off and less sure), grows
// less sure when it is not revisited, is forgotten after PLACE.forgetDays, and dies with the
// creature. Food places are the forage patches in gameplay/foraging.js under the same rules.
export const PLACE=Object.freeze({forgetDays:16,merge:2.5,limit:16,taughtSure:.6,jitter:1.4});
// v1.33.2 Learned fear: a place where a Stalker attacked or killed a relative is a danger place.
// Fear lasts longer than other places, is shared by witnesses and taught to young, steers
// autonomous family away while it is strong, and fades or dies with those who hold it.
export const FEAR=Object.freeze({days:24,radius:4,steerSure:.25,witnessRadius:8,witnessSure:.85,teachRadius:6,noticeRadius:3,elective:['feed','explore','tendency-roam','tendency-gather','stealth-forage','migrate','aquatic-range','group','graze']});
const forgetDaysFor=type=>type==='danger'?FEAR.days:PLACE.forgetDays;
// Deterministic offset for a taught copy, so teaching consumes no RNG.
export function taughtOffset(seed,x,y){let h=2166136261^(seed|0);for(const v of [Math.round(x*4),Math.round(y*4)]){h^=v;h=Math.imul(h,16777619)}const a=((h>>>0)%3600)/3600*Math.PI*2,r=PLACE.jitter*(.35+(((h>>>8)&255)/255)*.65);return{dx:Math.cos(a)*r,dy:Math.sin(a)*r}}

export class CognitionController{
  constructor(sim){
    this.sim=sim;
    this.states=new Map();
    this.showOverlay=false;
    this.historyLimit=24;
  }
  enabled(animal){return !!(animal&&animal.species==='genvo'&&(animal.lineage||animal.player))}
  ensure(animal){
    if(!animal)return null;
    let state=this.states.get(animal.id);
    if(!state){state={water:null,food:null,threat:null,family:new Map(),history:[],seen:new Set(),lastStage:null};this.states.set(animal.id,state)}
    return state;
  }
  state(animal){return this.states.get(animal?.id)||this.ensure(animal)}
  observe(){
    for(const animal of this.sim.animals){
      if(!this.enabled(animal))continue;
      const state=this.ensure(animal),spec=SPECIES[animal.species];
      this.observeEnvironment(animal,state,spec);
      this.observeThreat(animal,state);
      this.observeFamily(animal,state);
      this.observeDevelopment(animal,state,spec);
      if(animal.lineage)this.observePlaces(animal);
    }
  }
  observeEnvironment(animal,state,spec){
    const radius=Math.max(3,Math.min(8,Math.round(4.5*(animal.genes.senses||1))));
    let water=null,waterScore=.62,food=null,foodScore=.10;
    const minX=Math.max(1,Math.floor(animal.x-radius)),maxX=Math.min(CFG.worldSize-2,Math.ceil(animal.x+radius));
    const minY=Math.max(1,Math.floor(animal.y-radius)),maxY=Math.min(CFG.worldSize-2,Math.ceil(animal.y+radius));
    for(let y=minY;y<=maxY;y+=2)for(let x=minX;x<=maxX;x+=2){
      const d=Math.hypot(x-animal.x,y-animal.y);if(d>radius)continue;
      const i=this.sim.world.idx(x,y),moisture=this.sim.world.moisture[i];
      const drinkable=this.sim.world.isDrinkable(x,y);const ws=(drinkable?1:moisture)-d*.025;if(ws>waterScore){waterScore=ws;water={x,y,value:drinkable?1:moisture,lastSeenTick:this.sim.tickCount}}
      for(const [kind,eff] of Object.entries(groundDiet(animal))){
        if(eff<=0)continue;
        let amount=0;
        if(kind==='carrion')amount=this.sim.world.carrion[i]||0;
        else if(PLANTS[kind])amount=this.sim.world.plants[kind]?.[i]||0;
        else continue;
        const fs=amount*eff-d*.018;
        if(fs>foodScore){foodScore=fs;food={x,y,kind,value:amount,lastSeenTick:this.sim.tickCount}}
      }
    }
    if(water){state.water=water;this.recordOnce(animal,'water-found','Found water',{x:water.x,y:water.y})}
    const aquatic=bestFreshwaterFood(this.sim,animal,radius);if(aquatic&&aquatic.score>foodScore)food={...aquatic,value:aquatic.score,lastSeenTick:this.sim.tickCount};
    if(food){state.food=food;this.recordOnce(animal,`food-seen:${food.kind}`,`Found ${labelFood(food.kind)}`,{kind:food.kind,x:food.x,y:food.y})}
  }
  observeThreat(animal,state){
    const radius=this.flightRadius(animal,5*(animal.genes.senses||1));
    const threat=this.sim.findNearest(animal,b=>b.alive&&canHunt(b)&&preyPreference(b,animal)>0,radius);
    if(!threat)return;
    state.threat={x:threat.x,y:threat.y,species:threat.species,id:threat.id,lastSeenTick:this.sim.tickCount};
    this.recordOnce(animal,`threat:${threat.species}`,`Encountered ${SPECIES[threat.species]?.label||threat.species}`,{species:threat.species,id:threat.id});
  }
  observeFamily(animal,state){
    const radius=10*(animal.genes.senses||1);
    this.sim.forEachNearby(animal,radius,b=>{
      if(!b.alive||b.id===animal.id||b.species!==animal.species)return;
      const relation=this.relation(animal,b);
      if(relation==='unrelated')return;
      const prev=state.family.get(b.id)||{familiarity:0};
      const familiarity=Math.min(1,prev.familiarity+.015);
      state.family.set(b.id,{id:b.id,relation,x:b.x,y:b.y,lastSeenTick:this.sim.tickCount,familiarity});
      this.recordOnce(animal,`family:${relation}:${b.id}`,`Recognized ${relation} #${b.id}`,{relation,id:b.id});
    });
  }
  // Known places ------------------------------------------------------------------------
  placeSureness(place){if(!place)return 0;const days=Math.max(0,(this.sim.tickCount-place.lastTick)/CFG.dayTicks);return Math.max(0,(place.sure??1)*(1-days/forgetDaysFor(place.type)))}
  knowPlace(animal,type,x,y,{sure=1,source='self',shelterId=null,cause=null}={}){
    if(!this.enabled(animal))return null;const state=this.ensure(animal);state.places??=[];
    let place=state.places.find(p=>p.type===type&&(shelterId!=null&&p.shelterId===shelterId||Math.hypot(p.x-x,p.y-y)<=PLACE.merge));
    if(place){if(source==='self'){place.x=x;place.y=y;place.source='self'}place.sure=Math.max(this.placeSureness(place),sure);place.lastTick=this.sim.tickCount;return place}
    place={type,x,y,sure,source,lastTick:this.sim.tickCount,learnedTick:this.sim.tickCount};if(shelterId!=null)place.shelterId=shelterId;if(cause)place.cause={...cause};state.places.push(place);
    if(state.places.length>PLACE.limit){state.places.sort((a,b)=>this.placeSureness(b)-this.placeSureness(a));state.places.length=PLACE.limit}
    if(source==='taught')this.sim.evolutionBudget?.noteTaught?.(animal);
    if(source==='taught')this.record(animal,'place-taught',type==='danger'?'Learned to fear a place from its caregiver':`Was shown a ${type==='water'?'water bank':'shelter'}`,{type,x,y});
    return place;
  }
  knownPlaces(animal,type=null){
    const state=this.states.get(animal?.id);if(!state?.places?.length)return[];
    state.places=state.places.filter(p=>this.placeSureness(p)>0);
    return state.places.filter(p=>!type||p.type===type).map(p=>({...p,sureness:this.placeSureness(p)}));
  }
  // The closest water bank this creature knows that is still drinkable.
  knownWater(animal){
    let best=null,bestD=Infinity;for(const p of this.knownPlaces(animal,'water')){if(!this.sim.world.isDrinkable(p.x,p.y))continue;const d=Math.hypot(p.x-animal.x,p.y-animal.y);if(d<bestD){bestD=d;best={x:p.x,y:p.y,sureness:p.sureness,source:p.source,distance:d}}}
    return best;
  }
  // A caregiver shows a place: the young's copy is a little off and less sure.
  teachPlace(child,type,x,y,{shelterId=null,cause=null}={}){
    if(!this.enabled(child))return null;let tx=x,ty=y;
    if(type==='water'){const o=taughtOffset(child.id,x,y),jx=x+o.dx,jy=y+o.dy;if(this.sim.world.isDrinkable(jx,jy)){tx=jx;ty=jy}else{const near=this.sim.world.nearestDrinkable(jx,jy,2.2);if(near){tx=near.x;ty=near.y}}}
    return this.knowPlace(child,type,tx,ty,{sure:PLACE.taughtSure,source:'taught',shelterId,cause});
  }
  // Places only this creature knew, among its living lineage relatives.
  uniqueKnowledge(animal){
    const others=this.sim.animals.filter(a=>a.alive&&a.id!==animal.id&&a.lineage&&a.species===animal.species),out=[];
    for(const p of this.knownPlaces(animal)){if(!others.some(o=>this.knownPlaces(o,p.type).some(q=>Math.hypot(q.x-p.x,q.y-p.y)<=PLACE.merge*1.6)))out.push({type:p.type,x:p.x,y:p.y})}
    for(const patch of this.sim.foraging?.knownPatches?.(animal)||[]){if(!others.some(o=>(this.sim.foraging.knownPatches(o)||[]).some(q=>q.kind===patch.kind&&Math.hypot(q.x-patch.x,q.y-patch.y)<=PLACE.merge*1.6)))out.push({type:'food',kind:patch.kind,x:patch.x,y:patch.y})}
    return out;
  }
  // A Stalker attacked or killed a family creature here: the victim and relatives who saw it learn to fear it.
  noteDanger(victim,attacker,{killed=false}={}){
    if(!victim?.lineage||victim.species!=='genvo')return;const cause={victimId:victim.id,killed:!!killed,species:attacker?.species||null},x=victim.x,y=victim.y;
    if(victim.alive&&!killed)this.knowPlace(victim,'danger',x,y,{cause});
    for(const a of this.sim.animals){if(!a.alive||a===victim||!a.lineage||a.species!=='genvo')continue;if(Math.hypot(a.x-x,a.y-y)<=FEAR.witnessRadius)this.knowPlace(a,'danger',x,y,{sure:FEAR.witnessSure,source:'witnessed',cause})}
  }
  // The strongest danger place whose zone contains (x,y), if fear there is still strong enough to act on.
  fearAt(animal,x,y){let best=null;for(const p of this.knownPlaces(animal,'danger')){if(p.sureness<FEAR.steerSure)continue;if(Math.hypot(p.x-x,p.y-y)<=FEAR.radius&&(!best||p.sureness>best.sureness))best=p}return best}
  // Autonomous family keep optional trips out of places they fear. Survival needs are not overridden.
  steerFromFear(animal){
    if(!animal?.lineage||animal.species!=='genvo'||this.sim.isManualPlayer?.(animal)||!animal.target||!FEAR.elective.includes(animal.intent))return false;
    const t=animal.target;if(!Number.isFinite(t.x)||!Number.isFinite(t.y))return false;const fear=this.fearAt(animal,t.x,t.y);if(!fear)return false;
    let dx=t.x-fear.x,dy=t.y-fear.y;if(Math.hypot(dx,dy)<.1){dx=animal.x-fear.x;dy=animal.y-fear.y}const len=Math.hypot(dx,dy)||1,r=FEAR.radius+1;
    const nx=Math.max(1,Math.min(CFG.worldSize-2,fear.x+dx/len*r)),ny=Math.max(1,Math.min(CFG.worldSize-2,fear.y+dy/len*r));
    animal.intent='explore';animal.target={x:nx,y:ny,avoiding:true};return true;
  }
  takeFearNotice(){const n=this.fearNotice;this.fearNotice=null;return n}
  takeKnowledgeNotice(){const n=this.knowledgeNotice;this.knowledgeNotice=null;return n}
  observePlaces(animal){
    // observe() itself is already throttled, so this runs at perception cadence.
    const shelter=this.sim.shelter?.nearest?.(animal,{radius:2,familyOnly:true});if(shelter)this.knowPlace(animal,'shelter',shelter.x,shelter.y,{shelterId:shelter.id});
    // The active creature's own memory speaks up when it walks into a place it fears.
    if(animal.player){const state=this.states.get(animal.id);for(const p of state?.places||[]){if(p.type!=='danger'||this.placeSureness(p)<=0||Math.hypot(p.x-animal.x,p.y-animal.y)>FEAR.noticeRadius)continue;const key=`${Math.round(p.x)},${Math.round(p.y)}:${this.sim.day}`;if(p.noticedKey===key)continue;p.noticedKey=key;
      const c=p.cause,victim=c?.victimId===animal.id?'itself':`#${c?.victimId}`;const what=p.source==='taught'?'Its caregiver feared this place':`Your creature remembers a Stalker ${c?.killed?'taking':'attacking'} ${victim} here`;
      this.fearNotice={text:`${what}${this.placeSureness(p)<.4?' · an old fear':''}`,tone:'warn'};break}}
  }
  observeDevelopment(animal,state,spec){
    const stage=animal.age<spec.maturity?'juvenile':animal.age>spec.lifespan*.78?'elder':'adult';
    if(state.lastStage===null){state.lastStage=stage;return}
    if(stage!==state.lastStage){state.lastStage=stage;this.record(animal,'stage',`Became ${stage}`,{stage})}
  }
  memoryAgeDays(memory){return memory?Math.max(0,(this.sim.tickCount-memory.lastSeenTick)/CFG.dayTicks):Infinity}
  memoryFresh(animal,memory){
    if(!memory)return false;
    const persistence=Math.max(6,Math.round(9*(animal.genes.senses||1)));
    return this.memoryAgeDays(memory)<=persistence;
  }
  waterTarget(animal){const m=this.state(animal)?.water;return this.memoryFresh(animal,m)?{x:m.x,y:m.y,memory:true}:null}
  foodTarget(animal){const m=this.state(animal)?.food;return this.memoryFresh(animal,m)?usableKnownFoodTarget(this.sim,animal,{x:m.x,y:m.y,kind:m.kind,foodX:m.foodX,foodY:m.foodY,memory:true}):null}
  rememberedThreat(animal){const m=this.state(animal)?.threat;return this.memoryFresh(animal,m)?m:null}
  relation(a,b){
    if(!a||!b)return'unrelated';
    if((a.parentIds||[]).includes(b.id))return'parent';
    if((b.parentIds||[]).includes(a.id))return'child';
    if((a.parentIds||[]).some(id=>(b.parentIds||[]).includes(id)))return'sibling';
    if(a.lastMate===b.id||b.lastMate===a.id)return'mate';
    if(a.lineage&&b.lineage){
      if(this.sim.lineage.isDescendant(a.id,b.id))return'ancestor';
      if(this.sim.lineage.isDescendant(b.id,a.id))return'descendant';
    }
    return'unrelated';
  }
  nearbyRelations(animal,radius=12){
    const out=[];
    this.sim.forEachNearby(animal,radius,b=>{if(b===animal||!b.alive)return;const relation=this.relation(animal,b);if(relation==='unrelated')return;out.push({animal:b,relation,distance:Math.hypot(b.x-animal.x,b.y-animal.y)})});
    return out.sort((a,b)=>a.distance-b.distance||a.animal.id-b.animal.id);
  }
  socialTarget(animal){
    if(!this.enabled(animal)||this.sim.isManualPlayer?.(animal))return null;
    const profile=this.temperament(animal),relations=this.nearbyRelations(animal,12*(animal.genes.senses||1));
    const preferred=2.6/profile.sociality;
    const candidate=relations.find(r=>['parent','child','sibling','mate'].includes(r.relation)&&r.distance>preferred*1.35);
    return candidate?.animal||null;
  }
  temperament(animal){
    const t=animal?.genes?.temperament??1;
    const boldness=clamp(.72,1.28,1+(t-1)*2.2);
    const sociality=clamp(.76,1.24,1+(t-1)*1.8);
    return{raw:t,boldness,sociality,label:t<.965?'cautious / solitary':t>1.035?'bold / social':'balanced'};
  }
  flightRadius(animal,base){return base/this.temperament(animal).boldness}
  exploreDistance(animal,base){return base*this.temperament(animal).boldness}
  familyDistanceScale(animal){return 1/this.temperament(animal).sociality}
  record(animal,type,text,data={}){
    const state=this.ensure(animal);if(!state)return;
    state.history.unshift({type,text,data,tick:this.sim.tickCount,day:this.sim.day,year:this.sim.year});
    if(state.history.length>this.historyLimit)state.history.length=this.historyLimit;
  }
  recordOnce(animal,key,text,data={}){const state=this.ensure(animal);if(!state||state.seen.has(key))return;state.seen.add(key);this.record(animal,key,text,data)}
  onDrink(animal){if(this.enabled(animal)){this.recordOnce(animal,'first-drink','First drink',{x:animal.x,y:animal.y});if(animal.lineage||animal.player)this.knowPlace(animal,'water',animal.x,animal.y)}}
  onFeed(animal,kind,position={}){const meal=animal?.lastFreshwaterMeal;if(meal?.tick===this.sim.tickCount&&meal.kind===kind&&Number.isInteger(meal.i))position={x:meal.i%this.sim.world.n+.5,y:Math.floor(meal.i/this.sim.world.n)+.5};this.sim.discovery?.noteFeedingTrace(animal,kind,position);this.sim.habits?.noteFeed?.(animal);if(this.enabled(animal))this.recordOnce(animal,`first-meal:${kind}`,`First ate ${labelFood(kind)}`,{kind})}
  onHunt(animal,prey){if(this.enabled(animal))this.recordOnce(animal,`first-kill:${prey.species}`,`First killed ${SPECIES[prey.species]?.label||prey.species}`,{species:prey.species,id:prey.id})}
  onMate(a,b){if(this.enabled(a))this.recordOnce(a,'first-mate',`Paired with #${b.id}`,{id:b.id});if(this.enabled(b))this.recordOnce(b,'first-mate',`Paired with #${a.id}`,{id:a.id})}
  onBirth(child,mother,father){if(child?.lineage){this.record(child,'born',`Born to #${mother?.id??'?'} and #${father?.id??'?'}`,{motherId:mother?.id,fatherId:father?.id});if(this.enabled(mother))this.record(mother,'offspring',`Offspring #${child.id} born`,{id:child.id});if(this.enabled(father))this.record(father,'offspring',`Offspring #${child.id} born`,{id:child.id})}}
  onDeath(animal,cause){
    if(!this.enabled(animal))return;this.record(animal,'death',`Died: ${cause}`,{cause});
    // What only this creature knew dies with it.
    if(!animal.lineage)return;const lost=this.uniqueKnowledge(animal);if(!lost.length)return;
    const ref=this.sim.player?.()||animal,first=lost[0],d=Math.round(Math.hypot(first.x-ref.x,first.y-ref.y)),dir=compass(first.x-ref.x,first.y-ref.y);
    const what=first.type==='water'?'a water bank':first.type==='shelter'?'a shelter':first.type==='danger'?'a place to fear':`a ${labelFood(first.kind)} patch`;
    const text=`Only #${animal.id} knew ${what}${d>=2?` ${d} tiles ${dir}`:' here'}${lost.length>1?` and ${lost.length-1} more place${lost.length>2?'s':''}`:''} · that knowledge died with it`;
    this.knowledgeNotice={text,tone:'warn',lost:lost.length,animalId:animal.id};
    const p=this.sim.player?.();if(p&&p.id!==animal.id&&this.enabled(p))this.record(p,'knowledge-lost',text,{animalId:animal.id,lost:lost.length});
  }
  onHandoff(from,to,reason='handoff'){if(this.enabled(to))this.record(to,'control',`Became active lineage (${reason})`,{fromId:from?.id??null})}
  snapshot(animal){
    const state=this.state(animal);if(!state)return null;
    return{water:state.water,food:state.food,threat:state.threat,history:[...state.history],relations:this.nearbyRelations(animal),temperament:this.temperament(animal)};
  }
}

function compass(dx,dy){const a=Math.atan2(dy,dx),i=Math.round(a/(Math.PI/4));return['east','south-east','south','south-west','west','north-west','north','north-east'][(i+8)%8]}
function labelFood(kind){return PLANTS[kind]?.label||FRESHWATER_FOOD[kind]?.label||SPECIES[kind]?.label||kind}
function clamp(min,max,v){return Math.max(min,Math.min(max,v))}
