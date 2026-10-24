import {SPECIES} from '../organisms/species.js';
import {ADAPTATIONS,nearThreshold} from '../lineage/evolution.js';
import {compareGenes,traitListText} from '../lineage/adaptation.js';
import {developmentFor} from '../family/family.js';
import {drawLineagePortrait} from '../render/lineage-portrait.js';
import {formReading,protoReading} from '../lineage/readings.js';

// v1.31 Succession as Selection: choosing who continues the line is a comparison of living
// descendants, not a menu of upgrades. Each card shows how the descendant's body differs
// from you, which adaptations it was born with, its habits, and how ready it is.
export function buildSuccessorChoices(sim,limit=4){
  const current=sim.player(),heirs=sim.lineage?.eligibleHeirs?.()||[];if(!current)return[];
  return heirs.slice(0,limit).map(h=>{
    const born=new Set(h.bornWith||[]),adaptations=(h.adaptations||[]).map(id=>({id,name:ADAPTATIONS[id]?.name||id,born:born.has(id),fromParent:(current.adaptations||[]).includes(id)}));
    const lost=(current.adaptations||[]).filter(id=>!(h.adaptations||[]).includes(id)).map(id=>ADAPTATIONS[id]?.name||id);
    const readiness=sim.lineage.readinessFor?.(h)||{label:''};
    return{id:h.id,generation:h.generation,sex:h.sex,stage:developmentFor(h).stage,age:Math.round(h.age),health:Math.round(h.health),
      body:(()=>{const base=traitListText(compareGenes(h.genes,current.genes,{limit:3,threshold:.02}),{empty:'built much like you'}),parentParts=new Set((current.bodyPlan?.nodes||[]).map(n=>n.partId)),newParts=[...new Set((h.bodyPlan?.nodes||[]).map(n=>n.partId))].filter(p=>!parentParts.has(p)).map(p=>p.replace(/-/g,' '));return newParts.length?`${base} · new: ${newParts.slice(0,2).join(', ')}`:base})(),
      adaptations,lost,developing:nearThreshold(h).slice(0,2).map(n=>n.name),habits:sim.habits?.summary?.(h)||'no settled habits yet',readiness:readiness.label,selected:sim.lineage.selectedHeirId===h.id,
      // v1.33.4: each card shows the body itself, so body variation reads at a glance.
      portrait:{genes:{...h.genes},pigmentGenome:h.pigmentGenome?structuredClone(h.pigmentGenome):null,bodyPlan:h.bodyPlan||null,adaptations:[...(h.adaptations||[])],divergence:formReading(h),protoTrait:protoReading(h),lifestyle:h.ecoLifestyle||null}};
  });
}

export class SuccessionChooser{
  constructor({getSim,root=document.querySelector('#app'),onDone=()=>{}}={}){
    this.getSim=getSim;this.onDone=onDone;this.open=false;this.index=0;this.choices=[];
    this.el=document.createElement('section');this.el.id='successionChooser';this.el.className='succession-chooser';this.el.hidden=true;this.el.setAttribute('aria-live','polite');
    root?.appendChild(this.el);
    this.el.addEventListener('click',e=>{const card=e.target.closest('[data-heir]');if(card){const i=Number(card.dataset.index);if(i===this.index)this.confirm();else{this.index=i;this.render()}}const close=e.target.closest('[data-close]');if(close)this.close()});
  }
  get sim(){return this.getSim()}
  // H with one heir hands off directly. With several, it opens the comparison first.
  request(){
    const sim=this.sim,heirs=sim.lineage.eligibleHeirs();if(!heirs.length)return{ok:false,message:'No grown descendant can take over yet.'};
    if(heirs.length===1){const ok=sim.lineage.handoffTo(heirs[0].id,{manual:true});return{ok,message:ok?'':'That descendant cannot take over yet.'}}
    this.choices=buildSuccessorChoices(sim);this.index=Math.max(0,this.choices.findIndex(c=>c.selected));this.wasPaused=!!sim.paused;sim.paused=true;this.open=true;this.el.hidden=false;this.render();return{ok:true,opened:true};
  }
  close(){if(this.open&&this.sim)this.sim.paused=!!this.wasPaused;this.open=false;this.el.hidden=true}
  confirm(){
    const c=this.choices[this.index];if(!c)return this.close();const sim=this.sim;this.close();
    sim.lineage.selectedHeirId=c.id;const ok=sim.lineage.handoffSelected();this.onDone({ok,choice:c});return ok;
  }
  handleKey(e){
    if(!this.open)return false;const code=e.code;
    if(code==='Escape'){this.close();return true}
    if(code==='KeyH'||code==='Enter'||code==='Space'){if(!e.repeat)this.confirm();return true}
    if(/^Digit[1-4]$/.test(code)){const i=Number(code.at(-1))-1;if(i<this.choices.length){this.index=i;this.render()}return true}
    if(code==='ArrowLeft'||code==='ArrowUp'||code==='KeyQ'||code==='KeyA'||code==='KeyW'){this.index=(this.index-1+this.choices.length)%this.choices.length;this.render();return true}
    if(code==='ArrowRight'||code==='ArrowDown'||code==='KeyE'||code==='KeyD'||code==='KeyS'){this.index=(this.index+1)%this.choices.length;this.render();return true}
    return true; // block world input while choosing
  }
  render(){
    const esc=v=>String(v??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    const cards=this.choices.map((c,i)=>{
      const adapt=c.adaptations.length?c.adaptations.map(a=>`<li class="${a.born?'born':''}">${esc(a.name)}${a.born?' <em>new at birth</em>':''}</li>`).join(''):'<li class="none">no major adaptations</li>';
      const lost=c.lost.length?`<p class="lost">Did not inherit: ${esc(c.lost.join(', '))}</p>`:'';const dev=c.developing?.length?`<p class="developing">Close to: ${esc(c.developing.join(', '))}</p>`:'';
      return`<button type="button" class="heir-card ${i===this.index?'active':''}" data-heir="${c.id}" data-index="${i}">
        <header><b>${i+1}</b><strong>G${c.generation} #${c.id}</strong><span>${esc(c.stage)} · ${c.sex} · ${c.age}d · health ${c.health}</span></header>
        <canvas class="heir-portrait" width="112" height="72" data-portrait="${i}" aria-hidden="true"></canvas>
        <p><b>Body</b> ${esc(c.body)}</p><ul>${adapt}</ul>${lost}${dev}
        <p><b>Habits</b> ${esc(c.habits)}</p><p class="ready">${esc(c.readiness)}</p></button>`;
    }).join('');
    this.el.innerHTML=`<header class="panel-head"><div><span>SUCCESSION</span><strong>Who continues the line?</strong></div><small data-close>Esc · cancel</small></header>
      <p class="succession-lead">Each descendant carries a different body, different inherited adaptations and the habits it picked up. The one you choose is the lineage from here.</p>
      <div class="heir-grid">${cards}</div>
      <footer class="panel-foot">1-${this.choices.length} or arrows · pick · H or Enter · continue as this one</footer>`;
    for(const canvas of this.el.querySelectorAll('canvas[data-portrait]')){const c=this.choices[Number(canvas.dataset.portrait)];if(c?.portrait)drawLineagePortrait(canvas,c.portrait.genes,{pigmentGenome:c.portrait.pigmentGenome||null,bodyPlan:c.portrait.bodyPlan,frame:2,dir:2,emphasis:Number(canvas.dataset.portrait)===this.index,adaptations:c.portrait.adaptations,divergence:c.portrait.divergence,protoTrait:c.portrait.protoTrait,lifestyle:c.portrait.lifestyle})}
  }
}
