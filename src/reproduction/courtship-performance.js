import {partnerAvailability,COURTSHIP_READINESS} from './partner-encounters.js';
// Single canonical courtship authority. Body parts grant actions; individuals
// learn sequences through their own attempts and by observing nearby success.
// Attractive timing / matching rituals affect *soft* mate choice, not hard
// species, kinship, readiness, pregnancy or resource constraints.
import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {RNG} from '../core/rng.js';
import {PARTS} from '../lineage/part-registry.js';
import {planPartCounts} from '../lineage/part-abilities.js';
import {matePreferencesFor,individualMateChoice,expressedMateTraits,LOCAL_ASSORTMENT,COURTSHIP_SIMILARITY,courtshipSimilarityAdvantage} from './mate-preferences.js';

export const COURTSHIP_PERFORMANCE=Object.freeze({radius:.9,contestRadius:1.2,beats:3,minHealth:COURTSHIP_READINESS.minHealth,baseCost:.24,signalCost:.28});
export const COURTSHIP_MOVES=Object.freeze(['dance','call','flare','scent','gesture']);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(lo,hi,v)=>Math.max(lo,Math.min(hi,v));
const signature=sequence=>sequence.join('>');
const learned=a=>a.courtshipLearning||(a.courtshipLearning={attempts:0,patterns:{}});

