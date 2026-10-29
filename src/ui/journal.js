import {deserializePlan} from '../lineage/body-plan.js';
import {recordedInheritanceSummary} from '../lineage/recombination-receipt.js';
import {bodyCostReading} from './body-cost-reading.js';
import {lineageComparisonModels,drawLineageComparison} from './lineage-comparison.js';
import {seedPatchDescription} from '../gameplay/seed-observations.js';
import {creatureIdentity} from './creature-identity.js';
import {updateKnowledgeHTML} from './knowledge-panel.js';
import {taxonNameExplanation} from '../lineage/taxon-name-generator.js';
import {SPECIES} from '../organisms/species.js';
import {developmentFor} from '../family/family.js';
import {compareGenes,traitListText,visualChangeText,strongestTraitText} from '../lineage/adaptation.js';
import {drawLineagePortrait} from '../render/lineage-portrait.js';
import {ADAPTATIONS,nearThreshold} from '../lineage/evolution.js';
import {comparePhysicalBuilds,offspringPartOrigins,originSummary} from '../lineage/breeding-guidance.js';
import {tissueEnergy} from '../ecology/tissue-energy.js';

export class FieldJournal{
  constructor(sim){
    this.sim=sim;
    this.open=false;
    this.selectedId=null;
    this.lastSignature='';
    this.el=document.querySelector('#journal');this.el.addEventListener('toggle',e=>{if(e.target.dataset.section==='body-comparison'&&e.target.open)drawLineageComparison(this.el,this.sim,this.selectedId)},{capture:true});this.el.addEventListener('click',e=>{const b=e.target.closest('[data-journal]');if(!b)return;if(b.dataset.journal==='revisit'){this.onRevisit?.(Number(b.dataset.patch));return}if(b.dataset.journal==='member'){this.selectMember(b.dataset.memberId);return}if(b.dataset.journal==='close')this.setOpen(false);else if(b.dataset.journal==='handoff')this.handoffSelected();else this.cycle(b.dataset.journal==='prev'?-1:1)});
  }
  setSimulation(sim){this.sim=sim;this.selectedId=null;this.lastSignature='';this.setOpen(false)}
  setOpen(open){this.open=!!open;if(this.open&&!this.selectedId)this.selectedId=this.sim.lineage.activeId||this.sim.lineage.founderId;this.lastSignature='';this.update()}
  toggle(){this.setOpen(!this.open);return this.open}
  records(){return [...this.sim.lineage.records.values()].sort((a,b)=>a.generation-b.generation||a.bornDay-b.bornDay||a.id-b.id)}
  selectedRecord(records=this.records()){if(!records.length)return null;if(!records.some(r=>r.id===this.selectedId))this.selectedId=this.sim.lineage.activeId||records[0].id;return records.find(r=>r.id===this.selectedId)||records[0]}
  cycle(delta=1){const records=this.records();if(!records.length)return null;let i=records.findIndex(r=>r.id===this.selectedId);if(i<0)i=0;else i=(i+delta+records.length)%records.length;this.selectedId=records[i].id;this.lastSignature='';this.update();const scroll=this.el?.querySelector('.journal-scroll');if(scroll)scroll.scrollTop=0;return records[i]}
  // Portrait navigation reads existing records; it never transfers player control.
  selectMember(rawId){
    const id=Number(rawId);
    if(!Number.isSafeInteger(id)||!this.sim?.lineage?.records?.has(id))return false;
    this.selectedId=id;
    this.lastSignature='';
    this.update();
    const scroll=this.el?.querySelector('.journal-scroll');
    if(scroll)scroll.scrollTop=0;
    const heading=this.el?.querySelector('.journal-head h2');
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
    return true;
  }
  canTakeOver(record=this.selectedRecord()){
    if(!record?.alive||record.id===this.sim.lineage.activeId)return false;
    const animal=this.sim.animals.find(a=>a.id===record.id&&a.alive);if(!animal)return false;
    return this.sim.lineage.isDescendant(record.id,this.sim.lineage.activeId)&&animal.age>=SPECIES[animal.species].maturity;
  }
  handoffSelected(){const record=this.selectedRecord();if(!this.canTakeOver(record))return false;const ok=this.sim.lineage.handoffTo(record.id,{manual:true});if(ok){this.selectedId=record.id;this.lastSignature='';this.update()}return ok}
  update(){
    if(!this.el)return;
    this.el.hidden=!this.open;if(!this.open)return;
    const records=this.records(),record=this.selectedRecord(records);if(!record){this.el.innerHTML='<div class="journal-page"><p>No family history yet.</p></div>';return}
    const model=buildJournalEntry(this.sim,record.id),signature=JSON.stringify([records.length,records.findIndex(r=>r.id===record.id),record.id,record.alive,record.children.length,(record.adaptations||[]).join(','),this.sim.day,this.sim.lineage.activeId,model.notes.length,model.home,model.lastFood,model.lastWater,model.seedPatches,model.bodyCost?.text]);
    if(signature===this.lastSignature)return;this.lastSignature=signature;
    updateKnowledgeHTML(this.el,journalMarkup(model,this.canTakeOver(record),records.length,records.findIndex(r=>r.id===record.id)+1));
    drawLineageComparison(this.el,this.sim,record.id);
    drawRecordedKin(this.el,this.sim);
    const canvas=this.el.querySelector('#journalPortrait');drawLineagePortrait(canvas,record.genes,{pigmentGenome:record.pigmentGenome||null,frame:2,dir:2,bodyPlan:this.sim.animals.find(a=>a.id===record.id)?.bodyPlan||record.bodyPlan,emphasis:record.id===this.sim.lineage.activeId,adaptations:record.adaptations||[]});
  }
}

