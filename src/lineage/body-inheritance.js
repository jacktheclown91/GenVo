import {recombinationReceipt,singlePlanSelections,RECOMBINATION_RECEIPT} from './recombination-receipt.js';
import {facialHostId,hasImplicitHead,headStructureMoves} from './head-plan.js';
import {optionalLossChoices} from './optional-loss.js';
import {inheritedLegacyWaterTraits,projectWaterPhysiology} from './water-physiology.js';
import {refreshExpression,syncAnatomy} from './evolution.js';
import {isWildSpecies,wildStartPlan,withoutRelicParts,WILD_START} from '../organisms/wild-bodies.js';
import {serializePlan,deserializePlan} from './body-plan.js';
import {makePlan,validatePlan} from './body-plan.js';
import {PARTS,partDef} from './part-registry.js';
import {createDraft,place,replaceRoot,draftProblems,mirrorSocket} from './evolution-draft.js';
import {applyLineageTarget,planFor} from './reproduction-bridge.js';
import {DEVELOPMENTAL_SYMMETRY,ASYMMETRIC_SHARE} from './developmental-symmetry.js';

// New creature vision (creator decision 2026-10-09): a GenVo8 starts with very few parts, and the
// old eight-legged body is a mid-developed creature. Every GenVo8 (founder and wild) begins with
// the founder body below. Different parental bodies contribute real socket-mounted part groups to their young;
// compatible identical physical builds create the editor opportunity instead. Mutations stay
// optional and bounded. This system changes no adult and draws from the simulation RNG.

export const FOUNDER_PLACEMENTS=Object.freeze([
  {partId:'small-torso',parent:null,socket:null},
  ...[1,3,5,7].map(i=>({partId:'walking-leg',parent:'root',socket:`limb.${i}`})),
  {partId:'grazing-mouth',parent:'root',socket:'mouth'},
  {partId:'simple-eye',parent:'root',socket:'eye.left'},{partId:'simple-eye',parent:'root',socket:'eye.right'}
]);
export function founderPlan(){return makePlan(FOUNDER_PLACEMENTS)}
export const BODY_VARIATION=Object.freeze({mutationChance:.25});

export function giveFounderBody(animal){if(isWildSpecies(animal?.species)){animal.bodyPlan=deserializePlan(serializePlan(wildStartPlan(animal.species)));return true}if(animal?.species!=='genvo')return false;return applyLineageTarget(animal,founderPlan())}

// Place a part on a socket and on its mirror when the body has one. With developmental symmetry the pair is
// all-or-nothing (a failed mirror fails the mutation); otherwise the first side stands alone, as before.
function placePair(d,part,parent,socket,{mirrorWhen=()=>true}={}){const a=place(d,part,parent,socket);if(!a.ok)return a;const m=mirrorSocket(socket);if(m===socket||!mirrorWhen(m))return a;const b=place(d,part,parent,m);return DEVELOPMENTAL_SYMMETRY.enabled&&!b.ok?{ok:false,reason:'mirror failed'}:a}
// The small changes a body can make in one generation, in a fixed order (so a seed replays).
function mutationOptions(plan){
  // v1.61.0 (creator direction 2026-10-10: "all creatures should have more evolutionary traits"): any leg
  // can become a variant leg, not only a walking leg, so a runner-legged Stalker can evolve webbed,
  // padded or digging legs the way a Hopper can.
  const out=[],present=new Set(plan.nodes.map(n=>n.partId)),root=plan.nodes.find(n=>!n.parent),torso=partDef(root.partId),has=id=>plan.nodes.some(n=>n.id===id);
  // A new leg on an empty limb socket (with its mirror when there is one).
  for(const s of torso.providedSockets)if(s.type==='limb'&&!has(`root/${s.id}`))out.push(d=>placePair(d,'walking-leg','root',s.id,{mirrorWhen:m=>torso.providedSockets.some(x=>x.id===m)&&!d.plan.nodes.some(n=>n.id===`root/${m}`)}));
  // A leg pair becomes a variant leg its lineage can reach.
  const legVariants=Object.values(PARTS).filter(p=>p.tags.includes('leg')&&p.id!=='walking-leg');
  for(const n of plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)))for(const v of legVariants)if(v.id!==n.partId&&v.developmentalPrerequisites.every(q=>present.has(q)||(q==='walking-leg'&&PARTS[n.partId]?.tags.includes('leg'))))out.push(d=>placePair(d,v.id,'root',n.socket,{mirrorWhen:m=>d.plan.nodes.some(x=>x.id===`root/${m}`)}));
  // The next body, mouth or eye in the lineage's reach.
  for(const p of Object.values(PARTS)){
    if(p.tags.includes('exclusive'))continue;
    if(!p.developmentalPrerequisites.every(q=>present.has(q))||present.has(p.id))continue;
    if(p.tags.includes('head')&&hasImplicitHead(plan)){const conversion=d=>place(d,p.id,'root','head');conversion.headStructure=true;out.push(conversion)}
    else if(p.tags.includes('torso'))out.push(d=>replaceRoot(d,p.id));
    else if(p.tags.includes('mouth'))out.push(d=>place(d,p.id,facialHostId(d.plan),'mouth'));
    else if(p.tags.includes('eye'))out.push(d=>placePair(d,p.id,facialHostId(d.plan),'eye.left'));
  }
  // A flank, back, tail or spur part.
  for(const p of Object.values(PARTS)){
    if(p.tags.includes('exclusive'))continue;
    if(!p.developmentalPrerequisites.every(q=>present.has(q)))continue;
    if(p.compatibleSocketTypes.includes('flank'))out.push(d=>placePair(d,p.id,'root','flank.left'));
    if(p.compatibleSocketTypes.includes('dorsal')&&!present.has(p.id))out.push(d=>place(d,p.id,'root','dorsal'));
    if(p.compatibleSocketTypes.includes('tail')&&!present.has(p.id))out.push(d=>place(d,p.id,'root','tail'));
    if(p.compatibleSocketTypes.includes('spur')){const legs=plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id));if(legs.length)out.push(d=>{const a=place(d,p.id,legs[0].id,'spur');if(!a.ok||!DEVELOPMENTAL_SYMMETRY.enabled)return a;
      // Spurs develop on both legs of a mirrored pair.
      const mate=`root/${mirrorSocket(legs[0].socket)}`;if(mate===legs[0].id||!d.plan.nodes.some(x=>x.id===mate))return a;const b=place(d,p.id,mate,'spur');return b.ok?a:{ok:false,reason:'mirror failed'}})}
  }
  return out;
}

