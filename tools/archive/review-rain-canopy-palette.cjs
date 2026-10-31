// Native exported WebAudio, public world controls, natural seeded weather. No event/state injection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
function wav(channels,rate,file){const n=channels[0].length,b=Buffer.alloc(44+n*channels.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels.length,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels.length*2,28);b.writeUInt16LE(channels.length*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);let peak=0,sum=0;for(let i=0;i<n;i++)for(let c=0;c<channels.length;c++){const x=channels[c][i];assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));sum+=x*x;b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),44+(i*channels.length+c)*2)}fs.writeFileSync(file,b);return{seconds:n/rate,rate,channels:channels.length,peak,rms:Math.sqrt(sum/(n*channels.length))}}

(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]);assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'..'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');
  const rows=[];
  for(const mode of ['before','current','isolated','dry','bare','enclosed']){
   const result=await page.evaluate(async mode=>{
    const {AudioDirector}=await import('/src/audio/audio.js');
    const ctx=new OfflineAudioContext(2,22050*8,22050),director=new AudioDirector(null);
    director.ctx=ctx;director.musicLevel=0;director.sfxLevel=0;director.buildGraph();director.seed=8128;
    director.noiseBuffer=director.makeNoiseBuffer(2.5);director.startAmbience();
    if(mode!=='isolated')for(const id of ['field','wet','water-edge','rain']){
     const stem={field:'field-loop',wet:'wet-loop','water-edge':'water-edge-loop',rain:'rain-loop'}[id];
     const response=await fetch('/assets/audio/ambience/'+stem+'.ogg');assertResponse(response);
     director.assetBuffers.set(id,await ctx.decodeAudioData(await response.arrayBuffer()));
    }
    function assertResponse(r){if(!r.ok)throw Error('Asset HTTP '+r.status)}
    const update=director.habitatTextures.update.bind(director.habitatTextures);
    director.habitatTextures.update=targets=>update(mode==='before'?{...targets,'rain-canopy':0}:mode==='isolated'?{'rain-canopy':targets['rain-canopy']}:targets);
    director.currentScene={scene:'calm',danger:0,generation:1,wetness:.7,rain:mode==='dry'?0:.8,
      waterEdge:0,habitat:{kind:mode==='enclosed'?'cave':'woodland',canopy:mode==='bare'?0:.9,wind:0,water:0}};
    director.startAuthoredLoops();director.updateMix(director.currentScene);
    if(mode==='isolated')director.ambienceSource.gain.gain.setValueAtTime(0,0);
    const output=await ctx.startRendering();return{rate:output.sampleRate,channels:[0,1].map(i=>Array.from(output.getChannelData(i))),
      rainCanopy:director.habitatTextures.layers.get('rain-canopy').gain.gain.value};
   },mode);
   const metric=wav(result.channels,result.rate,path.join(out,mode+'.wav'));
   assert.ok(metric.peak<.95&&metric.rms>0.00001);rows.push({mode,...metric,rainCanopy:result.rainCanopy});
  }
  assert.ok(rows[1].rms>rows[0].rms,'Rain canopy adds measurable output in otherwise still woodland');
  assert.ok(rows[2].rms<rows[1].rms,'New texture remains subordinate to full rain bed');
  for(const row of rows.slice(3))assert.ok(row.rainCanopy<.00001,'Dry/bare/enclosed texture targets zero');
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({rows,scope:'Native OfflineAudioContext controlled acoustic comparison, identical authored assets/noise seed; before differs only by disabling the new foliage rain layer. Isolated is the new layer alone. No world fields are edited or natural habitat history claimed.',creatorAcceptance:false},null,2));
  console.log('Rain canopy comparison PASS: before/current and isolated output, headroom, subordinate layer and dry/bare/enclosed zero targets.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
