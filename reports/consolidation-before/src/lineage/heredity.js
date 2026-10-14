import {GENETIC_DOMAIN} from '../organisms/species.js';
import {CFG} from '../sim/config.js';
import {ADAPTATIONS,ADAPTATION_IDS,ANATOMY_AXES,ANATOMY_FOR,BODY_ABILITIES,syncAnatomy,expressedAdaptations,emptyAnatomy,seedValueFor,refreshExpression} from './evolution.js';

// v1.31 Succession as Selection (anatomy since v1.32 Stage D): heredity for the founder line.
// Children blend both parents, siblings differ, and inherited adaptations can be carried by
// some siblings and not others. New adaptations appear in actual newborns, weighted by the
// pressures their parents lived through, instead of being picked from a draft at handoff.
// Wild populations keep the original inheritance so background ecology is unchanged.

const GENE_MIN=GENETIC_DOMAIN.min,GENE_MAX=GENETIC_DOMAIN.max;
const clamp=v=>Math.max(GENE_MIN,Math.min(GENE_MAX,v));

export function isLineageBirth(parents){return !!(parents?.length===2&&parents.some(p=>p?.lineage)&&parents.every(p=>p?.genes&&p?.bodyPlan))}

// Blend the parents, then add sibling-to-sibling spread and occasional larger jumps.
export function inheritLineageGenes(rng,a,b,keys){
  const H=CFG.heredity,g={};
  for(const k of keys){
    const pa=a?.[k]??1,pb=b?.[k]??1,mid=(pa+pb)/2,spread=Math.abs(pa-pb)/2;
    let v=mid+rng.range(-1,1)*spread*H.segregation+rng.range(-H.mutation,H.mutation);
    if(rng.chance(H.largeMutationChance))v+=rng.range(-H.largeMutation,H.largeMutation);
    g[k]=clamp(v);
  }
  return g;
}

// Stage D: children inherit anatomy, and their adaptations are what that anatomy expresses.
// A body part one parent has developed past a threshold is carried by most, not all,
// children; both parents carrying it passes it on reliably. Small sibling differences come
// from a deterministic per-child jitter, so the random stream matches v1.31 heredity.
const jitter=(seed,axis)=>{let h=2166136261^seed;for(let i=0;i<axis.length;i++){h^=axis.charCodeAt(i);h=Math.imul(h,16777619)}return(((h>>>0)%1000)/1000-.5)*.08};
export function inheritLineageAnatomy(rng,parents,childSeed=0){
  const H=CFG.heredity,[a,b]=parents.map(p=>syncAnatomy(p)||emptyAnatomy()),out=emptyAnatomy();
  const tier=(v,axis)=>{let t=0;for(const def of Object.values(ANATOMY_FOR))if(def.axis===axis&&v>=def.threshold)t++;return t};
  // Visit body parts in the order the parents' adaptations are listed (the v1.31 draw order).
  const order=[];for(const p of parents)for(const id of p?.adaptations||[]){const ax=ANATOMY_FOR[id]?.axis;if(ax&&!order.includes(ax))order.push(ax)}
  for(const ax of Object.keys(ANATOMY_AXES))if(!order.includes(ax))order.push(ax);
  for(const ax of order){
    const va=a[ax]||0,vb=b[ax]||0,hi=Math.max(va,vb),lo=Math.min(va,vb);
    let v=tier(hi,ax)===tier(lo,ax)?(va+vb)/2:(rng.chance(H.singleParentCarry)?hi:lo);
    // Sibling jitter never moves a body part across a threshold on its own.
    if(v>0){const j=Math.max(0,Math.min(1,v+jitter(childSeed,ax)));if(tier(j,ax)===tier(v,ax))v=j}
    out[ax]=v;
  }
  return out;
}

