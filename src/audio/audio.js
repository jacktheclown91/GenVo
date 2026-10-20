import {AUDIO_SCENES,activeStrategyBranch,cueForResult,handoffTheme,musicPattern,musicSceneFor,semitone,stalkerDangerBand,themeStageForGeneration} from './model.js';
import {AUTHORED_AUDIO} from './assets.js';
import {creatureVoiceProfile} from './creature-voice.js';
import {currentCourtshipMove,COURTSHIP_PERFORMANCE,availableCourtshipMoves} from '../reproduction/courtship-performance.js';
import {CFG} from '../sim/config.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

export class AudioDirector{
  constructor(sim){
    this.sim=sim;
    this.ctx=null;
    this.master=null;this.musicBus=null;this.sfxBus=null;this.ambienceBus=null;
    this.noiseBuffer=null;this.ambienceSource=null;
    this.assetBuffers=new Map();this.authoredLoops=new Map();this.assetLoadPromise=null;this.authoredReady=false;this.deferredInitPromise=null;this.deferredInitTimer=null;
    this.enabled=true;this.unlocked=false;
    this.masterLevel=.72;this.musicLevel=.24;this.sfxLevel=.68;this.ambienceLevel=.08;
    this.nextMusicTime=0;this.musicStep=0;this.lastScene=AUDIO_SCENES.CALM;
    this.courtshipAudio=new WeakMap();this.lastActionTick=-1;this.lastDamageTick=-1;this.lastLineageRecords=sim?.lineage?.records?.size||0;this.lastHandoffs=sim?.lineage?.handoffs?.length||0;
    this.moveClock=0;this.sceneClock=0;this.currentScene=musicSceneFor(sim);
    this.wildlifeClock=1.4;this.stalkerClock=.45;this.lastThreatId=null;this.lastThreatBand=0;this.lastMixDanger=0;this.handoffDuckUntil=0;
    this.seed=hashString(sim?.seed||'GENVO8-AUDIO')||1;this.lastInteractiveAudioAt=0;
    this.loadPrefs();
  }
  setSimulation(sim){
    this.sim=sim;this.courtshipAudio=new WeakMap();this.lastActionTick=-1;this.lastDamageTick=-1;this.lastLineageRecords=sim?.lineage?.records?.size||0;this.lastHandoffs=sim?.lineage?.handoffs?.length||0;this.musicStep=0;this.nextMusicTime=this.ctx?.currentTime||0;this.seed=hashString(sim?.seed||'GENVO8-AUDIO')||1;this.lastInteractiveAudioAt=0;this.currentScene=musicSceneFor(sim);this.wildlifeClock=1.2;this.stalkerClock=.35;this.lastThreatId=null;this.lastThreatBand=0;this.lastMixDanger=0;this.handoffDuckUntil=0;
    if(this.ctx)this.updateMix(this.currentScene);
  }
  loadPrefs(){try{const raw=localStorage.getItem('genvo8-audio');if(!raw)return;const p=JSON.parse(raw);if(typeof p.enabled==='boolean')this.enabled=p.enabled;if(Number.isFinite(p.master))this.masterLevel=clamp(p.master)}catch{}}
  savePrefs(){try{localStorage.setItem('genvo8-audio',JSON.stringify({enabled:this.enabled,master:this.masterLevel}))}catch{}}
  async unlock(){
    if(!this.ctx){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return false;this.ctx=new AC();this.buildGraph()}
    if(this.ctx.state==='suspended')try{await this.ctx.resume()}catch{}
    this.unlocked=this.ctx.state==='running';
    if(this.unlocked&&this.nextMusicTime<this.ctx.currentTime)this.nextMusicTime=this.ctx.currentTime+.08;
    if(this.unlocked){
      if(typeof document==='undefined')await this.startDeferredAudio();
      else this.scheduleDeferredAudio();
    }
    return this.unlocked;
  }
  scheduleDeferredAudio(){
    if(this.deferredInitPromise||this.deferredInitTimer)return;
    const start=()=>{this.deferredInitTimer=null;if(this.deferredInitPromise)return;const run=()=>{if(!this.deferredInitPromise)this.deferredInitPromise=this.startDeferredAudio()};if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:1200});else setTimeout(run,0)};
    this.deferredInitTimer=setTimeout(start,650);
  }
  async startDeferredAudio(){
    if(!this.ctx)return false;
    if(!this.noiseBuffer){this.noiseBuffer=this.makeNoiseBuffer(2.5);this.startAmbience()}
    if(!this.assetLoadPromise)this.assetLoadPromise=this.loadAssetPack();
    return await this.assetLoadPromise;
  }
  buildGraph(){
    const c=this.ctx;
    this.master=c.createGain();this.musicBus=c.createGain();this.sfxBus=c.createGain();this.ambienceBus=c.createGain();
    this.musicBus.connect(this.master);this.sfxBus.connect(this.master);this.ambienceBus.connect(this.master);this.master.connect(c.destination);
    this.master.gain.value=this.enabled?this.masterLevel:0;this.musicBus.gain.value=this.musicLevel;this.sfxBus.gain.value=this.sfxLevel;this.ambienceBus.gain.value=this.ambienceLevel;
  }
  async loadAssetPack(){
    const c=this.ctx;if(!c||typeof fetch!=='function'||typeof c.decodeAudioData!=='function')return false;
    const loaded=[],entries=Object.entries(AUTHORED_AUDIO).sort((a,b)=>(a[1].kind==='loop')-(b[1].kind==='loop'));
    for(const [id,def] of entries){
      // v1.58.0: each sound is tried in its formats in order (Ogg Opus, then AAC) until one decodes.
      for(const url of def.urls||[def.url]){try{const res=await fetch(url);if(!res.ok)throw new Error(`HTTP ${res.status}`);const bytes=await res.arrayBuffer();if(typeof document!=='undefined'&&(def.kind==='loop'||bytes.byteLength>32000))await this.waitForDecodeIdle(700);const buf=await this.decodeAudio(bytes);if(buf){this.assetBuffers.set(id,buf);loaded.push(id);break}}catch{}}
      if(typeof document!=='undefined')await this.yieldAudioDecode();
    }
    if(!loaded.length)return false;
    this.authoredReady=true;this.startAuthoredLoops();return true;
  }
  audioClock(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now()}
  markInteractiveAudio(){this.lastInteractiveAudioAt=this.audioClock()}
  async waitForDecodeIdle(minIdle=700){
    while(this.audioClock()-this.lastInteractiveAudioAt<minIdle)await new Promise(resolve=>setTimeout(resolve,120));
  }
  async yieldAudioDecode(){
    if(typeof requestAnimationFrame==='function')return await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  async decodeAudio(arrayBuffer){
    const c=this.ctx;if(!c?.decodeAudioData)return null;
    try{const maybe=c.decodeAudioData(arrayBuffer.slice(0));if(maybe?.then)return await maybe;if(maybe)return maybe}catch{}
    return await new Promise((resolve,reject)=>{try{c.decodeAudioData(arrayBuffer.slice(0),resolve,reject)}catch(e){reject(e)}}).catch(()=>null);
  }
  startAuthoredLoops(){
    if(!this.ctx)return;
    for(const [id,def] of Object.entries(AUTHORED_AUDIO)){
      if(def.kind!=='loop'||this.authoredLoops.has(id)||!this.assetBuffers.has(id))continue;
      const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=this.assetBuffers.get(id);src.loop=true;if(def.seconds&&src.buffer.duration>def.seconds+.001){src.loopStart=0;src.loopEnd=def.seconds}gain.gain.value=0;src.connect(gain);gain.connect(def.bus==='ambience'?this.ambienceBus:this.musicBus);src.start();this.authoredLoops.set(id,{src,gain,def});
    }
    this.updateAuthoredMix(this.currentScene||musicSceneFor(this.sim));
  }
  setLoopGain(id,value,time=.7){const loop=this.authoredLoops.get(id);if(!loop||!this.ctx)return;loop.gain.gain.setTargetAtTime(Math.max(.0001,value),this.ctx.currentTime,time)}
  updateAuthoredMix(scene){
    if(!this.ctx||!scene)return;const wet=clamp(scene.wetness||0),water=clamp(scene.waterEdge||0),danger=clamp(scene.danger||0),rising=danger>this.lastMixDanger+.025;
    this.setLoopGain('field',.30+.34*(1-wet)*(1-water*.34),1.05);this.setLoopGain('wet',.05+.52*wet*(1-water*.18),1.05);this.setLoopGain('water-edge',.0001+.54*water,water>0.3?.65:1.25);
    const stage=themeStageForGeneration(scene.generation||1),lineage=scene.scene===AUDIO_SCENES.ENDED?.12:scene.scene===AUDIO_SCENES.DANGER?.25:scene.scene===AUDIO_SCENES.HIDDEN?.28:.40;
    const themeGain=(.07+stage*.055)*(scene.scene===AUDIO_SCENES.DANGER?.58:scene.scene===AUDIO_SCENES.HIDDEN?.72:1)*(scene.shelter?1.08:1);
    this.setLoopGain('lineage',lineage,1.2);this.setLoopGain('theme',themeGain,1.15);this.setLoopGain('shelter',scene.shelter?.58*(1-danger*.58):.0001,scene.shelter?1.0:1.55);this.setLoopGain('danger',Math.max(.0001,danger*.62),rising?.34:1.35);this.lastMixDanger=danger;
  }
  makeNoiseBuffer(seconds=2){
    const c=this.ctx,buf=c.createBuffer(1,Math.max(1,Math.floor(c.sampleRate*seconds)),c.sampleRate),data=buf.getChannelData(0);let x=this.seed;
    for(let i=0;i<data.length;i++){x=(x*1664525+1013904223)>>>0;data[i]=((x/4294967296)*2-1)*.72}return buf;
  }
  startAmbience(){
    if(!this.ctx||!this.noiseBuffer)return;const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();src.buffer=this.noiseBuffer;src.loop=true;filter.type='lowpass';filter.frequency.value=900;filter.Q.value=.25;gain.gain.value=.32;src.connect(filter);filter.connect(gain);gain.connect(this.ambienceBus);src.start();this.ambienceSource={src,filter,gain};
  }
  toggleMute(){this.enabled=!this.enabled;this.savePrefs();if(this.master&&this.ctx){const t=this.ctx.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(this.enabled?this.masterLevel:0,t,.035)}return this.enabled}
  noteResult(result){this.markInteractiveAudio();const cue=cueForResult(result);if(cue)this.playCue(cue,result)}
  note(name,data={}){this.markInteractiveAudio();this.playCue(name,data)}
  update(dt,input={}){
    if(!this.sim)return;
    this.sceneClock+=dt;
    if(this.sceneClock>=.22){this.sceneClock=0;this.currentScene=musicSceneFor(this.sim);this.updateMix(this.currentScene)}
    this.pollSimulationEvents();
    if(this.unlocked&&this.enabled){this.scheduleMusic();this.updateMovement(dt,input);this.updateWildlife(dt)}
  }
  updateMix(scene){
    if(!this.ctx||!this.master)return;const t=this.ctx.currentTime,danger=scene.danger||0,duck=t<this.handoffDuckUntil?.56:1;
    const musicTarget=this.musicLevel*(scene.scene===AUDIO_SCENES.DANGER?1.08:scene.scene===AUDIO_SCENES.HIDDEN?.72:1)*duck;
    const ambTarget=this.ambienceLevel*(scene.scene===AUDIO_SCENES.DANGER?.58:scene.scene===AUDIO_SCENES.HIDDEN?.48:1)*(t<this.handoffDuckUntil?.72:1);
    this.musicBus.gain.setTargetAtTime(musicTarget,t,t<this.handoffDuckUntil?.16:.62);this.ambienceBus.gain.setTargetAtTime(ambTarget,t,t<this.handoffDuckUntil?.20:.72);
    if(this.ambienceSource){this.ambienceSource.filter.frequency.setTargetAtTime(scene.scene===AUDIO_SCENES.HIDDEN?520:scene.scene===AUDIO_SCENES.DANGER?650:900,t,.5);this.ambienceSource.gain.gain.setTargetAtTime(.28+.18*(1-danger),t,.7)}
    this.updateAuthoredMix(scene);this.lastScene=scene.scene;
  }
  pollSimulationEvents(){
    const sim=this.sim;
    if(sim.lastPlayerDamage&&sim.lastPlayerDamage.tick!==this.lastDamageTick){
      this.lastDamageTick=sim.lastPlayerDamage.tick;const attacker=sim.animals?.find(a=>a.id===sim.lastPlayerDamage.attackerId);
      if(attacker)this.playSample('stalker-lunge',{x:attacker.x,y:attacker.y,radius:11,volume:.84,rate:.96+this.rand()*.08});
      this.playCue('damage',sim.lastPlayerDamage);
    }
    const action=sim.lastPlayerAction;if(action&&action.tick!==this.lastActionTick){this.lastActionTick=action.tick;if(action.type==='emerge')this.playCue('emerge',action)}
    this.pollCourtshipAudio();
    const records=sim.lineage?.records?.size||0;if(records>this.lastLineageRecords){const n=records-this.lastLineageRecords;this.lastLineageRecords=records;for(let i=0;i<Math.min(3,n);i++)this.playCue('birth',{index:i})}
    const count=sim.lineage?.handoffs?.length||0;if(count>this.lastHandoffs){const h=sim.lineage.handoffs.at(-1);this.lastHandoffs=count;this.playHandoff(h)}
  }
  updateMovement(dt,input){
    const p=this.sim.player?.();if(!p||p.hidden||p.airborne||p.perched||(p.diveDepth||0)>.03||this.sim.paused)return;const moving=!!(input.up||input.down||input.left||input.right);if(!moving){this.moveClock=0;return}
    this.markInteractiveAudio();this.moveClock+=dt;const interval=input.sprint?.29:.46;if(this.moveClock>=interval){this.moveClock%=interval;this.playCue(input.sprint?'sprint':'move',{quiet:true})}
  }
  updateWildlife(dt){
    const sim=this.sim,p=sim.player?.();if(!p||sim.paused)return;
    const scene=this.currentScene||musicSceneFor(sim),protectedStart=!!sim.isOpeningProtected?.(p);
    this.stalkerClock-=dt;
    if(!protectedStart&&scene.threatId&&scene.threatDistance<9.4){
      const hunter=sim.animals.find(a=>a.id===scene.threatId&&a.alive),band=stalkerDangerBand(scene),newThreat=scene.threatId!==this.lastThreatId;
      if(newThreat){this.lastThreatId=scene.threatId;this.lastThreatBand=0;this.stalkerClock=Math.min(this.stalkerClock,.12)}
      if(hunter&&band>this.lastThreatBand){if(band>=3)this.playSample('stalker-charge',{x:hunter.x,y:hunter.y,radius:12,volume:.78,rate:.96+this.rand()*.06});else if(band>=2)this.playSample('stalker-stalk',{x:hunter.x,y:hunter.y,radius:13,volume:.58,rate:.96+this.rand()*.07});this.lastThreatBand=band}
      else if(band<this.lastThreatBand)this.lastThreatBand=band;
      if(this.stalkerClock<=0){if(hunter)this.playSpeciesVoice(hunter,{stalkerTell:true,volume:.58+.28*scene.danger});this.stalkerClock=Math.max(.72,3.25-scene.danger*1.75+(scene.concealed?.55:0)+this.rand()*1.05)}
    }else{this.lastThreatId=null;this.lastThreatBand=0;this.stalkerClock=Math.min(.9,Math.max(.25,this.stalkerClock))}
    this.wildlifeClock-=dt;if(this.wildlifeClock>0)return;
    this.wildlifeClock=4.0+this.rand()*4.8;if(scene.danger>.38)return;
    const candidates=[];
    for(const a of sim.animals||[]){if(!a.alive||a.id===p.id||a.id===scene.threatId||!creatureVoiceProfile(a))continue;if(sim.world?.sameLand&&!sim.world.sameLand(p.x,p.y,a.x,a.y))continue;const d=Math.hypot(a.x-p.x,a.y-p.y);if(d<2||d>14)continue;candidates.push({a,d})}
    candidates.sort((a,b)=>a.d-b.d);if(!candidates.length)return;const pool=candidates.slice(0,Math.min(7,candidates.length)),pick=pool[Math.floor(this.rand()*pool.length)];this.playSpeciesVoice(pick.a,{volume:.22+.16*(1-pick.d/14)});
  }
  playSpeciesVoice(animal,{stalkerTell=false,volume=.3}={}){
    const voice=creatureVoiceProfile(animal);if(!voice)return false;const rate=voice.rate*(.97+this.rand()*.06);
    if(this.playSample(voice.sample,{x:animal.x,y:animal.y,radius:stalkerTell?12:15,volume,rate}))return true;
    const dest=this.spatialDestination(animal.x,animal.y,{radius:stalkerTell?12:15,volume});if(!dest)return false;const t=this.ctx.currentTime+.005;
    if(voice.rough){this.noise(t,.18,.12,1200*rate,dest);this.tone(170*rate,92*rate,t,.24,.08,'sawtooth',dest)}
    else if(voice.bright){this.tone(1100*rate,1850*rate,t,.13,.08,'sine',dest);this.tone(1500*rate,2200*rate,t+.16,.09,.05,'sine',dest)}
    else{this.tone(voice.sample==='digger'?135*rate:430*rate,voice.sample==='digger'?90*rate:620*rate,t,.22,.08,'triangle',dest);this.noise(t,.16,.04,420*rate,dest)}return true;
  }
  pollCourtshipAudio(){
    const sim=this.sim,p=sim.player?.();if(!p||sim.paused)return;
    for(const a of sim.animals||[]){const state=a.courtshipPerformance;if(!a.alive||a.intent!=='mate'||!state||sim.tickCount>state.endsAt||Math.hypot(a.x-p.x,a.y-p.y)>10)continue;const partner=sim.animals.find(b=>b.id===state.partnerId&&b.alive);if(!partner||Math.hypot(a.x-partner.x,a.y-partner.y)>COURTSHIP_PERFORMANCE.contestRadius||sim.world?.sameLand&&!sim.world.sameLand(a.x,a.y,p.x,p.y))continue;
      const move=currentCourtshipMove(sim,a);if(move!=='approach'&&!availableCourtshipMoves(a).includes(move))continue;const step=Math.floor(Math.max(0,sim.tickCount-state.startedAt)/(COURTSHIP_PERFORMANCE.beats*CFG.lifeStride)),key=state.startedAt+':'+state.attempt+':'+step;
      if(this.courtshipAudio.get(a)===key)continue;this.courtshipAudio.set(a,key);
      if(move==='call'){this.playSpeciesVoice(a,{volume:.36});continue}const dest=this.spatialDestination(a.x,a.y,{radius:10,volume:.24});if(!dest)continue;const t=this.ctx.currentTime+.005;
      if(move==='dance'){this.noise(t,.07,.06,950,dest);this.noise(t+.19,.07,.045,1250,dest)}
      else if(move==='flare')this.noise(t,.19,.045,2100,dest);
      else if(move==='gesture')this.noise(t,.09,.035,1450,dest);
      // Scent and approach remain quiet; no musical approval/rejection calculation.
    }
  }
  scheduleMusic(){
    const c=this.ctx;if(!c||c.state!=='running')return;const lookAhead=.35;
    if(this.nextMusicTime<c.currentTime-.6)this.nextMusicTime=c.currentTime+.05;
    while(this.nextMusicTime<c.currentTime+lookAhead){
      const scene=this.currentScene||musicSceneFor(this.sim),stepIndex=this.musicStep%8,phraseIndex=Math.floor(this.musicStep/8)%4,pattern=musicPattern(scene.scene,{...scene,phraseIndex}),step=pattern.steps[stepIndex];
      const tempo=scene.scene===AUDIO_SCENES.DANGER?76:scene.scene===AUDIO_SCENES.HIDDEN?52:scene.scene===AUDIO_SCENES.SHELTER?60:58;
      const stepDur=60/tempo;
      if(step!==null){const f=semitone(pattern.root,step+pattern.octave);this.musicNote(f,this.nextMusicTime,stepDur*.72,scene,stepIndex,pattern)}
      if(stepIndex===0&&phraseIndex===2&&scene.branch)this.playSample(`branch-${scene.branch}`,{volume:.20,bus:'music',when:this.nextMusicTime,rate:.98+pattern.stage*.01});
      if(scene.scene===AUDIO_SCENES.DANGER&&(stepIndex%2===0))this.dangerPulse(this.nextMusicTime,scene.danger);
      this.musicStep=(this.musicStep+1)%32;this.nextMusicTime+=stepDur;
    }
  }
  musicNote(freq,time,duration,scene,step,pattern=null){
    const c=this.ctx,osc=c.createOscillator(),filter=c.createBiquadFilter(),g=c.createGain();osc.type=scene.scene===AUDIO_SCENES.DANGER||scene.branch==='utility'?'triangle':'sine';osc.frequency.setValueAtTime(freq,time);if(scene.scene===AUDIO_SCENES.SHELTER&&step%2===0)osc.detune.setValueAtTime(-5,time);
    filter.type='lowpass';filter.frequency.setValueAtTime(scene.scene===AUDIO_SCENES.DANGER?1050:scene.branch==='stealth'?1250:1500,time);filter.Q.value=.7;const peak=scene.scene===AUDIO_SCENES.DANGER?.06:scene.scene===AUDIO_SCENES.HIDDEN?.025:.038;
    g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(peak,time+.012);g.gain.exponentialRampToValueAtTime(peak*.45,time+.18);g.gain.exponentialRampToValueAtTime(.0001,time+Math.max(.3,duration*1.35));osc.connect(filter);filter.connect(g);g.connect(this.musicBus);osc.start(time);osc.stop(time+duration*1.35+.08);
    // v1.56.0: a quick inharmonic overtone makes each theme note a soft struck mallet instead of a bare tone.
    if(scene.scene!==AUDIO_SCENES.DANGER){const o3=c.createOscillator(),g3=c.createGain();o3.type='sine';o3.frequency.setValueAtTime(freq*3.93,time);g3.gain.setValueAtTime(.0001,time);g3.gain.exponentialRampToValueAtTime(peak*.32,time+.006);g3.gain.exponentialRampToValueAtTime(.0001,time+.22);o3.connect(g3);g3.connect(this.musicBus);o3.start(time);o3.stop(time+.26)}
    if((scene.scene===AUDIO_SCENES.SHELTER||scene.branch==='social'||(pattern?.stage>=2&&pattern?.phraseIndex===3))&&step%4===0){const o2=c.createOscillator(),g2=c.createGain();o2.type='sine';o2.frequency.value=scene.branch==='social'?freq*1.25:pattern?.stage>=3?freq*1.5:freq/2;g2.gain.setValueAtTime(.0001,time);g2.gain.exponentialRampToValueAtTime(.016,time+.08);g2.gain.exponentialRampToValueAtTime(.0001,time+duration*1.45);o2.connect(g2);g2.connect(this.musicBus);o2.start(time);o2.stop(time+duration*1.5)}
  }
  dangerPulse(time,intensity=.5){
    if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(62,time);o.frequency.exponentialRampToValueAtTime(46,time+.11);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(.018+.025*intensity,time+.012);g.gain.exponentialRampToValueAtTime(.0001,time+.16);o.connect(g);g.connect(this.musicBus);o.start(time);o.stop(time+.18);
  }
  playCue(name,data={}){
    if(!this.unlocked||!this.enabled||!this.ctx)return;const t=this.ctx.currentTime+.005;
    const foodSamples={'eat-moss':'food-moss','eat-berries':'food-berries','eat-reeds':'food-reeds','eat-mushroom':'food-mushroom','eat-seed':'food-seed','eat-carrion':'food-carrion'};
    if(foodSamples[name]){if(this.playSample(foodSamples[name],{volume:name==='eat-carrion'?.62:.54,rate:.96+this.rand()*.08}))return;name='eat'}
    switch(name){
      case'jump':this.noise(t,.10,.035,1800);this.tone(140,360,t,.13,.035,'triangle');break;
      case'land':this.noise(t,.08,.045,650);this.tone(115,65,t,.09,.035,'triangle');break;
      case'splash':this.noise(t,.22,.075,1200);this.tone(420,110,t,.20,.03,'sine');break;
      case'move':this.noise(t,.055,.025,1250);break;
      case'sprint':this.noise(t,.08,.045,950);this.tone(95,72,t,.07,.02,'triangle');break;
      case'drink':this.tone(720,410,t,.16,.055,'sine');this.tone(520,300,t+.09,.2,.04,'sine');break;
      case'eat':this.noise(t,.09,.09,1700);this.tone(180,125,t,.08,.025,'triangle');break;
      case'fight':this.tone(125,70,t,.12,.12,'triangle');this.noise(t,.09,.13,720);break;
      case'kill':this.tone(112,48,t,.23,.15,'sawtooth');this.noise(t,.16,.16,650);this.tone(330,220,t+.12,.24,.04,'sine');break;
      case'miss':this.noise(t,.07,.055,2400);this.tone(260,205,t,.09,.025,'triangle');break;
      case'damage':this.playSample('genvo-hurt',{volume:.72,rate:.92+this.rand()*.12});this.tone(92,42,t,.19,.13,'sawtooth');this.noise(t,.13,.13,520);break;
      case'hide':this.noise(t,.28,.065,700);this.tone(420,245,t,.32,.025,'sine');break;
      case'emerge':this.noise(t,.14,.04,1200);this.tone(245,390,t,.18,.022,'sine');break;
      case'alarm':if(!this.playSample('genvo-alarm',{volume:.58,rate:.98+this.rand()*.05})){this.playSample('genvo-call',{volume:.48,rate:1.12});this.tone(430,620,t,.15,.04,'sine');this.tone(480,700,t+.17,.16,.035,'sine')}break;
      case'rally':if(!this.playSample('genvo-rally',{volume:.62,rate:.97+this.rand()*.04})){this.playSample('genvo-call',{volume:.58,rate:.92});this.tone(310,520,t,.16,.05,'triangle');this.tone(390,650,t+.13,.2,.045,'triangle');this.tone(520,780,t+.27,.2,.035,'sine')}break;
      case'carry':this.noise(t,.11,.05,1450);this.tone(210,265,t,.12,.025,'triangle');break;
      case'store':{const sampled=this.playSample('shelter-store',{volume:.46,rate:.96+this.rand()*.08});if(!sampled){this.tone(240,330,t,.12,.03,'triangle');this.tone(330,440,t+.09,.15,.026,'sine')}this.tone(392,523,t+.13,.16,.024,'sine');break}
      case'build':{const sampled=this.playSample('shelter-build',{volume:.50,rate:.96+this.rand()*.06});if(!sampled){this.noise(t,.10,.075,850);this.tone(150,105,t,.10,.045,'triangle');this.noise(t+.13,.08,.06,1100)}this.tone(330,440,t+.14,.14,.026,'sine');this.tone(440,587,t+.25,.18,.024,'sine');break}
      case'repair':{const sampled=this.playSample('shelter-repair',{volume:.44,rate:.97+this.rand()*.06});if(!sampled){this.noise(t,.09,.05,1050);this.tone(180,130,t,.10,.03,'triangle')}this.tone(349,466,t+.11,.14,.021,'sine');break}
      case'court':this.tone(196,247,t,.16,.022,'sine');this.tone(247,294,t+.12,.18,.018,'sine');break;
      case'birth':if(!this.playSample('genvo-birth',{volume:.38,rate:1+(data.index||0)*.035})){this.playSample('genvo-call',{volume:.26,rate:1.22+(data.index||0)*.04});this.tone(523.25,659.25,t,.28,.035,'sine');this.tone(659.25,783.99,t+.16,.32,.03,'sine')}break;
      case'confirm':this.tone(330,440,t,.12,.025,'sine');break;
      case'deny':this.tone(135,108,t,.09,.022,'triangle');this.noise(t,.045,.018,520);break;
    }
  }
  playSample(id,{x=null,y=null,radius=14,volume=1,rate=1,bus='sfx',when=null}={}){
    if(!this.unlocked||!this.enabled||!this.ctx)return false;const buffer=this.assetBuffers.get(id);if(!buffer)return false;let destination=bus==='music'?this.musicBus:bus==='ambience'?this.ambienceBus:this.sfxBus;
    if(Number.isFinite(x)&&Number.isFinite(y)){destination=this.spatialDestination(x,y,{radius,volume});if(!destination)return false;volume=1}
    const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=buffer;if(src.playbackRate)src.playbackRate.value=clamp(rate,.65,1.5);gain.gain.value=Math.max(.0001,volume);src.connect(gain);gain.connect(destination);if(Number.isFinite(when))src.start(Math.max(this.ctx.currentTime,when));else src.start();return true;
  }
  spatialDestination(x,y,{radius=14,volume=1}={}){
    if(!this.ctx||!this.sfxBus)return null;const p=this.sim?.player?.();if(!p)return this.sfxBus;const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);if(d>radius)return null;const att=.12+.88*Math.pow(clamp(1-d/radius),1.25),gain=this.ctx.createGain();gain.gain.value=Math.max(.0001,volume*att);
    if(typeof this.ctx.createStereoPanner==='function'){const pan=this.ctx.createStereoPanner();pan.pan.value=clamp(dx/Math.max(3,radius*.62),-.88,.88);gain.connect(pan);pan.connect(this.sfxBus);return gain}
    gain.connect(this.sfxBus);return gain;
  }
  playHandoff(handoff){
    if(!this.unlocked||!this.enabled||!this.ctx)return;const t=this.ctx.currentTime+.03,death=handoff?.reason==='death',established=!!handoff?.newlyEstablished,scene=this.currentScene||musicSceneFor(this.sim),branch=activeStrategyBranch(this.sim?.player?.());
    const pattern=musicPattern(AUDIO_SCENES.CALM,{...scene,phraseIndex:0}),root=pattern.root*(death?1.78:established?2.38:2),seq=handoffTheme({reason:handoff?.reason,established,branch});
    this.handoffDuckUntil=Math.max(this.handoffDuckUntil,this.ctx.currentTime+1.34);this.updateMix(scene);
    for(let i=0;i<8;i++){const f=semitone(root,seq[i]);this.softChime(f,t+i*.115,.46,established?.054:death?.032:.041)}
  }
  softChime(freq,time,duration=.4,peak=.04){
    const c=this.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type='sine';o.frequency.value=freq;f.type='lowpass';f.frequency.value=1900;g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(peak,time+.025);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(f);f.connect(g);g.connect(this.sfxBus);o.start(time);o.stop(time+duration+.04);
  }
  tone(from,to,time,duration=.12,peak=.04,type='sine',destination=this.sfxBus){
    const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,from),time);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),time+duration);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(peak,time+.012);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(destination||this.sfxBus);o.start(time);o.stop(time+duration+.03);
  }
  noise(time,duration=.08,peak=.05,frequency=1200,destination=this.sfxBus){
    if(!this.noiseBuffer)return;const c=this.ctx,src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(peak,time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+duration);src.connect(filter);filter.connect(g);g.connect(destination||this.sfxBus);src.start(time,this.rand()*1.6);src.stop(time+duration+.02);
  }
  rand(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296}
}

function hashString(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
