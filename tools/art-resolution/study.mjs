import {drawGenvoSprite} from '../../src/render/genvo-draw.js';
import {phenotypeFor} from '../../src/organisms/species.js';
import {creaturePalette} from '../../src/render/creature-palette.js';
import {loadNativePartCatalog} from '../../src/render/runtime-part-art.js';
import {validatePlan} from '../../src/lineage/body-plan.js';
import {loadStudy} from './load-study.mjs';
import {studyCreatures} from './specimens.mjs';
const $=id=>document.getElementById(id),resolutions=[32,64,128],specimens=studyCreatures();
if(matchMedia('(prefers-reduced-motion: reduce)').matches)$('walk').checked=false;
let ready=false,study,phase=0,freeze=false,last=0,lastSheet=0;
const partSets=new Map();
for(const animal of specimens){const valid=validatePlan(animal.bodyPlan);if(!valid.ok)throw Error(valid.errors.join('; '));const o=document.createElement('option');o.textContent=animal.name;o.value=specimens.indexOf(animal);$('specimen').append(o);}
const cards=resolutions.map(resolution=>{
  const card=document.createElement('article');card.className='card';card.innerHTML='<div class="card-head"><h3>'+resolution+'px</h3><span class="tag">'+(resolution===32?'Current artwork':'Native study')+'</span></div><canvas class="portrait" width="440" height="440" aria-label="'+resolution+' pixel assembled creature"></canvas><canvas class="facings" width="440" height="220" aria-label="All eight creature facings"></canvas><p>Same body plan · same camera scale · same gait phase</p>';
  $('cards').append(card);return{resolution,portrait:card.querySelector('.portrait'),facings:card.querySelector('.facings')};
});
function settings(){return{animal:specimens[Number($('specimen').value)],scale:Number($('scale').value),dir:Number($('facing').value),growth:Number($('growth').value),pigment:Number($('pigment').value),moving:$('walk').checked};}
function draw(canvas,resolution,{allFacings=false,frame=phase}={}){
  const o=settings(),animal=o.animal,ph=phenotypeFor(animal);
  ph.bodyScale*=o.growth;ph.limbScale*=.72+.28*o.growth;ph.hueShift=(ph.hueShift||0)+o.pigment;
  const palette=creaturePalette(ph),c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
  const authoredParts=resolution===32?undefined:partSets.get(resolution);
  const paint=(x,y,dir,scale)=>{c.save();c.translate(x,y);drawGenvoSprite(c,{animal,phenotype:ph,palette,scale,frame,moving:o.moving,pose:{dir,action:o.moving?'move':'idle'},authoredParts});c.restore();};
  if(allFacings){for(let dir=0;dir<8;dir++){paint(55+(dir%4)*110,53+Math.floor(dir/4)*110,dir,2);c.font='11px system-ui';c.fillStyle='#abbca9';c.textAlign='center';c.fillText(['N','NE','E','SE','S','SW','W','NW'][dir],55+(dir%4)*110,103+Math.floor(dir/4)*110);}}
  else{paint(220,220,o.dir,o.scale);c.strokeStyle='#67816466';c.beginPath();c.moveTo(220-4*o.scale,340);c.lineTo(220+4*o.scale,340);c.stroke();c.font='11px system-ui';c.fillStyle='#abbca9';c.textAlign='center';c.fillText('8 artwork units · '+o.scale+'× camera',220,362);}
}
function render(sheets=true){if(!ready)return;for(const card of cards){draw(card.portrait,card.resolution);if(sheets)draw(card.facings,card.resolution,{allFacings:true});}}
$('freeze').onclick=()=>{freeze=!freeze;$('freeze').textContent=freeze?'Play animation':'Freeze frame';};
for(const id of ['specimen','scale','facing','growth','pigment','walk'])$(id).onchange=render;
$('measure').onclick=()=>{
  const measured=[];for(const card of cards){const samples=[];
    for(let i=0;i<4;i++)draw(card.portrait,card.resolution,{frame:i});
    for(let i=0;i<48;i++){const t=performance.now();draw(card.portrait,card.resolution,{frame:(i%32)/4});samples.push(performance.now()-t);}
    samples.sort((a,b)=>a-b);const assets=study.catalog.parts.filter(p=>p.resolution===card.resolution);
    measured.push({resolution:card.resolution,medianMs:+samples[24].toFixed(3),p95Ms:+samples[45].toFixed(3),compressedStudyBytes:assets.reduce((n,p)=>n+p.bytes,0),decodedStudyFrameRgbaBytes:assets.reduce((n,p)=>n+p.decodedRgbaBytes,0)});
  }
  window.__artStudy.measurements={specimen:settings().animal.name,scale:settings().scale,samples:48,results:measured};
  $('metrics').textContent=JSON.stringify(window.__artStudy.measurements,null,2);
};
async function worldModule(){return $('game').contentWindow.Function('return import("/src/render/runtime-part-art.js")')();}
for(const button of document.querySelectorAll('[data-world]'))button.onclick=async()=>{
  try{const resolution=Number(button.dataset.world),module=await worldModule();
    // Build the Map in the game's realm; the preview is explicit and reversible.
    const GameMap=$('game').contentWindow.Map;
    const parts=resolution===32?null:new GameMap(study.variants.get(resolution));
    module.setPartArtPreview(parts);$('world-status').textContent=resolution===32?'Native 32px gameplay restored.':'Experimental '+resolution+'px artwork on the actual world. Physical size and biology are unchanged.';
    window.__artStudy.worldResolution=resolution;
  }catch(error){$('world-status').textContent=error.message;}
};
$('observe').onclick=()=>{
  const animal=$('game').contentWindow.__GENVO8__?.sim?.player?.();
  if(!animal){$('world-status').textContent='Begin or continue a world first.';return;}
  const copy=structuredClone(animal);copy.name='Observed player · '+animal.id;
  specimens.push(copy);const option=document.createElement('option');option.value=specimens.length-1;option.textContent=copy.name;$('specimen').append(option);$('specimen').value=option.value;render();
};
window.__artStudy={specimens,measurements:null,worldResolution:32,render,freeze:()=>{freeze=true;phase=2;render();}};
try{
  await loadNativePartCatalog();study=await loadStudy();for(const resolution of [64,128])partSets.set(resolution,Object.fromEntries(study.variants.get(resolution)));ready=true;
  $('status').textContent='Ready · 15 optional high-detail parts at each resolution · 32px fallback for the rest · original sources preserved';
  window.__artStudy.exportAtlases=study.exportAtlases;window.__artStudy.ready=true;window.__artStudy.catalog=study.catalog;render();
  requestAnimationFrame(function tick(now){if(last&&!freeze&&$('walk').checked)phase=(phase+Math.min(.05,(now-last)/1000)*5)%8;last=now;if(!freeze){const sheets=now-lastSheet>125;render(sheets);if(sheets)lastSheet=now;}requestAnimationFrame(tick);});
}catch(error){$('status').textContent='Study unavailable: '+error.message;throw error;}
