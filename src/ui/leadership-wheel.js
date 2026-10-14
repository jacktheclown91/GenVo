import {CFG} from '../sim/config.js';

const ACTIONS=['gather','forage','scout','avoid','nest'];

export class LeadershipWheel{
  constructor({canvas,renderer,getSim,canOpen,onFeedback,onModeChange}){
    this.canvas=canvas;this.renderer=renderer;this.getSim=getSim;this.canOpen=canOpen;this.onFeedback=onFeedback;this.onModeChange=onModeChange;
    this.el=document.querySelector('#commandWheel');this.labelEl=this.el?.querySelector('.command-wheel-label')||null;this.scopeButton=this.el?.querySelector('[data-scope="toggle"]')||null;this.quickButton=document.querySelector('#quickMenu [data-command="leadership"]');
    this.target=null;this.touchTimer=null;this.touchStart=null;this.commandMode=false;this.usedLocalGuidance=false;this.lastAvailable=false;
    this.bind();this.sync();
  }
  bind(){
    if(!this.el)return;
    this.canvas.addEventListener('contextmenu',e=>{e.preventDefault();this.setCommandMode(false);this.openAt(e.clientX,e.clientY)});
    this.canvas.addEventListener('click',e=>{if(!this.commandMode||e.button!==0)return;e.preventDefault();e.stopPropagation();this.openAt(e.clientX,e.clientY,{consumeMode:true})});
    this.canvas.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='touch'||this.commandMode)return;this.cancelTouch();this.touchStart={x:e.clientX,y:e.clientY};this.touchTimer=setTimeout(()=>{this.touchTimer=null;this.openAt(e.clientX,e.clientY)},430);
    });
    this.canvas.addEventListener('pointermove',e=>{if(!this.touchStart)return;if(Math.hypot(e.clientX-this.touchStart.x,e.clientY-this.touchStart.y)>12)this.cancelTouch()},{passive:true});
    for(const type of ['pointerup','pointercancel'])this.canvas.addEventListener(type,()=>this.cancelTouch(),{passive:true});
    this.el.addEventListener('pointerdown',e=>e.stopPropagation());
    this.el.addEventListener('click',e=>{const scope=e.target.closest('[data-scope]');if(scope){e.preventDefault();e.stopPropagation();this.toggleScope();return}const button=e.target.closest('[data-action]');if(!button)return;e.preventDefault();e.stopPropagation();this.choose(button.dataset.action)});
    this.el.addEventListener('pointerover',e=>{const button=e.target.closest('[data-action]');if(button&&!button.disabled)this.setLabel(button.getAttribute('aria-label')||'')});
    this.el.addEventListener('pointerout',e=>{if(e.target.closest('[data-action]'))this.setLabel('')});
    this.el.addEventListener('focusin',e=>{const button=e.target.closest('[data-action]');if(button&&!button.disabled)this.setLabel(button.getAttribute('aria-label')||'')});
    this.el.addEventListener('focusout',()=>this.setLabel(''));
    addEventListener('pointerdown',e=>{if(!this.el.hidden&&!this.el.contains(e.target)&&(e.target!==this.canvas||e.button===0))this.close()});
    addEventListener('keydown',e=>{if(e.code!=='Escape')return;if(!this.el.hidden||this.commandMode){this.close();this.setCommandMode(false);e.preventDefault()}});
  }
  cancelTouch(){if(this.touchTimer)clearTimeout(this.touchTimer);this.touchTimer=null;this.touchStart=null}
  setLabel(text){if(this.labelEl)this.labelEl.textContent=text}
  available(){return !!this.getSim()?.familyDirectives?.areaStatus?.().available}
  sync(){
    const available=this.available();
    if(this.quickButton){this.quickButton.classList.toggle('ready',available);this.quickButton.classList.toggle('active',this.commandMode);this.quickButton.setAttribute('aria-pressed',this.commandMode?'true':'false');this.quickButton.title=available?(this.getSim()?.familyDirectives?.scopeMeta?.().multipleTaxa?`Species guidance (R) · ${this.getSim().familyDirectives.scopeMeta().label}`:'Family guidance (R)'):'Family guidance: unlocks with a grown relative'}
    if(available&&!this.lastAvailable&&!this.usedLocalGuidance)this.onFeedback?.({ok:true,quiet:true,message:'Family guidance unlocked · use the target icon or press R.'});
    this.lastAvailable=available;
    if(!available&&this.commandMode)this.setCommandMode(false);
    return available;
  }
  setCommandMode(value){
    const next=!!value;
    if(next){
      if(this.canOpen&&!this.canOpen())return false;
      if(!this.available()){this.onFeedback?.({ok:false,message:'Family guidance unlocks when a grown relative can respond.'});this.sync();return false}
      this.close();
    }
    if(this.commandMode===next){this.sync();return true}
    this.commandMode=next;this.canvas.classList.toggle('command-targeting',next);this.onModeChange?.(next);this.sync();return true;
  }
  toggleCommandMode(){return this.setCommandMode(!this.commandMode)}
  resetDiscovery(){this.usedLocalGuidance=false;this.lastAvailable=false;this.setCommandMode(false);this.sync()}
  openAt(clientX,clientY,{consumeMode=false}={}){
    if(this.canOpen&&!this.canOpen())return false;
    const sim=this.getSim(),status=sim?.familyDirectives?.areaStatus?.();
    if(!sim||!status?.available){this.onFeedback?.({ok:false,message:'Family guidance unlocks when a grown relative can respond.'});return false}
    const target=this.renderer.screenToWorld(clientX,clientY);if(!target)return false;
    const x=Math.max(1,Math.min(CFG.worldSize-2,target.x)),y=Math.max(1,Math.min(CFG.worldSize-2,target.y));
    if(sim.world.water[sim.world.idx(x,y)]){this.onFeedback?.({ok:false,message:'Choose dry ground for family guidance.'});return false}
    this.target={x,y};this.updateButtons(status);
    const margin=96,vw=innerWidth,vh=innerHeight,left=Math.max(margin,Math.min(vw-margin,clientX)),top=Math.max(margin,Math.min(vh-margin,clientY));
    this.el.style.left=`${left}px`;this.el.style.top=`${top}px`;this.el.hidden=false;this.setLabel('');
    if(consumeMode)this.setCommandMode(false);
    return true;
  }
  updateButtons(status){
    for(const action of ACTIONS){const b=this.el.querySelector(`[data-action="${action}"]`);if(!b)continue;const locked=action==='scout'&&!status.scoutUnlocked||action==='nest'&&!status.nestAvailable;b.disabled=locked;b.classList.toggle('locked',locked);const reason=action==='scout'&&!status.scoutUnlocked?'Scout locked':action==='nest'&&!status.nestUnlocked?'Nest locked':action==='nest'&&!status.nestAvailable?'Nest capacity reached':(b.dataset.label||action);b.setAttribute('aria-label',reason)}
    const clear=this.el.querySelector('[data-action="clear"]');if(clear)clear.disabled=!status.order&&!status.avoid?.length;
    if(this.scopeButton){const scope=status.scope||{scope:'lineage',label:'Whole lineage',multipleTaxa:false};this.scopeButton.hidden=!scope.multipleTaxa;this.scopeButton.textContent=scope.scope==='taxon'?scope.label.toUpperCase():'LINEAGE';this.scopeButton.classList.toggle('lineage',scope.scope==='lineage');this.scopeButton.setAttribute('aria-label',`Guidance scope: ${scope.label}. Activate to switch.`);this.scopeButton.title=`Guidance scope: ${scope.label}`;}
  }
  toggleScope(){const sim=this.getSim();if(!sim?.familyDirectives)return false;const meta=sim.familyDirectives.toggleScope();const status=sim.familyDirectives.areaStatus();this.updateButtons(status);this.onFeedback?.({ok:true,type:'guidance',message:meta.scope==='taxon'?`Guidance now targets ${meta.label} only.`:'Guidance now targets the whole lineage.'});return true}
  choose(action){
    const sim=this.getSim();if(!sim)return this.close();
    if(action==='clear'){
      const ok=sim.familyDirectives.clearLocalGuidance();this.onFeedback?.({ok,type:'guidance',message:ok?'Local family guidance cleared.':'No local guidance to clear.'});if(ok)this.usedLocalGuidance=true;this.close();this.sync();return;
    }
    if(!this.target)return this.close();
    const ok=sim.familyDirectives.setAreaOrder(action,this.target,'radial');
    const labels={gather:'Gather here',forage:'Forage here',scout:'Scout here',avoid:'Avoid area',nest:'Nest here'};
    this.onFeedback?.({ok,type:'guidance',message:ok?`${labels[action]} marked.`:(sim.familyDirectives.lastAreaMessage||'That area cannot be marked.')});
    if(ok)this.usedLocalGuidance=true;this.close();this.sync();
  }
  close(){if(!this.el)return;this.el.hidden=true;this.target=null;this.setLabel('')}
}
