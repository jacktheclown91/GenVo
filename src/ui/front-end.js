// GenVo player-facing navigation. Menus never advance the ecosystem; existing renderer owns the world backdrop.
export class FrontEnd{
  constructor({saveManager,audio,onContinue,onCreate,onLoad,onResume,onReturn,onSave,getWorldInfo}){
    Object.assign(this,{saveManager,audio,onContinue,onCreate,onLoad,onResume,onReturn,onSave,getWorldInfo});
    this.el=document.querySelector('#frontEnd');this.open=true;this.screen='home';this.previous='home';this.busy=false;
    this.messageEl=document.querySelector('#menuMessage');this.worldsEl=document.querySelector('#worldsList');
    this.el.addEventListener('click',event=>this.click(event));
    this.el.querySelector('#menuVolume')?.addEventListener('input',e=>this.updateVolume(Number(e.target.value)));
    this.el.querySelector('#menuMute')?.addEventListener('change',e=>this.updateMute(e.target.checked));
    this.el.querySelector('#menuReduceMotion')?.addEventListener('change',e=>this.updateMotion(e.target.checked));
    try{document.body.classList.toggle('reduced-menu-motion',localStorage.getItem('genvo-menu-reduced-motion')==='1')}catch{}
    this.syncSettings();this.show('home');
  }
  get isOpen(){return this.open}
  setMessage(text='',error=false){this.messageEl.textContent=text;this.messageEl.classList.toggle('error',error)}
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
    if(screen==='new')this.el.querySelector('#newWorldName').value='Untamed World';
    this.el.querySelector('.menu-view:not([hidden]) button:not([disabled]),.menu-view:not([hidden]) input')?.focus({preventScroll:true});
  }
  close(){this.open=false;this.el.hidden=true;this.setMessage()}
  async refreshHome(){
    try{
      const worlds=await this.saveManager.listWorlds();const active=worlds.find(w=>w.key===this.saveManager.activeSlotId)||worlds[0];
      const btn=this.el.querySelector('[data-action="continue"]'),msg=this.el.querySelector('#menuResumeMeta');
      btn.disabled=!active;
      btn.dataset.slot=active?.key||'';
      msg.textContent=active?`${active.worldName||'First Lineage'} · Generation ${active.generation||1} · Year ${active.year||1}, Day ${active.day||1}`:'A new world awaits.';
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
      const data=document.createElement('small');data.textContent=`Generation ${w.generation||1} · Year ${w.year||1}, Day ${w.day||1}`;
      const actions=document.createElement('div');actions.className='world-actions';
      for(const [action,label] of [['load-world','Play'],['rename-world','Rename'],['delete-world','Delete']]){
        const b=document.createElement('button');b.type='button';b.dataset.action=action;b.dataset.slot=w.key;b.textContent=label;
        if(action!=='load-world')b.className='menu-secondary';actions.append(b);
      }
      article.append(heading,data,actions);this.worldsEl.append(article);
    }
  }
  syncSettings(){
    const vol=this.el.querySelector('#menuVolume'),label=this.el.querySelector('#menuVolumeValue'),mute=this.el.querySelector('#menuMute'),motion=this.el.querySelector('#menuReduceMotion');
    vol.value=Math.round(this.audio.masterLevel*100);label.value=`${vol.value}%`;label.textContent=`${vol.value}%`;
    mute.checked=!this.audio.enabled;motion.checked=document.body.classList.contains('reduced-menu-motion');
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
    this.busy=true;
    try{
      if(a==='continue'){if(await this.onContinue(button.dataset.slot))this.close()}
      else if(a==='create'){
        const name=this.el.querySelector('#newWorldName').value.trim(),seed=this.el.querySelector('#newWorldSeed').value.trim();
        if(!name){this.setMessage('Give your world a name.',true);return}
        if(await this.onCreate({name,seed,geography:this.el.querySelector('#newWorldGeography')?.value||'freshwater/1'}))this.close();
      }
      else if(a==='load-world'){if(await this.onLoad(button.dataset.slot))this.close()}
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
