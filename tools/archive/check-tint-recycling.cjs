// Pixel-identity check for recycled tint canvases in real Chromium: the same pigmented parts are
// drawn through fresh allocation and again after enough distinct pigments to force eviction/reuse.
let activeBrowser;const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=path.resolve(__dirname,'../..');const browser=await chromium.launch({headless:true});activeBrowser=browser;const page=await browser.newPage({viewport:{width:800,height:600}});
 await page.route('https://genvo.review/**',async r=>{const p=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//,'')||'index.html');if(!p.startsWith(root+path.sep))return r.abort();if(!fs.existsSync(p))return r.fulfill({status:404,body:''});const ext=path.extname(p);await r.fulfill({body:fs.readFileSync(p),contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream'});});
 await page.goto('https://genvo.review/index.html');await page.waitForFunction(()=>window.__GENVO8__?.contextTray);await page.waitForFunction(()=>window.__GENVO8__.nativeArtStatus().status==='ready',null,{timeout:30000});
 const r=await page.evaluate(async()=>{const {drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{phenotypeFor}=await import('/src/organisms/species.js'),{creaturePalette}=await import('/src/render/creature-palette.js');
  const sim=window.__GENVO8__.sim,animals=sim.animals.filter(a=>a.alive&&a.bodyPlan).slice(0,6);const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d',{willReadFrequently:true});
  const draw=(a,dir,palette=null)=>{x.clearRect(0,0,96,96);x.save();x.translate(48,48);const ph=phenotypeFor(a);drawGenvoSprite(x,{animal:a,phenotype:ph,scale:2,frame:2,moving:true,palette:palette||creaturePalette(ph),pose:{dir,action:'move',life:{growth:1},behavior:{}}});x.restore();return Array.from(x.getImageData(0,0,96,96).data)};
  const first=animals.map(a=>[0,2,4,6].map(d=>draw(a,d)));
  // Force evictions: many distinct pigments through every asset's tint cache.
  const hex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join('');const created0=window.__made||0;const orig=Document.prototype.createElement;let made=0;Document.prototype.createElement=function(t,...a){if(String(t).toLowerCase()==='canvas')made++;return orig.call(this,t,...a)};
  for(let k=0;k<160;k++){const r=40+k%120,gg=60+(k*7)%140,bb=30+(k*13)%150,pal={shade:hex(r*.5,gg*.5,bb*.5),body:hex(r,gg,bb),light:hex(r+60,gg+60,bb+60)};for(const a of animals)for(const d of [0,2,4,6])draw(a,d,pal)}
  const madeDuringForcing=made;made=0;
  const second=animals.map(a=>[0,2,4,6].map(d=>draw(a,d)));const madeDuringSecond=made;Document.prototype.createElement=orig;let diff=0,total=0;for(let i=0;i<first.length;i++)for(let j=0;j<4;j++){const A=first[i][j],B=second[i][j];for(let k=0;k<A.length;k++){total++;if(A[k]!==B[k])diff++}}
  return{creatures:animals.length,samples:first.length*4,bytes:total,differingBytes:diff,forcedPalettes:160,canvasesCreatedWhileForcing:madeDuringForcing,canvasesCreatedOnRedraw:madeDuringSecond}});
 await browser.close();console.log(JSON.stringify(r));if(r.differingBytes)process.exitCode=1;
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
