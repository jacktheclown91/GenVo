#!/usr/bin/env node
/* Export reusable PNG sprite sheets through the canonical browser renderers. */
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

function loadPlaywright(){
  try{return require('playwright')}
  catch(error){
    const bundled=path.join(process.env.USERPROFILE||'', '.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','playwright');
    if(fs.existsSync(bundled))return require(bundled);
    throw error;
  }
}

const HOST='https://genvo8.export';
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.argv[2]||path.join(root,'references','generated-sprite-sheets'));

async function main(){
  const {chromium}=loadPlaywright();
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({deviceScaleFactor:1});
  await page.route(`${HOST}/**`,async route=>{
    const url=new URL(route.request().url());
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'tools/sprite-sheet-export.html';
    const target=path.resolve(root,relative);
    if(target!==root&&!target.startsWith(root+path.sep))return route.abort();
    if(!fs.existsSync(target)||!fs.statSync(target).isFile())return route.fulfill({status:404,body:'Not found'});
    const ext=path.extname(target).toLowerCase(),contentType=ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.json'?'application/json':'application/octet-stream';
    return route.fulfill({status:200,body:fs.readFileSync(target),contentType});
  });
  await page.goto(`${HOST}/tools/sprite-sheet-export.html`,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__SPRITE_EXPORT__?.ready===true);
  const result=await page.evaluate(()=>window.__SPRITE_EXPORT__.exportAll());
  await browser.close();

  for(const entry of result.files){
    const encoded=entry.dataUrl.split(',',2)[1];
    fs.writeFileSync(path.join(output,entry.name),Buffer.from(encoded,'base64'));
  }
  result.manifest.files=result.files.map(({name,width,height})=>({name,width,height}));
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(result.manifest,null,2)+'\n','utf8');
  console.log(`Exported ${result.files.length} canonical sprite sheets to ${output}`);
}

main().catch(error=>{console.error(error);process.exitCode=1});
