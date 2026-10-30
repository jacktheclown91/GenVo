// Native exported WebAudio, public world controls, natural seeded weather. No event/state injection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
function wav(channels,rate,file){const n=channels[0].length,b=Buffer.alloc(44+n*channels.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels.length,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*channels.length*2,28);b.writeUInt16LE(channels.length*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);let peak=0,sum=0;for(let i=0;i<n;i++)for(let c=0;c<channels.length;c++){const x=channels[c][i];assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));sum+=x*x;b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),44+(i*channels.length+c)*2)}fs.writeFileSync(file,b);return{seconds:n/rate,rate,channels:channels.length,peak,rms:Math.sqrt(sum/(n*channels.length))}}

(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]);assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');

  const studies=['balance','paddle'].map(name=>({name,study:JSON.parse(fs.readFileSync(path.join(root,'docs/tail-detail-2026-10-29',name,'receipt.json'),'utf8')).comparison.study}));
  const rows=await page.evaluate(async studies=>{
   const {loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{loadNativePartCatalog}=await import('/src/render/runtime-part-art.js'),{readOrganismStudy}=await import('/src/render/organism-study.js'),{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js'),{creaturePalette}=await import('/src/render/creature-palette.js');
   await loadNativePartCatalog();const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d'),rows=[];c.imageSmoothingEnabled=false;
   for(const resolution of [64,128]){
    const current=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts,oldTail=(await loadPartArtVariant(new URL('/docs/tail-detail-2026-10-29/before/tail-catalog.json',location.href),{resolution})).parts;
    const prior=new Map(current);prior.set('balance-tail',oldTail.get('balance-tail'));prior.delete('paddle-tail');
    for(const {name,study} of studies){const a=readOrganismStudy(study).animal,ph=phenotypeFor(a),palette=creaturePalette(ph),samples={before:[],current:[]};
     for(let round=0;round<36;round++)for(const label of round%2?['current','before']:['before','current']){
      const parts=Object.fromEntries(label==='before'?prior:current),start=performance.now();
      for(let dir=0;dir<8;dir++){c.clearRect(0,0,256,256);c.save();c.translate(128,128);drawGenvoSprite(c,{animal:a,phenotype:ph,palette,scale:3,frame:round%8,moving:true,authoredParts:parts,pose:{dir,action:'move'}});c.restore()}
      if(round>=6)samples[label].push(performance.now()-start);
     }
     for(const [label,values] of Object.entries(samples)){values.sort((a,b)=>a-b);rows.push({name,resolution,label,medianMs:values[15],p90Ms:values[27],samples:values.length,spritesPerSample:8})}
    }
   }return rows;
  },studies);
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({rows,scope:'Matched isolated8-sprite CPU composition, actual gameplay organism studies, reused canvas, alternating warm before/current comparisons. Not whole-world FPS or mature-crowd acceptance.'},null,2));console.log(JSON.stringify(rows));
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