export function buildJournalEntry(sim,recordId){
  const record=sim.lineage.records.get(recordId);if(!record)return null;
  const founder=sim.lineage.records.get(sim.lineage.founderId),animal=sim.animals.find(a=>a.id===record.id),stage=animal?developmentFor(animal).stage:(record.alive?'living':'recorded');
  const parents=record.parentIds.map(id=>sim.lineage.records.get(id)).filter(Boolean),children=record.children.map(id=>sim.lineage.records.get(id)).filter(Boolean);
  const ancestry=sim.lineage.ancestryPath(record.id);
  const body=animal?.bodyPlan||record.bodyPlan;
  const conceptionBodies=Array.isArray(record.parentBodyPlans)&&record.parentBodyPlans.length===2?record.parentBodyPlans:null;
  const inheritance=conceptionBodies?offspringPartOrigins(body,conceptionBodies[0],conceptionBodies[1]):null;
  const parentBuilds=conceptionBodies?comparePhysicalBuilds(conceptionBodies[0],conceptionBodies[1]):null;
  const livingMatches=sim.animals.filter(other=>other.alive&&other.lineage&&other.id!==record.id&&comparePhysicalBuilds(body,other)?.exact).length;
  const changes=founder&&record.id!==founder.id?compareGenes(record.genes,founder.genes,{limit:3}):[];
  const looks=founder&&record.id!==founder.id?visualChangeText(record.genes,founder.genes,{limit:3,empty:'much like the founder'}):'the founder';
  const cognitive=sim.cognition.states.get(record.id),territory=sim.territory.states.get(record.id),migration=sim.migration.states.get(record.id);
  const notes=(cognitive?.history||[]).slice(0,5).map(n=>({text:journalNote(n),when:`Y${n.year} · day ${n.day}`}));
  const origin=record.authoredOrigin;
  const ageDays=record.alive&&animal?Math.round(animal.age):origin?origin.authoredAge+Math.max(0,(record.diedDay??origin.introducedDay)-origin.introducedDay):Math.max(0,(record.diedDay??record.bornDay)-record.bornDay);
  const branch=animal?sim.evolutionTree?.currentBranchFor?.(animal):null,lastHistoric=(record.speciesBranchHistory||[]).at(-1)||record.speciesBranch||null,taxon=branch?.label||lastHistoric?.label||'GenVo';
  return{
    subjectName:animal?creatureIdentity(sim,animal).name:taxon,id:record.id,generation:record.generation,sex:record.sex,alive:record.alive,active:record.id===sim.lineage.activeId,stage,ageDays,taxon,
    taxonExplanation:taxonNameExplanation(branch?.nameOrigin||lastHistoric?.nameOrigin),
    born:origin?`Authored adult · introduced day ${origin.introducedDay} (${origin.mode})`:record.bornDay==null?'Birth date not retained':`Y${record.bornYear} · day ${record.bornDay}`,
    death:record.alive?'':`${plainCause(record.cause)} · Y${record.diedYear} · day ${record.diedDay}`,
    trait:animal?strongestTraitText(animal):traitListText(compareGenes(record.genes,founder?.genes||record.genes,{limit:2}),{empty:'close to the family baseline'}),
    changes:traitListText(changes,{empty:'close to the founder'}),looks,
    adaptations:(record.adaptations||[]).map(id=>ADAPTATIONS[id]?.name).filter(Boolean),
    bodyCost:bodyCostReading(animal,animal?tissueEnergy(sim,animal):undefined),
    bodyComparison:lineageComparisonModels(sim,record.id).map(m=>({label:m.label,id:m.id})),
    seedPatches:(sim.discovery.seedObservations||[]).filter(o=>o.actorId===record.id).slice(-8).map(o=>({id:o.id,text:seedPatchDescription(o),when:'Last observed day '+o.observedDay})),
    habits:sim.habits?.summary?.(animal||{habits:record.habits})||'no settled habits yet',
    developing:animal?nearThreshold(animal).slice(0,2).map(n=>n.name):[],
    parents,children,ancestry,notes,inheritance:recordedInheritanceSummary(record.bodyInheritance,record.bodyVariation)||(inheritance?originSummary(inheritance,{limit:2}):'Parental body plans at conception not recorded (older lineage)'),parentBuilds:parentBuilds?.exact?'Parents have matching physical builds':parentBuilds?`Parents differ at ${parentBuilds.different} mounted positions`:'Parental pairing unavailable',livingMatches,
    home:territory?.established&&territory.home?`settled home · radius ${Math.round(territory.radius)} tiles`:'no settled home recorded',
    // v1.33.4: what this creature itself knows (v1.33 knowledge), not its last glimpse.
    lastWater:knowledgeLine(sim,animal),
    lastFood:fearLine(sim,animal),
    migration:migration?.status&&migration.status!=='settled'?plainMigration(migration.status):migration?.seasonalRefuges&&Object.keys(migration.seasonalRefuges).length?`${Object.keys(migration.seasonalRefuges).length} seasonal refuge${Object.keys(migration.seasonalRefuges).length===1?'':'s'} known`:'no migration recorded'
  };
}


