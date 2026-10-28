import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import v8 from 'node:v8';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {packageScenarioSnapshot} from '../src/persistence/scenario-library.js';

assert.ok(process.argv[2]&&process.argv[3],'Supply fresh output directory and real snapshot.v8');
const root=process.cwd(),out=path.resolve(process.argv[2]),input=path.resolve(process.argv[3]);
assert.equal(fs.existsSync(out),false,'Never overwrite an earlier review');
const referenceCommit=process.argv[4]||'04c9a41524667481b0ae625d892abc5abcf29770';
assert.match(referenceCommit,/^[a-f0-9]{40}$/);
const source=execFileSync('git',['show',referenceCommit+':src/render/snow-ground-art.js']);
const reference=source.toString().replace("'../world/snowpack.js'","'/src/world/snowpack.js'");
assert.notEqual(reference,source.toString(),'Expected reference import must be relocated explicitly');
const bytes=fs.readFileSync(input),snapshot=v8.deserialize(bytes);
fs.mkdirSync(out,{recursive:true});
const importPath=path.join(out,'actual-mature-snow.json.gz');
const paused={...snapshot,core:{...snapshot.core,paused:true}};
fs.writeFileSync(importPath,zlib.gzipSync(JSON.stringify(packageScenarioSnapshot(paused,
  {id:'actual-mature-snow',label:'Recorded mature snow cache review'}))));
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav'};
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://local').pathname;
  if(pathname==='/proof/reference-snow.mjs'){
    response.setHeader('Content-Type','text/javascript');response.end(reference);return;
  }
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
  if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  fs.readFile(file,(error,data)=>{
    if(error){response.writeHead(404);response.end();return}
    response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(data);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.USERPROFILE,
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
let browser;
try{
  browser=await chromium.launch({headless:false});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>!!window.__GENVO8__?.saveManager);
  await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
  await page.locator('#newWorldStartingPoint').selectOption('import');
  await page.locator('#newWorldScenarioFile').setInputFiles(importPath);
  await page.locator('#newWorldCreature').selectOption('recorded');
  await page.locator('#newWorldMovementRules').selectOption('recorded');
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
  await page.waitForFunction(({seed,tick})=>{
    const g=window.__GENVO8__;
    return document.querySelector('#frontEnd')?.hidden&&g?.sim.seed===seed&&
      g.renderer.sceneShown&&!g.saveManager.busy&&g.saveManager.lastSavedTick>=tick;
  },{seed:snapshot.seed,tick:snapshot.core.tickCount},{timeout:120000});
  const begin=page.getByRole('button',{name:"LET'S BEGIN",exact:true});
  if(await begin.isVisible())await begin.click();
  await page.keyboard.press('Escape');
  await page.locator('.menu-view[data-screen="pause"] [data-action="resume"]').waitFor({state:'visible'});
  const result=await page.evaluate(async()=>{
    const original=await import('/proof/reference-snow.mjs');
    const current=await import('/src/render/snow-ground-art.js');
    const {snowCover}=await import('/src/world/snowpack.js');
    const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js');
    const {encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    const g=window.__GENVO8__,sim=g.sim,world=sim.world,actor=sim.player();
    if(!sim.paused||sim.tickInProgress)throw Error('Review requires a complete paused world');
    const state=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,
      {savedAt:'snow-window-exact-state',reason:'snow-window-review'})));
    const before=state(),width=46,height=30;
    const x0=Math.max(0,Math.min(world.n-width-2,Math.floor(actor.x)-width/2));
    const y0=Math.max(0,Math.min(world.n-height-2,Math.floor(actor.y)-height/2));
    const windows=[[x0,y0],[x0+1,y0],[x0,y0],[x0,y0+1],[x0+1,y0+1],[x0+1,y0+1]];
    function review(width,height,windows,requireReduction=false){
      const canvases=[document.createElement('canvas'),document.createElement('canvas')];
      for(const canvas of canvases){canvas.width=width*32;canvas.height=height*32}
      original.beginSnowWindow(world,0);current.beginSnowWindow(world,0);
      const frames=[];let referencePng,candidatePng;
      for(const [index,[x,y]] of windows.entries()){
        const bounds={x0:x,y0:y,x1:x+width,y1:y+height},rows=[];
        for(const [which,module] of [original,current].entries()){
          const ctx=canvases[which].getContext('2d');ctx.clearRect(0,0,width*32,height*32);
          const previous=module.snowGroundArtStats(world).builds,start=performance.now();
          module.beginSnowWindow(world,width*height,bounds);
          let drawn=0;
          for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++){
            if(module.drawSnowGround(ctx,{world,x:xx,y:yy,px:(xx-x)*32,py:(yy-y)*32,
              tile:32,waterMask:g.renderer.visualWaterMask(xx,yy)}))drawn++;
          }
          const stats=module.snowGroundArtStats(world);
          rows.push({drawn,builds:stats.builds-previous,entries:stats.entries,capacity:stats.capacity,
            paintMs:performance.now()-start});
        }
        const a=canvases[0].getContext('2d').getImageData(0,0,width*32,height*32).data;
        const b=canvases[1].getContext('2d').getImageData(0,0,width*32,height*32).data;
        let changedBytes=0;for(let k=0;k<a.length;k++)if(a[k]!==b[k])changedBytes++;
        if(changedBytes)throw Error('Snow pixels changed at window '+index+': '+changedBytes);
        if(!rows[0].drawn||rows[0].drawn!==rows[1].drawn)throw Error('Missing actual snow or drawing mismatch');
        if(rows[1].entries>width*height)throw Error('Artwork exceeded the actual window bound');
        frames.push({index,bounds,original:rows[0],candidate:rows[1],changedBytes});
        if(index===1){referencePng=canvases[0].toDataURL();candidatePng=canvases[1].toDataURL()}
      }
      // Right/down scans can naturally evict outgoing cells in LRU order.
      // The reverse (left) pan inserts before a still-needed cached cell.
      if(requireReduction&&frames[2].candidate.builds>=frames[2].original.builds)throw Error('Dense actual left pan did not reduce texture rebuilding');
      if(frames.at(-1).candidate.builds!==0)throw Error('Unchanged window rebuilt textures');
      return {frames,referencePng,candidatePng};
    }
    const wide=review(width,height,windows);
    // A sparse window need not fill the old cache, so it requires pixel parity
    // rather than an invented improvement. Separately find a real dense 5x5
    // patch for the full-cache 4x4 pan case; never alter physical snow stocks.
    let dense=null;
    for(let y=0;y<world.n-5&&!dense;y++)for(let x=0;x<world.n-5;x++){
      let complete=true;
      for(let dy=0;dy<5&&complete;dy++)for(let dx=0;dx<5;dx++){
        const i=world.idx(x+dx,y+dy);
        if(world.water[i]||snowCover(world,i)<.25){complete=false;break}
      }
      if(complete){dense={x,y};break}
    }
    if(!dense)throw Error('Recorded input has no actual dense snow patch for the full-cache counterexample');
    const {x,y}=dense,small=review(4,4,[[x,y],[x+1,y],[x,y],[x,y+1],[x+1,y+1],[x+1,y+1]],true);
    if(state()!==before)throw Error('Painting changed complete canonical state');
    return {tick:sim.tickCount,day:sim.day,living:sim.animals.filter(a=>a.alive).length,
      wideFrames:wide.frames,denseFrames:small.frames,completeStateExact:true,
      referencePng:wide.referencePng,candidatePng:wide.candidatePng};
  });
  assert.deepEqual(errors,[]);
  for(const [name,data] of [['reference',result.referencePng],['candidate',result.candidatePng]])
    fs.writeFileSync(path.join(out,name+'-pan.png'),Buffer.from(data.split(',')[1],'base64'));
  delete result.referencePng;delete result.candidatePng;
  const receipt={scope:'Visible Chromium, actual recorded Day321 world imported through native controls. Paused read-only rendering at six wide and six dense controlled camera-window positions; exact RGBA comparison and complete canonical graph equality. No actor relocation, biological stock edit, direct time stepping or human usability acceptance.',
    referenceCommit,referenceSourceSha256:createHash('sha256').update(source).digest('hex'),
    inputSha256:createHash('sha256').update(bytes).digest('hex'),...result,errors};
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));
  console.log(JSON.stringify(receipt,null,2));
}catch(error){fs.writeFileSync(path.join(out,'failure.txt'),error.stack||String(error));throw error}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
