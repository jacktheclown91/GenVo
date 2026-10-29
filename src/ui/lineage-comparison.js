// Recorded conception anatomy and actual descendant anatomy, never a hypothetical child.
import {deserializePlan} from '../lineage/body-plan.js';
import {comparePhysicalBuilds} from '../lineage/breeding-guidance.js';
import {adultSizeScale,validateBodySize} from '../organisms/body-size.js';
import {phenotypeFor} from '../organisms/species.js';
import {drawLineagePortrait,lineagePortraitBounds} from '../render/lineage-portrait.js';
import {loadPartArtVariant} from '../render/part-art-variants.js';
import {bodyVerbs} from './body-verbs.js';
import {beginTintFrame} from '../render/indexed-part-renderer.js';

function sizeReading(source,sim){
  if(source?.bodySize){
    try{validateBodySize(source.bodySize);return{bodySize:structuredClone(source.bodySize),sizeStatus:'recorded'}}catch{}
  }
  return{sizeStatus:sim.bodySizeRules?'unrecorded':'reference'};
}
export function comparisonSizeLabel(model){
  if(model.sizeStatus==='unrecorded')return 'Inherited adult size not recorded';
  if(model.sizeStatus==='reference')return 'Reference-size world';
  return 'Inherited adult length '+adultSizeScale(model).toFixed(3)+'× reference';
}
export function lineageComparisonModels(sim,id){
  const record=sim.lineage.records.get(id);if(!record)return[];
  const parse=p=>{const body=typeof p==='string'?deserializePlan(p):p;if(!body?.nodes?.length)throw Error('Missing recorded anatomy');return body};
  const parents=(record.parentIds||[]).map((pid,i)=>{
    const stored=record.parentPhenotypes?.[i],witness=stored?.id===pid?stored:null,parent=witness||sim.lineage.records.get(pid),body=record.parentBodyPlans?.[i];
    if(!parent||!body)return null;
    try{return{label:'Parent '+(i+1)+' · conception anatomy',bodyPlan:parse(body),genes:parent.genes,pigmentGenome:parent.pigmentGenome||null,lifestyle:parent.ecoLifestyle||null,adaptations:parent.adaptations||[],anatomy:parent.anatomy||null,id:pid,...sizeReading(witness,sim)}}catch{return null}
  }).filter(Boolean);
  if(!parents.length)return[];
  const animal=sim.animals.find(a=>a.id===id);
  try{return[...parents,{label:animal?'Offspring · current body':'Offspring · birth anatomy',bodyPlan:parse(animal?.bodyPlan||record.bodyPlan),genes:animal?.genes||record.genes,pigmentGenome:(animal?animal.pigmentGenome:record.pigmentGenome)||null,lifestyle:animal?.ecoLifestyle||null,adaptations:animal?.adaptations||record.adaptations||[],anatomy:animal?.anatomy||record.anatomy||null,id,...sizeReading(animal||record,sim)}]}catch{return[]}
}
export function lineageComparisonChanges(sim,models){
  const child=models.at(-1);if(!child)return[];
  return models.slice(0,-1).map(parent=>{
    const build=comparePhysicalBuilds(parent,child),before=phenotypeFor(parent),after=phenotypeFor(child);
    const proportions=[];
    for(const [key,label] of [['bodyScale','Gene-expressed body proportions'],['limbScale','Gene-expressed limb reach']]){
      const delta=after[key]/before[key]-1;
      if(Number.isFinite(delta)&&Math.abs(delta)>=.01)proportions.push(label+' '+(delta>0?'+':'−')+Math.round(Math.abs(delta)*100)+'%');
    }
    const verbs=bodyVerbs(sim,{...child,species:'genvo'},{...parent,species:'genvo'}).filter(v=>v.change!=='kept');
    return{parentId:parent.id,differences:build?.differences||[],proportions,verbs};
  });
}

const views=new WeakMap();let detailBatch=null;
function detailedParts(models){
  const ids=[...new Set(['head-base',...models.flatMap(m=>m.bodyPlan.nodes.map(n=>n.partId))])].sort(),key=ids.join('|');
  if(detailBatch?.key===key)return detailBatch.promise;
  detailBatch?.controller.abort();const controller=new AbortController();
  const batch={key,controller};detailBatch=batch;
  batch.promise=loadPartArtVariant(new URL('../../assets/art/production-candidate-v1/catalog.json',import.meta.url),{resolution:128,partIds:ids,fetcher:url=>fetch(url,{signal:controller.signal})}).then(result=>({parts:Object.freeze(Object.fromEntries(result.parts)),count:result.parts.size}));
  return batch.promise;
}
function portraitOptions(model,state,authoredParts){
  return{bodyPlan:model.bodyPlan,adaptations:model.adaptations,anatomy:model.anatomy,pigmentGenome:model.pigmentGenome,lifestyle:model.lifestyle,dir:state.dir,bodySize:state.size==='inherited'?model.bodySize:null,authoredParts};
}
const element=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};

