// Population-scale proto-speciation. Sustained separation can seed one modest
// inherited population trait. v1.13 adds deterministic reinforcement, weakening
// and gene-flow mixing without declaring separate species or consuming RNG.
// v1.32 Stage E/G: trait strength lives on the body (one anatomy axis per trait) and the trait
// is read from it; its population history sits on `protoHistory`.
import {protoReading,writeProto} from './readings.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));

export const PROTO_TRAITS={
  scarcity:{id:'frugal-frame',label:'Frugal Frame',short:'Frugal',pressure:'scarcity',summary:'A slightly thriftier body shaped by generations of thin forage.',cause:'sustained food scarcity',mechanic:'resting energy use falls modestly'},
  competition:{id:'range-sense',label:'Range Sense',short:'Range sense',pressure:'competition',summary:'A slightly more searching sensory profile shaped by crowded feeding grounds.',cause:'sustained resource competition',mechanic:'food search reaches a little farther'},
  predation:{id:'watch-crest',label:'Watch Crest',short:'Watch crest',pressure:'predation',summary:'A more vigilant sensory crest shaped by persistent predator pressure.',cause:'sustained predator pressure',mechanic:'nearby threats are noticed a little farther away'},
  crowding:{id:'close-brood',label:'Close-Brood Frame',short:'Close brood',pressure:'crowding',summary:'A compact social build shaped by dense family living.',cause:'sustained crowding',mechanic:'family shelter gives slightly better protection'},
  dryness:{id:'dryland-skin',label:'Dryland Skin',short:'Dryland',pressure:'dryness',summary:'A drier, tighter mantle shaped by repeated life away from reliable moisture.',cause:'sustained dry-ground pressure',mechanic:'daily water loss falls modestly'},
  wetness:{id:'splayfoot',label:'Splayfoot',short:'Splayfoot',pressure:'wetness',summary:'Broader footing shaped by generations living on saturated ground.',cause:'sustained wet-ground pressure',mechanic:'movement over wet ground becomes a little easier'},
  heat:{id:'heat-shed-mantle',label:'Heat-Shed Mantle',short:'Heat shed',pressure:'heat',summary:'A slightly leaner mantle shaped by persistent heat.',cause:'sustained heat pressure',mechanic:'heat strain is reduced modestly'},
  cold:{id:'cold-mantle',label:'Cold Mantle',short:'Cold mantle',pressure:'cold',summary:'A fuller mantle shaped by persistent cold.',cause:'sustained cold pressure',mechanic:'cold strain is reduced modestly'}
};
const BY_ID=Object.fromEntries(Object.values(PROTO_TRAITS).map(v=>[v.id,v]));
const EXPRESSION_FLOOR=.16;