// One-sided developmental changes (the deliberate route to asymmetry): one leg of a mirrored pair becomes a
// variant its lineage can reach, or gains a spur.
function asymmetricOptions(plan){const out=[],present=new Set(plan.nodes.map(n=>n.partId)),has=id=>plan.nodes.some(n=>n.id===id);
  const paired=plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)&&mirrorSocket(n.socket)!==n.socket&&has(`root/${mirrorSocket(n.socket)}`));
  const legVariants=Object.values(PARTS).filter(p=>p.tags.includes('leg')&&p.id!=='walking-leg');
  for(const n of paired)for(const v of legVariants)if(v.id!==n.partId&&v.developmentalPrerequisites.every(q=>present.has(q)||(q==='walking-leg'&&PARTS[n.partId]?.tags.includes('leg'))))out.push(d=>place(d,v.id,'root',n.socket));
  for(const p of Object.values(PARTS))if(!p.tags.includes('exclusive')&&p.compatibleSocketTypes.includes('spur')&&p.developmentalPrerequisites.every(q=>present.has(q)))for(const n of paired)if(!plan.nodes.some(x=>x.parent===n.id))out.push(d=>place(d,p.id,n.id,'spur'));
  return out}
// One reachable mutation of a plan, or the plan unchanged when none is viable.
export function mutatePlan(rng,plan,{onMutation=null}={}){
  const oneSided=DEVELOPMENTAL_SYMMETRY.enabled&&rng.chance(ASYMMETRIC_SHARE);
  const options=oneSided?asymmetricOptions(plan):mutationOptions(plan);
  for(const loss of optionalLossChoices(plan,{asymmetric:oneSided})){const fn=d=>{d.plan=loss.plan;return{ok:true}};fn.loss=loss;options.push(fn)}
  if(!options.length)return plan;
  const ancestry=plan.nodes.map(n=>n.partId);if(ancestry.some(id=>PARTS[id]?.tags.includes('leg')))ancestry.push('walking-leg');
  const index=rng.int(0,options.length-1),pick=options[index],d=createDraft({base:plan,ancestry,budget:Infinity});
  const r=pick(d),problems=r?.ok?draftProblems(d):[r?.reason||'operation rejected'],accepted=!!r?.ok&&!problems.length,result=accepted?d.plan:plan;
  onMutation?.({policy:'neutral-head-structure/1',operator:pick.loss?'delete':pick.headStructure?'head-structure':'add-or-replace',branch:oneSided?'asymmetric':'paired',choice:index,options:options.length,attempted:true,accepted,from:plan.id,to:result.id,targets:pick.loss?.targets||[],removed:accepted?pick.loss?.removed||[]:[],moved:accepted&&pick.headStructure?headStructureMoves(plan,result):[],problems});
  return result;
}

