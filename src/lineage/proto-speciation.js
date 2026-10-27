import {AUTONOMOUS_POPULATIONS} from '../ecology/autonomous-founding.js';
import {chooseParentalReading} from './parental-reading.js';
// Inherited population differences. Parental legacy determinants pass without
// pressure-ranked origin, reinforcement or weakening. Population pressure is
// observation; existing physical effects and historical provenance are retained.
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
  sourcePopulationFor(child){if(!child)return null;if(this.sim.autonomousPopulationRules===AUTONOMOUS_POPULATIONS.policy)return this.sim.populationMemory?.populationForAnimal?.(child)||null;const pops=this.populations();if(!pops.length)return null;const secondaries=pops.filter(p=>!p.primary).map(p=>({p,d:Math.hypot(child.x-p.x,child.y-p.y)})).sort((a,b)=>a.d-b.d||String(a.p.key).localeCompare(String(b.p.key)));const nearest=secondaries[0],radius=Math.max(5.5,(this.sim.territory?.cellSize||6)*.9);if(nearest&&nearest.d<=radius)return nearest.p;return pops.find(p=>p.primary)||pops[0]}
  candidateFor(child,parents=[]){
    if(!child)return null;
    const eligible=parents.filter(p=>this.traitFor(p));
    return eligible.length?{parents:eligible}:null;
  }
  onBirth(child,parents=[]){
    const eligible=this.candidateFor(child,parents);if(!eligible)return null;
    const chosen=chooseParentalReading(this.sim.rng,eligible.parents,p=>this.traitFor(p));
    const source=chosen.reading,pop=this.sourcePopulationFor(child);
    writeProto(child,source.id,source.strength,{...source,
      populationKey:pop?.key||source.populationKey||'unassigned',
      populationLabel:pop?.label||source.populationLabel||'Unassigned population',
      originPopulationKey:source.originPopulationKey||source.populationKey,
      originPopulationLabel:source.originPopulationLabel||source.populationLabel,
      bornDay:this.sim.day,inherited:true,inheritanceState:'inherited-neutral',
      lineageDepth:(source.lineageDepth||1)+1,sourceParentId:chosen.sourceParentId,
      inheritanceRules:'neutral-parental/1'});
    const trait=this.traitFor(child),key=`${trait.id}:inherited-neutral`;
    if(child.lineage&&!this.noticed.has(key)){this.noticed.add(key);this.notice={message:`A descendant inherited ${trait.label}.`,tone:'success'}}
    return trait;
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
  revealText(animal){const t=this.traitFor(animal);if(!t)return'';const state=t.inheritanceState||'emerged',mix=t.mixedFrom?.[0];let inheritance='';if(state==='inherited-neutral')return `${this.mechanicsText(animal)}. Inherited from parent ${t.sourceParentId}; environmental pressure did not select or strengthen this inherited trait. This is still a lineage difference, not a separate species.`;if(state==='reinforced')inheritance=` It has reinforced for ${t.lineageDepth} generations.`;else if(state==='mixed-reinforced'||state==='mixed')inheritance=` Gene flow${mix?` from ${mix.label}`:''} has softened and mixed the expression.`;else if(state==='weakened')inheritance=' It persists, but weaker pressure is reducing the expression.';else if(state==='persisting')inheritance=' It persists across another generation.';const species=this.sim.speciation?.identityFor?.(animal);return`${this.mechanicsText(animal)}. ${t.originPopulationLabel||t.populationLabel} first shaped this trait from ${t.cause}.${inheritance}${species?' This inherited difference now contributes to a recognized species boundary.':' This is still one lineage difference, not a separate species.'}`}
  chipText(animal,previous=null){const t=this.traitFor(animal);if(!t)return'';const state=t.inheritanceState||'emerged';if(state==='inherited-neutral')return`PROTO · ${t.short.toUpperCase()} INHERITED`;if(state==='reinforced')return`PROTO · ${t.short.toUpperCase()} REINFORCED`;if(state==='mixed-reinforced'||state==='mixed')return`PROTO · ${t.short.toUpperCase()} MIXED`;if(state==='weakened')return`PROTO · ${t.short.toUpperCase()} WEAKENED`;if(state==='persisting')return`PROTO · ${t.short.toUpperCase()} PERSISTS`;const before=this.traitFor(previous);if(before?.id===t.id)return`PROTO · ${t.short.toUpperCase()} INHERITED`;return`PROTO · ${t.short.toUpperCase()} EMERGED`}
  lines(){const living=this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&this.traitFor(a)),groups=new Map();for(const a of living){const t=this.traitFor(a),key=`${t.populationKey}:${t.id}`,g=groups.get(key)||{label:t.populationLabel,trait:t.label,count:0,reinforced:0,mixed:0,weakened:0};g.count++;if(String(t.inheritanceState).includes('reinforced'))g.reinforced++;if(String(t.inheritanceState).includes('mixed'))g.mixed++;if(t.inheritanceState==='weakened')g.weakened++;groups.set(key,g)}return[...groups.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).map(g=>`${g.label} · ${g.trait} ×${g.count}${g.reinforced?` · reinforced ${g.reinforced}`:''}${g.mixed?` · mixed ${g.mixed}`:''}${g.weakened?` · weakening ${g.weakened}`:''}`)}
  statusLine(){const lines=this.lines();return lines.length?`Proto-divergence ${lines.join(' · ')}`:'Proto-divergence NONE YET · inherited variation has not produced a recorded population difference'}
}
export function protoTraitMeta(id){return BY_ID[id]||null}
