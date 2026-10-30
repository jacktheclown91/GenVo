import {bodyDimensionsOf} from '../organisms/body-mass.js';
import {inheritedCapabilityChanges} from './inherited-capabilities.js';
import {createConceptionPlate,mountBirthCapacity} from '../../assets/ui/birth-comparison.js';
import {SPECIES} from '../organisms/species.js';
import {ADAPTATIONS} from '../lineage/evolution.js';
import {drawLineagePortrait} from '../render/lineage-portrait.js';
import {compareGenes} from '../lineage/adaptation.js';
import {PART_ABILITY_TEXT as PHASE_D_TEXT,WAVE1_TEXT,WAVE2_TEXT} from '../lineage/part-abilities.js';

const ALL_PART_TEXT={...PHASE_D_TEXT,...WAVE1_TEXT,...WAVE2_TEXT};

// First-generation arc (creator direction 2026-10-23). When the player's young
// are born, show what each one actually inherited: which body parts came from
// the player, from its other parent or from both, anything new from
// development, what it was born with, and what it still has to learn. Every
// line is read from the birth's recorded inheritance (bodyInheritance receipt,
// bodyVariation, bornWith) and the family learning model; nothing is inferred
// from species names and nothing changes the simulation.
const name=id=>String(id).replace(/@.*$/,'').replace(/-/g,' ');
const partsOf=a=>[...new Set((a?.bodyPlan?.nodes||[]).map(n=>n.partId))];
const list=ids=>ids.map(name).join(', ');
// Donor of each of the child's parts: 'you', 'mate', 'both' or 'new'.
export function inheritedParts(child,playerId){
 const receipt=child?.bodyInheritance,nodes=receipt?.recombined?.nodes||[],parents=receipt?.parents||[];
 const who=i=>parents[i]?.id===playerId?'you':'mate',byPart=new Map();
 for(const n of nodes){const s=n.sources||[];const tag=s.length>=2?'both':s.length===1?who(s[0].parentIndex):'new';const set=byPart.get(n.partId)||new Set();set.add(tag);byPart.set(n.partId,set)}
 // Parts expressed after development but absent from the recombined layout.
 for(const p of partsOf(child))if(!byPart.has(p))byPart.set(p,new Set(['new']));
 const out={you:[],mate:[],both:[],new:[]};
 for(const [part,tags] of byPart){const t=tags.has('new')?'new':tags.size>1||tags.has('both')?'both':[...tags][0];if(partsOf(child).includes(part))out[t].push(part)}
 for(const k of Object.keys(out))out[k].sort();
 return out;
}
export function buildYoungSummary(sim,parent,children,{first=false}={}){
 if(!parent||!children?.length)return null;
 const mateId=children.map(c=>c.parentIds?.find(id=>id!==parent.id)).find(id=>id!=null),mate=sim.animals.find(a=>a.id===mateId)||null;
 const spec=SPECIES[parent.species]||{},maturity=spec.maturity||30,mine=new Set(partsOf(parent));
 const young=children.map(c=>{const from=inheritedParts(c,parent.id),lost=[...mine].filter(p=>!partsOf(c).includes(p)).sort();
  const learning=sim.family?.learningProfile?.(c);
  const removed=new Set((c.bodyVariation?.accepted?c.bodyVariation.removed||[]:[]).map(n=>n.partId));
  // After inheritance a body can still be reshaped: by a guided design
  // (Creature Lab, guided-ancestry starts) or, for GenVo bodies, by trait
  // reconciliation when inherited adaptations develop. Report those changes
  // socket by socket against the inherited layout from the receipt.
  const guided=[],receipt=c.bodyInheritance,layoutAt=new Map();
  for(const n of receipt?.recombined?.nodes||[]){const src=n.sources?.[0],pid=receipt.parents?.[src?.parentIndex]?.id,owner=pid===parent.id?parent:sim.animals.find(a=>a.id===pid),node=owner?.bodyPlan?.nodes?.find(x=>x.id===src?.nodeId);if(node?.socket)layoutAt.set(node.parent+'/'+node.socket,n.partId)}
  const reshaped=layoutAt.size&&c.bodyVariation?.finalBody&&c.bodyVariation.finalBody!==c.bodyVariation.to;
  if(reshaped){const theirs=new Map((c.bodyPlan?.nodes||[]).filter(n=>n.socket).map(n=>[n.parent+'/'+n.socket,n.partId])),swaps=new Map();
   for(const [k,v] of theirs){const was=layoutAt.get(k);const key=was&&was!==v?name(was)+' → '+name(v):!was?'added '+name(v):null;if(key)swaps.set(key,(swaps.get(key)||0)+1)}
   for(const [k,v] of layoutAt)if(!theirs.has(k)){const key='removed '+name(v);swaps.set(key,(swaps.get(key)||0)+1)}
   const fresh=new Set(from.new);for(const [k,n] of swaps){const result=k.startsWith('added ')?k.slice(6):k.includes(' → ')?k.split(' → ')[1]:null;if(result&&[...fresh].some(p=>name(p)===result))continue;guided.push(n>1?k+' ×'+n:k)}}
  const guidedBy=c.bodyVariation?.guidedOverride?'Shaped by your guided design':'Developed from inherited traits';
  const guidedParts=new Set(reshaped?lost.filter(x=>[...layoutAt.values()].includes(x)):[]);
  const novelParts=[...new Set([...from.new,...from.mate.filter(p=>!mine.has(p))])];
  const advantages=novelParts.map(p=>{
   const t=ALL_PART_TEXT[p];
   return t?.gain?`${name(p)} (${t.gain})`:null;
  }).filter(Boolean);
  return{id:c.id,...(c.bodySize?{size:bodyDimensionsOf(c)}:{}),sex:c.sex==='F'?'female':c.sex==='M'?'male':'',from,lost,lostInDevelopment:lost.filter(x=>removed.has(x)&&!guidedParts.has(x)),guided,guidedBy,guidedParts:[...guidedParts],advantages,capabilities:inheritedCapabilityChanges(sim,parent,c),traits:compareGenes(c.genes,parent.genes,{limit:3}).map(t=>t.phrase),bornWith:(c.bornWith||[]).map(id=>ADAPTATIONS[id]?.name||name(id)),
   mutated:!!(c.bodyVariation?.accepted&&c.bodyVariation?.attempted&&(c.bodyVariation.targets?.length||c.bodyVariation.removed?.length||c.bodyVariation.moved?.length)),
   dependent:!!sim.family?.isDependent?.(c),stage:learning?.label||'newborn'}});
 const lines=y=>[y.size?'Inherited adult length '+y.size.adultScale.toFixed(3)+'\u00d7 reference; current '+y.size.currentScale.toFixed(3)+'\u00d7':'',y.capabilities?.length?'Different possibilities: '+y.capabilities.join(' · '):'',y.from.you.length?'From you: '+list(y.from.you):'',y.from.mate.length?'From its other parent: '+list(y.from.mate):'',y.from.both.length?'Both of you carried: '+list(y.from.both):'',
  y.from.new.length?'New in this body: '+list(y.from.new):'',y.lostInDevelopment.length?'Lost in development: '+list(y.lostInDevelopment):'',
  y.guided.length?y.guidedBy+': '+y.guided.join(', '):'',
  y.lost.filter(x=>!y.lostInDevelopment.includes(x)&&!y.guidedParts.includes(x)).length?'Not inherited from you: '+list(y.lost.filter(x=>!y.lostInDevelopment.includes(x)&&!y.guidedParts.includes(x))):'',
  y.traits.length?'Compared with you: '+y.traits.join(', '):'',y.bornWith.length?'Born with: '+y.bornWith.join(', '):''].filter(Boolean);
  // Summarize real sibling differences before the detailed parent/part plates.
  const highlights=new Map();
  for(const child of young)for(const text of child.capabilities){
    const ids=highlights.get(text)||[];ids.push(child.id);highlights.set(text,ids);
  }
 return{highlights:[...highlights].map(([text,ids])=>({text,ids})),first,title:first?'Your First Young':'New Young',kicker:'GENERATION '+((parent.generation||1)+1)+' · INHERITANCE',
  lead:`${children.length===1?'One young was':children.length+' young were'} born to you${mate?' and #'+mate.id:''}. Each body is a real mixture of its parents'.`,
  young:young.map(y=>({...y,lines:lines(y)})),
  knowledge:'Bodies are inherited. Knowledge is not: young that stay near you learn water, food, shelter and danger from what they see you do.',
  stakes:`They depend on you while they grow. In about ${maturity} days of growth one can be ready to carry the line on: press H to continue as them.`,
  notice:`${children.length===1?'Young':children.length+' young'} born · `+(()=>{const fresh=[...new Set(young.flatMap(y=>y.from.new))],fromMate=[...new Set(young.flatMap(y=>y.from.mate))],traits=[...new Set(young.flatMap(y=>y.traits))].slice(0,2);
   return[fresh.length?'new: '+list(fresh):'',fromMate.length?'from #'+(mate?.id??'mate')+': '+list(fromMate):'',traits.length?'compared with you: '+traits.join(', '):''].filter(Boolean).join(' · ')||'bodies much like yours'})()};
}
// Watches for newborns of the creature the player controls. The first litter
// in a world opens the card (pausing like other milestones); later litters get
// a short notice. Only newborns are considered, so loading a save never
// replays old births.
export class YoungSummary{
 constructor({getSim,root=document.querySelector('#app'),blocked=()=>false,notify=()=>{}}={}){
  this.getSim=getSim;this.blocked=blocked;this.notify=notify;this.open=false;this.seen=new Set();this.pending=null;
  this.el=document.createElement('section');this.el.id='youngSummary';this.el.className='transition legacy-summary young-summary';this.el.hidden=true;
  this.el.setAttribute('role','dialog');this.el.setAttribute('aria-modal','true');this.el.setAttribute('aria-labelledby','youngTitle');root?.appendChild(this.el);
  this.el.addEventListener('click',e=>{if(e.target.closest('[data-young="continue"]'))this.close()});
 }
 check(){
  const sim=this.getSim(),p=sim?.player?.();if(!p||this.open)return;
  if(this.world!==sim){this.world=sim;this.seen=new Set(sim.animals.filter(a=>a.parentIds?.includes(p.id)).map(a=>a.id));this.pending=null}
  const newborn=sim.animals.filter(a=>a.alive&&a.parentIds?.includes(p.id)&&!this.seen.has(a.id)&&(a.age||0)<2);
  for(const a of sim.animals)if(a.parentIds?.includes(p.id)&&(a.age||0)>=2)this.seen.add(a.id);
  if(newborn.length)this.pending={parent:p,children:newborn};
  if(!this.pending||this.blocked())return;
  const {parent,children}=this.pending;this.pending=null;for(const c of children)this.seen.add(c.id);
  const first=!sim.uiFirstYoungShown,model=buildYoungSummary(sim,parent,children,{first});if(!model)return;
  if(first){sim.uiFirstYoungShown=true;this.show(sim,model)}else this.notify(model.notice);
 }
 show(sim,model){
  this.wasPaused=!!sim.paused;sim.paused=true;this.open=true;this.model=model;this.el.replaceChildren();
  const card=document.createElement('div');card.className='legacy-card';
  const kicker=document.createElement('div');kicker.className='transition-kicker';kicker.textContent=model.kicker;
  const h=document.createElement('h2');h.id='youngTitle';h.textContent=model.title;
  const lead=document.createElement('p');lead.className='transition-lead';lead.textContent=model.lead;
  const comparison=createConceptionPlate(sim,model.young.map(y=>y.id));
  const grid=document.createElement('div');grid.className='young-grid';
  for(const y of model.young.slice(0,4)){const cell=document.createElement('div');cell.className='young-cell';const canvas=document.createElement('canvas');canvas.width=144;canvas.height=112;
   const child=sim.animals.find(a=>a.id===y.id);if(child)drawLineagePortrait(canvas,child.genes,{pigmentGenome:child.pigmentGenome||null,lifestyle:child.ecoLifestyle||null,bodyPlan:child.bodyPlan,anatomy:child.anatomy,adaptations:child.adaptations,frame:2,dir:2,fitScale:comparison.fitScale});
   const head=document.createElement('b');head.textContent=`#${y.id}${y.sex?' · '+y.sex:''}`;const ul=document.createElement('ul');for(const l of y.lines){const li=document.createElement('li');li.textContent=l;ul.append(li)}
   cell.append(canvas,head,ul);grid.append(cell)}
  const knowledge=document.createElement('p');knowledge.className='legacy-note';knowledge.textContent=model.knowledge;
  const stakes=document.createElement('p');stakes.className='legacy-note';stakes.textContent=model.stakes;
  const actions=document.createElement('div');actions.className='legacy-actions';const b=document.createElement('button');b.type='button';b.dataset.young='continue';b.className='primary';b.textContent='Raise them';actions.append(b);
  const content=document.createElement('div');content.className='birth-scroll';
  if(model.highlights?.length){
   const opportunities=document.createElement('section');opportunities.className='birth-opportunities';
   const title=document.createElement('h3');title.textContent='Different possibilities';
   const list=document.createElement('ul');
   for(const change of model.highlights.slice(0,3)){
    const item=document.createElement('li');item.textContent=change.ids.length+' of '+model.young.length+' young: '+change.text;list.append(item);
   }
   opportunities.append(title,list);content.append(opportunities);
  }
  content.append(comparison.element,grid,knowledge,stakes);card.append(kicker,h,lead,content,actions);this.el.append(card);this.el.hidden=false;this.restoreCapacity=mountBirthCapacity(card);b.focus?.();
 }
 close(){if(!this.open)return;this.restoreCapacity?.();this.restoreCapacity=null;const sim=this.getSim();if(sim)sim.paused=this.wasPaused;this.open=false;this.el.hidden=true}
}