// Retained individual anatomy only. Missing bodies never fall back to a founder.
function kinHasBody(record){try{const plan=deserializePlan(record.bodyPlan);return !!record.genes&&Array.isArray(plan?.nodes)&&plan.nodes.length>0}catch{return false}}
function kinMarkup(record,relation){
  const label=relation+' · Generation '+record.generation+', record '+record.id+', '+(record.alive?'living':'deceased');
  return '<figure class="kin-record '+(record.alive?'':'kin-dead')+'" data-kin-id="'+record.id+'"><button type="button" class="kin-record-link" data-journal="member" data-member-id="'+record.id+'" aria-label="Read '+label+'">'+(kinHasBody(record)?'<canvas width="160" height="120" aria-hidden="true"></canvas>':'<span class="kin-missing">Anatomy not retained</span>')+'<span class="kin-card-caption"><b>G'+record.generation+' · #'+record.id+'</b><span>'+relation+' · '+(record.alive?'Living':'Died')+'</span></span></button></figure>';
}
function drawRecordedKin(el,sim){for(const figure of el.querySelectorAll('[data-kin-id]')){const record=sim.lineage.records.get(Number(figure.dataset.kinId)),canvas=figure.querySelector('canvas');if(canvas&&record&&kinHasBody(record))drawLineagePortrait(canvas,record.genes,{pigmentGenome:record.pigmentGenome||null,frame:2,dir:2,bodyPlan:record.bodyPlan,adaptations:record.adaptations||[]})}}

