import {SPECIES} from '../organisms/species.js';

// Legacy milestone summary (creator direction 2026-10-22). Presents what
// actually happened, the real parent and descendant, inherited and changed
// anatomy, offspring and how the line was continued, then lets the player keep
// evolving in the same world or begin a new one. The world never ends here.
const name=id=>String(id).replace(/-/g,' ');
const list=(ids,empty)=>ids.length?ids.map(name).join(', '):empty;
const label=a=>`Generation ${a.generation} ${SPECIES[a.species]?.label||a.species}`;
export const LEGACY_TEXT=Object.freeze({
 firstLegacy:{kicker:'THE FIRST LEGACY',title:'Your Legacy Begins',motto:'Survive. Reproduce. Become the next generation.'},
 eightGenerations:{kicker:'EIGHT-GENERATION LEGACY',title:'A Lineage Established',motto:'Eight generations carried forward by the living world.'}
});
export function buildLegacySummary(kind,m){
 const t=LEGACY_TEXT[kind];if(!t||!m)return null;
 const how=m.reason==='death'?'continued after its death':'handed on by your choice';
 return{kind,kicker:t.kicker,title:t.title,motto:t.motto,
  lead:`${label(m.from)} lived ${m.from.age} days and ${how}. ${label(m.to)} now carries the line.`,
  rows:[
   ['Ancestor',`${label(m.from)} · ${m.from.sex==='F'?'female':m.from.sex==='M'?'male':'unknown sex'} · ${m.from.age} days`],
   ['Descendant',`${label(m.to)} · ${m.to.age} days old`],
   ['Inherited anatomy',list(m.inheritedParts,'none in common')],
   ['New in this body',list(m.newParts,'no new parts')],
   ['No longer present',list(m.lostParts,'nothing lost')],
   ['Offspring',`${m.offspringBorn} born · ${m.offspringAlive} still alive`],
   ['Living lineage',`${m.lineageAlive} members`],
   ['Reached',`Day ${m.day}${m.year!=null?' · year '+m.year:''}`]
  ]};
}
export class LegacySummary{
 constructor({getSim,root=document.querySelector('#app'),onNewWorld=()=>{}}={}){
  this.getSim=getSim;this.onNewWorld=onNewWorld;this.open=false;
  this.el=document.createElement('section');this.el.id='legacySummary';this.el.className='transition legacy-summary';this.el.hidden=true;
  this.el.setAttribute('role','dialog');this.el.setAttribute('aria-modal','true');this.el.setAttribute('aria-labelledby','legacyTitle');
  root?.appendChild(this.el);
  this.el.addEventListener('click',e=>{const b=e.target.closest('[data-legacy]');if(!b)return;if(b.dataset.legacy==='new'){this.close({resume:false});this.onNewWorld()}else this.close()});
 }
 show(kind){
  const sim=this.getSim(),model=buildLegacySummary(kind,sim?.legacyMilestones?.[kind]);if(!model)return false;
  this.wasPaused=!!sim.paused;sim.paused=true;this.open=true;this.model=model;
  this.el.replaceChildren();const card=document.createElement('div');card.className='legacy-card';
  const kicker=document.createElement('div');kicker.className='transition-kicker';kicker.textContent=model.kicker;
  const h=document.createElement('h2');h.id='legacyTitle';h.textContent=model.title;
  const motto=document.createElement('p');motto.className='legacy-motto';motto.textContent=model.motto;
  const lead=document.createElement('p');lead.className='transition-lead';lead.textContent=model.lead;
  const grid=document.createElement('div');grid.className='transition-detail-grid legacy-grid';
  for(const [k,v] of model.rows){const row=document.createElement('div'),b=document.createElement('b'),s=document.createElement('span');b.textContent=k;s.textContent=v;row.append(b,s);grid.append(row)}
  const note=document.createElement('p');note.className='legacy-note';note.textContent='This is a milestone, not the end: the world, your lineage and natural evolution all continue.';
  const actions=document.createElement('div');actions.className='legacy-actions';
  for(const [id,text] of [['continue','Continue Evolving'],['new','Begin a New World']]){const b=document.createElement('button');b.type='button';b.dataset.legacy=id;b.textContent=text;if(id==='continue')b.className='primary';actions.append(b)}
  card.append(kicker,h,motto,lead,grid,note,actions);this.el.append(card);this.el.hidden=false;
  actions.querySelector('.primary')?.focus?.();
  return true;
 }
 close({resume=true}={}){if(!this.open)return;const sim=this.getSim();if(sim&&resume)sim.paused=this.wasPaused;this.open=false;this.el.hidden=true}
}
