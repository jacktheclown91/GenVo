import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/padded-limb-detail-2026-10-29/composition-profile.json');
if(fs.existsSync(out))throw Error('Never overwrite a profile');fs.mkdirSync(path.dirname(out),{recursive:true});
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.gz':'application/gzip','.css':'text/css'})[path.extname(f)]||'application/octet-stream');res.end(b)})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch();const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/tools/art-resolution/index.html');
 const studies=[{id:'furred-padded',study:JSON.parse(fs.readFileSync('docs/padded-limb-detail-2026-10-29/gameplay/receipt.json')).comparison.study}];
 const result=await page.evaluate(async studies=>{
  const {loadNativePartCatalog}=await import('/src/render/runtime-part-art.js');await loadNativePartCatalog();
  const {loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{readOrganismStudy}=await import('/src/render/organism-study.js'),{phenotypeFor}=await import('/src/organisms/species.js'),{creaturePalette}=await import('/src/render/creature-palette.js');
  const runs=[],sheets=[],canvas=document.createElement('canvas');canvas.width=canvas.height=384;const c=canvas.getContext('2d');
  for(const resolution of [64,128]){
   const current=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts;
   const before=new Map(current);before.delete('padded-leg');
   const maps={before:Object.fromEntries(before),current:Object.fromEntries(current)};
   for(const specimen of studies){const animal=readOrganismStudy(specimen.study).animal,saved=JSON.stringify(animal),ph=phenotypeFor(animal);
    const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=320;const sc=sheet.getContext('2d');sc.imageSmoothingEnabled=false;sc.fillStyle='#152a20';sc.fillRect(0,0,sheet.width,sheet.height);
    for(const [row,label] of ['before','current'].entries())for(let dir=0;dir<8;dir++){
     sc.fillStyle='#ded9b2';sc.font='11px sans-serif';sc.fillText(label+' '+['N','NE','E','SE','S','SW','W','NW'][dir],dir*160+6,row*160+14);
     sc.save();sc.translate(dir*160+80,row*160+88);drawGenvoSprite(sc,{animal,phenotype:ph,palette:creaturePalette(ph),scale:6,frame:2,moving:true,authoredTimeMs:250,authoredParts:maps[label],pose:{dir,action:'walk'}});sc.restore();
    }
    sheets.push({name:specimen.id+'-'+resolution+'-directions.png',png:sheet.toDataURL('image/png')});
    for(const scale of [2,6]){const times={before:[],current:[]};
     for(let round=0;round<40;round++)for(const label of round%2?['current','before']:['before','current']){
      const start=performance.now();for(let dir=0;dir<8;dir++){c.clearRect(0,0,384,384);c.save();c.translate(192,192);drawGenvoSprite(c,{animal,phenotype:ph,palette:creaturePalette(ph),scale,frame:round%8,moving:true,authoredTimeMs:round*125,authoredParts:maps[label],pose:{dir,action:'walk'}});c.restore()}if(round>=8)times[label].push(performance.now()-start);
     }
     for(const label of ['before','current']){const t=times[label].sort((a,b)=>a-b);runs.push({subject:specimen.id,resolution,scale,label,medianMs:t[16],p95Ms:t[30],samples:t.length,spritesPerSample:8})}
    }
    if(JSON.stringify(animal)!==saved)throw Error('Composition changed the study');
   }
  }
  return{runs,sheets,studiesExact:true};
 },studies);
 for(const sheet of result.sheets)fs.writeFileSync(path.join(path.dirname(out),sheet.name),Buffer.from(sheet.png.split(',')[1],'base64'));delete result.sheets;
 fs.writeFileSync(out,JSON.stringify({status:'OBSERVED',scope:'Alternating matched uncached eight-facing composition batches of actual public-founder organism studies; 32 measured samples after 8 warmups, no video or live Simulation. CPU command timings, not GPU or mature-world/frame acceptance.',...result},null,2));

 await page.goto('http://127.0.0.1:'+server.address().port+'/tools/creature-lab/index.html');
 await page.waitForFunction(()=>window.__GENVO_LAB_ASSEMBLY__?.plan);
 await page.getByRole('button',{name:'Creature assembly',exact:true}).click();
 await page.locator('#importAssembly').setInputFiles({name:'actual-padded-organism.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(studies[0].study))});
 await page.waitForFunction(()=>document.querySelector('#assemblyStudyStatus').textContent.includes('Recorded organism #'));
 await page.locator('#showAssemblyGuides').uncheck();
 const plan=await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan));
 for(const resolution of ['32','64','128']){
  await page.locator('#assemblyArtResolution').selectOption(resolution);
  await page.waitForFunction(r=>document.querySelector('#assemblyArtStatus').textContent.startsWith(r==='32'?'Native32 stable artwork':r+'px modular'),resolution);
  await page.locator('#previewAction').selectOption('walk');
  for(const facing of ['0','1','2','3','4','5','6','7']){
   await page.locator('#previewDirection').selectOption(facing);
   if(await page.evaluate(()=>JSON.stringify(window.__GENVO_LAB_ASSEMBLY__.plan))!==plan)throw Error('Lab changed actual anatomy');
  }
  await page.locator('#previewDirection').selectOption('2');
  await page.locator('#creaturePreview').screenshot({path:path.join(path.dirname(out),'lab-'+resolution+'.png')});
 }
 fs.writeFileSync(path.join(path.dirname(out),'lab-receipt.json'),JSON.stringify({status:'PASS',scope:'Public Lab import of the exact recorded gameplay organism; 32/64/128 walking previews and all eight public heading controls; anatomy exact.',creatorAcceptance:false},null,2));
 console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(r=>server.close(r))}
