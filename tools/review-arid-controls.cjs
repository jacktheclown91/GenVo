const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const root=process.cwd(),out=path.resolve(process.argv[2]||'docs/arid-presentation-2026-10-29/controlled');if(fs.existsSync(out))throw Error('Use a fresh directory');fs.mkdirSync(out,{recursive:true});
 const receipt={errors:[],creatorAcceptance:false,scope:'Explicit controlled hot/dry physiological fixture in an isolated browser, canonical Simulation/action execution and actual native sprite/control classes. No natural drought-dormancy field observation is claimed.'};
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');if(u.pathname==='/fixture.html'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><link rel="stylesheet" href="/styles.css"><div id="app"><div id="hud"></div><nav id="quickMenu"></nav><canvas id="fixture" width="1280" height="720"></canvas></div>')}
  const f=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.gz':'application/gzip'})[path.extname(f)]||'application/octet-stream');res.end(b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>receipt.errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/fixture.html');
  receipt.setup=await page.evaluate(async()=>{
   const {Simulation}=await import('/src/sim/simulation.js'),{makePlan}=await import('/src/lineage/body-plan.js'),{founderPlan}=await import('/src/lineage/body-inheritance.js'),{SPECIES,phenotypeFor}=await import('/src/organisms/species.js');
   const {loadNativePartCatalog}=await import('/src/render/runtime-part-art.js');await loadNativePartCatalog();
   const {CreatureContextTray}=await import('/src/ui/creature-context-tray.js'),{drawGenvoSprite}=await import('/src/render/genvo-draw.js'),{creaturePalette}=await import('/src/render/creature-palette.js'),{aridVisualState}=await import('/src/render/arid-presentation.js'),{visualLifeState}=await import('/src/render/life.js'),{behaviorVisualState}=await import('/src/render/behavior.js'),{loadPartArtVariant}=await import('/src/render/part-art-variants.js');
   const {createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
   const sim=new Simulation('CONTROLLED-ARID-NATIVE',{player:true,dayClock:true,metabolism:true,aridPhysiology:true}),a=sim.player(),w=sim.world;
   a.bodyPlan=makePlan([...founderPlan().nodes.map(n=>({partId:n.parent?n.partId:'soft-torso',parent:n.parent,socket:n.socket})),{partId:'heat-frill',parent:'root',socket:'dorsal'},{partId:'wax-plates',parent:'root',socket:'flank.left'},{partId:'fat-pad',parent:'root',socket:'flank.right'}]);
   Object.assign(a,{age:SPECIES.genvo.maturity+2,health:100,pregnant:null,infected:false,energy:SPECIES.genvo.maxEnergy*.9,hydration:SPECIES.genvo.maxHydration*.5,genes:{...a.genes,climate:1}});sim.animals=[a];sim.rebuildSpatial();
   const i=w.idx(a.x,a.y);w.water[i]=0;w.temperature[i]=.98;w.moisture[i]=.08;w.waterDistance[i]=99;sim.coverAt=()=>.6;
   const canvas=document.getElementById('fixture'),c=canvas.getContext('2d'),results=[],maps={32:null};for(const resolution of [64,128])maps[resolution]=Object.fromEntries((await loadPartArtVariant(new URL('/assets/art/production-candidate-v1/catalog.json',location.href),{resolution})).parts);
   const snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(sim,{savedAt:'controlled-arid'})));
   const paint=()=>{c.fillStyle='#172c20';c.fillRect(0,0,1280,720);c.fillStyle='#f0dfad';c.font='20px Georgia';c.fillText('Controlled hot / dry anatomy study — not a natural field observation',24,36);
    const life=visualLifeState(sim,a,{action:a.torpor?'rest':'idle',moving:false,timeSeconds:2}),behavior=behaviorVisualState({bodyPlan:a.bodyPlan,id:a.id,action:a.torpor?'rest':'idle',life});
    for(const [column,resolution] of [32,64,128].entries())for(const [row,enabled] of [false,true].entries()){
     const x=210+column*400,y=185+row*235;c.fillStyle='#d9d5b7';c.font='14px sans-serif';c.fillText(resolution+'px · '+(enabled?'actual hot/dry signal':'neutral appearance'),x-150,y-95);
     c.save();c.translate(x,y);drawGenvoSprite(c,{animal:a,phenotype:phenotypeFor(a),scale:5,frame:0,moving:false,authoredParts:maps[resolution]||undefined,palette:creaturePalette(phenotypeFor(a)),pose:{dir:2,action:a.torpor?'rest':'idle',arid:enabled?aridVisualState(sim,a):null,life,behavior}});c.restore();
    }
   };
   const renderer={canvas,sim,w:1280,h:720,screenPos:new Map(),screenBounds:new Map()},tray=new CreatureContextTray({canvas,renderer,getSim:()=>sim,blocked:()=>false,stageBlocked:()=>false,onResult:r=>{results.push(r);tray.lastResourceAt=-Infinity;tray.update();paint()}});
   tray.update();paint();const saved=snapshot();tray.lastResourceAt=-Infinity;tray.update();paint();if(snapshot()!==saved)throw Error('Read/paint changed the full fixture state');
   // Exercise the real sprite cache with exactly the same caller key across a
   // physiological state switch. Surface color changes must invalidate it.
   const probe=document.createElement('canvas');probe.width=probe.height=256;const dc=probe.getContext('2d'),pixels=arid=>{dc.clearRect(0,0,256,256);dc.save();dc.translate(128,128);drawGenvoSprite(dc,{animal:a,phenotype:phenotypeFor(a),scale:5,frame:0,moving:false,palette:creaturePalette(phenotypeFor(a)),cacheKey:'same-controlled-key',frozenPose:true,pose:{dir:2,action:'idle',arid}});dc.restore();return Array.from(dc.getImageData(0,0,256,256).data)};
   const neutral=pixels(null),active=pixels(aridVisualState(sim,a));if(!active.some((v,j)=>j%4!==3&&v!==neutral[j]))throw Error('Native cache hid conditional paint');for(let j=3;j<active.length;j+=4)if(active[j]!==neutral[j])throw Error('Conditional paint changed geometry');
   window.__aridFixture={sim,a,tray,results,snapshot,paint};return{signal:aridVisualState(sim,a),stateExact:true,cacheInvalidated:true,alphaExact:true};
  });
  await page.screenshot({path:path.join(out,'hot-dry-neutral-current.png')});const button=page.locator('[data-command="torpor"]');assert.equal(await button.isEnabled(),true);assert.match(await button.textContent(),/Drought dormancy/);await button.click();
  receipt.entered=await page.evaluate(()=>({torpor:window.__aridFixture.a.torpor,kind:window.__aridFixture.a.torporKind,result:window.__aridFixture.results.at(-1)}));assert.equal(receipt.entered.kind,'aestivation');assert.equal(receipt.entered.result.ok,true);await page.screenshot({path:path.join(out,'aestivation-entered.png')});
  assert.match(await button.textContent(),/Wake/);await button.click();receipt.woke=await page.evaluate(()=>({torpor:window.__aridFixture.a.torpor,kind:window.__aridFixture.a.torporKind??null,result:window.__aridFixture.results.at(-1)}));assert.equal(receipt.woke.torpor,false);assert.equal(receipt.woke.kind,null);
  assert.deepEqual(receipt.errors,[]);receipt.status='PASS';fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));console.log('Controlled arid native PASS: real heat/wax paint, same-key cache invalidation, exact alpha/save graph, actual drought button entry and wake.');
 }catch(e){receipt.failure=e.message;fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