export async function drawLineageComparison(el,sim,id){
  const section=el.querySelector('[data-section="body-comparison"]');if(!section?.open)return;
  const models=lineageComparisonModels(sim,id);if(!models.length)return;
  let state=views.get(el);if(!state){state={dir:2,art:'128',size:'anatomy',ticket:0,expanded:new Set(),controlsOpen:false};views.set(el,state)}
  if(state.id!==id){state.id=id;state.expanded.clear()}
  const ticket=++state.ticket,allSizes=models.every(m=>m.sizeStatus!=='unrecorded');
  if(!allSizes)state.size='anatomy';
  let menu=section.querySelector('.lineage-view-controls');
  if(!menu){menu=element('details');menu.className='lineage-view-controls';menu.open=state.controlsOpen;menu.append(element('summary'));const fields=element('div');fields.className='lineage-comparison-controls';menu.append(fields);section.insertBefore(menu,section.querySelector('div'))}
  menu.ontoggle=()=>{if(menu.isConnected)state.controlsOpen=menu.open};
  menu.querySelector('summary').textContent='View: '+['North','North east','East','South east','South','South west','West','North west'][state.dir]+' · '+(state.art==='128'?'Detailed 128':'Standard')+' · '+(state.size==='inherited'?'inherited size':'normalized anatomy');
  const controls=menu.querySelector('.lineage-comparison-controls');
  const focusedControl=controls.contains(document.activeElement)?document.activeElement.getAttribute('aria-label'):null;
  controls.replaceChildren();
  const select=(label,items,value,change)=>{
    const field=element('label',label+' '),input=element('select');input.setAttribute('aria-label',label);
    for(const [key,text] of items){const option=element('option',text);option.value=String(key);input.append(option)}input.value=String(value);input.onchange=()=>{change(input.value);drawLineageComparison(el,sim,id)};field.append(input);controls.append(field);return input;
  };
  select('Facing',['North','North east','East','South east','South','South west','West','North west'].map((name,i)=>[i,name]),state.dir,value=>{state.dir=Number(value)});
  select('Comparison artwork',[['128','Detailed 128'],['standard','Standard artwork']],state.art,value=>{state.art=value});
  const size=select('Comparison scale',[['anatomy','Normalize anatomy'],['inherited','Inherited adult size']],state.size,value=>{state.size=value});
  size.querySelector('[value="inherited"]').disabled=!allSizes;
  size.title=allSizes?'Adult inherited scale; juvenile growth is excluded.':'Conception size is missing. Current living-parent size is never substituted.';
  if(focusedControl)controls.querySelector('[aria-label="'+focusedControl+'"]')?.focus();
  let status=section.querySelector('.lineage-comparison-status');if(!status){status=element('p');status.className='lineage-comparison-status';status.setAttribute('role','status');menu.after(status)}
  const notes=section.querySelector('[data-comparison-note]');if(notes)notes.textContent=state.size==='inherited'?'Recorded inherited adult size at a common physical scale. Newborns are smaller in the world.':'Body shapes normalized to reference size. Inherited size is listed separately; unrecorded conception size cannot be compared.';if(notes&&models.length<3)notes.textContent+=' Some parent conception records are unavailable.';
  const figures=section.querySelectorAll('figure'),changes=lineageComparisonChanges(sim,models);
  for(let i=0;i<models.length;i++){
    const figure=figures[i];if(!figure)continue;
    figure.querySelectorAll('.lineage-size-reading,.lineage-change-reading').forEach(e=>e.remove());
    const note=element('p',comparisonSizeLabel(models[i]));note.className='lineage-size-reading';figure.append(note);
    const change=changes[i];if(!change)continue;
    const detail=element('details');detail.className='lineage-change-reading';detail.open=state.expanded.has(change.parentId);detail.ontoggle=()=>{if(detail.open)state.expanded.add(change.parentId);else state.expanded.delete(change.parentId)};const count=change.differences.length;
    detail.append(element('summary',count?count+' changed '+(count===1?'position':'positions')+' in offspring':'Same mounted anatomy'));
    const list=element('ul');for(const d of change.differences)list.append(element('li',d.location+': '+d.first+' → '+d.second));
    for(const text of change.proportions)list.append(element('li',text));
    for(const v of change.verbs)list.append(element('li',(v.change==='new'?'Gained anatomy for ':'Lost anatomy for ')+v.label.toLowerCase()));
    if(list.children.length)detail.append(list);if(change.verbs.length)detail.append(element('p','Body potential only; growth, reserves and current conditions still gate actions.'));figure.append(detail);
  }
  const paint=parts=>{
    beginTintFrame();
    const options=models.map(m=>portraitOptions(m,state,parts)),bounds=models.map((m,i)=>lineagePortraitBounds(m.genes,options[i]));
    const scale=Math.min(8,...bounds.map(b=>Math.min((240-36)/b.w,(180-36)/b.h)));
    models.forEach((m,i)=>drawLineagePortrait(figures[i]?.querySelector('canvas'),m.genes,{...options[i],frame:2,fitScale:scale}));
  };
  paint(undefined);status.textContent=state.art==='128'?'Loading detailed portrait parts…':'Standard artwork · '+(allSizes?'size comparison available':'conception size not recorded');
  if(state.art!=='128')return;
  try{
    const detailed=await detailedParts(models);
    if(state.ticket!==ticket||!section.isConnected||!section.open)return;
    paint(detailed.parts);status.dataset.detailedParts=String(detailed.count);status.textContent='Detailed 128 · standard fallback where needed';
  }catch(error){
    if(state.ticket!==ticket||!section.isConnected||!section.open)return;
    state.art='standard';menu.querySelector('summary').textContent=menu.querySelector('summary').textContent.replace('Detailed 128','Standard');controls.querySelector('[aria-label="Comparison artwork"]').value='standard';status.textContent='Detailed artwork unavailable; standard portrait retained. '+error.message;detailBatch?.controller.abort();detailBatch=null;
  }
}