// Traits a newborn gets from heredity or lived pressure become visible parts, so its body always
// matches what it can do: each expressed adaptation adds the part that stands for it where it fits.
const mouthParent=d=>facialHostId(d.plan);
const TRAIT_PARTS=[
  ['crushing-jaw',d=>place(d,'crushing-jaw',mouthParent(d),'mouth')],
  ['heavy-jaw',d=>{const m=d.plan.nodes.find(n=>n.socket==='mouth')?.partId;return m==='tearing-jaw'||m==='crushing-jaw'?{ok:true}:place(d,'tearing-jaw',mouthParent(d),'mouth')}],
  ['spring-tendons',d=>legsOn(d,'spring-leg',[3,4,5])],
  ['grasping-limbs',d=>legsOn(d,'grasper',[7,0,1])],
  ['webbed-limbs',d=>legsOn(d,'webbed-leg',[2,6,1,7])],
  ['hardened-mantle',d=>flanks(d,'armor-plate')],
  ['water-sacs',d=>flanks(d,'storage-sac')],
  ['barbed-limbs',d=>{for(const n of d.plan.nodes.filter(n=>/^root\/limb\.\d+$/.test(n.id)))if(!d.plan.nodes.some(x=>x.parent===n.id))place(d,'barb',n.id,'spur');return{ok:true}}],
  ['alarm-pulse',d=>d.plan.nodes.some(n=>n.partId==='signal-crest')?{ok:true}:place(d,'signal-crest','root','dorsal')]
];
function legsOn(d,part,slots){for(const i of slots){const n=d.plan.nodes.find(x=>x.id===`root/limb.${i}`);if(n&&n.partId!==part)place(d,part,'root',`limb.${i}`)}return{ok:true}}
function flanks(d,part){for(const side of ['flank.left','flank.right'])if(!d.plan.nodes.some(n=>n.socket===side&&n.partId===part))place(d,part,'root',side);return{ok:true}}
export function reconcileTraits(plan,adaptations,{skipWater=false,skipTraits=[]}={}){
  const have=new Set(adaptations||[]),todo=TRAIT_PARTS.filter(([id])=>have.has(id)&&!skipTraits.includes(id)&&(!skipWater||!['water-sacs','webbed-limbs'].includes(id)));if(!todo.length)return plan;
  const d=createDraft({base:plan,ancestry:Object.keys(PARTS),budget:Infinity});for(const [,fn] of todo)fn(d);
  return draftProblems(d).length?plan:d.plan;
}

// The matching gate is expressed anatomy alone: not learned ritual, species-branch label,
// ancestry, personality, cosmetic rendering state, or current health. Plan IDs are computed
// from canonical socket placement + part/version, not from mutable instance labels.
export function samePhysicalBuild(a,b){
  if(!a||!b)return false;
  const x=planFor(a),y=planFor(b);
  return !!(x&&y&&x.id===y.id);
}

// Recombine complete mounted socket subtrees from *both* parents. Each inherited group keeps
// its own joint/spur children and is checked against the chosen torso's real sockets. This is
// intentionally a simple first genetic-cross mechanism: it never fabricates incompatible parts,
// free-floating limbs or a third registry. A sibling may inherit different groups; selecting
// similarly built descendants can stabilize a design without any fixed generational guarantee.
export function recombineBodyPlans(rng,motherPlan,fatherPlan,{onRecombined=null}={}){
  const source=[motherPlan,fatherPlan],selections=new Map();
  const finish=(plan,chosen=selections,mode='selected-groups')=>{if(plan&&onRecombined)onRecombined(recombinationReceipt(plan,source,chosen,mode));return plan;};
  if(!motherPlan||!fatherPlan){const index=motherPlan?0:1,plan=source[index];return finish(plan,plan?singlePlanSelections(plan,[index]):selections,'single-parent');}
  if(motherPlan.id===fatherPlan.id)return finish(motherPlan,singlePlanSelections(motherPlan,[0,1]),'matching-body-shortcut');
  const baseIndex=rng.int(0,1),base=source[baseIndex],root=base.nodes.find(n=>!n.parent);
  if(!root)return finish(base,singlePlanSelections(base,[baseIndex]),'base-fallback');
  selections.set(root.id,[baseIndex]);
  const sockets=partDef(root.partId)?.providedSockets||[];
  const assembled=[{partId:root.partId,parent:null,socket:null}];
  const groups=(plan,socket)=>{
    const tops=plan.nodes.filter(n=>n.parent==='root'&&n.socket===socket);
    const retained=new Set(tops.map(n=>n.id));
    let changed=true;
    while(changed){changed=false;for(const n of plan.nodes)if(n.parent&&retained.has(n.parent)&&!retained.has(n.id)){retained.add(n.id);changed=true}}
    return plan.nodes.filter(n=>retained.has(n.id)).map(n=>({partId:n.partId,parent:n.parent,socket:n.socket,sourceNodeId:n.id}));
  };
  // Mirrored attachments normally travel as a unit, including spur descendants, so an
  // inherited pair of legs is not unnecessarily shattered into one-off unusable limbs.
  const visited=new Set();
  for(const socket of sockets){
    if(visited.has(socket.id))continue;
    const mirrored=mirrorSocket(socket.id),partner=sockets.find(q=>q.id===mirrored&&q.type===socket.type);
    const block=partner&&partner.id!==socket.id?[socket,partner]:[socket];
    block.forEach(q=>visited.add(q.id));
    const chosen=rng.int(0,1),other=1-chosen;
    const selected=which=>block.flatMap(q=>groups(source[which],q.id));
    const valid=group=>{
      for(const q of block){
        const top=group.filter(n=>n.parent==='root'&&n.socket===q.id);
        if(top.length>q.max||top.some(n=>!partDef(n.partId)?.compatibleSocketTypes.includes(q.type)))return false;
      }
      return validatePlan(makePlan([...assembled,...group])).ok;
    };
    const preferred=selected(chosen),fallback=selected(other);
    // Core organs must remain functional when one ancestor lacked the paired socket.
    // Other empty groups are heritable absence (loss of ornament/defense is possible).
    const vital=block.some(q=>q.type==='mouth'||q.type==='eye'||q.type==='limb');
    let pick=preferred;
    if((vital&&!pick.length)||!valid(pick))pick=fallback;
    if(valid(pick)){assembled.push(...pick);const donor=pick===preferred?chosen:other;for(const n of pick)selections.set(n.sourceNodeId,[donor]);}
  }
  const plan=makePlan(assembled,{headMode:base.headMode});
  return validatePlan(plan).ok?finish(plan):finish(base,singlePlanSelections(base,[baseIndex]),'base-fallback');
}

