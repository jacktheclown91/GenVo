import {VIEW_MODES,viewMode,setViewMode} from '../render/view-modes.js';
import {cameraZoom,setCameraZoom} from '../render/camera-zoom.js';
// GenVo player-facing navigation. Menus never advance the ecosystem; existing renderer owns the world backdrop.
export class FrontEnd{
  constructor({saveManager,audio,onContinue,onCreate,onLoad,onResume,onReturn,onSave,onExportScenario,getWorldInfo}){
    Object.assign(this,{saveManager,audio,onContinue,onCreate,onLoad,onResume,onReturn,onSave,onExportScenario,getWorldInfo});
    this.el=document.querySelector('#frontEnd');this.open=true;this.screen='home';this.previous='home';this.busy=false;
    this.messageEl=document.querySelector('#menuMessage');this.worldsEl=document.querySelector('#worldsList');
    this.el.addEventListener('click',event=>this.click(event));
    this.el.querySelector('#menuVolume')?.addEventListener('input',e=>this.updateVolume(Number(e.target.value)));
    this.el.querySelector('#menuMute')?.addEventListener('change',e=>this.updateMute(e.target.checked));
    this.el.querySelector('#menuReduceMotion')?.addEventListener('change',e=>this.updateMotion(e.target.checked));
    // Viewing mode is a presentation preference kept in this browser, not in saves.
    this.el.querySelector('#menuViewMode')?.addEventListener('change',e=>{setViewMode(e.target.value);this.syncSettings()});
    this.el.querySelector('#menuZoom')?.addEventListener('change',e=>{setCameraZoom(Number(e.target.value));this.onZoom?.(cameraZoom());this.syncSettings()});
    this.el.querySelector('#newWorldStartingPoint')?.addEventListener('change',()=>this.syncStartingPoint());
    this.el.querySelector('#newWorldCreature')?.addEventListener('change',()=>{this.startingPointsReady=this.refreshStartingPoints()});
    // Simple choices (creature and where to begin) drive the same selects as Advanced options.
    const choose=(id,value)=>{const s=this.el.querySelector(id);if(!s||![...s.options].some(o=>o.value===value))return;s.value=value;s.dispatchEvent(new Event('change',{bubbles:true}))};
    this.el.querySelector('#newWorldCreatureCards')?.addEventListener('click',e=>{const b=e.target.closest('[data-creature]');if(b)choose('#newWorldCreature',b.dataset.creature)});
    this.el.querySelector('#newWorldStartCards')?.addEventListener('click',e=>{const b=e.target.closest('[data-start]');if(b)choose('#newWorldStartingPoint',b.dataset.start)});
    // Automated browser checks set the advanced fields directly, so they start expanded there.
    const advanced=this.el.querySelector('#newWorldAdvanced');if(advanced&&globalThis.navigator?.webdriver)advanced.open=true;
    try{document.body.classList.toggle('reduced-menu-motion',localStorage.getItem('genvo-menu-reduced-motion')==='1')}catch{}
    this.syncSettings();this.show('home');
  }
  get isOpen(){return this.open}
  setMessage(text='',error=false){
    this.messageEl.textContent=text;this.messageEl.classList.toggle('error',error);
    // A failed action may add this status below a long, already-scrolled form.
    // Reveal the real error without taking focus away from its recovery controls.
    if(error&&text)this.messageEl.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});
  }
  async show(screen){
    if(!this.el.querySelector(`.menu-view[data-screen="${screen}"]`))return;
    if(screen!==this.screen&&screen!=='home'&&screen!=='pause')this.previous=this.screen;
    this.screen=screen;this.open=true;this.el.hidden=false;this.el.dataset.mode=screen==='pause'||screen==='return'?'pause':'title';
    for(const v of this.el.querySelectorAll('.menu-view'))v.hidden=v.dataset.screen!==screen;
    this.setMessage();
    if(screen==='home')await this.refreshHome();
    if(screen==='worlds')await this.refreshWorlds();
    if(screen==='pause')this.el.querySelector('#pausedWorldInfo').textContent=this.getWorldInfo()||'Living world';
    if(screen==='settings')this.syncSettings();
    if(screen==='new'){this.el.querySelector('#newWorldName').value='Untamed World';await this.refreshStartingPoints();}
    this.el.querySelector('.menu-view:not([hidden]) button:not([disabled]),.menu-view:not([hidden]) input')?.focus({preventScroll:true});
  }
  async refreshStartingPoints(){
    const el=this.el.querySelector('#newWorldStartingPoint');
    const previous=el.value,creature=this.el.querySelector('#newWorldCreature')?.value||'recorded',resident=creature==='resident';
    el.replaceChildren(new Option('New ecology, Day 1','new'),new Option('Import a saved world file...','import'));
    let worlds=[];
    try{worlds=await this.saveManager.listWorlds()}catch{this.setMessage('Saved worlds could not be listed.',true)}
    for(const w of worlds){
      el.add(new Option('Fork saved: '+(w.worldName||'Unnamed World')+
        ' · Day '+(w.day||1)+' · Generation '+(w.generation||1),'fork:'+w.key));
    }
    this.catalog=[];
    try{
      const response=await fetch('./assets/scenarios/catalog.json');
      if(response.ok){
        const {validateScenarioCatalog}=await import('../persistence/scenario-library.js');
        this.catalog=validateScenarioCatalog(await response.json());
        for(const c of this.catalog.filter(c=>c.playable||resident&&c.liveAnimals>0||creature==='guided'||creature==='sandbox'))el.add(new Option('Evolved: '+c.label+' · Day '+c.day,'catalog:'+c.id));
      }
    }catch(error){console.warn('Curated scenarios are unavailable:',error)}
    if(creature.startsWith('starter-')){for(const option of [...el.options])if(option.value!=='new')option.remove();el.value='new';}
    else if(Array.from(el.options).some(option=>option.value===previous))el.value=previous;
    this.syncStartingPoint();
  }
  // Mirror the selects into the simple choice cards.
  syncStartCards(){
    const creature=this.el.querySelector('#newWorldCreature')?.value,start=this.el.querySelector('#newWorldStartingPoint');
    for(const b of this.el.querySelectorAll('#newWorldCreatureCards [data-creature]'))b.setAttribute('aria-checked',String(b.dataset.creature===creature));
    // Presentation labels follow the selected existing world, not a new founder.
    const recorded=this.el.querySelector('#newWorldCreatureCards [data-creature="recorded"]'),fresh=start?.value==='new';
    if(recorded){recorded.querySelector('b').textContent=fresh?'Walker':'Recorded lineage';recorded.querySelector('span').textContent=fresh?'A plain four-legged founder. Learn the land, then evolve it your way.':'Continue the living lineage recorded in this world.';}

    const box=this.el.querySelector('#newWorldStartCards');if(!box||!start)return;
    for(const b of box.querySelectorAll('[data-start]'))b.remove();
    for(const o of start.options){if(o.value!=='new'&&!o.value.startsWith('catalog:'))continue;
     const b=document.createElement('button'),title=document.createElement('b'),line=document.createElement('span');b.type='button';b.setAttribute('role','radio');b.dataset.start=o.value;
     if(o.value==='new'){title.textContent='A new world · Day 1';line.textContent='Watch life spread from the very start.'}else{const entry=this.catalog.find(c=>o.value==='catalog:'+c.id);title.textContent=entry?entry.label.replace(/[,·]\s*Day\s+\d+$/,'')+' · Day '+entry.day:o.textContent.replace(/^Evolved: /,'');line.textContent='Join a world already full of evolved life.'}
     b.append(title,line);b.setAttribute('aria-checked',String(o.value===start.value));box.append(b)}
  }
  syncStartingPoint(){
    const start=this.el.querySelector('#newWorldStartingPoint')?.value||'new',
      file=this.el.querySelector('#newWorldScenarioFileLabel'),
      note=this.el.querySelector('#newWorldScenarioDetail');
    if(file)file.hidden=start!=='import';
    const movement=this.el.querySelector('#newWorldMovementRules'),movementLabel=this.el.querySelector('#newWorldMovementRulesLabel');
    if(movementLabel)movementLabel.hidden=start==='new';if(movement){movement.disabled=start==='new';if(start==='new')movement.value='recorded'}
    // A real checkpoint already has its own seed and immutable geography.
    // Never imply changing the form's seed could rewrite evolved history.
    for(const id of ['newWorldSeed','newWorldGeography']){
      const control=this.el.querySelector('#'+id);if(control){control.disabled=start!=='new';control.closest('label').hidden=start!=='new'}
    }
    if(note)note.textContent=start==='new'
      ?'Begin the complete evolutionary journey from the initial ecology.'
      :start==='import'
        ?'Choose a world file exported from GenVo.'
        :start.startsWith('fork:')
          ?'Fork a real saved world at its recorded day. Your original save will not change.'
          :'Start from this evolved world as a new, separate game.';
    this.syncStartCards();
  }
  close(){this.open=false;this.el.hidden=true;this.setMessage()}
  async refreshHome(){
    try{
      const worlds=await this.saveManager.listWorlds();const active=worlds.find(w=>w.key===this.saveManager.activeSlotId&&w.role!=='movement-backup')||worlds.find(w=>w.role!=='movement-backup');
      const btn=this.el.querySelector('[data-action="continue"]'),msg=this.el.querySelector('#menuResumeMeta');
      btn.disabled=!active;
      btn.dataset.slot=active?.key||'';
      msg.textContent=active?`${active.worldName||'First Lineage'} · Generation ${active.generation||1} · Year ${active.year||1}, Day ${active.day||1}${active.startKind==='authored-founder'?' · Authored '+active.startMode+' start':''}`:'A new world awaits.';
    }catch(err){this.setMessage('Saved worlds unavailable on this browser.',true);this.el.querySelector('[data-action="continue"]').disabled=true}
  }
  async refreshWorlds(){
    this.worldsEl.replaceChildren();
    let worlds=[];
    try{worlds=await this.saveManager.listWorlds()}catch(err){this.setMessage('Unable to read saved worlds.',true)}
    if(!worlds.length){const p=document.createElement('p');p.className='worlds-empty';p.textContent='No saved worlds yet.';this.worldsEl.append(p);return}
    for(const w of worlds){
      const article=document.createElement('article');article.className='world-entry';
      const heading=document.createElement('strong');heading.textContent=w.worldName||(w.key==='autosave'?'First Lineage':'Unnamed World');
      const data=document.createElement('small');data.textContent=`Generation ${w.generation||1} · Year ${w.year||1}, Day ${w.day||1}${w.startKind==='authored-founder'?' · Authored '+w.startMode+' start':''}`;
      const actions=document.createElement('div');actions.className='world-actions';
      for(const [action,label] of [[w.role==='movement-backup'?'fork-backup':'load-world',w.role==='movement-backup'?'New World from backup':'Play'],['export-scenario','Export Scenario'],['rename-world','Rename'],['delete-world','Delete']]){
        const b=document.createElement('button');b.type='button';b.dataset.action=action;b.dataset.slot=w.key;b.textContent=label;
        if(action!=='load-world')b.className='menu-secondary';actions.append(b);
      }
      if(w.role==='movement-backup')data.textContent+=' · Read-only original checkpoint';else if(w.movementAdopted)data.textContent+=' · Movement continuation';
      article.append(heading,data,actions);this.worldsEl.append(article);
    }
  }
  syncSettings(){
    const vol=this.el.querySelector('#menuVolume'),label=this.el.querySelector('#menuVolumeValue'),mute=this.el.querySelector('#menuMute'),motion=this.el.querySelector('#menuReduceMotion');
    vol.value=Math.round(this.audio.masterLevel*100);label.value=`${vol.value}%`;label.textContent=`${vol.value}%`;
    mute.checked=!this.audio.enabled;motion.checked=document.body.classList.contains('reduced-menu-motion');
    const zoom=this.el.querySelector('#menuZoom');if(zoom)zoom.value=String(cameraZoom());
    const view=this.el.querySelector('#menuViewMode'),note=this.el.querySelector('#menuViewNote');if(view){view.value=viewMode();if(note)note.textContent=VIEW_MODES[viewMode()].note}
  }
  updateVolume(n){
    this.audio.masterLevel=Math.max(0,Math.min(1,n/100));this.audio.savePrefs();
    if(this.audio.ctx&&this.audio.master){const t=this.audio.ctx.currentTime;this.audio.master.gain.setTargetAtTime(this.audio.enabled?this.audio.masterLevel:0,t,.03)}
    this.el.querySelector('#menuVolumeValue').textContent=`${n}%`;
  }
  updateMute(muted){if(this.audio.enabled===!muted)return;this.audio.toggleMute()}
  updateMotion(reduce){document.body.classList.toggle('reduced-menu-motion',reduce);try{localStorage.setItem('genvo-menu-reduced-motion',reduce?'1':'0')}catch{}}
  handleKey(event){
    if(!this.open)return false;
    if(document.querySelector('#residentStart[open],#founderEditor:not([hidden])'))return true;
    if(event.code==='Escape'||event.code==='KeyP'&&this.screen==='pause'){
      event.preventDefault();
      if(this.screen==='pause')this.onResume();
      else if(this.screen!=='home')this.show(this.screen==='return'?'pause':this.previous==='pause'?'pause':'home');
      return true;
    }
    if(event.code==='Space'&&!['INPUT','SELECT','BUTTON','TEXTAREA'].includes(event.target?.tagName)){event.preventDefault();return true}
    return true;
  }
  async click(event){
    const button=event.target.closest('button');if(!button||!this.el.contains(button)||this.busy)return;
    event.preventDefault();this.audio.unlock();
    if(button.dataset.screenTarget){this.show(button.dataset.screenTarget);return}
    const a=button.dataset.action;
    if(a==='back'){this.show(this.previous==='pause'?'pause':'home');return}
    if(a==='fullscreen'){
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();this.setMessage(document.fullscreenElement?'Fullscreen enabled.':'Windowed mode.')}catch{this.setMessage('Fullscreen unavailable here. Try the browser or itch expand control.',true)}return;
    }
    const actionScreen=this.screen;
    this.busy=true;
    try{
      if(a==='continue'){if(await this.onContinue(button.dataset.slot)&&this.screen===actionScreen)this.close()}
      else if(a==='create'){
        await this.startingPointsReady;
        const name=this.el.querySelector('#newWorldName').value.trim(),seed=this.el.querySelector('#newWorldSeed').value.trim();
        if(!name){this.setMessage('Give your world a name.',true);return}
        const start=this.el.querySelector('#newWorldStartingPoint')?.value||'new';
        const scenarioFile=this.el.querySelector('#newWorldScenarioFile')?.files?.[0]||null;
        const catalogEntry=start.startsWith('catalog:')?this.catalog.find(c=>c.id===start.slice(8)):null;
        if(await this.onCreate({name,seed,geography:this.el.querySelector('#newWorldGeography')?.value||'freshwater/1',
          start,scenarioFile,catalogEntry,movementRules:this.el.querySelector('#newWorldMovementRules')?.value||'recorded',creature:this.el.querySelector('#newWorldCreature')?.value||'recorded'})&&this.screen===actionScreen)this.close();
      }
      else if(a==='fork-backup'){const slot=button.dataset.slot;await this.show('new');this.el.querySelector('#newWorldStartingPoint').value='fork:'+slot;this.el.querySelector('#newWorldMovementRules').value='recorded';this.el.querySelector('#newWorldCreature').value='recorded';this.syncStartingPoint();}
      else if(a==='load-world'){if(await this.onLoad(button.dataset.slot)&&this.screen===actionScreen)this.close()}
      else if(a==='export-scenario'){await this.onExportScenario(button.dataset.slot);this.setMessage('Scenario package exported.');}
      else if(a==='rename-world'){
        const current=button.closest('.world-entry')?.querySelector('strong')?.textContent||'';
        const name=window.prompt('World name:',current);
        if(name!==null){await this.saveManager.renameWorld(button.dataset.slot,name);await this.refreshWorlds()}
      }
      else if(a==='delete-world'){
        if(window.confirm('Delete this world and its saved lineage permanently?')){await this.saveManager.deleteWorld(button.dataset.slot);await this.refreshWorlds()}
      }
      else if(a==='resume'){this.onResume();this.close()}
      else if(a==='save'){await this.onSave();this.setMessage('World saved.')}
      else if(a==='return'){this.show('return')}
      else if(a==='save-return'||a==='discard-return'){
        if(await this.onReturn(a==='save-return'))this.show('home');
      }
    }catch(error){console.error(error);this.setMessage(error?.message||'This action could not be completed.',true)}
    finally{this.busy=false}
  }
}