// The fallback approach is a basic social interaction, not a free dance/call.
// No cosmetic-only capabilities and no new part artwork are introduced.
export function availableCourtshipMoves(animal){
  const parts=planPartCounts(animal),actions=new Set();
  for(const [id,count] of Object.entries(parts)){
    if(count<=0)continue;
    for(const action of PARTS[id]?.actionCapabilities||[])if(COURTSHIP_MOVES.includes(action))actions.add(action);
  }
  return [...actions].sort();
}
export function displayIntensity(a){
  const t=expressedMateTraits(a);
  return clamp(0,1,(t.display+1)*.30+(t.ornament+1)*.13);
}
export function courtshipCost(a,sequence=null){
  const moves=sequence||['approach'];
  return COURTSHIP_PERFORMANCE.baseCost+displayIntensity(a)*COURTSHIP_PERFORMANCE.signalCost+
    Math.max(0,moves.length-1)*.08;
}
export function chooseCourtshipSequence(sim,actor){
  const actions=availableCourtshipMoves(actor),memory=learned(actor),attempt=memory.attempts;
  if(!actions.length)return ['approach'];
  // Learning can spread only a sequence this body can actually perform.
  const known=Object.entries(memory.patterns||{}).filter(([key,p])=>
    key.split('>').every(m=>actions.includes(m))&&p.success>0)
    .sort((a,b)=>(b[1].success+b[1].observed*.35-b[1].failure*.20)-
                  (a[1].success+a[1].observed*.35-a[1].failure*.20)||a[0].localeCompare(b[0]));
  // Exploration never stops, preventing the population from locking into an
  // ancestral ritual. This also makes repeated single-action dances possible.
  if(known.length&&attempt%3!==2)return known[0][0].split('>');
  const rng=new RNG(`${sim.seed}:ritual-explore:${actor.id}:${attempt}`),length=1+rng.int(0,Math.min(2,actions.length-1));
  const start=rng.int(0,actions.length-1);
  return Array.from({length},(_,i)=>actions[(start+i)%actions.length]);
}
export function ritualAppeal(sim,receiver,performer,performance){
  if(!performance)return 0;
  const taste=matePreferencesFor(sim.seed,receiver),sequence=performance.sequence||['approach'];
  const affinity=sequence.reduce((sum,action)=>sum+(taste.ritualTastes?.[action]??0),0)/sequence.length;
  const timing=1-Math.min(2,Math.abs((taste.tempo??0)-(performance.tempo??0)))/2;
  // A learned performance matters more when other suitors exist. Never a veto.
  return clamp(-1,1,(affinity*.65+timing*.35)*(performance.quality??.5));
}
export function courtshipContest(sim,target){
  const contenders=sim.animals.filter(a=>a.alive&&a.id!==target.id&&a.intent==='mate'&&
    a.target?.id===target.id&&dist(a,target)<=COURTSHIP_PERFORMANCE.contestRadius&&
    sim.canMatePair(a,target,{ready:true})&&a.energy>=courtshipCost(a));
  const score=a=>individualMateChoice(target,a,sim.seed,{assortment:sim.mateAssortmentRules===LOCAL_ASSORTMENT}).score+
    ritualAppeal(sim,target,a,a.courtshipPerformance||a.completedCourtship)*.25;
  contenders.sort((a,b)=>score(b)-score(a)||dist(a,target)-dist(b,target)||a.id-b.id);
  return {winner:contenders[0]||null,contenders:contenders.map(a=>a.id)};
}
function remember(a,sequence,{success=false,observed=false}={}){
  if(!sequence?.length)return;
  const actions=availableCourtshipMoves(a);
  if(!sequence.every(m=>m==='approach'||actions.includes(m)))return;
  const mem=learned(a),key=signature(sequence),p=mem.patterns[key]||{success:0,failure:0,observed:0};
  if(success)p.success=Math.min(50,p.success+1);
  else if(observed)p.observed=Math.min(50,p.observed+1);
  else p.failure=Math.min(50,p.failure+1);
  mem.patterns[key]=p;
  const entries=Object.entries(mem.patterns);
  if(entries.length>12){entries.sort((a,b)=>(b[1].success+b[1].observed*.35)-(a[1].success+a[1].observed*.35)||a[0].localeCompare(b[0]));mem.patterns=Object.fromEntries(entries.slice(0,12));}
}
// Observers learn culturally, not genetically or through species name alone.
export function learnCourtshipOutcome(sim,actor,target,success){
  const performance=actor.completedCourtship;
  if(!performance||performance.partnerId!==target?.id)return;
  remember(actor,performance.sequence,{success});
  if(success){
    for(const observer of sim.animals){
      if(!observer.alive||observer.id===actor.id||dist(observer,actor)>3)continue;
      remember(observer,performance.sequence,{observed:true});
    }
  }
  actor.completedCourtship=null;
}
// Descriptive cultural prevalence; never a scripted species mating condition.
export function observedRituals(sim,species){
  const totals=new Map();
  for(const a of sim.animals){if(!a.alive||a.species!==species)continue;
    for(const [seq,p] of Object.entries(a.courtshipLearning?.patterns||{}))
      totals.set(seq,(totals.get(seq)||0)+p.success+p.observed*.35);
  }
  return [...totals].filter(v=>v[1]>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5);
}
// No ecology RNG use. Repeated experiences are variable but neither guarantee
// acceptance nor rule out unusual combinations. Both animals make a separate
// choice after all ordinary hard biological restrictions have passed.
export function performedMateChoice(sim,actor,target){
  const performance=actor.completedCourtship;
  if(!performance||performance.partnerId!==target.id||sim.tickCount>performance.endsAt+CFG.lifeStride)return null;
  const contenders=courtshipContest(sim,target);
  const competing=contenders.contenders.length>1;
  const rivalPenalty=competing&&contenders.winner?.id!==actor.id?.12:0;
  const appeal=ritualAppeal(sim,target,actor,performance);
  const options={assortment:sim.mateAssortmentRules===LOCAL_ASSORTMENT};
  const tastes=[individualMateChoice(actor,target,sim.seed,options),individualMateChoice(target,actor,sim.seed,options)];
  const resemblanceEligible=sim.courtshipSimilarityRules===COURTSHIP_SIMILARITY.policy&&partnerAvailability(sim,actor,target,COURTSHIP_READINESS).available;
  const chances=tastes.map((choice,i)=>{
    const soft=clamp(.08,.92,.39+choice.score*.80);
    const bonus=i===1?appeal*(competing?.28:.08)-rivalPenalty:0;
    const resemblance=resemblanceEligible
      ?courtshipSimilarityAdvantage(i===0?actor:target,i===0?target:actor,sim.seed,{sameTaxon:sim.evolutionTree?.sameTaxon(actor,target)??false}):0;
    return clamp(.055,.94,soft+bonus+resemblance);
  });
  const index=performance.attempt;
  const draws=tastes.map((_,i)=>new RNG(`${sim.seed}:courtship-reception:${actor.id}:${target.id}:${index}:${i}`).next());
  const accepted=draws[0]<chances[0]&&draws[1]<chances[1];
  return {accepted,reason:accepted?'mutual-acceptance':draws[0]>=chances[0]?'first-declines':'second-declines',chances,appeal,competing};
}
export function performCourtship(sim,actor,target){
  if(!actor?.alive||!target?.alive||dist(actor,target)>(sim.reachBetween?.(actor,target,COURTSHIP_PERFORMANCE.radius)??COURTSHIP_PERFORMANCE.radius)){actor.courtshipPerformance=null;return false;}
  if(!sim.canMatePair(actor,target,{ready:true})){actor.courtshipPerformance=null;return false;}
  const current=actor.courtshipPerformance;
  // Completion uses the same one-life-update validity window as activeCourtship.
  if(current?.partnerId===target.id&&sim.tickCount<=current.endsAt+CFG.lifeStride){
    if(sim.tickCount<current.endsAt)return false;
    actor.completedCourtship={...current};actor.courtshipPerformance=null;
    return true;
  }
  const available=availableCourtshipMoves(actor);
  const requested=actor.queuedCourtshipSequence;
  const valid=Array.isArray(requested)&&requested.length>0&&requested.length<=3&&
    requested.every(move=>move==='approach'||available.includes(move));
  if(Array.isArray(requested)&&requested.length&&!valid){actor.courtshipPerformance=null;actor.queuedCourtshipSequence=null;actor.intent='idle';actor.target=null;actor.lastCourtshipFailure={partnerId:target.id,tick:sim.tickCount,reason:'This body cannot perform the queued sequence.'};return false}
  const sequence=valid?[...requested]:chooseCourtshipSequence(sim,actor),cost=courtshipCost(actor,sequence);
  if(actor.energy<cost||actor.infected||actor.health<COURTSHIP_PERFORMANCE.minHealth){actor.courtshipPerformance=null;return false;}
  actor.energy-=cost;actor.completedCourtship=null;actor.queuedCourtshipSequence=null;
  const memory=learned(actor),attempt=memory.attempts++;
  const practice=memory.patterns?.[signature(sequence)]?.success||0;
  const quality=clamp(.35,1,.51+Math.min(.25,practice*.03)+actor.energy/Math.max(1,(SPECIES[actor.species]?.maxEnergy||100))*.12);
  actor.courtshipPerformance={partnerId:target.id,startedAt:sim.tickCount,
    endsAt:sim.tickCount+COURTSHIP_PERFORMANCE.beats*sequence.length*CFG.lifeStride,
    intensity:displayIntensity(actor),energySpent:cost,sequence,attempt,quality,qualityBase:.51+actor.energy/Math.max(1,(SPECIES[actor.species]?.maxEnergy||100))*.12,
    tempo:clamp(-1,1,((actor.genes?.temperament??1)-1)*3)};
  return false;
}
export function activeCourtship(sim,actor){
  const state=actor.courtshipPerformance;if(!state)return null;
  const partner=sim.animals.find(a=>a.id===state.partnerId&&a.alive);
  if(!partner||!actor.alive||!sim.canMatePair(actor,partner,{ready:true})||
    dist(actor,partner)>COURTSHIP_PERFORMANCE.contestRadius||
    sim.tickCount>state.endsAt+CFG.lifeStride){actor.courtshipPerformance=null;return null;}
  return partner;
}
export function currentCourtshipMove(sim,actor){
  const state=actor.courtshipPerformance;if(!state?.sequence?.length)return null;
  const step=Math.floor(Math.max(0,sim.tickCount-state.startedAt)/(COURTSHIP_PERFORMANCE.beats*CFG.lifeStride));
  return state.sequence[Math.min(state.sequence.length-1,step)];
}

