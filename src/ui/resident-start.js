import {residentStartCandidates} from '../persistence/resident-start.js';
import {creatureIdentity} from './creature-identity.js';
import {drawLineagePortrait} from '../render/lineage-portrait.js';
import {SPECIES} from '../organisms/species.js';

export function chooseResidentStart(sim){
 const candidates=residentStartCandidates(sim);
 if(!candidates.length)throw Error('This world has no living creature with a supported body.');
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='resident-start';dialog.id='residentStart';
  const heading=document.createElement('h2');heading.textContent='Choose your creature';
  const explanation=document.createElement('p');explanation.textContent='These creatures already live here. Keep their real body, age, condition and ancestry. Your original world stays unchanged.';
  const select=document.createElement('select');select.setAttribute('aria-label','Living resident');
  for(const a of candidates)select.add(new Option(`${creatureIdentity(sim,a).name} #${a.id} · G${a.generation} · ${Math.floor(a.age)} days`,String(a.id)));
  const canvas=document.createElement('canvas');canvas.width=224;canvas.height=140;canvas.setAttribute('aria-label','Selected creature appearance');
  const detail=document.createElement('p');detail.setAttribute('aria-live','polite');
  const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Begin as this creature';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';
  const finish=id=>{dialog.close();dialog.remove();resolve(id)};
  const update=()=>{const a=candidates.find(a=>a.id===Number(select.value)),s=SPECIES[a.species],identity=creatureIdentity(sim,a);
   detail.textContent=`${identity.stage} · health ${Math.round(a.health)}% · food ${Math.round(a.energy/s.maxEnergy*100)}% · water ${Math.round(a.hydration/s.maxHydration*100)}%. ${identity.description}.`;
   drawLineagePortrait(canvas,a.genes,{pigmentGenome:a.pigmentGenome||null,lifestyle:a.ecoLifestyle||null,bodyPlan:a.bodyPlan,anatomy:a.anatomy,adaptations:a.adaptations});
  };
  select.addEventListener('change',update);confirm.onclick=()=>finish(Number(select.value));cancel.onclick=()=>finish(null);
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null)});
  dialog.append(heading,explanation,select,canvas,detail,confirm,cancel);document.body.append(dialog);update();dialog.showModal();select.focus();
 });
}
