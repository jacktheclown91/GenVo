const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]);assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});const receipt={errors:[],creatorAcceptance:false};
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.m4a':'audio/mp4'})[path.extname(f)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1366,height:768},recordVideo:{dir:out}}),page=await context.newPage();page.on('pageerror',e=>receipt.errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__GENVO8__?.saveManager);
  await page.getByRole('button',{name:'New World',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#newWorldStartCards [data-start]').length>1);
  if(await page.locator('#newWorldAdvanced').getAttribute('open')===null)await page.locator('#newWorldAdvanced summary').click();
  await page.locator('#newWorldSeed').fill('PLANTED-TOE-TURNS');await page.getByRole('button',{name:'Begin World',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#frontEnd').hidden&&window.__GENVO8__.sim.seed==='PLANTED-TOE-TURNS',null,{timeout:60000});
  await page.evaluate(()=>window.__GENVO8__.renderer.sceneReady());
  for(let i=0;i<8;i++){if(!await page.evaluate(()=>{const t=window.__GENVO8__.tutorial;return t.worldInputBlocked()&&['welcome','briefing'].includes(t.stage)}))break;await page.keyboard.press('Enter')}
  await page.evaluate(async()=>{
   const g=window.__GENVO8__,{GroundContactTracker}=await import('/src/render/ground-contacts.js'),{loadPartArtVariant}=await import('/src/render/part-art-variants.js'),{setPartArtPreview}=await import('/src/render/runtime-part-art.js');
   const parts=(await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution:64})).parts;
   const stats={held:0,playerTurning:0,npcTurning:0,maxHeldYawChange:0,maxWorldDrift:0,samples:0,costMs:0,ids:new Set()},begin=GroundContactTracker.prototype.begin;
   const details=[];for(const [id,art] of parts)if(art.drawLimb){parts.set(id,{...art,drawLimb(c,args){const f=args.footForward,a=(args.facing-2)*Math.PI/4;if(f&&args.frameIndex===0&&f.x*Math.cos(a)+f.y*Math.sin(a)<.95&&details.length<1)details.push({id,args:structuredClone(args)});return art.drawLimb(c,args)}})}
   setPartArtPreview(parts);
   GroundContactTracker.prototype.begin=function(options){const frame=begin.call(this,options);if(frame&&!frame.reviewWrapped){frame.reviewWrapped=true;const resolve=frame.resolve;frame.resolve=function(leg,points){const key=leg.slot??leg.index,existing=this.memo.has(key),entry=this.state.legs?.get(key),prior=entry?{heading:entry.heading,planted:entry.planted}:null,start=performance.now(),result=resolve.call(this,leg,points);if(!existing&&!g.sim.paused){stats.costMs+=performance.now()-start;stats.samples++;if(this.mode==='walk'&&prior?.planted&&result.leg.planted){stats.held++;stats.maxHeldYawChange=Math.max(stats.maxHeldYawChange,Math.abs(entry.heading-prior.heading));stats.maxWorldDrift=Math.max(stats.maxWorldDrift,Math.hypot(this.state.x+result.foot.x/this.state.units-entry.anchor.x,this.state.y+result.foot.y/this.state.units-entry.anchor.y));const f=result.leg.footForward;if(f.x*this.forward.x+f.y*this.forward.y<.95){const animal=g.sim.animals.find(a=>a.id===this.state.id);stats[animal?.player?'playerTurning':'npcTurning']++;stats.ids.add(this.state.id)}}}return result;}}return frame;};
   window.__toeReview={stats,details,parts,restore(){GroundContactTracker.prototype.begin=begin}};
  });
  for(const key of ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','ArrowLeft']){await page.keyboard.down(key);await page.waitForTimeout(650);await page.keyboard.up(key)}
  await page.screenshot({path:path.join(out,'actual-turning.png')});await page.waitForTimeout(1800);await page.keyboard.press('p');await page.waitForFunction(()=>window.__GENVO8__.sim.paused);
  await page.waitForFunction(()=>{const g=window.__GENVO8__;return !g.sim.familyControlStatus?.()?.unlocked||g.sim.familyControlExplained},null,{timeout:20000});
  const result=await page.evaluate(async()=>{
   const g=window.__GENVO8__,r=window.__toeReview,{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
   const snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'toe-heading'}))),before=snap();for(let i=0;i<4;i++)g.renderer.render();
   const detail=r.details[0];let png=null;if(detail){const cv=document.createElement('canvas');cv.width=640;cv.height=320;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#14251d';c.fillRect(0,0,640,320);const art=r.parts.get(detail.id),a=(detail.args.facing-2)*Math.PI/4;
    for(let col=0;col<2;col++){c.fillStyle='#ddd3b8';c.font='15px sans-serif';c.fillText(col?'Held sole heading':'Previous: follows body heading',col*320+12,25);c.save();c.translate(col*320+160,175);c.scale(5,5);c.translate(-detail.args.knee.x,-detail.args.knee.y);art.drawLimb(c,{...detail.args,footForward:col?detail.args.footForward:{x:Math.cos(a),y:Math.sin(a)}});c.restore()}png=cv.toDataURL()}
   r.restore();return{stats:{...r.stats,ids:[...r.stats.ids],meanResolveMs:r.stats.costMs/r.stats.samples},stateExact:before===snap(),detail,png};
  });
  if(result.png)fs.writeFileSync(path.join(out,'actual-foot-detail.png'),Buffer.from(result.png.split(',')[1],'base64'));delete result.png;
  assert.ok(result.stats.held>0&&result.stats.playerTurning>0&&result.stats.npcTurning>0);assert.equal(result.stats.maxHeldYawChange,0);assert.ok(result.stats.maxWorldDrift<1e-10);assert.ok(result.stateExact);assert.deepEqual(receipt.errors,[]);
  receipt.result=result;receipt.scope='Ordinary new world, public keyboard turns, unmodified autonomous wildlife and actual optional64 artwork. Detail uses an actual captured held foot enlarged5x for inspection; before changes only distal heading. No biological movement or event fields staged. Not full-world performance or creator acceptance.';
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({status:'PASS',...result.stats,stateExact:result.stateExact}));await context.close();
 }catch(e){receipt.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
