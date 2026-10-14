import {partEffectFactors} from './part-abilities.js';
import {CFG} from '../sim/config.js';
// Major inherited adaptations: discrete lineage unlocks earned from lived pressure.
// These are separate from the continuous eight-gene system.

export const ADAPTATIONS={
  'hardened-mantle':{name:'Hardened Mantle',short:'Armor',branch:'defense',summary:'Stalker bites hurt less.',tradeoff:'Sprinting is slightly slower.',pressure:{predation:5,disease:.5},visual:'thicker mantle'},
  'barbed-limbs':{name:'Barbed Limbs',short:'Barbs',branch:'defense',summary:'Your bite-and-limb strike can drive a Stalker back.',tradeoff:'Sprinting costs a little more energy.',pressure:{predation:5,scarcity:1},visual:'barbed outer legs'},
  'bitter-slime':{name:'Bitter Slime',short:'Bitter slime',branch:'defense',summary:'A Stalker that bites you recoils and avoids you briefly.',tradeoff:'Making the secretion costs energy.',pressure:{predation:5,disease:1},visual:'bright mantle edge'},
  'spring-tendons':{name:'Spring Tendons',short:'Spring legs',branch:'mobility',summary:'Sprint faster when escape matters.',tradeoff:'Fast sprinting burns more energy.',pressure:{predation:3,dryness:2,scarcity:1},visual:'long springing rear legs'},
  'water-sacs':{name:'Water Sacs',short:'Water sacs',branch:'survival',summary:'Lose water more slowly.',tradeoff:'A little extra body mass slows sprinting.',pressure:{dryness:6,heat:1,cold:1},visual:'fuller side lobes'},
  'efficient-gut':{name:'Efficient Gut',short:'Efficient gut',branch:'survival',summary:'Food restores more energy.',tradeoff:'Uses a little more water.',pressure:{scarcity:6,dryness:1},visual:'deeper lower mantle'},
  'fast-healing':{name:'Fast Healing',short:'Fast healing',branch:'survival',summary:'Recover health much faster while well fed.',tradeoff:'Healing raises daily energy use.',pressure:{disease:5,predation:2,scarcity:1},visual:'pale repair spots'},
  'alarm-pulse':{name:'Alarm Pulse',short:'Alarm pulse',branch:'social',summary:'Press X to warn nearby family when a Stalker is close.',tradeoff:'The pulse costs energy and has a cooldown.',pressure:{predation:3,fewMates:3},visual:'paired sensory crest'},

  // v0.52 adds strategies that change what the player can do, not just numeric fitness.
  'camouflage-mantle':{name:'Camouflage Mantle',short:'Camouflage',branch:'stealth',summary:'Hide in dense cover and feed quietly without revealing yourself.',tradeoff:'Ordinary movement still exposes you; very close Stalkers can still find you.',pressure:{predation:5,scarcity:1},visual:'broken habitat-colored mottling'},
  'heavy-jaw':{name:'Heavy Jaw',short:'Heavy jaw',branch:'offense',summary:'Your bite hits much harder; fit descendants may challenge Stalkers near home.',tradeoff:'The larger jaw raises water use.',pressure:{predation:4,scarcity:3},visual:'larger jaw plates'},
  'mobbing-instinct':{name:'Mobbing Instinct',short:'Mobbing',branch:'social',summary:'Rally adult family against Stalkers; mature relatives also defend threatened young.',tradeoff:'Rallying costs energy and can put relatives at risk.',pressure:{predation:4,fewMates:4},visual:'flared signal crests'},
  'grasping-limbs':{name:'Grasping Limbs',short:'Graspers',branch:'utility',summary:'Press Z to carry food back to shelter from farther away.',tradeoff:'Carrying slows your sprint.',pressure:{scarcity:5,fewMates:2,dryness:1},visual:'hooked front feet'},

  // v0.53 deepens four strategies into actual evolutionary branches.
  'adaptive-chromatophores':{name:'Adaptive Chromatophores',short:'Color shift',branch:'stealth',tier:2,requires:['camouflage-mantle'],summary:'Stay hidden while moving and foraging cautiously through dense cover.',tradeoff:'Sprinting or leaving cover exposes you.',pressure:{predation:6,scarcity:1},visual:'moving habitat-matched bands'},
  'crushing-jaw':{name:'Crushing Jaw',short:'Crushing jaw',branch:'offense',tier:2,requires:['heavy-jaw'],summary:'Bites can stagger Stalkers; healthy descendants patrol a wider home core.',tradeoff:'The larger jaw costs more energy and water.',pressure:{predation:6,scarcity:2},visual:'massive paired jaw plates'},
  'coordinated-defense':{name:'Coordinated Defense',short:'Coordinated defense',branch:'social',tier:2,requires:['mobbing-instinct'],summary:'Rallied adults brace together and defend young across a wider family area.',tradeoff:'A coordinated rally still risks several family members.',pressure:{predation:5,fewMates:5},visual:'paired rally crests'},
  'provisioning-pouches':{name:'Provisioning Pouches',short:'Provisioning',branch:'utility',tier:2,requires:['grasping-limbs'],summary:'Carry a double food load; stocked shelter supports longer family excursions.',tradeoff:'A full load slows movement more heavily.',pressure:{scarcity:6,fewMates:3},visual:'full ventral food pouches'},
  'webbed-limbs':{name:'Webbed Limbs',short:'Swimming',branch:'aquatic',tier:2,requires:['water-sacs'],summary:'Cross rivers and open water instead of stopping at the bank.',tradeoff:'Swimming is slower than land travel and drains energy faster.',pressure:{wetness:9,predation:1,scarcity:1},visual:'broad webbing between the outer toes'}
};

