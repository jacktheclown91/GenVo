import {CFG} from '../sim/config.js';
import {PARTS,partDef} from './part-registry.js';
import {validatePlan,partCounts} from './body-plan.js';
import {expressedAdaptations,adaptationEffects,bodyAbility,BODY_ABILITIES} from './evolution.js';
import {canSwim} from './lifestyle.js';

// Evolution Expansion (GDD v1, sections 6.5 and 11, backlog EV-005): the phenotype resolver.
// Pure: a body plan (plus the creature's non-body context) in, derived capabilities out.
//
// Phase A contract (adapter): every number comes from the existing v1.33.7 authorities through
// the plan's legacy anatomy (adaptations, adaptation effects, Pounce, the water rule), so the
// resolver reproduces today's game exactly and cannot double-count. Parts decide which actions
// exist, gated by the same legacy thresholds. Part mass and upkeep are reported but applied
// nowhere until a later phase moves an authority onto parts with its own tests.

// Actions whose availability still follows a legacy threshold on the part's anatomy axis.
const LEGACY_ACTION_GATES=Object.freeze({pounce:{axis:BODY_ABILITIES.pounce.axis,threshold:BODY_ABILITIES.pounce.threshold}});

export function resolvePhenotype(plan,{animal=null}={}){
  const check=validatePlan(plan);if(!check.ok)return{ok:false,errors:check.errors};
  const legacy=plan.legacyAnatomy||{},adaptations=expressedAdaptations(legacy);
  // A stand-in carrying only what the legacy authorities read about the body.
  const body={species:'genvo',alive:animal?.alive!==false,adaptations,anatomy:legacy,ecoLifestyle:animal?.ecoLifestyle||null};
  const counts=partCounts(plan),actions=new Set();
  for(const [id,n] of Object.entries(counts))if(n>0)for(const c of partDef(id).actionCapabilities)actions.add(c);
  for(const [action,gate] of Object.entries(LEGACY_ACTION_GATES))if(actions.has(action)&&(legacy[gate.axis]||0)<gate.threshold)actions.delete(action);
  const pounce=bodyAbility(body,'pounce'),P=CFG.pounce;
  let mass=0,upkeep=0;for(const [id,n] of Object.entries(counts)){mass+=PARTS[id].mass*n;upkeep+=PARTS[id].upkeep*n}
  return{
    ok:true,planId:plan.id,parts:counts,
    adaptations,
    effects:adaptationEffects(body),
    actions:[...actions].sort(),
    pounceReach:pounce?P.reach[0]+(pounce-.8)/.2*(P.reach[1]-P.reach[0]):0,
    // Water rule unchanged (GDD 2 and 6.2): webbing or an aquatic lifestyle, never a paddle tail alone.
    canSwim:canSwim(body),
    informational:{mass:+mass.toFixed(3),upkeep:+upkeep.toFixed(3)}
  };
}
