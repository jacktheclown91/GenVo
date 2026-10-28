// Native controlled turn fixture, using real artwork and an unchanged world.
// Usage: node tools/review-turn-cadence.mjs <source root> <fresh output> [seed] [creature]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{
  playwright=require(path.join(process.env.USERPROFILE,
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
if(!process.argv[2]||!process.argv[3])throw Error('Supply source root and fresh evidence directory');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const seed=process.argv[4]||'GENVO8-TEST-A',creature=process.argv[5]||'recorded';
if(fs.existsSync(out))throw Error('Never overwrite an earlier review');
fs.mkdirSync(out,{recursive:true});
const mime={'.mjs':'text/javascript','.js':'text/javascript','.json':'application/json',
  '.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml',
  '.ogg':'audio/ogg','.m4a':'audio/mp4','.wav':'audio/wav','.gz':'application/gzip'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://local').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
  fs.readFile(target,(error,bytes)=>{
    if(error){response.writeHead(404);response.end();return}
    response.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');
    response.end(bytes);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await playwright.chromium.launch();
  const context=await browser.newContext({viewport:{width:960,height:540},
    recordVideo:{dir:out,size:{width:960,height:540}}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.__GENVO8__?.saveManager&&
    window.__GENVO8__.nativeArtStatus().status==='ready');
  await page.getByRole('button',{name:'New World',exact:true}).click();
  await page.locator('#newWorldCreature').selectOption(creature);
  await page.locator('#newWorldSeed').fill(seed);
  await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(seed=>document.querySelector('#frontEnd')?.hidden&&
    window.__GENVO8__.sim.seed===seed,seed,{timeout:60000});
  await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
  for(let i=0;i<8;i++){
    const blocked=await page.evaluate(()=>{
      const tutorial=window.__GENVO8__.tutorial;
      return tutorial.worldInputBlocked()&&['welcome','briefing'].includes(tutorial.stage);
    });
    if(!blocked)break;
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(1500);
  await page.getByRole('button',{name:'Game utilities',exact:true}).click();
  await page.locator('button[data-action=autonomy]').click();
  await page.getByRole('button',{name:'Game utilities',exact:true}).click();
  await page.keyboard.press('p');

  const proof=await page.evaluate(async()=>{
    const g=window.__GENVO8__;
    const [{Renderer},{default:before},{drawGenvoSprite},{phenotypeFor},{creaturePalette},{createSimulationSnapshot},{encodeSnapshotGraph}]=await Promise.all([
      import('/src/render/renderer.js'),import('/tests/fixtures/turn-cadence-before-629ad29a.mjs'),
      import('/src/render/genvo-draw.js'),import('/src/organisms/species.js'),import('/src/render/creature-palette.js'),
      import('/src/persistence/save-manager.js'),import('/src/persistence/scenario-codec.js')]);
    if(!g.sim.paused)throw Error('Public pause did not stop the world');
    const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'fixed',reason:'turn-presentation'})));
    const saved=snapshot(),animal=g.sim.player(),ph=phenotypeFor(animal),palette=creaturePalette(ph);
    const times=[16,33,50,80,100,116,250,266,283,300,320],checkpoints=new Set([80,250,283,320]);
    const oldState={renderNow:0},newState={renderNow:0};before.call(oldState,animal.id,0);Renderer.prototype.easedDir.call(newState,animal.id,0);
    const rows=[];
    for(const time of times){oldState.renderNow=time;newState.renderNow=time;
      const oldFacing=before.call(oldState,animal.id,4),newFacing=Renderer.prototype.easedDir.call(newState,animal.id,4);
      if(checkpoints.has(time))rows.push({time,oldFacing,newFacing});
    }
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=440;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#17251e';c.fillRect(0,0,960,440);
    c.fillStyle='#eadba3';c.font='18px sans-serif';c.fillText('Same native creature: controlled eight-facing turn after a delayed frame',18,28);
    c.font='15px sans-serif';c.fillText('Published turn cadence',18,60);c.fillText('Elapsed-time turn cadence',18,250);
    rows.forEach((row,index)=>{
      const x=120+index*235;c.fillStyle='#cbd9bb';c.fillText(row.time+' ms',x-30,82);
      for(const [y,dir] of [[150,row.oldFacing],[340,row.newFacing]]){
        c.save();c.translate(x,y);drawGenvoSprite(c,{animal,phenotype:ph,scale:4,frame:2,palette,pose:{dir,life:{blink:false}}});c.restore();
        c.fillStyle='#cbd9bb';c.fillText('Facing '+dir,x-30,y+73);
      }
    });
    const stateExact=saved===snapshot();if(!stateExact)throw Error('Presentation changed canonical state');
    if(rows.at(-1).oldFacing===4||rows.at(-1).newFacing!==4)throw Error('Before/after cadence contrast missing');
    return{scope:'Native authored sprite presentation fixture using an actual ordinary-world creature. Only diagnostic facing targets and frame timestamps are controlled; no organism, anatomy, topology or gameplay field changes.',rows,stateExact,nativeArt:g.nativeArtStatus().status,body:animal.bodyPlan.id,png:canvas.toDataURL('image/png')};
  });
  fs.writeFileSync(path.join(out,'native-turn-comparison.png'),Buffer.from(proof.png.split(',')[1],'base64'));delete proof.png;
  proof.errors=errors;if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
  await page.close();await context.close();
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