export class ProtoSpeciationController{
  constructor(sim){this.sim=sim;this.notice=null;this.noticed=new Set()}
  traitFor(animal){
    const raw=protoReading(animal),def=raw?.id?BY_ID[raw.id]:null;if(!def||Number(raw.strength||0)<EXPRESSION_FLOOR)return null;
    const mixedFrom=(raw.mixedFrom||[]).map(v=>typeof v==='string'?{id:v,label:BY_ID[v]?.label||v}:{...v,label:v.label||BY_ID[v.id]?.label||v.id}).filter(v=>BY_ID[v.id]);
    return{...def,...raw,strength:clamp(raw.strength,EXPRESSION_FLOOR,.72),lineageDepth:Math.max(1,raw.lineageDepth||1),geneFlow:clamp(raw.geneFlow||0),mixedFrom};
  }
  populations(){return this.sim.populationMemory?.populations?.()||[]}
  differentialFor(key){
    const memory=this.sim.populationMemory,profile=memory?.profile?.(key);if(!profile||profile.days<5)return null;
    const peers=memory.snapshots?.().filter(x=>x.population.key!==key&&x.profile?.days>=5)||[];if(!peers.length)return null;let best=null;
    for(const peer of peers){const theirs=Object.fromEntries(peer.profile.axes.map(a=>[a.id,a.mean]));const deltas=profile.axes.map(a=>({id:a.id,label:a.label,mine:a.mean,other:theirs[a.id]||0,delta:a.mean-(theirs[a.id]||0),magnitude:Math.abs(a.mean-(theirs[a.id]||0))})).sort((a,b)=>b.magnitude-a.magnitude||a.id.localeCompare(b.id));const score=deltas.reduce((n,d)=>n+d.magnitude,0)/Math.max(1,deltas.length);if(!best||score>best.score)best={key,profile,peer:peer.population,peerProfile:peer.profile,score,deltas}}
    if(!best||best.score<.12)return null;const positive=best.deltas.filter(d=>d.delta>=.18&&d.mine>=.28&&PROTO_TRAITS[d.id]).sort((a,b)=>b.delta-a.delta||b.mine-a.mine||a.id.localeCompare(b.id));if(!positive.length)return null;return{...best,dominant:positive[0],positive};
  }
  sourcePopulationFor(child){if(!child)return null;const pops=this.populations();if(!pops.length)return null;const secondaries=pops.filter(p=>!p.primary).map(p=>({p,d:Math.hypot(child.x-p.x,child.y-p.y)})).sort((a,b)=>a.d-b.d||String(a.p.key).localeCompare(String(b.p.key)));const nearest=secondaries[0],radius=Math.max(5.5,(this.sim.territory?.cellSize||6)*.9);if(nearest&&nearest.d<=radius)return nearest.p;return pops.find(p=>p.primary)||pops[0]}
  qualifiedParentResidence(parents,key){const memory=this.sim.populationMemory;let best=null;for(const parent of parents||[]){const affinity=memory?.affinityFor?.(parent);if(!affinity||affinity.key!==key||affinity.days<3||affinity.share<.55)continue;if(!best||affinity.share>best.affinity.share||affinity.days>best.affinity.days)best={parent,affinity}}return best}
  pressureSupport(pop,pressure){const profile=this.sim.populationMemory?.profile?.(pop?.key);if(!profile)return 0;return profile.axes.find(a=>a.id===pressure)?.mean||0}
  parentTraits(parents=[]){return parents.map(parent=>({parent,trait:this.traitFor(parent)})).filter(x=>x.trait)}
  localCandidate(child,parents,pop){
    const residence=this.qualifiedParentResidence(parents,pop.key);if(!residence)return null;const diff=this.differentialFor(pop.key);if(!diff?.dominant)return null;const axis=diff.dominant,def=PROTO_TRAITS[axis.id];if(!def)return null;
    const pts=this.parentTraits(parents),same=pts.filter(x=>x.trait.id===def.id).sort((a,b)=>b.trait.strength-a.trait.strength)[0]?.trait||null,foreign=pts.map(x=>x.trait).filter(t=>t.id!==def.id);
    const historyWeight=clamp((diff.profile.days-4)/8),residenceWeight=clamp((residence.affinity.share-.55)/.45);let strength=.20+axis.mine*.16+axis.delta*.22+historyWeight*.07+residenceWeight*.05;
    let state='emerged',depth=1,geneFlow=0,mixedFrom=[];
    if(same){strength=Math.max(strength,same.strength*.94+.055);state='reinforced';depth=same.lineageDepth+1}
    if(foreign.length){geneFlow=clamp(.12+foreign.reduce((n,t)=>n+t.strength,0)/foreign.length*.24,.12,.34);strength-=.035+.055*geneFlow;mixedFrom=[...new Map(foreign.map(t=>[t.id,{id:t.id,label:t.label,strength:t.strength}])).values()];state=same?'mixed-reinforced':'mixed'}
    strength=clamp(strength,.20,.68);return{def,pop,diff,axis,residence:residence.affinity,strength,state,depth,geneFlow,mixedFrom,origin:same?{key:same.originPopulationKey||same.populationKey,label:same.originPopulationLabel||same.populationLabel}:{key:pop.key,label:pop.label||pop.key}};
  }
  inheritedCandidate(child,parents,pop){
    const pts=this.parentTraits(parents);if(!pts.length)return null;const profile=this.sim.populationMemory?.profile?.(pop.key)||null;
    const ranked=pts.map(x=>{const support=this.pressureSupport(pop,x.trait.pressure);return{...x,support,score:x.trait.strength*.62+support*.38}}).sort((a,b)=>b.score-a.score||b.trait.strength-a.trait.strength||a.trait.id.localeCompare(b.trait.id));
    const chosen=ranked[0],others=ranked.filter(x=>x.trait.id!==chosen.trait.id),same=ranked.filter(x=>x.trait.id===chosen.trait.id),support=chosen.support;let strength,state,geneFlow=0,mixedFrom=[];
    if(same.length>=2){const avg=same.reduce((n,x)=>n+x.trait.strength,0)/same.length;strength=avg*(support>=.24?.96:.87);state=support>=.24?'persisting':'weakened'}
    else{strength=chosen.trait.strength*(.84+Math.min(.08,support*.18));state=support>=.22?'persisting':'weakened';if((parents||[]).length>1)geneFlow=.12}
    if(others.length){geneFlow=clamp(.20+others.reduce((n,x)=>n+x.trait.strength,0)/others.length*.20,.20,.38);strength*=.88-.08*geneFlow;mixedFrom=[...new Map(others.map(x=>[x.trait.id,{id:x.trait.id,label:x.trait.label,strength:x.trait.strength}])).values()];state='mixed'}
    if(strength<EXPRESSION_FLOOR)return null;const diff=this.differentialFor(pop.key),axis=diff?.deltas?.find(d=>d.id===chosen.trait.pressure)||null,origin={key:chosen.trait.originPopulationKey||chosen.trait.populationKey,label:chosen.trait.originPopulationLabel||chosen.trait.populationLabel};
    return{def:BY_ID[chosen.trait.id],pop,diff,axis,residence:null,strength:clamp(strength,EXPRESSION_FLOOR,.68),state,depth:chosen.trait.lineageDepth+1,geneFlow,mixedFrom,origin,sourceTrait:chosen.trait,profile,support};
  }
  candidateFor(child,parents=[]){if(!child?.lineage||child.species!=='genvo'||(child.generation||1)<4)return null;const pop=this.sourcePopulationFor(child);if(!pop)return null;return this.localCandidate(child,parents,pop)||this.inheritedCandidate(child,parents,pop)}
  onBirth(child,parents=[]){
    const c=this.candidateFor(child,parents);if(!c)return null;const sourceDays=c.diff?.profile?.days||c.profile?.days||c.sourceTrait?.sourceDays||0,sourceDifference=c.axis?.delta??c.sourceTrait?.sourceDifference??0,separation=c.diff?.score??c.sourceTrait?.separation??0;
    writeProto(child,c.def.id,c.strength,{pressure:c.def.pressure,populationKey:c.pop.key,populationLabel:c.pop.label||c.pop.key,originPopulationKey:c.origin?.key||c.pop.key,originPopulationLabel:c.origin?.label||c.pop.label||c.pop.key,sourceDays,sourceDifference,separation,emergedGeneration:c.sourceTrait?.emergedGeneration||child.generation,bornDay:this.sim.day,inherited:c.state!=='emerged',inheritanceState:c.state,lineageDepth:c.depth,geneFlow:c.geneFlow,mixedFrom:c.mixedFrom,support:c.axis?.mine??c.support??0});
    const trait=this.traitFor(child),mix=trait.mixedFrom?.[0],noticeKey=`${c.pop.key}:${trait.id}:${c.state}:${mix?.id||''}`;if(!this.noticed.has(noticeKey)){this.noticed.add(noticeKey);let message;if(c.state==='reinforced')message=`${c.pop.label} is reinforcing ${trait.label} across generations.`;else if(c.state==='mixed-reinforced'||c.state==='mixed')message=`Gene flow is mixing ${trait.label}${mix?` with ${mix.label}`:''} in ${c.pop.label}.`;else if(c.state==='weakened')message=`${trait.label} persists in ${c.pop.label}, but the pressure supporting it is weakening.`;else if(c.state==='persisting')message=`${trait.label} is persisting in ${c.pop.label}.`;else message=`${c.pop.label} descendants are beginning to inherit ${trait.label} from ${trait.cause}.`;this.notice={message,tone:'success'}}return trait;
  }
  consumeNotice(){const n=this.notice;this.notice=null;return n}
  effectStrength(animal){const t=this.traitFor(animal);if(!t)return 0;return clamp((t.strength+.12)/.70,.28,1)}
  movementMultiplier(animal){const t=this.traitFor(animal);if(!t||t.pressure!=='wetness')return 1;const i=this.sim.world.idx(animal.x,animal.y),moist=this.sim.world.moisture?.[i]||0;if(moist<.55||this.sim.world.water?.[i])return 1;return 1+.055*this.effectStrength(animal)}
  forageRangeMultiplier(animal){const t=this.traitFor(animal);return t?.pressure==='competition'?1+.06*this.effectStrength(animal):1}
  sensoryMultiplier(animal,kind='threat'){const t=this.traitFor(animal);return t?.pressure==='predation'&&kind==='threat'?1+.06*this.effectStrength(animal):1}
  metabolismMultiplier(animal){const t=this.traitFor(animal);return t?.pressure==='scarcity'?1-.055*this.effectStrength(animal):1}
  waterUseMultiplier(animal){const t=this.traitFor(animal);return t?.pressure==='dryness'?1-.06*this.effectStrength(animal):1}
  thermalMultiplier(animal,kind){const t=this.traitFor(animal);if(!t)return 1;if(kind==='heat'&&t.pressure==='heat')return 1-.085*this.effectStrength(animal);if(kind==='cold'&&t.pressure==='cold')return 1-.085*this.effectStrength(animal);return 1}
  shelterProtectionMultiplier(animal){const t=this.traitFor(animal);return t?.pressure==='crowding'?1-.045*this.effectStrength(animal):1}
  mechanicsText(animal){const t=this.traitFor(animal);if(!t)return'';const e=this.effectStrength(animal);if(t.pressure==='scarcity')return`${t.label} · ${Math.round(5.5*e)}% lower resting energy use`;if(t.pressure==='competition')return`${t.label} · +${Math.round(6*e)}% food-search reach`;if(t.pressure==='predation')return`${t.label} · +${Math.round(6*e)}% threat sensing`;if(t.pressure==='crowding')return`${t.label} · ${Math.round(4.5*e)}% stronger shelter protection`;if(t.pressure==='dryness')return`${t.label} · ${Math.round(6*e)}% lower water use`;if(t.pressure==='wetness')return`${t.label} · +${Math.round(5.5*e)}% wet-ground travel`;if(t.pressure==='heat')return`${t.label} · ${Math.round(8.5*e)}% less heat strain`;if(t.pressure==='cold')return`${t.label} · ${Math.round(8.5*e)}% less cold strain`;return t.label}
  revealText(animal){const t=this.traitFor(animal);if(!t)return'';const state=t.inheritanceState||'emerged',mix=t.mixedFrom?.[0];let inheritance='';if(state==='reinforced')inheritance=` It has reinforced for ${t.lineageDepth} generations.`;else if(state==='mixed-reinforced'||state==='mixed')inheritance=` Gene flow${mix?` from ${mix.label}`:''} has softened and mixed the expression.`;else if(state==='weakened')inheritance=' It persists, but weaker pressure is reducing the expression.';else if(state==='persisting')inheritance=' It persists across another generation.';const species=this.sim.speciation?.identityFor?.(animal);return`${this.mechanicsText(animal)}. ${t.originPopulationLabel||t.populationLabel} first shaped this trait from ${t.cause}.${inheritance}${species?' This inherited difference now contributes to a recognized species boundary.':' This is still one lineage difference, not a separate species.'}`}
  chipText(animal,previous=null){const t=this.traitFor(animal);if(!t)return'';const state=t.inheritanceState||'emerged';if(state==='reinforced')return`PROTO · ${t.short.toUpperCase()} REINFORCED`;if(state==='mixed-reinforced'||state==='mixed')return`PROTO · ${t.short.toUpperCase()} MIXED`;if(state==='weakened')return`PROTO · ${t.short.toUpperCase()} WEAKENED`;if(state==='persisting')return`PROTO · ${t.short.toUpperCase()} PERSISTS`;const before=this.traitFor(previous);if(before?.id===t.id)return`PROTO · ${t.short.toUpperCase()} INHERITED`;return`PROTO · ${t.short.toUpperCase()} EMERGED`}
  lines(){const living=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&this.traitFor(a)),groups=new Map();for(const a of living){const t=this.traitFor(a),key=`${t.populationKey}:${t.id}`,g=groups.get(key)||{label:t.populationLabel,trait:t.label,count:0,reinforced:0,mixed:0,weakened:0};g.count++;if(String(t.inheritanceState).includes('reinforced'))g.reinforced++;if(String(t.inheritanceState).includes('mixed'))g.mixed++;if(t.inheritanceState==='weakened')g.weakened++;groups.set(key,g)}return[...groups.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).map(g=>`${g.label} · ${g.trait} ×${g.count}${g.reinforced?` · reinforced ${g.reinforced}`:''}${g.mixed?` · mixed ${g.mixed}`:''}${g.weakened?` · weakening ${g.weakened}`:''}`)}
  statusLine(){const lines=this.lines();return lines.length?`Proto-divergence ${lines.join(' · ')}`:'Proto-divergence NONE YET · sustained separated pressure can seed small inherited population traits'}
}
export function protoTraitMeta(id){return BY_ID[id]||null}