export const ADAPTATION_IDS=Object.keys(ADAPTATIONS);

// v1.32 consolidation Stage D: adaptations are expressions of inherited anatomy.
// Each founder-line creature carries a few continuous body-part values (0..1). An adaptation
// is expressed when its body part crosses a threshold; a tier 2 adaptation is the same body
// part developed further. The adaptation list on an animal is a cache of what its anatomy
// expresses, so every existing reader (hasAdaptation, effects, UI) keeps working.
export const ANATOMY_AXES=Object.freeze({
  armor:'mantle plating',barbs:'limb barbs',glands:'mantle glands',spring:'rear-leg tendons',
  waterBody:'water-holding body',gut:'gut',repair:'tissue repair',signal:'signal crest',
  rally:'rally crest',skin:'skin pigment',jaw:'jaw',forelimb:'forelimbs'
});
export const ANATOMY_FOR=Object.freeze({
  'hardened-mantle':{axis:'armor',threshold:.5},'barbed-limbs':{axis:'barbs',threshold:.5},'bitter-slime':{axis:'glands',threshold:.5},
  'spring-tendons':{axis:'spring',threshold:.5},'water-sacs':{axis:'waterBody',threshold:.5},'webbed-limbs':{axis:'waterBody',threshold:.8},
  'efficient-gut':{axis:'gut',threshold:.5},'fast-healing':{axis:'repair',threshold:.5},'alarm-pulse':{axis:'signal',threshold:.5},
  'mobbing-instinct':{axis:'rally',threshold:.5},'coordinated-defense':{axis:'rally',threshold:.8},
  'camouflage-mantle':{axis:'skin',threshold:.5},'adaptive-chromatophores':{axis:'skin',threshold:.8},
  'heavy-jaw':{axis:'jaw',threshold:.5},'crushing-jaw':{axis:'jaw',threshold:.8},
  'grasping-limbs':{axis:'forelimb',threshold:.5},'provisioning-pouches':{axis:'forelimb',threshold:.8}
});
// Where an expressed adaptation sits on its body part when it is first seeded (migration,
// a legacy draft choice, or a newborn variation): clearly past the threshold.
export const ANATOMY_SEED=Object.freeze({tier1:.65,tier2:.9});
// v1.33.1 body abilities: things a body can do once a part is developed far enough, read from
// anatomy rather than granted as an adaptation. Pounce is a long spring off highly developed
// rear-leg tendons, the part that first gives Spring Tendons.
export const BODY_ABILITIES=Object.freeze({
  pounce:{name:'Pounce',axis:'spring',threshold:.8,requires:'spring-tendons',pressure:{predation:4,scarcity:2,dryness:1}}
});
// The body part's development if this creature can use the ability, else 0. Pure.
export function bodyAbility(animal,id){const def=BODY_ABILITIES[id];if(!def||animal?.species!=='genvo')return 0;const v=animal.anatomy?.[def.axis]||0;return v>=def.threshold?v:0}
export function emptyAnatomy(){return Object.fromEntries(Object.keys(ANATOMY_AXES).map(k=>[k,0]))}
export function seedValueFor(id){const def=ANATOMY_FOR[id];return def?.threshold>=.8?ANATOMY_SEED.tier2:ANATOMY_SEED.tier1}
export function expressedAdaptations(anatomy){
  if(!anatomy)return[];return ADAPTATION_IDS.filter(id=>{const def=ANATOMY_FOR[id];return def&&(anatomy[def.axis]||0)>=def.threshold});
}
export function anatomyFromAdaptations(ids){
  const out=emptyAnatomy();for(const id of ids||[]){const def=ANATOMY_FOR[id];if(def)out[def.axis]=Math.max(out[def.axis],seedValueFor(id))}
  return out;
}
// Keep anatomy and the adaptation cache in step. Anatomy is the truth; an adaptation list
// edited directly (older saves, tests, the legacy draft) is folded back into anatomy first.
export function syncAnatomy(animal){
  if(!animal)return null;
  if(!animal.anatomy){animal.anatomy=anatomyFromAdaptations(animal.adaptations);return animal.anatomy}
  const want=new Set(animal.adaptations||[]),have=expressedAdaptations(animal.anatomy);
  if(have.length===want.size&&have.every(id=>want.has(id)))return animal.anatomy;
  for(const id of want){const def=ANATOMY_FOR[id];if(def&&(animal.anatomy[def.axis]||0)<def.threshold)animal.anatomy[def.axis]=seedValueFor(id)}
  for(const id of expressedAdaptations(animal.anatomy))if(!want.has(id)){const def=ANATOMY_FOR[id];animal.anatomy[def.axis]=Math.max(0,def.threshold-.15)}
  return animal.anatomy;
}
export function refreshExpression(animal){if(!animal)return[];animal.adaptations=expressedAdaptations(animal.anatomy);return animal.adaptations}
// Body parts that are developing but not yet expressed, for successor and mate comparisons.
export function nearThreshold(animal,margin=.12){
  const a=syncAnatomy(animal);if(!a)return[];const out=[];
  for(const id of ADAPTATION_IDS){const def=ANATOMY_FOR[id],v=a[def.axis]||0;if(v<def.threshold&&v>=def.threshold-margin&&v>0&&(!ADAPTATIONS[id].requires||ADAPTATIONS[id].requires.every(r=>{const d=ANATOMY_FOR[r];return (a[d.axis]||0)>=d.threshold})))out.push({id,name:ADAPTATIONS[id].name,progress:v/def.threshold})}
  for(const [id,def] of Object.entries(BODY_ABILITIES)){const v=a[def.axis]||0;if(v<def.threshold&&v>=def.threshold-margin&&(!def.requires||(animal.adaptations||[]).includes(def.requires)))out.push({id,name:def.name,progress:v/def.threshold,ability:true})}
  return out.sort((x,y)=>y.progress-x.progress);
}

