import {autonomousEvolutionEnabled} from './autonomous-evolution.js';
import {noteEvolutionaryBirth,evolutionaryGeneFlow,trimEvolutionaryBirths} from './population-birth-evidence.js';
// Population-level species recognition. v1.14 consumes only prospective evidence:
// recorded local ecology, reinforced proto-traits, residence and recent gene flow.
// The base organism registry remains `genvo` so a recognized branch can share the
// existing ecology/render authorities without duplicating an engine species.

import {SPECIES} from '../organisms/species.js';
import {protoTraitMeta} from './proto-speciation.js';
import {generateTaxonName,taxonNameExplanation} from './taxon-name-generator.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));

export class SpeciationController{
  constructor(sim){this.sim=sim;this.states=new Map();this.births=[];this.notice=null;this.noticed=new Set()}
  populations(){return this.sim.populationMemory?.populations?.()||[]}
  populationByKey(key){return this.populations().find(p=>p.key===key)||null}
  affinityKey(animal){return this.sim.populationMemory?.affinityFor?.(animal)?.key||null}
  childPopulation(child){return this.sim.protoSpeciation?.sourcePopulationFor?.(child)||null}
  traitFor(animal){return this.sim.protoSpeciation?.traitFor?.(animal)||null}
  identityFor(animal){
    const raw=animal?.speciesBranch;if(!raw?.id)return null;const state=this.states.get(raw.populationKey);if(!state?.recognized||state.branch?.id!==raw.id)return null;return{...raw};
  }
  stateFor(key){return this.states.get(key)||null}
  ensureState(pop){
    let state=this.states.get(pop.key);if(state)return state;
    state={populationKey:pop.key,populationLabel:pop.label||pop.key,recognized:false,branch:null,progress:0,qualifyingDays:0,weakDays:0,lastEvaluationDay:0,lastSnapshot:null,recognizedDay:null,recognizedGeneration:null};
    this.states.set(pop.key,state);return state;
  }
  noteBirth(child,parents=[],conceptionParents=parents){
    if(autonomousEvolutionEnabled(this.sim))return noteEvolutionaryBirth(this,child,conceptionParents);
    if(!child?.lineage||child.species!=='genvo')return null;const pop=this.childPopulation(child);if(!pop)return null;
    const parentKeys=(parents||[]).map(p=>p?.lineage?this.affinityKey(p):'wild').map(v=>v||'wild');const involved=new Set([pop.key,...parentKeys.filter(k=>k!=='wild')]);
    const cross=parentKeys.some(k=>k==='wild'||k!==pop.key);this.births.push({day:this.sim.day,generation:child.generation||1,populationKey:pop.key,parentKeys:[...parentKeys],involvedKeys:[...involved],cross});
    this.trimBirths();this.assignIdentity(child,pop);return this.births.at(-1);
  }
  trimBirths(){if(autonomousEvolutionEnabled(this.sim)){this.births=trimEvolutionaryBirths(this.births,this.sim.day);return}const minDay=Math.max(1,this.sim.day-48);if(this.births.length>96||this.births[0]?.day<minDay)this.births=this.births.filter(e=>e.day>=minDay).slice(-96)}
  geneFlowFor(key){
    if(autonomousEvolutionEnabled(this.sim))return evolutionaryGeneFlow(this,key);
    const events=this.births.filter(e=>e.involvedKeys.includes(key)).slice(-12),local=events.filter(e=>!e.cross&&e.populationKey===key).length,cross=events.filter(e=>e.cross).length,total=local+cross;
    return{events,total,local,cross,ratio:total?cross/total:1,isolation:total?1-cross/total:0};
  }
  cohortFor(pop){
    if(autonomousEvolutionEnabled(this.sim)){
      const species=pop.species||'genvo';
      return this.sim.animals.filter(a=>a.alive&&a.species===species&&a.age>=SPECIES[species].maturity&&
        (pop.kind==='autonomous'?pop.memberIds.has(a.id):this.affinityKey(a)===pop.key));
    }
    const maturity=SPECIES.genvo.maturity;return this.sim.animals.filter(a=>a.alive&&a.lineage&&a.species==='genvo'&&a.age>=maturity&&this.affinityKey(a)===pop.key);
  }
  dominantTraitFor(pop){
    const cohort=this.cohortFor(pop),groups=new Map();
    for(const animal of cohort){
      const traits=autonomousEvolutionEnabled(this.sim)?this.sim.protoSpeciation.traitsFor(animal):
        [this.traitFor(animal)].filter(Boolean);
      for(const trait of traits){
        const group=groups.get(trait.id)||{id:trait.id,label:trait.label,pressure:trait.pressure,
          count:0,totalStrength:0,maxDepth:0,reinforced:0,members:[]};
        group.count++;group.totalStrength+=trait.strength;
        group.maxDepth=Math.max(group.maxDepth,trait.lineageDepth||1);
        if(String(trait.inheritanceState||'').includes('reinforced')||trait.lineageDepth>=3)group.reinforced++;
        group.members.push(animal);groups.set(trait.id,group);
      }
    }
    const ranked=[...groups.values()].sort((a,b)=>b.count-a.count||b.maxDepth-a.maxDepth||
      b.totalStrength-a.totalStrength||Number(a.id.endsWith(':loss'))-Number(b.id.endsWith(':loss'))||a.id.localeCompare(b.id));
    const top=ranked[0]||null;if(!top)return{cohort,top:null};
    top.share=top.count/Math.max(1,cohort.length);top.averageStrength=top.totalStrength/top.count;
    return{cohort,top};
  }
  physicalSeparation(pop,cohort=[]){const reference=this.sim.evolutionTree?.referencePopulationFor?.(pop,cohort)||(autonomousEvolutionEnabled(this.sim)?null:this.populations().find(p=>p.primary));if(!reference||pop.primary)return 0;return Math.hypot(pop.x-reference.x,pop.y-reference.y)}
  evidenceFor(pop){
    if(!pop||pop.primary)return null;
    const state=this.ensureState(pop),profile=this.sim.populationMemory?.profile?.(pop.key)||null;
    const diff=this.sim.protoSpeciation?.differentialFor?.(pop.key)||null;
    const {cohort,top}=this.dominantTraitFor(pop),flow=this.geneFlowFor(pop.key);
    const distance=this.physicalSeparation(pop,cohort),autonomous=autonomousEvolutionEnabled(this.sim);
    // A physical part is inherited without an ecological instruction. Its
    // association is read from the actual independent population history.
    const axis=top?(top.pressure?diff?.deltas?.find(d=>d.id===top.pressure):
      autonomous?diff?.deltas?.filter(d=>d.delta>=.16&&d.mine>=.30)
        .sort((a,b)=>b.delta-a.delta||a.id.localeCompare(b.id))[0]:null):null;
    const historyDays=profile?.days||0,historyScore=clamp(historyDays/10);
    const ecologyScore=clamp((diff?.score||0)/.24),distanceScore=clamp(distance/24);
    const traitDepth=top?.maxDepth||0;
    const traitScore=top?clamp((top.averageStrength-.18)/.34)*.45+
      clamp(traitDepth/3)*.30+clamp(top.share/.65)*.25:0;
    const isolationScore=flow.total?clamp(flow.isolation):0;
    const progress=clamp(historyScore*.18+ecologyScore*.22+distanceScore*.10+traitScore*.30+isolationScore*.20);
    const gates={history:historyDays>=10,ecology:(diff?.score||0)>=.18,distance:distance>=16,
      cohort:cohort.length>=3,trait:!!top&&top.count>=2&&top.share>=.58&&top.maxDepth>=3&&top.averageStrength>=.36,
      localPressure:!!axis&&axis.delta>=.16&&axis.mine>=.30,
      reproduction:flow.local>=4&&flow.total>=4,isolation:flow.ratio<=.25};
    const qualified=Object.values(gates).every(Boolean);
    const renewedFlow=autonomous?flow.knownTotal>=3&&flow.knownRatio>=.48:flow.total>=3&&flow.ratio>=.48;
    const ecologicalConvergence=!autonomous&&(diff?.score||0)<.10&&historyDays>=10;
    const collapseRisk=renewedFlow||ecologicalConvergence||(top?top.share<.34:true);
    const evidence={state,pop,profile,diff,cohort,trait:top,flow,distance,axis:axis||null,progress,gates,qualified,collapseRisk};
    state.progress=progress;state.lastSnapshot=this.compactEvidence(evidence);return evidence;
  }
  compactEvidence(e){
    return{day:this.sim.day,progress:e.progress,historyDays:e.profile?.days||0,separation:e.diff?.score||0,
      distance:e.distance,cohort:e.cohort.length,traitId:e.trait?.id||null,traitLabel:e.trait?.label||null,
      traitDepth:e.trait?.maxDepth||0,traitShare:e.trait?.share||0,traitStrength:e.trait?.averageStrength||0,
      localBirths:e.flow.local,crossBirths:e.flow.cross,geneFlow:e.flow.ratio,isolation:e.flow.isolation,qualified:e.qualified,
      ...(autonomousEvolutionEnabled(this.sim)?{gates:{...e.gates},unknownBirths:e.flow.unknown,
        knownGeneFlow:e.flow.knownRatio,referencePopulationKey:e.diff?.peer?.key||null}:{})};
  }
  branchIdFor(pop,trait){
    const legacyId=`${pop.key.replace(/[^a-z0-9]+/gi,'-')}:${trait.id}`;
    if(!autonomousEvolutionEnabled(this.sim))return legacyId;
    // Existing saved taxa retain their recorded identity and naming history.
    for(const node of this.sim.evolutionTree?.nodes?.values?.()||[]){
      if(node.originPopulationKey===pop.key&&node.traitId===trait.id)return node.id;
    }
    // Encode both components without discarding signed regional coordinates.
    return `autonomous:${encodeURIComponent(pop.key)}:${encodeURIComponent(trait.id)}`;
  }
  branchFor(pop,trait,evidence=null){
    const id=this.branchIdFor(pop,trait);
    const tree=this.sim.evolutionTree,parent=tree?.parentForPopulation?.(pop,evidence?.cohort||[])||null;
    const existing=tree?.node?.(id)||null;
    // An extinct/rejoined branch retains its original name when recognized again;
    // legacy saves keep their recorded names even without nameOrigin metadata.
    const named=existing?.label?{label:existing.label,nameOrigin:existing.nameOrigin||null}:generateTaxonName({
      branchId:id,parentNode:parent,cohort:evidence?.cohort||[],pressure:evidence?.axis?.id||trait.pressure,
      usedNames:[...(tree?.nodes?.values?.()||[])].map(node=>node.label)
    });
    return{id,...named,populationKey:pop.key,populationLabel:pop.label||pop.key,traitId:trait.id,pressure:evidence?.axis?.id||trait.pressure,parentId:parent?.id||null,parentLabel:parent?.label||'GenVo',recognizedDay:this.sim.day,recognizedGeneration:autonomousEvolutionEnabled(this.sim)?Math.max(1,...(evidence?.cohort||[]).map(a=>a.generation||1)):this.sim.lineage?.highestGeneration||1};
  }
  recognize(e){
    const state=e.state;if(state.recognized)return state.branch;let branch=this.branchFor(e.pop,e.trait,e);branch=this.sim.evolutionTree?.onRecognize?.(branch,e)||branch;state.recognized=true;state.branch=branch;state.recognizedDay=this.sim.day;state.recognizedGeneration=branch.recognizedGeneration;state.weakDays=0;
    for(const a of e.cohort){const t=this.traitFor(a);if(t?.id===branch.traitId&&t.strength>=.25){a.speciesBranch={...branch};this.sim.evolutionTree?.onIdentityAssigned?.(a,branch)}}
    this.notice={message:`Species split recognized · ${branch.label} has persisted at ${branch.populationLabel}.`,tone:'success'};return branch;
  }
  collapse(state,reason='renewed gene flow',{extinct=false}={}){
    if(!state?.recognized)return false;const branch=state.branch,id=branch?.id,label=branch?.label||'Species branch';this.sim.evolutionTree?.onBoundaryEnded?.(branch,reason,{extinct});for(const a of this.sim.animals)if(a.alive&&a.speciesBranch?.id===id){delete a.speciesBranch;const rec=this.sim.lineage?.records?.get?.(a.id);if(rec)rec.speciesBranch=null;}state.recognized=false;state.branch=null;state.qualifyingDays=0;state.weakDays=0;state.recognizedDay=null;state.recognizedGeneration=null;this.notice={message:extinct?`${label} is extinct · its branch remains in lineage history.`:`${label} boundary rejoined · ${reason} is restoring gene flow.`,tone:extinct?'warn':'warn'};return true;
  }
  assignIdentity(animal,pop=this.childPopulation(animal)){
    if(!animal||!pop)return null;const state=this.states.get(pop.key);if(!state?.recognized||!state.branch)return null;const trait=autonomousEvolutionEnabled(this.sim)?this.sim.protoSpeciation.traitsFor(animal).find(t=>t.id===state.branch.traitId):this.traitFor(animal);if(!trait||trait.id!==state.branch.traitId||trait.strength<.24)return null;animal.speciesBranch={...state.branch};this.sim.evolutionTree?.onIdentityAssigned?.(animal,state.branch);return animal.speciesBranch;
  }
  evaluatePopulation(pop){
    const e=this.evidenceFor(pop);if(!e)return null;const state=e.state;if(state.lastEvaluationDay===this.sim.day)return e;state.lastEvaluationDay=this.sim.day;
    if(!state.recognized){if(e.qualified)state.qualifyingDays++;else state.qualifyingDays=Math.max(0,state.qualifyingDays-1);if(state.qualifyingDays>=2)this.recognize(e)}
    else{const livingBranch=this.sim.animals.filter(a=>a.alive&&(autonomousEvolutionEnabled(this.sim)||a.lineage)&&a.speciesBranch?.id===state.branch?.id);if(!livingBranch.length){this.collapse(state,'population extinction',{extinct:true})}else{if(e.collapseRisk)state.weakDays++;else state.weakDays=Math.max(0,state.weakDays-1);if(state.weakDays>=2){const renewed=autonomousEvolutionEnabled(this.sim)?e.flow.knownRatio>=.48:e.flow.ratio>=.48;const reason=renewed?'renewed inter-population breeding':autonomousEvolutionEnabled(this.sim)?'inherited anatomical convergence':'ecological convergence';this.collapse(state,reason)}else if(state.branch){for(const a of e.cohort)this.assignIdentity(a,pop)}}}
    return e;
  }
  advanceDay(){this.trimBirths();for(const pop of this.populations())if(!pop.primary)this.evaluatePopulation(pop)}
  snapshots(){return this.populations().filter(p=>!p.primary).map(p=>this.evidenceFor(p)).filter(Boolean).sort((a,b)=>Number(b.state.recognized)-Number(a.state.recognized)||b.progress-a.progress||a.pop.label.localeCompare(b.pop.label))}
  statusLine(){
    const snaps=this.snapshots();if(!snaps.length)return'Speciation threshold NONE YET · establish a separated population first';const e=snaps[0],s=e.state;if(s.recognized&&s.branch)return`Species ${s.branch.label.toUpperCase()} · ${s.branch.populationLabel} · gene-flow separation ${Math.round(e.flow.isolation*100)}% · ${e.trait?.label||'local trait'} depth ${e.trait?.maxDepth||0}`;
    const missing=Object.entries(e.gates).filter(([,ok])=>!ok).map(([id])=>id);return`Speciation threshold ${e.pop.label} ${Math.round(e.progress*100)}% · trait depth ${e.trait?.maxDepth||0}/3 · gene-flow separation ${Math.round(e.flow.isolation*100)}%${missing.length?` · needs ${missing.slice(0,2).join(' + ')}`:''}`;
  }
  lines(){return this.snapshots().slice(0,4).map(e=>{const s=e.state;if(s.recognized&&s.branch)return`${s.branch.label} · RECOGNIZED · ${e.pop.label} · gene-flow separation ${Math.round(e.flow.isolation*100)}% · gene flow ${Math.round(e.flow.ratio*100)}%`;return`${e.pop.label} · split ${Math.round(e.progress*100)}% · ${e.trait?.label||'no reinforced trait'} depth ${e.trait?.maxDepth||0} · local births ${e.flow.local} · cross ${e.flow.cross}`})}
  revealText(animal){const identity=this.identityFor(animal);if(!identity)return'';const state=this.states.get(identity.populationKey),snap=state?.lastSnapshot;return`${identity.label} is now recognized as a distinct descendant species from ${identity.parentLabel||'GenVo'}. ${taxonNameExplanation(identity.nameOrigin)} ${identity.populationLabel} sustained ${protoTraitMeta(identity.traitId)?.cause||'local pressure'} across ${snap?.traitDepth||3} inherited generations with ${Math.round((snap?.isolation??1)*100)}% recent local-only birth share. This observed gene flow does not establish biological infertility. Continued gene flow can still weaken this young species boundary.`}
  chipText(animal){const identity=this.identityFor(animal);return identity?`SPECIES · ${identity.label.toUpperCase()}`:''}
  consumeNotice(){const n=this.notice;this.notice=null;return n}
}

// Legacy callers can still request a human-readable trait label; this helper does
// not assign taxon names. Naming requires real branch ancestry and a founding cohort.
export function speciesBranchLabel(traitId){return protoTraitMeta(traitId)?.label||null}
