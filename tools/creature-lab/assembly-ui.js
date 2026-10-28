import {creatureFootprint as workshopBounds} from '../../src/render/creature-footprint.js';
import {SOCKET_COLORS} from './socket-guides.js';
import {PARTS,partDef} from '../../src/lineage/part-registry.js';
import {serializePlan,deserializePlan} from '../../src/lineage/body-plan.js';
import {GENE_KEYS,phenotypeFor} from '../../src/organisms/species.js';
import {drawGenvoSprite,genvoAnchors} from '../../src/render/genvo-draw.js';
import {starterPlan,attachPart,removePart,checked} from './assembly-model.js';
import {loadPartArtVariant} from '../../src/render/part-art-variants.js';
import {loadNativePartCatalog} from '../../src/render/runtime-part-art.js';
import {planProtectionInPlay} from '../../src/lineage/protection-reading.js';
await loadNativePartCatalog();
let authoredParts={},artistParts={},variantParts={},artRevision=0;
window.addEventListener('genvo8-lab-authored-renderer',event=>{artistParts={...artistParts,[event.detail.partId]:event.detail};authoredParts={...variantParts,...artistParts};artRevision++;boundsCache.clear();showAuthoredBindings();renderPreview();message('Authored artwork installed for '+event.detail.partId+' in this preview.')});
const $=id=>document.getElementById(id);
function showAuthoredBindings(){$('authoredBindings').textContent=Object.keys(artistParts).length?'Artist overrides: '+Object.keys(artistParts).join(', '):Object.keys(variantParts).length?'Detailed modular artwork · '+Object.keys(variantParts).length+' parts · native32 fallback':'Preview artwork: installed native catalog';$('clearAuthored').disabled=!Object.keys(artistParts).length}
$('clearAuthored').onclick=()=>{artistParts={};authoredParts={...variantParts};artRevision++;boundsCache.clear();showAuthoredBindings();renderPreview();message('Authored preview artwork removed; body plan unchanged.')};
$('showAssemblyGuides').onchange=renderPreview;
showAuthoredBindings();let plan=starterPlan(),undo=[],redo=[],anchors=[],frame=0,playing=false,lastFrame=0,animationHandle=null,view={zoom:1,scale:10,cx:192,cy:192},reference=null;const boundsCache=new Map();
function commit(next){undo.push(plan);if(undo.length>100)undo.shift();redo=[];plan=next;refresh()}
function message(text){$('assemblyStatus').textContent=text}
function refresh(){
 $('assemblyRoot').value=plan.nodes.find(n=>!n.parent).partId;
 $('attachmentSocket').replaceChildren();$('assemblyNodes').replaceChildren();
 for(const n of plan.nodes){for(const s of partDef(n.partId).providedSockets){if(n.id==='root'&&plan.nodes.some(x=>x.socket==='head')&&(s.type==='mouth'||s.type==='eye'))continue;const option=document.createElement('option');option.value=JSON.stringify([n.id,s.id]);option.textContent=n.id+' / '+s.id+' · '+s.type;$('attachmentSocket').append(option)}
 const row=document.createElement('div');row.textContent=n.id+' · '+n.partId;if(n.parent){const b=document.createElement('button');b.textContent='Remove '+n.id;b.onclick=()=>{try{commit(removePart(plan,n.id))}catch(e){message(e.message)}};row.append(b)}$('assemblyNodes').append(row)}
 renderPreview();
 message('Valid canonical body plan · '+plan.nodes.length+' parts');showProtection();
}
// What this plan would protect in play, through the same lineage path the evolution editor uses.
function showProtection(){let el=$('assemblyProtection');if(!el){el=document.createElement('p');el.id='assemblyProtection';el.className='lab-in-play';$('assemblyStatus').after(el)}const r=planProtectionInPlay(plan);el.hidden=!r;el.textContent=r?'In play: '+r.detail:''}
function previewAnimal(body=plan){return{id:1,species:'genvo',alive:true,age:60,dir:Number($('previewDirection').value),genes:Object.fromEntries(GENE_KEYS.map(k=>[k,1])),adaptations:[],bodyPlan:body}}
function measure(body,dir){const key=body.id+'|'+dir+'|'+artRevision;if(!boundsCache.has(key))boundsCache.set(key,workshopBounds(previewAnimal(body),dir,{authoredParts}));return boundsCache.get(key)}
function renderPreview(){const action=$('previewAction').value,dir=Number($('previewDirection').value),moving=['walk','flee','hunt'].includes(action),bound=measure(plan,dir),other=reference?measure(reference,dir):null;
 const width=Math.max(bound.w,other?.w||0),height=Math.max(bound.h,other?.h||0),S=Math.min(320/width,320/height,16)*view.zoom;view={...view,scale:S,cx:192-bound.x*S,cy:192-bound.y*S};
 function paint(canvas,body,b){const c=canvas.getContext('2d');c.clearRect(0,0,384,384);c.imageSmoothingEnabled=false;c.save();c.translate(192-b.x*S,192-b.y*S);const animal=previewAnimal(body);drawGenvoSprite(c,{animal,phenotype:phenotypeFor(animal),scale:S,frame,moving,authoredParts,authoredTimeMs:frame*125,palette:{body:'#80a660',shade:'#405c38',light:'#b8d38e'},pose:{dir,action}});c.restore();}
 paint($('creaturePreview'),plan,bound);if(reference){paint($('referencePreview'),reference,other);const before=new Map(reference.nodes.map(n=>[n.id,n.partId])),changed=plan.nodes.filter(n=>before.get(n.id)!==n.partId).map(n=>n.partId.replaceAll('-',' ')),removed=reference.nodes.filter(n=>!plan.nodes.some(x=>x.id===n.id)).length;$('assemblyComparisonLabel').textContent=changed.length||removed?'Current changes: '+changed.join(', ')+(removed?' · '+removed+' removed':''):'Same mounted anatomy as the pinned reference';}
 anchors=genvoAnchors({animal:previewAnimal(),phenotype:phenotypeFor(previewAnimal()),frame:0,pose:{dir,action:'idle'}}).anchors;drawConnectionGuides();
 $('assemblyGuides').style.display=action==='idle'&&!playing&&$('showAssemblyGuides').checked?'':'none';$('assemblyViewStatus').textContent='Whole-creature fit · '+Math.round(view.zoom*100)+'% · current facing';
}
const stage=document.createElement('div');stage.className='lab-body-stage';const board=$('creaturePreview').closest('.artboard');board.dataset.label='Current anatomy';board.before(stage);stage.append(board);const toolbar=document.createElement('div');toolbar.className='lab-view-tools';stage.after(toolbar);
for(const [label,fn] of [['Fit creature',()=>{view.zoom=1}],['Zoom in',()=>{view.zoom=Math.min(2.5,view.zoom*1.2)}],['Zoom out',()=>{view.zoom=Math.max(.5,view.zoom/1.2)}],['Pin reference',()=>{reference=structuredClone(plan);$('assemblyComparison').hidden=false;queueMicrotask(sizeStage)}],['Clear reference',()=>{reference=null;$('assemblyComparison').hidden=true;queueMicrotask(sizeStage)}],['Expand preview',()=>{document.body.classList.toggle('lab-preview-expanded')}]] ){const button=document.createElement('button');button.textContent=label;button.type='button';button.onclick=()=>{fn();if(label==='Expand preview'){const expanded=document.body.classList.contains('lab-preview-expanded');button.textContent=expanded?'Restore preview':'Expand preview';button.setAttribute('aria-pressed',String(expanded))}renderPreview()};toolbar.append(button)}
// Resolution changes affect this assembled preview only. In-progress artist
// paint remains the top layer, and no part/body-plan/export is rewritten.
const artControl=document.createElement('label');artControl.textContent='Artwork ';
const artSelect=document.createElement('select');artSelect.id='assemblyArtResolution';
for(const [value,label] of [['32','Native 32 · stable'],['64','Detailed 64 · candidate'],['128','Close-up 128 · candidate']]){
 const option=document.createElement('option');option.value=value;option.textContent=label;artSelect.append(option);
}
artControl.append(artSelect);toolbar.prepend(artControl);
const artStatus=document.createElement('span');artStatus.id='assemblyArtStatus';artStatus.setAttribute('role','status');artStatus.textContent='Native32 stable artwork';artControl.append(artStatus);
const variantLoads=new Map();let variantTicket=0,activeArtResolution=32;
artSelect.onchange=async()=>{
 const ticket=++variantTicket,resolution=Number(artSelect.value);
 try{
  let next={};
  if(resolution!==32){
   artStatus.textContent='Loading detailed artwork…';
   if(!variantLoads.has(resolution))variantLoads.set(resolution,loadPartArtVariant(new URL('../../assets/art/production-candidate-v1/catalog.json',import.meta.url),{resolution}).catch(error=>{variantLoads.delete(resolution);throw error;}));
   const result=await variantLoads.get(resolution);next=Object.fromEntries(result.parts);
  }
  if(ticket!==variantTicket)return;
  activeArtResolution=resolution;variantParts=next;authoredParts={...variantParts,...artistParts};artRevision++;boundsCache.clear();showAuthoredBindings();renderPreview();
  artStatus.textContent=resolution===32?'Native32 stable artwork':resolution+'px modular candidate · same physical anatomy';
 }catch(error){if(ticket===variantTicket){artStatus.textContent=error.message;artSelect.value=String(activeArtResolution);}}
};
const viewStatus=document.createElement('p');viewStatus.id='assemblyViewStatus';toolbar.after(viewStatus);const comparison=document.createElement('figure');comparison.id='assemblyComparison';comparison.hidden=true;comparison.innerHTML='<figcaption>Pinned anatomy reference · same scale and motion</figcaption><canvas id="referencePreview" width="384" height="384" aria-label="Pinned whole-creature anatomy reference"></canvas><p id="assemblyComparisonLabel"></p>';stage.append(comparison);const sizeStage=()=>{const columns=reference?2:1,size=Math.max(80,Math.min(stage.clientHeight-34,stage.clientWidth/columns-12));stage.style.setProperty('--lab-specimen-size',size+'px')};new ResizeObserver(sizeStage).observe(stage);
const attachSelected=anchor=>{try{commit(attachPart(plan,anchor.parent,anchor.socket,$('attachmentPart').value));message('Mounted '+$('attachmentPart').value.replaceAll('-',' ')+' · Undo is available.')}catch(e){message('Rejected: '+e.message)}};