export function inheritedAdaptations(parents){
  if(!parents?.length)return[];
  return [...new Set(parents.flatMap(p=>p?.adaptations||[]))];
}

export function hasAdaptation(animal,id){return !!animal?.adaptations?.includes(id)}
export function adaptationList(animal){return (animal?.adaptations||[]).map(id=>ADAPTATIONS[id]).filter(Boolean)}

export class EvolutionController{
  constructor(sim){this.sim=sim;this.pending=null;this.lastChoice=null}
  onHandoff(from,to,handoff){
    if(!from||!to||to.species!=='genvo')return null;
    // v1.31: adaptations now appear in newborns. The draft only runs if re-enabled.
    if(!CFG.evolution?.handoffDraft){if(handoff)handoff.bornAdaptations=(to.bornWith||[]).map(id=>ADAPTATIONS[id]?.name).filter(Boolean);return null}
    const existing=new Set(to.adaptations||[]),pressure=this.sim.pressure?.lifetimeSummary?.(from,{limit:6})||[];
    const ranked=rankOffers({pressure,existing,cause:this.sim.lineage.records.get(from.id)?.cause,generation:to.generation});
    const offers=diverseOffers(ranked,existing,3);
    if(!offers.length){this.pending=null;return null}
    this.pending={fromId:from.id,toId:to.id,generation:to.generation,pressure:pressure.map(p=>({kind:p.kind,score:p.score,peak:p.peak})),offers:offers.map(id=>({id,...ADAPTATIONS[id]})),chosen:null,handoff};
    return this.pending;
  }
  offerFor(animal=this.sim.player()){return this.pending&&animal?.id===this.pending.toId?this.pending:null}
  choose(id){
    const p=this.pending;if(!p||p.chosen||!p.offers.some(o=>o.id===id))return false;
    const animal=this.sim.animals.find(a=>a.id===p.toId&&a.alive);if(!animal)return false;
    syncAnatomy(animal);const def=ANATOMY_FOR[id];if(def)animal.anatomy[def.axis]=Math.max(animal.anatomy[def.axis]||0,seedValueFor(id));refreshExpression(animal);
    const rec=this.sim.lineage.records.get(animal.id);if(rec)rec.adaptations=[...animal.adaptations];
    p.chosen=id;this.lastChoice={id,animalId:animal.id,generation:animal.generation,tick:this.sim.tickCount};
    return ADAPTATIONS[id];
  }
  clearChosen(){if(this.pending?.chosen)this.pending=null}
}

