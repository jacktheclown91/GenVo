// Read-only physical-breeding interpretation for the mate panel and family journal.
// The BodyPlan, physical crossover, species/kinship rules and editor eligibility remain
// authoritative in their existing modules. Never draw a hypothetical child or claim
// that a part will be inherited with a fixed probability.
import {deserializePlan} from './body-plan.js';
import {planFor} from './reproduction-bridge.js';

export function observedPlan(subject){
  if(!subject)return null;
  try{
    if(typeof subject==='string')return deserializePlan(subject);
    if(subject.nodes&&Array.isArray(subject.nodes))return subject;
    if(subject.bodyPlan)return typeof subject.bodyPlan==='string'?deserializePlan(subject.bodyPlan):subject.bodyPlan;
    if(subject.species)return planFor(subject);
  }catch{return null}
  return null;
}
const parts=plan=>new Map((plan?.nodes||[]).map(node=>[node.id,`${node.partId}@${node.partVersion}`]));
export function partName(part){return String(part||'').replace(/@.*$/,'').replace(/-/g,' ')}
export function socketName(socket){return socket==='root'?'torso':String(socket).replace(/^root\//,'').replace(/\//g,' / ').replace(/\./g,' ').replace(/-/g,' ')}

// Counts anatomical node/socket identity, NOT behavior, preference, age, species name,
// visual pigments or genetic distance. Editor eligibility must still be checked by
// the actual mating controller (species, kinship, consent and matching physical plans).
export function comparePhysicalBuilds(a,b){
  const aa=observedPlan(a),bb=observedPlan(b);
  if(!aa||!bb)return null;
  const x=parts(aa),y=parts(bb),sockets=[...new Set([...x.keys(),...y.keys()])].sort();
  const differences=[],matches=[];
  for(const socket of sockets){
    const first=x.get(socket)||null,second=y.get(socket)||null;
    const item={socket,location:socketName(socket),first:first?partName(first):'empty',second:second?partName(second):'empty'};
    (first===second?matches:differences).push(item);
  }
  return {exact:aa.id===bb.id&&differences.length===0,matched:matches.length,total:sockets.length,different:differences.length,differences,matches,firstId:aa.id,secondId:bb.id};
}

export function offspringPartOrigins(child,mother,father){
  const plan=observedPlan(child),m=observedPlan(mother),f=observedPlan(father);
  if(!plan||!m||!f)return null;
  const byMother=parts(m),byFather=parts(f),out={both:[],mother:[],father:[],novel:[]};
  for(const n of plan.nodes){
    const signature=`${n.partId}@${n.partVersion}`;
    const M=byMother.get(n.id)===signature,F=byFather.get(n.id)===signature;
    const where=M&&F?'both':M?'mother':F?'father':'novel';
    out[where].push({socket:n.id,location:socketName(n.id),part:partName(n.partId)});
  }
  return out;
}

// A bounded comparison of recorded layouts; this does not identify a selected donor. "Novel" means not
// present at the same socket in either known parent; mutation, trait reconciliation,
// and parent snapshots are possible causes, not guaranteed diagnoses.
export function originSummary(origins,{limit=3}={}){
  if(!origins)return'Parental body plans not recorded';
  const describe=(label,list)=>`${label} ${list.length}${list.length?` (${list.slice(0,limit).map(n=>`${n.part} · ${n.location}`).join(', ')}${list.length>limit?', …':''})`:''}`;
  return [describe('Matches both',origins.both),describe('Matches mother',origins.mother),describe('Matches father',origins.father),describe('Other arrangement',origins.novel)].join(' · ');
}
