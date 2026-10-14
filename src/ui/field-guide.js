import {PARTS} from '../lineage/part-registry.js';
import {SITE_KINDS,TRIALS} from '../gameplay/discovery.js';
import {phenotypeFor} from '../organisms/species.js';
import {drawGenvoSprite} from '../render/genvo-draw.js';
import {creaturePalette} from '../render/creature-palette.js';
import {drawSite} from '../render/sites.js';

// Phase G field guide (GDD v1 Phase G: journal, anatomy and species discovery). Y opens it.
// v1.53.0 (creator direction 2026-10-09: menus should not look system-like and must show all
// their text): a field-journal page with drawn creatures and places. Things not yet found are
// shown as dark silhouettes, so the player sees what is still out there without a list of
// "unknown" rows. Read-only: it never changes the world.
const esc=v=>String(v??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const nice=id=>id.split('-').map((w,i)=>i?w:w[0].toUpperCase()+w.slice(1)).join(' ');

export class FieldGuide{
  constructor({getSim,root=document.querySelector('#app')}={}){
    this.getSim=getSim;this.open=false;this.el=document.createElement('section');this.el.id='fieldGuide';this.el.className='field-guide';this.el.hidden=true;this.el.setAttribute('aria-label','Field guide');root?.appendChild(this.el);
    this.page='creatures';this.el.addEventListener('click',e=>{if(e.target.closest('[data-act="close"]'))this.setOpen(false);const t=e.target.closest('[data-page]');if(t){this.page=t.dataset.page;this.key=null;this.render()}});
  }
  toggle(){this.setOpen(!this.open)}
  // Refreshed every two seconds while open (drawings are redrawn only when what is known changes).
  refresh(dt){if(!this.open)return;this.wait=(this.wait||0)+dt;if(this.wait>=2){this.wait=0;this.render()}}
  setOpen(v){this.open=!!v;this.el.hidden=!this.open;if(this.open){this.key=null;this.render()}}
  creatures(D){
    const list=[],seen=new Set(),player=this.getSim()?.player?.();
    if(player?.bodyPlan){list.push({id:player.bodyPlan.id,name:'Your current creature',animal:player,known:true});seen.add(player.bodyPlan.id)}
    for(const animal of D.observedBodies||[]){if(seen.has(animal.bodyPlan.id))continue;seen.add(animal.bodyPlan.id);list.push({id:animal.bodyPlan.id,name:animal.name,animal,known:true})}
    return list;
  }
  render(){
    const D=this.getSim()?.discovery;if(!D||!this.open)return;
    const creatures=this.creatures(D),found=new Set(D.sites.filter(s=>D.isFound(s)).map(s=>s.kind)),placeKinds=Object.keys(SITE_KINDS).filter(k=>k!=='relic'&&k!=='carcass');
    const key=JSON.stringify([this.page,creatures.map(c=>[c.id,c.name,c.animal?.genes]),[...found],D.trials,D.unlockedParts,D.seenParts.length]);if(key===this.key)return;this.key=key;
    const missingPlaces=placeKinds.filter(k=>!found.has(k)).length,doneTrials=Object.keys(D.trials).length;
    const trials=Object.entries(TRIALS).map(([id,t])=>`<li class="${D.trials[id]?'done':''}"><i></i><div><b>${esc(t.label)}</b><small>${esc(t.text)}</small></div></li>`).join('');
    const seen=Object.keys(PARTS).filter(id=>D.seenParts.includes(id)&&!PARTS[id].tags.includes('starter'));
    this.el.innerHTML=`<header class="fg-head"><div><h2>Field guide</h2><p>What your family has seen and learned. Press Y to close.</p></div><button type="button" data-act="close">Close</button></header>
      <nav class="fg-tabs">${[['creatures','Creatures'],['places','Places'],['trials','Trials'],['parts','Parts']].map(([id,l])=>`<button type="button" data-page="${id}" class="${this.page===id?'active':''}">${l}</button>`).join('')}</nav>
      <div class="fg-body" data-show="${this.page}">
        <section class="fg-creatures"><h3>Creatures</h3><div class="fg-cards">${creatures.map((c,i)=>`<figure class="${c.known?'':'unknown'} ${c.special?'special':''}"><canvas data-c="${i}" width="96" height="76"></canvas><figcaption>${c.known?esc(c.name):c.special?'Rare creature':'Not seen yet'}</figcaption></figure>`).join('')}</div></section>
        <section class="fg-places"><h3>Places</h3><div class="fg-cards">${placeKinds.map(k=>`<figure class="${found.has(k)?'':'unknown'}" title="${found.has(k)?esc(SITE_KINDS[k].blurb):''}"><canvas data-p="${k}" width="96" height="64"></canvas><figcaption>${found.has(k)?esc(SITE_KINDS[k].label):'Not found yet'}</figcaption>${found.has(k)?`<small>${esc(SITE_KINDS[k].blurb)}</small>`:''}</figure>`).join('')}</div><p class="fg-note">${missingPlaces?`${missingPlaces} kind${missingPlaces===1?'':'s'} of place still to find. Lookout rocks reveal places nearby.`:'You have found every kind of place.'}</p></section>
        <section class="fg-trials"><h3>Trials <span>${doneTrials} of ${Object.keys(TRIALS).length}</span></h3><ul>${trials}</ul><p class="fg-note">Each trial adds to the bonus points for your next evolution (up to 4 more).</p></section>
        <section class="fg-parts"><h3>Relic parts</h3><p>${(D.unlockedParts||[]).length?(D.unlockedParts||[]).map(id=>`<span class="tag relic">${esc(nice(id))}</span>`).join(' '):'None yet. Rare creatures leave a relic where they die; pick it up with E.'}</p>
          <h3>Parts seen in the wild <span>${seen.length}</span></h3><p>${seen.length?seen.map(id=>`<span class="tag">${esc(nice(id))}</span>`).join(' '):'None yet. Get close to wild creatures to study their bodies.'}</p><p class="fg-note">Parts you have seen cost 1 point less in the editor.</p></section>
      </div>`;
    this.el.querySelectorAll('canvas[data-c]').forEach(cv=>{const c=creatures[Number(cv.dataset.c)];this.drawCreature(cv,c)});
    this.el.querySelectorAll('canvas[data-p]').forEach(cv=>this.drawPlace(cv,cv.dataset.p,found.has(cv.dataset.p)));
  }
  silhouette(cv){const c=cv.getContext('2d');c.globalCompositeOperation='source-in';c.fillStyle='#120c07';c.fillRect(0,0,cv.width,cv.height);c.globalCompositeOperation='source-over'}
  drawCreature(cv,cr){
    const c=cv.getContext?.('2d');if(!c)return;c.imageSmoothingEnabled=false;c.clearRect(0,0,cv.width,cv.height);
    const a=cr.animal,ph=a.phenotype||phenotypeFor(a);
    c.save();c.translate(cv.width/2,cv.height/2+4);drawGenvoSprite(c,{animal:a,phenotype:ph,scale:3,frame:2,palette:creaturePalette(ph),pose:{dir:3,life:{blink:false}}});c.restore();
    if(!cr.known)this.silhouette(cv);
  }
  drawPlace(cv,kind,known){const c=cv.getContext?.('2d');if(!c)return;c.imageSmoothingEnabled=false;c.clearRect(0,0,cv.width,cv.height);drawSite(c,{kind},{px:cv.width/2,py:cv.height/2+8,u:3,found:false});if(!known)this.silhouette(cv)}
}
