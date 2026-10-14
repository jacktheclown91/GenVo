import {createDraft,commitDraft,draftCost} from './evolution-draft.js';
import {planFor,ancestryFor,applyLineageTarget} from './reproduction-bridge.js';
import {samePhysicalBuild} from './body-inheritance.js';

// Physical-stability editor gate (creator direction 2026-10-12): only two matching physical
// body plans unlock the next-generation mutation editor. Mixed-body, biologically compatible
// pairings naturally recombine their mounted parts instead; learned behavior never affects the
// matching decision. Existing living adults are never edited.
export class EvolutionEditorController{
  constructor(sim){this.sim=sim;this.offer=null;this.committed=[];this.notice=null}

  // Called by reproduction when a pair mates.
  onMated(a,b){
    const p=this.sim.player();if(!this.sim.playerEnabled||!p?.lineage)return null;
    if(a?.id!==p.id&&b?.id!==p.id)return null;const mother=a.sex==='F'?a:b,father=a.sex==='F'?b:a;
    if(!mother?.pregnant||mother.lineageTarget)return null;
    if(!samePhysicalBuild(mother,father)){
      this.offer=null;this.notice={text:'Different parent bodies · offspring inherit a physical mixture. Breed matching builds to unlock the editor.',tone:'info'};
      return null;
    }
    this.offer={motherId:mother.id,fatherId:father.id,parentId:p.id,day:this.sim.day,year:this.sim.year,generation:(p.generation||1)+1};
    return this.offer;
  }
  pending(){
    const o=this.offer;if(!o)return null;const mother=this.sim.animals.find(a=>a.id===o.motherId&&a.alive);
    if(!mother?.pregnant){this.offer=null;return null}return o;
  }
  // A fresh draft from the active parent's body, the lineage's ancestry and this handoff's budget.
  openDraft(){
    const o=this.pending();if(!o)return null;const parent=this.sim.animals.find(a=>a.id===o.parentId)||this.sim.player();
    return createDraft({base:planFor(parent),ancestry:[...ancestryFor(this.sim,parent)],budget:this.sim.evolutionBudget?.budget?.()??8,known:this.sim.discovery?.seenParts||null,unlocked:this.sim.discovery?.unlockedParts||null});
  }
  commit(draft){
    const o=this.pending();if(!o||!draft)return{ok:false,problems:['No litter is waiting for a design.']};
    const r=commitDraft(draft,{tick:this.sim.tickCount,day:this.sim.day,generation:o.generation});if(!r.ok)return r;
    const mother=this.sim.animals.find(a=>a.id===o.motherId);mother.lineageTarget={plan:r.record.plan,from:r.record.from,spent:r.record.spent,day:this.sim.day};
    this.sim.evolutionBudget?.consume?.();
    this.committed.push({from:r.record.from,to:r.record.to,spent:r.record.spent,budget:r.record.budget,day:this.sim.day,year:this.sim.year,generation:o.generation,motherId:o.motherId});if(this.committed.length>32)this.committed.shift();
    const parent=this.sim.player();if(parent)this.sim.cognition?.record?.(parent,'lineage-target',`Shaped the coming generation · ${r.record.spent} MP`,{to:r.record.to});
    this.offer=null;this.notice={text:`Design committed · the coming litter will carry it · ${r.record.spent} MP spent`,tone:'success'};return r;
  }
  cancel(){const had=!!this.offer;this.offer=null;return had}
  // Called for each newborn before it is registered: shape it from its mother's committed target.
  onBirth(child,mother){if(mother?.lineageTarget?.plan&&child?.bodyPlan)return applyLineageTarget(child,mother.lineageTarget.plan);return false}
  onLitterDone(mother){if(mother?.lineageTarget)delete mother.lineageTarget}
  takeNotice(){const n=this.notice;this.notice=null;return n}
  costOf(draft){return draftCost(draft)}
}