// Live input edits only unperformed beats of the existing funded performance.
export function upcomingMoveAvailability(sim,actor,move,{index}={}){
 const state=actor?.courtshipPerformance;
 if(sim.paused)return{enabled:false,reason:'Resume the world first.'};
 if(!actor?.alive||!state||sim.tickCount>=state.endsAt)return{enabled:false,reason:'No ongoing performance to change.'};
 const partner=sim.animals.find(a=>a.id===state.partnerId&&a.alive);
 if(!partner||!sim.canMatePair(actor,partner,{ready:true})||dist(actor,partner)>COURTSHIP_PERFORMANCE.contestRadius)return{enabled:false,reason:'The encounter is no longer physically valid.'};
 if(move!=='approach'&&!availableCourtshipMoves(actor).includes(move))return{enabled:false,reason:'This body cannot perform '+move+'.'};
 const step=Math.floor((sim.tickCount-state.startedAt)/(COURTSHIP_PERFORMANCE.beats*CFG.lifeStride)),slot=index??state.sequence.length;
 if(!Number.isInteger(slot)||slot<=step||slot>state.sequence.length||slot>=3)return{enabled:false,reason:slot<=step?'That beat has already started.':'Choose a future beat to replace; at most three moves.'};
 const sequence=[...state.sequence];sequence[slot]=move;
 const cost=Math.max(0,courtshipCost(actor,sequence)-state.energySpent);
 if(actor.energy<cost)return{enabled:false,reason:'Not enough energy for another display.',cost};
 return{enabled:true,reason:slot===state.sequence.length?'Add next display · '+cost.toFixed(2)+' energy.':'Replace the selected future display; no extra cost.',slot,cost,sequence};
}
export function changeUpcomingMove(sim,actor,move,options={}){
 const status=upcomingMoveAvailability(sim,actor,move,options);if(!status.enabled)return{ok:false,...status};
 const state=actor.courtshipPerformance,added=status.sequence.length-state.sequence.length;
 const patterns=actor.courtshipLearning?.patterns||{},oldPractice=patterns[signature(state.sequence)]?.success||0;
 const base=(state.qualityBase??state.quality-Math.min(.25,oldPractice*.03))-.12*status.cost/Math.max(1,SPECIES[actor.species]?.maxEnergy||100);
 actor.energy-=status.cost;state.energySpent+=status.cost;state.sequence=status.sequence;state.endsAt+=added*COURTSHIP_PERFORMANCE.beats*CFG.lifeStride;
 state.qualityBase=base;state.quality=clamp(.35,1,base+Math.min(.25,(patterns[signature(state.sequence)]?.success||0)*.03));
 return{ok:true,sequence:[...state.sequence],cost:status.cost,message:added?'Added '+move+' to this performance.':'Upcoming display changed to '+move+'.'};
}