for(const p of Object.values(PARTS)){const option=document.createElement('option');option.value=p.id;option.textContent=p.id.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());if(p.tags.includes('root'))$('assemblyRoot').append(option);else $('attachmentPart').append(option)}
function drawConnectionGuides(){
 const svg=$('assemblyGuides');svg.replaceChildren();const available=new Set([...$('attachmentSocket').options].map(o=>o.value));
 for(const anchor of anchors){const value=JSON.stringify([anchor.parent,anchor.socket]);if(!available.has(value)||!PARTS[$('attachmentPart').value]?.compatibleSocketTypes.includes(anchor.type))continue;
 const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',view.cx+anchor.x*view.scale);circle.setAttribute('cy',view.cy+anchor.y*view.scale);circle.setAttribute('r',String(22*384/Math.max(1,$('creaturePreview').getBoundingClientRect().width)));circle.setAttribute('fill',SOCKET_COLORS[anchor.type]+'66');circle.setAttribute('stroke',value===$('attachmentSocket').value?'#ffffff':'#17282a');circle.setAttribute('stroke-width',value===$('attachmentSocket').value?'3':'1');circle.setAttribute('tabindex','0');circle.setAttribute('role','button');circle.setAttribute('aria-label','Attach selected part to '+anchor.parent+' '+anchor.socket+' '+anchor.type);circle.dataset.connection=value;
 const select=()=>{$('attachmentSocket').value=value;attachSelected(anchor)};circle.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select()}};const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=anchor.parent+' / '+anchor.socket+' · '+anchor.type;circle.append(title);svg.append(circle)}
 $('connectionLabel').textContent='Selected connection: '+($('attachmentSocket').selectedOptions[0]?.textContent||'none');
}
$('assemblyGuides').onclick=e=>{const rect=$('creaturePreview').getBoundingClientRect(),x=(e.clientX-rect.left)*384/rect.width,y=(e.clientY-rect.top)*384/rect.height,compatible=anchors.filter(a=>PARTS[$('attachmentPart').value]?.compatibleSocketTypes.includes(a.type)),nearest=compatible.map(a=>({a,d:Math.hypot(view.cx+a.x*view.scale-x,view.cy+a.y*view.scale-y)*rect.width/384})).sort((a,b)=>a.d-b.d)[0];if(nearest&&nearest.d<=22){$('attachmentSocket').value=JSON.stringify([nearest.a.parent,nearest.a.socket]);attachSelected(nearest.a)}};
$('attachmentSocket').onchange=drawConnectionGuides;$('attachmentPart').onchange=drawConnectionGuides;
new ResizeObserver(()=>{if(anchors.length)drawConnectionGuides()}).observe($('creaturePreview'));
window.__GENVO_LAB_ASSEMBLY__={get plan(){return plan},get view(){return view},get anchors(){return anchors},get reference(){return reference},get artResolution(){return Number(artSelect.value)}};
$('assemblyRoot').value='small-torso';$('assemblyRoot').onchange=()=>{try{commit(starterPlan($('assemblyRoot').value))}catch(e){message(e.message)}};
$('attach').onclick=()=>{try{const [parent,socket]=JSON.parse($('attachmentSocket').value);commit(attachPart(plan,parent,socket,$('attachmentPart').value))}catch(e){message('Rejected: '+e.message)}};
$('assemblyUndo').onclick=()=>{if(undo.length){redo.push(plan);plan=undo.pop();refresh()}};$('assemblyRedo').onclick=()=>{if(redo.length){undo.push(plan);plan=redo.pop();refresh()}};
$('exportAssembly').onclick=()=>{const url=URL.createObjectURL(new Blob([serializePlan(plan)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='creature-'+plan.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('importAssembly').onchange=async()=>{try{const file=$('importAssembly').files[0];if(file)commit(checked(deserializePlan(await file.text())))}catch(e){message('Rejected: '+e.message)}};
refresh();

$('previewAction').onchange=$('previewDirection').onchange=renderPreview;
$('previewFrame').oninput=()=>{frame=Number($('previewFrame').value);renderPreview()};
function animate(time){if(!playing)return;if(time-lastFrame>=125){frame=(frame+1)%8;lastFrame=time;$('previewFrame').value=frame;renderPreview()}animationHandle=requestAnimationFrame(animate)}
$('previewPlay').onclick=()=>{playing=!playing;$('previewPlay').textContent=playing?'Pause':'Play';$('previewPlay').setAttribute('aria-pressed',String(playing));if(playing){lastFrame=performance.now();animationHandle=requestAnimationFrame(animate)}else cancelAnimationFrame(animationHandle);renderPreview()};
