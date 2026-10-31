// Native exported WebAudio, public world controls, natural seeded weather. No event/state injection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
function wav(channels,rate,file){const n=channels[0].length,b=Buffer.alloc(44+n*channels.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels.length,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels.length*2,28);b.writeUInt16LE(channels.length*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);let peak=0,sum=0;for(let i=0;i<n;i++)for(let c=0;c<channels.length;c++){const x=channels[c][i];assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));sum+=x*x;b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),44+(i*channels.length+c)*2)}fs.writeFileSync(file,b);return{seconds:n/rate,rate,channels:channels.length,peak,rms:Math.sqrt(sum/(n*channels.length))}}

(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]);assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});const receipt={errors:[],creatorAcceptance:false};
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local'),pathname=decodeURIComponent(u.pathname),old=pathname==='/src/audio/audio-before.js'?'audio.js':pathname==='/src/audio/creature-voice-before.js'?'creature-voice.js':null;
  const file=old?path.join(root,'docs/anatomical-voice-2026-10-29/before',old):path.resolve(root,'..'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();if(old==='audio.js')b=Buffer.from(b.toString('utf8').replace("from './creature-voice.js'","from './creature-voice-before.js'"));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ogg':'audio/ogg','.m4a':'audio/mp4','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(b)});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>receipt.errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__GENVO8__?.saveManager);
  await page.getByRole('button',{name:'New World',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#newWorldStartCards [data-start]').length>1);
  if(await page.locator('#newWorldAdvanced').getAttribute('open')===null)await page.locator('#newWorldAdvanced summary').click();await page.locator('#newWorldSeed').fill('VOICE-ANATOMY');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden&&window.__GENVO8__.sim.seed==='VOICE-ANATOMY',null,{timeout:60000});await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
  for(let i=0;i<8;i++){if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;await page.keyboard.press('Enter')}
  await page.waitForFunction(()=>window.__GENVO8__.audio.ctx?.state==='running'&&window.__GENVO8__.audio.assetBuffers.size===33,null,{timeout:60000});
  await page.evaluate(async()=>{
   const g=window.__GENVO8__,a=g.audio,c=a.ctx,{creatureVoiceProfile}=await import('/src/audio/creature-voice.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
   const stats={calls:[],filtersCreated:0,filtersDisposed:0},original=a.playSpeciesVoice,sample=a.playSample,filter=c.createBiquadFilter;
   const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'voice-native'})));
   c.createBiquadFilter=function(){const node=filter.call(this);if(stats.active){stats.filtersCreated++;const disconnect=node.disconnect;node.disconnect=function(...args){stats.filtersDisposed++;return disconnect.apply(this,args)}}return node};
   a.playSample=function(id,options){stats.active=!!options?.voice;try{return sample.call(this,id,options)}finally{stats.active=false}};
   a.playSpeciesVoice=function(animal,options){const before=snapshot(),profile=creatureVoiceProfile(animal),played=original.call(this,animal,options);stats.calls.push({id:animal.id,profile,played,stateExact:before===snapshot()});return played};
   const tap=c.createScriptProcessor(2048,2,2),sink=c.createGain(),chunks=[[],[]];sink.gain.value=0;tap.onaudioprocess=e=>{for(let i=0;i<2;i++)chunks[i].push(new Float32Array(e.inputBuffer.getChannelData(i)))};a.master.connect(tap);tap.connect(sink);sink.connect(c.destination);
   window.__voiceReview={stats,seedAnimal:structuredClone(g.sim.player()),tap,sink,chunks,rate:c.sampleRate,restore(){a.playSpeciesVoice=original;a.playSample=sample;c.createBiquadFilter=filter}};
  });
  await page.waitForTimeout(8000);await page.screenshot({path:path.join(out,'actual-gameplay.png')});await page.keyboard.press('p');await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
  const capture=await page.evaluate(()=>{const a=window.__GENVO8__.audio,r=window.__voiceReview;a.master.disconnect(r.tap);r.tap.disconnect();r.sink.disconnect();r.tap.onaudioprocess=null;const channels=r.chunks.map(chunks=>{const out=new Float32Array(chunks.reduce((s,v)=>s+v.length,0));let i=0;for(const part of chunks){out.set(part,i);i+=part.length}return Array.from(out)});return{channels,rate:r.rate}});
  receipt.nativeMix=wav(capture.channels,capture.rate,path.join(out,'native-mix.wav'));assert.ok(receipt.nativeMix.peak<.95&&receipt.nativeMix.rms>.0001);
  await page.waitForFunction(()=>{const r=window.__voiceReview;return r.stats.filtersDisposed===r.stats.filtersCreated},null,{timeout:10000});
  receipt.live=await page.evaluate(()=>{const r=window.__voiceReview;r.restore();return r.stats});assert.ok(receipt.live.calls.some(c=>c.played&&c.profile));assert.ok(receipt.live.calls.every(c=>c.stateExact));assert.equal(receipt.live.filtersCreated,receipt.live.filtersDisposed);
  receipt.palettes=[];
  for(const kind of ['grazer','clawed-grazer','jaw','crusher','beak','kernel','filter','giant','giant-newborn'])for(const old of [true,false]){
   const rendered=await page.evaluate(async({kind,old})=>{
    const {AudioDirector}=await import(old?'/src/audio/audio-before.js':'/src/audio/audio.js'),{creatureVoiceProfile}=await import(old?'/src/audio/creature-voice-before.js':'/src/audio/creature-voice.js'),{makePlan,validatePlan}=await import('/src/lineage/body-plan.js'),{SPECIES}=await import('/src/organisms/species.js');
    const a=structuredClone(window.__voiceReview.seedAnimal),mouth={grazer:'grazing-mouth','clawed-grazer':'grazing-mouth',jaw:'tearing-jaw',crusher:'crushing-jaw',beak:'beak-mouth',kernel:'kernel-beak',filter:'filter-mouth',giant:'grazing-mouth','giant-newborn':'grazing-mouth'}[kind];
    a.age=kind==='giant-newborn'?0:SPECIES[a.species].maturity;a.bodyPlan=makePlan(a.bodyPlan.nodes.map(n=>n.socket==='mouth'?{...n,partId:mouth}:n));
    if(kind==='clawed-grazer')a.bodyPlan=makePlan([...a.bodyPlan.nodes,{partId:'claw',parent:'root/limb.1',socket:'spur'}]);if(!validatePlan(a.bodyPlan).ok)throw Error('Invalid controlled anatomical voice');
    const size=kind.startsWith('giant')?3:1;a.bodySize={schema:1,alleles:[Math.log(size),Math.log(size)]};
    const ctx=new OfflineAudioContext(2,22050*4,22050),d=new AudioDirector(null);d.ctx=ctx;d.enabled=d.unlocked=true;d.seed=8128;d.musicLevel=0;d.ambienceLevel=0;d.buildGraph();d.sim={player:()=>a};d.currentScene={scene:'calm',danger:0};d.assetBuffers=new Map(window.__GENVO8__.audio.assetBuffers);
    const profile=creatureVoiceProfile(a);if(!d.playSpeciesVoice(a,{volume:.3}))throw Error('Missing voice sample');const output=await ctx.startRendering();
    return{channels:[0,1].map(i=>Array.from(output.getChannelData(i))),rate:output.sampleRate,profile};
   },{kind,old});
   const metric=wav(rendered.channels,rendered.rate,path.join(out,kind+'-'+(old?'before':'current')+'.wav'));assert.ok(metric.peak<.95&&metric.rms>.00001);receipt.palettes.push({kind,old,metric,profile:rendered.profile});
  }
  assert.deepEqual(receipt.errors,[]);receipt.scope='Ordinary new world and existing live wildlife voice scheduling, no biological/event/position injection. Native master recording and synchronous full saved-graph parity per call. Before/current controlled OfflineAudioContext anatomical/size palettes use preserved old voice code and real native samples; they do not claim naturally evolved giant or mouth lineages.';
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({status:'PASS',nativeMix:receipt.nativeMix,live:receipt.live,paletteCount:receipt.palettes.length}));
 }catch(e){receipt.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