// Called for each GenVo8 newborn before it is registered.
export function inheritBody(sim,child,mother,father){
  const wild=isWildSpecies(child?.species);if(child?.species!=='genvo'&&!wild)return false;
  const parents=[mother,father].filter(p=>p?.bodyPlan);if(!parents.length)return giveFounderBody(child);
  const inherited=parents.map(p=>p.elder?withoutRelicParts(p.bodyPlan,wild?WILD_START[child.species]:FOUNDER_PLACEMENTS):p.bodyPlan);
  let recombined;
  let plan=inherited.length>1?recombineBodyPlans(sim.rng,inherited[0],inherited[1],{onRecombined:receipt=>{recombined=receipt}}):inherited[0];
  if(!recombined)recombined=recombinationReceipt(plan,inherited,singlePlanSelections(plan,[0]),'single-parent');
  child.bodyInheritance={schema:RECOMBINATION_RECEIPT,parents:parents.map((p,i)=>({id:p.id,bodyId:p.bodyPlan.id,recombinationBodyId:inherited[i].id,filteredExclusiveParts:!!p.elder})),recombined};
  let variation={policy:'neutral-head-structure/1',operator:'inherit',attempted:false,accepted:true,from:plan.id,to:plan.id,targets:[],removed:[],moved:[]};
  if(sim.rng.chance(sim.bodyVariationChance??BODY_VARIATION.mutationChance))plan=mutatePlan(sim.rng,plan,{onMutation:event=>{variation=event}});
  const lostTraits=[...new Set(variation.removed.map(n=>PARTS[n.partId]?.legacy?.adaptation).filter(Boolean))];
  child.bodyVariation={...variation,parentBodies:parents.map(p=>({id:p.id,bodyId:p.bodyPlan.id})),finalBody:null};
  syncAnatomy(child);
  child.legacyWaterPhysiology=inheritedLegacyWaterTraits(parents,child).filter(id=>!lostTraits.includes(id));
  // Wild bodies retain their prior projection outside explicitly lost support.
  // A removed mapped organ cannot retain an unsupported inherited ability or
  // cause reconciliation to fabricate its replacement. Remaining support is kept.
  for(const id of lostTraits){const legacy=Object.values(PARTS).find(p=>p.legacy?.adaptation===id)?.legacy;if(!legacy||legacy.axis==='waterBody')continue;
    const supported=plan.nodes.some(n=>{const l=PARTS[n.partId]?.legacy;return l?.axis===legacy.axis&&l.threshold>=legacy.threshold});
    if(!supported)child.anatomy[legacy.axis]=Math.min(child.anatomy[legacy.axis]||0,legacy.threshold-.15);
  }
  if(wild){child.bodyPlan=deserializePlan(serializePlan(plan));projectWaterPhysiology(child,plan,{preserveLegacy:true});refreshExpression(child);child.bodyVariation.finalBody=child.bodyPlan.id;return true}
  plan=reconcileTraits(plan,child.adaptations,{skipWater:true,skipTraits:lostTraits});
  const applied=applyLineageTarget(child,plan,{preserveLegacyWater:true});child.bodyVariation.finalBody=child.bodyPlan?.id||null;return applied;
}