// Kept for older callers and tests: the adaptations a child would express.
export function inheritLineageAdaptations(rng,parents){return expressedAdaptations(inheritLineageAnatomy(rng,parents))}
export function adaptationCarryChance(id,a,b){
  const def=ANATOMY_FOR[id],ea=def?(syncAnatomy(a)?.[def.axis]||0)>=def.threshold:false,eb=def?(syncAnatomy(b)?.[def.axis]||0)>=def.threshold:false;
  const n=(ea?1:0)+(eb?1:0);
  return n>=2?1:n===1?CFG.heredity.singleParentCarry:0;
}

// Rank adaptations a newborn might show, from the pressures its parents lived through.
export function rankEmergentAdaptations(existing,pressure){
  const scores=new Map();
  for(const id of ADAPTATION_IDS){
    if(existing.has(id))continue;const def=ADAPTATIONS[id];
    if((def.requires||[]).some(r=>!existing.has(r)))continue;
    let s=0;for(const p of pressure||[])s+=(def.pressure?.[p.kind]||0)*(p.score||0);
    if(s>0)scores.set(id,s);
  }
  return [...scores].sort((x,y)=>y[1]-x[1]||x[0].localeCompare(y[0]));
}

// Occasionally a newborn shows a new adaptation suited to what its parents faced.
export function emergentAdaptation(sim,child,parents){
  const H=CFG.heredity;if(!child||!parents?.length)return null;
  const pressure=[];for(const p of parents)for(const item of sim.pressure?.lifetimeSummary?.(p,{limit:4})||[])pressure.push(item);
  const total=pressure.reduce((n,p)=>n+(p.score||0),0);if(total<H.emergenceMinPressure)return null;
  // Lived pressure also nudges the matching body part a little in every newborn, so a lineage
  // that keeps living under the same pressure develops toward the threshold over generations.
  syncAnatomy(child);const drift=rankEmergentAdaptations(new Set(child.adaptations||[]),pressure)[0];
  if(drift){const def=ANATOMY_FOR[drift[0]];if(def){child.anatomy[def.axis]=Math.min(1,(child.anatomy[def.axis]||0)+Math.min(H.anatomyDriftMax,total*H.anatomyDriftPerPressure));refreshExpression(child);
    const parentHas=new Set(parents.flatMap(p=>p?.adaptations||[]));for(const id of child.adaptations)if(!parentHas.has(id)&&!(child.bornWith||[]).includes(id))child.bornWith=[...(child.bornWith||[]),id]}}
  // A body part that already expresses its adaptation keeps developing toward a body ability
  // (v1.33.1 Pounce) when the parents lived under pressure that favors it. No RNG is used.
  syncAnatomy(child);
  for(const def of Object.values(BODY_ABILITIES)){if(def.requires&&!(child.adaptations||[]).includes(def.requires))continue;let s=0;for(const p of pressure)s+=(def.pressure?.[p.kind]||0)*(p.score||0);if(s>0)child.anatomy[def.axis]=Math.min(1,(child.anatomy[def.axis]||0)+Math.min(H.anatomyDriftMax,total*H.anatomyDriftPerPressure)*.5)}
  const chance=Math.min(H.emergenceMax,H.emergenceBase+total*H.emergencePerPressure);
  if(!sim.rng.chance(chance))return null;
  const ranked=rankEmergentAdaptations(new Set(child.adaptations||[]),pressure);if(!ranked.length)return null;
  // Weighted pick among the top few so siblings can diverge in different directions.
  const top=ranked.slice(0,3),sum=top.reduce((n,[,s])=>n+s,0);let roll=sim.rng.range(0,sum),pick=top[0][0];
  for(const [id,s] of top){roll-=s;if(roll<=0){pick=id;break}}
  const def=ANATOMY_FOR[pick];syncAnatomy(child);if(def)child.anatomy[def.axis]=Math.max(child.anatomy[def.axis]||0,seedValueFor(pick));refreshExpression(child);
  if(!child.adaptations.includes(pick))return null;child.bornWith=[...(child.bornWith||[]),pick];
  return pick;
}