function rankOffers({pressure,existing,cause,generation}){
  const eligible=ADAPTATION_IDS.filter(id=>!existing.has(id)&&requirementsMet(id,existing));
  const scores=new Map(eligible.map(id=>[id,0]));
  for(const p of pressure||[])for(const [id,def] of Object.entries(ADAPTATIONS))if(scores.has(id))scores.set(id,scores.get(id)+(def.pressure?.[p.kind]||0)*(p.score||.2));
  if(cause==='predation')for(const id of ['hardened-mantle','barbed-limbs','bitter-slime','camouflage-mantle','heavy-jaw','mobbing-instinct'])if(scores.has(id))scores.set(id,scores.get(id)+4);
  // Quiet generations still get meaningful choices, but lived pressure remains the main ranking signal.
  const fallback=['webbed-limbs','adaptive-chromatophores','crushing-jaw','coordinated-defense','provisioning-pouches','efficient-gut','spring-tendons','camouflage-mantle','grasping-limbs','fast-healing','alarm-pulse','water-sacs','heavy-jaw','hardened-mantle','mobbing-instinct','barbed-limbs','bitter-slime'];
  fallback.forEach((id,i)=>{if(scores.has(id))scores.set(id,scores.get(id)+(fallback.length-i)*.025+(generation||1)*.0001)});
  return [...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
}

function requirementsMet(id,existing){const req=ADAPTATIONS[id]?.requires||[];return req.every(r=>existing.has(r))}

function diverseOffers(ranked,existing,count){
  const out=[],branches=new Set();
  for(const [id] of ranked){const branch=ADAPTATIONS[id]?.branch||id;if(branches.has(branch))continue;out.push(id);branches.add(branch);if(out.length>=count)return out}
  for(const [id] of ranked){if(out.includes(id)||existing.has(id))continue;out.push(id);if(out.length>=count)break}
  return out;
}

export function adaptationEffects(animal){
  const ids=new Set(animal?.adaptations||[]);
  const fx={
    predatorDamage:ids.has('hardened-mantle')?.74:1,
    sprintSpeed:(ids.has('spring-tendons')?1.14:1)*(ids.has('hardened-mantle')?.95:1)*(ids.has('water-sacs')?.97:1),
    sprintEnergy:(ids.has('spring-tendons')?1.18:1)*(ids.has('barbed-limbs')?1.08:1),
    waterUse:(ids.has('water-sacs')?.72:1)*(ids.has('efficient-gut')?1.06:1)*(ids.has('heavy-jaw')?1.08:1)*(ids.has('crushing-jaw')?1.07:1),
    foodGain:ids.has('efficient-gut')?1.28:1,
    healing:ids.has('fast-healing')?2.35:1,
    metabolism:ids.has('fast-healing')?1.07:1,
    playerStrike:(ids.has('barbed-limbs')?2.35:1)*(ids.has('heavy-jaw')?1.62:1)*(ids.has('crushing-jaw')?1.70:1),
    strikeEnergy:(ids.has('heavy-jaw')?1.16:1)*(ids.has('crushing-jaw')?1.18:1),
    bitterSlime:ids.has('bitter-slime'),
    alarmPulse:ids.has('alarm-pulse'),
    camouflage:ids.has('camouflage-mantle'),
    adaptiveCamouflage:ids.has('adaptive-chromatophores'),
    mobbing:ids.has('mobbing-instinct'),
    coordinatedDefense:ids.has('coordinated-defense'),
    grasping:ids.has('grasping-limbs'),
    provisioning:ids.has('provisioning-pouches'),
    swim:ids.has('webbed-limbs'),
    swimSpeed:ids.has('webbed-limbs')?.66:0,
    swimEnergy:ids.has('webbed-limbs')?1.48:1,
    carryCapacity:ids.has('provisioning-pouches')?2:1,
    carrySprint:ids.has('provisioning-pouches')?.80:ids.has('grasping-limbs')?.90:1
  };
  // Phase D: parts in a designed body plan add their costs and benefits here, once.
  const pf=partEffectFactors(animal);
  if(pf){fx.sprintSpeed*=pf.sprintSpeed;fx.metabolism*=pf.metabolism;fx.waterUse*=pf.waterUse;fx.playerStrike*=pf.playerStrike;fx.carryCapacity*=pf.carryCapacity}
  return fx;
}
