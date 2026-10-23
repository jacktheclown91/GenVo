// Narrow review transformer. Shared journal source is changed only by its owner.
function replaceOnce(source,anchor,replacement){if(source.split(anchor).length!==2)throw Error('Journal source changed: review candidate anchor');return source.replace(anchor,replacement)}
function candidateJournal(source){
 source="import {deserializePlan} from '../lineage/body-plan.js';\n"+source;
 source=replaceOnce(source,"function journalMarkup(m,canTakeOver){",helpers+"\nfunction journalMarkup(m,canTakeOver){");
 source=replaceOnce(source,'<section class="journal-specimen">','<section class="journal-family-plate" aria-label="Recorded immediate family"><h3>Recorded parents</h3><p class="kin-context">Individual records; conception anatomy is compared below.</p><div class="kin-row kin-parents">${m.parents.length?m.parents.map(r=>kinMarkup(r,\'Parent\')).join(\'\'):\'<p class="kin-empty">No parent records retained</p>\'}</div><div class="kin-subject"><h3>Selected family member</h3><p class="kin-scale-note">Anatomy shown at adult scale; age is recorded below.</p><section class="journal-specimen">');
 source=replaceOnce(source,'      <section class="journal-notes">','      </div><h3>Recorded children <span>${m.children.length}</span></h3><div class="kin-row kin-children" tabindex="0" aria-label="Recorded children; scroll horizontally for more">${m.children.length?m.children.slice(0,12).map(r=>kinMarkup(r,\'Child\')).join(\'\'):\'<p class="kin-empty">No children recorded</p>\'}</div>${m.children.length>12?\'<p class="kin-context">First 12 shown. Previous and Next browse every retained family record.</p>\':\'\'}</section>\n      <section class="journal-notes">');
 const anchor='    const canvas=this.el.querySelector(\'#journalPortrait\');';
 source=replaceOnce(source,anchor,"    drawRecordedKin(this.el,this.sim);\n"+anchor);
 return source;
}
const helpers=String.raw`
// Retained individual anatomy only. Missing bodies never fall back to a founder.
function kinHasBody(record){try{const plan=deserializePlan(record.bodyPlan);return !!record.genes&&Array.isArray(plan?.nodes)&&plan.nodes.length>0}catch{return false}}
function kinMarkup(record,relation){return '<figure class="kin-record '+(record.alive?'':'kin-dead')+'" data-kin-id="'+record.id+'">'+(kinHasBody(record)?'<canvas width="160" height="120" aria-label="'+relation+' '+record.id+' recorded anatomy"></canvas>':'<p class="kin-missing">Anatomy not retained</p>')+'<figcaption><b>G'+record.generation+' · #'+record.id+'</b><span>'+relation+' · '+(record.alive?'Living':'Died')+'</span></figcaption></figure>'}
function drawRecordedKin(el,sim){for(const figure of el.querySelectorAll('[data-kin-id]')){const record=sim.lineage.records.get(Number(figure.dataset.kinId)),canvas=figure.querySelector('canvas');if(canvas&&record&&kinHasBody(record))drawLineagePortrait(canvas,record.genes,{pigmentGenome:record.pigmentGenome||null,frame:2,dir:2,bodyPlan:record.bodyPlan,adaptations:record.adaptations||[]})}}
`;
module.exports={candidateJournal};
