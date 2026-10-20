import {PARTS} from './part-registry.js';
import {founderPlan} from './body-inheritance.js';
import {createDraft,draftProblems,commitDraft} from './evolution-draft.js';
import {serializePlan,deserializePlan} from './body-plan.js';

// Authored precursor steps are a design record, never simulated ancestors.
// All graph, socket, part-cost and gross viability rules remain shared with
// the lineage editor. Sandbox removes ancestry/relic/budget locks only.
export class FounderDesign{
 constructor(mode='guided'){
  if(!['guided','sandbox'].includes(mode))throw Error('Unsupported founder design mode.');
  this.mode=mode;this.steps=[];this.ancestry=new Set();this.base=founderPlan();
  this.draft=this.nextDraft();
 }
 nextDraft(){return createDraft({base:this.base,ancestry:this.mode==='sandbox'?Object.keys(PARTS):[...this.ancestry],
  unlocked:this.mode==='sandbox'?Object.keys(PARTS):null,budget:this.mode==='sandbox'?Infinity:8})}
 problems(draft=this.draft){
  // Never trust caller-supplied ancestry or budget to bypass this session's
  // own precursor sequence. Reconstruct the legal context before validation.
  const legal=this.nextDraft();legal.plan=draft.plan;
  return draftProblems(legal);
 }
 advance(draft=this.draft){
  const problems=this.problems(draft);if(problems.length)return{ok:false,problems};
  const legal=this.nextDraft();legal.plan=draft.plan;
  const record=commitDraft(legal).record;
  this.steps.push({from:serializePlan(legal.base),to:serializePlan(record.plan),spent:record.spent});
  for(const node of [...legal.base.nodes,...record.plan.nodes])this.ancestry.add(node.partId);
  this.base=deserializePlan(serializePlan(record.plan));this.draft=this.nextDraft();
  return{ok:true,draft:this.draft};
 }
 finish(draft=this.draft){
  const problems=this.problems(draft);if(problems.length)return{ok:false,problems};
  const legal=this.nextDraft();legal.plan=draft.plan;const committed=commitDraft(legal).record;
  const final={from:serializePlan(legal.base),to:serializePlan(committed.plan),spent:committed.spent};
  return{ok:true,record:{schema:1,mode:this.mode,steps:[...structuredClone(this.steps),final],plan:final.to}};
 }
 load(record){
  validateFounderDesign(record);
  if(record.mode!==this.mode)throw Error('Choose the matching guided or sandbox mode before importing this design.');
  const restored=new FounderDesign(this.mode);
  for(const step of record.steps){restored.draft.plan=deserializePlan(step.to);restored.advance();}
  Object.assign(this,restored);return this.draft;
 }
}

export function validateFounderDesign(record){
 if(record?.schema!==1||!['guided','sandbox'].includes(record.mode)||!Array.isArray(record.steps)||!record.steps.length)throw Error('Invalid authored founder design.');
 const design=new FounderDesign(record.mode);
 for(const step of record.steps){
  if(!step||typeof step.from!=='string'||typeof step.to!=='string')throw Error('Invalid authored precursor step.');
  if(step.from!==serializePlan(design.base))throw Error('Authored precursor sequence is disconnected.');
  design.draft.plan=deserializePlan(step.to);
  const result=design.advance();if(!result.ok)throw Error('Invalid authored precursor: '+result.problems.join(' '));
  if(design.steps.at(-1).spent!==step.spent)throw Error('Invalid authored precursor cost.');
 }
 if(serializePlan(design.base)!==record.plan)throw Error('Authored founder plan disagrees with its design sequence.');
 return design.base;
}