export function journalMarkup(m,canTakeOver,recordCount,recordPosition){
  const ancestry=m.ancestry.map(r=>`<span class="journal-node ${r.id===m.id?'selected':''} ${r.alive?'':'dead'}"><i></i><b>G${r.generation}</b><small>#${r.id}</small></span>`).join('');
  const parents=m.parents.length?m.parents.map(r=>`G${r.generation} #${r.id}`).join(' · '):'founder';
  const children=m.children.length?m.children.slice(0,8).map(r=>`<span>${r.alive?'•':'×'} G${r.generation} #${r.id}</span>`).join(''):'<em>none recorded</em>';
  const notes=m.notes.length?m.notes.map(n=>`<li><span>${escapeHtml(n.text)}</span><small>${n.when}</small></li>`).join(''):'<li><span>No field notes yet.</span></li>';
  return `<div class="journal-page knowledge-panel">
    <header class="journal-head"><div><small>FAMILY LINE</small><h2>${escapeHtml(m.subjectName)} <span>Generation ${m.generation}</span></h2></div><p>${m.active?'YOU ARE HERE':m.alive?'LIVING RELATIVE':'FAMILY RECORD'}</p></header>
    <div class="journal-scroll" data-focus-key="family-scroll" tabindex="0" aria-label="Scrollable family record"><div class="journal-stitch"></div>
    <div class="journal-facts" aria-label="Family member at a glance"><div><b>Life record</b><span>${escapeHtml(m.born)}</span></div><div><b>Family ties</b><span>${m.parents.length} recorded parent${m.parents.length===1?'':'s'} · ${m.children.length} recorded child${m.children.length===1?'':'ren'}</span></div></div>
    <div class="journal-grid">
      <aside class="journal-spine" aria-label="Ancestry path">${ancestry}</aside>
      <section class="journal-family-plate" aria-label="Recorded immediate family"><h3>Recorded parents</h3><p class="kin-context">Select a parent or child portrait to read their record. Compare inherited anatomy below.</p><div class="kin-row kin-parents">${m.parents.length?m.parents.map(r=>kinMarkup(r,'Parent')).join(''):'<p class="kin-empty">No parent records retained</p>'}</div><div class="kin-subject"><h3>Selected family member</h3><p class="kin-scale-note">Anatomy shown at adult scale; age is recorded below.</p><section class="journal-specimen">
        <canvas id="journalPortrait" width="240" height="158" aria-label="Generation ${m.generation} family member"></canvas>
        <div class="specimen-caption"><b>${m.stage}</b><span>${m.sex} · ${m.ageDays} days · ${escapeHtml(m.taxon)}</span></div>
        <p>${escapeHtml(m.looks)}</p>
      </section>
      </div><h3>Recorded children <span>${m.children.length}</span></h3><div class="kin-row kin-children" tabindex="0" aria-label="Recorded children; scroll horizontally for more">${m.children.length?m.children.slice(0,12).map(r=>kinMarkup(r,'Child')).join(''):'<p class="kin-empty">No children recorded</p>'}</div>${m.children.length>12?'<p class="kin-context">First 12 shown. Previous and Next browse all recorded family members.</p>':''}</section>
      <section class="journal-notes">
        ${m.taxonExplanation?`<h3>Where the species name came from</h3><p>${escapeHtml(m.taxonExplanation)}</p>`:''}
        <h3>Habits</h3><p>${escapeHtml(m.habits)}</p>
        ${m.bodyCost?`<h3>Body and growth</h3><p>${escapeHtml(m.bodyCost.text)}</p>`:''}
        ${m.developing?.length?`<h3>Body developing toward</h3><p>${escapeHtml(m.developing.join(' · '))}</p>`:''}
        <h3>What changed</h3><p>${escapeHtml(m.changes)}</p>
        <h3>Family</h3><p>Parents: ${escapeHtml(parents)}</p><div class="journal-children">${children}</div>
        <details class="knowledge-fold" data-section="inheritance"><summary data-focus-key="inheritance">Inherited biology &amp; record</summary><p>Record #${m.id}</p><h3>Inherited body parts</h3><p>${escapeHtml(m.parentBuilds)}<br>${escapeHtml(m.inheritance)}<br>${m.livingMatches} other living lineage creature${m.livingMatches===1?'':'s'} with an identical physical build.</p>
        <p>Matching body plans can reopen editing after a permitted mating; kinship, health and reciprocal mate choice still apply.</p>
        ${m.adaptations.length?`<h3>Major adaptations</h3><p>${escapeHtml(m.adaptations.join(' · '))}</p>`:''}
        </details><h3>Places remembered</h3><p>${escapeHtml(m.home)}<br>${escapeHtml(m.lastWater)}<br>${escapeHtml(m.lastFood)}<br>${escapeHtml(m.migration)}</p>
        ${m.death?`<h3>Last record</h3><p>${escapeHtml(m.death)}</p>`:''}
      </section>
    </div>
    ${m.seedPatches.length?`<section class="journal-events journal-seed-patches"><h3>Seeds &amp; places observed</h3><ul>${m.seedPatches.map(o=>`<li><span>${escapeHtml(o.text)}<small>${escapeHtml(o.when)}</small></span><button type="button" data-journal="revisit" data-patch="${o.id}" data-focus-key="patch-${o.id}">Revisit patch</button></li>`).join('')}</ul></section>`:''}
    ${m.bodyComparison.length?`<details class="knowledge-fold journal-body-comparison" style="--comparison-count:${m.bodyComparison.length}" data-section="body-comparison"><summary data-focus-key="body-comparison">Compare parent &amp; offspring anatomy</summary><p>Recorded parent bodies at conception and this offspring's inherited body, shown at a shared adult scale. Juveniles are smaller in the world.${m.bodyComparison.length<3?' Some parent information is unavailable in this older record.':''}</p><div>${m.bodyComparison.map(m=>`<figure><figcaption>${escapeHtml(m.label)}</figcaption><canvas width="240" height="180" aria-label="${escapeHtml(m.label)}"></canvas></figure>`).join('')}</div></details>`:''}
    <section class="journal-events"><h3>Field notes</h3><ul>${notes}</ul></section>
    </div><footer class="journal-foot"><span class="journal-record-position">${recordCount===1?'1 family record':`Record ${recordPosition} of ${recordCount}`}</span>${recordCount>1?'<button type="button" data-journal="prev" data-focus-key="prev">Previous</button><button type="button" data-journal="next" data-focus-key="next">Next</button>':''}${canTakeOver?'<button type="button" data-journal="handoff">Continue as this one · H</button>':''}<button type="button" data-journal="close" data-focus-key="close">Close · L</button></footer>
  </div>`;
}

function journalNote(n){
  if(n.type==='control')return'Continued the family line here.';
  if(n.type==='stage')return`Became ${n.data?.stage||'older'}.`;
  if(n.type==='offspring')return`Young #${n.data?.id??'?'} was born.`;
  if(n.type==='born')return`Born to #${n.data?.motherId??'?'} and #${n.data?.fatherId??'?'}.`;
  if(n.type==='first-mate')return`Paired with #${n.data?.id??'?'}.`;
  return String(n.text||'').replace(/^Recognized /,'Met ').replace(/^Encountered /,'Saw ')+(/[.!?]$/.test(n.text||'')?'':'.');
}
function plural(n,one,many=one+'s'){return`${n} ${n===1?one:many}`}
function knowledgeLine(sim,animal){if(!animal?.alive)return'its places died with it';const places=sim.cognition?.knownPlaces?.(animal)||[],water=places.filter(p=>p.type==='water').length,shelters=places.filter(p=>p.type==='shelter').length,food=(sim.foraging?.knownPatches?.(animal)||[]).length;if(!water&&!shelters&&!food)return'knows no places of its own yet';return`knows ${[water?plural(water,'water bank'):'',food?plural(food,'food patch','food patches'):'',shelters?plural(shelters,'shelter'):''].filter(Boolean).join(', ')}`}
function fearLine(sim,animal){if(!animal?.alive)return'';const fears=(sim.cognition?.knownPlaces?.(animal,'danger')||[]).length;return fears?`fears ${plural(fears,'place')} where a Stalker struck`:'fears no places'}
function foodLabel(kind){const map={bramble:'berries',sunmoss:'moss',marshroot:'reeds',rotcap:'mushrooms',thistlepod:'seed pods',carrion:'carrion'};return map[kind]||kind}
function plainMigration(status){return status==='outbound'?'away from home':status==='refuge'?'living at a seasonal refuge':status==='returning'?'returning home':status}
function plainCause(cause){const map={starvation:'starved',dehydration:'died of thirst',disease:'died of illness',age:'died of old age',health:'died from injuries',predation:'killed by a predator'};return map[cause]||String(cause||'died')}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
