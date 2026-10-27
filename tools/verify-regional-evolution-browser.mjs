import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

// Real IndexedDB evidence for a controlled, paid regional pregnancy. This is
// persistence verification, not a player journey or external usability trial.
assert.ok(process.argv[2], 'Supply a fresh evidence directory');
const output=path.resolve(process.argv[2]);
assert.equal(fs.existsSync(output),false,'Never overwrite an earlier receipt');
const root=path.resolve(process.argv[3]||'.');
fs.mkdirSync(output,{recursive:true});
const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{
  playwright=require(path.join(process.env.USERPROFILE,
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://local').pathname;
  if(pathname==='/proof.html'){
    response.setHeader('Content-Type','text/html');
    response.end('<!doctype html><title>Regional evolution storage proof</title><link rel="icon" href="data:,">');
    return;
  }
  const file=path.resolve(root,'.'+decodeURIComponent(pathname));
  if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  fs.readFile(file,(error,bytes)=>{
    if(error){response.writeHead(404);response.end();return}
    response.setHeader('Content-Type',file.endsWith('.json')?'application/json':'text/javascript');
    response.end(bytes);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await playwright.chromium.launch({headless:true});
  const page=await browser.newPage(),errors=[];
  await page.exposeFunction('retainGraphMismatch',(actual,expected)=>{
    fs.writeFileSync(path.join(output,'actual-graph.json'),actual);
    fs.writeFileSync(path.join(output,'expected-graph.json'),expected);
  });
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/proof.html`);
  const receipt=await page.evaluate(async()=>{
    const {createPaidRegionalMotherWorld,reachPendingRegionalBirth}=
      await import('/tests/helpers/paid-regional-mother.mjs');
    const {SaveManager,createSimulationSnapshot,restoreSimulationSnapshot}=
      await import('/src/persistence/save-manager.js');
    const {encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
    const {prepareRegionalBiology}=await import('/src/world/planetary-offscreen-biology.js');
    const {REGION_STORE,commitRegionalCheckpoint}=await import('/src/persistence/regional-records.js');
    const ensure=(condition,message)=>{if(!condition)throw Error(message)};
    // Constructor/restore may insert plain object fields in a different order.
    // Canonicalize only that order and graph node numbering. Keep every value,
    // shared reference, cycle, Map/Set order, typed array and binary byte.
    const encode=value=>{
      const graph=encodeSnapshotGraph(value),nodes=[],seen=new Map();
      const visit=entry=>{
        if(!entry||typeof entry!=='object'||!Object.hasOwn(entry,'$ref'))return entry;
        const old=entry.$ref;
        if(seen.has(old))return {$ref:seen.get(old)};
        const id=nodes.length;seen.set(old,id);nodes.push(null);
        const source=graph.nodes[old];let node={...source};
        if(source.type==='object')node.items=[...source.items]
          .sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>[key,visit(item)]);
        else if(source.type==='map')node.items=source.items.map(([key,item])=>[visit(key),visit(item)]);
        else if(source.type==='array'||source.type==='set')node.items=source.items.map(visit);
        nodes[id]=node;return {$ref:id};
      };
      const root=visit(graph.root);
      return JSON.stringify({format:graph.format,root,nodes});
    };
    const shared={},cycle={};cycle.self=cycle;
    ensure(encode({a:1,b:2})===encode({b:2,a:1}),'Field order normalization failed');
    ensure(encode({a:shared,b:shared})!==encode({a:{},b:{}}),'Comparison lost shared identity');
    ensure(encode(cycle)!==encode({self:{}}),'Comparison lost cycles');
    ensure(encode(new Set([1,2]))!==encode(new Set([2,1])),'Comparison lost collection order');
    ensure(encode(new Uint8Array([1,2]))!==encode(new Uint8Array([1,3])),'Comparison lost binary bytes');
    const fixture=createPaidRegionalMotherWorld({modern:true,inheritedPhenotype:true});
    const sim=fixture.simulation,{ticks}=reachPendingRegionalBirth(fixture);
    const manager=new SaveManager({getSim:()=>sim});
    const slot='world-regional-evolution-birth-proof';
    manager.setActiveSlot(slot);
    // This biological fixture deliberately has no controlled player. Ordinary
    // Save correctly refuses playerless worlds; use the canonical checkpoint
    // transport directly, without changing that gameplay admission rule.
    const initial=createSimulationSnapshot(sim,{reason:'actual-regional-pregnancy',savedAt:new Date().toISOString()});
    initial.meta.key=slot;initial.meta.worldName='Regional evolution birth proof';
    await commitRegionalCheckpoint(await manager.db(),initial,slot,null);
    const baseline=await manager.loadSnapshot(),baselineEncoded=encode(baseline);
    const reference=restoreSimulationSnapshot(structuredClone(baseline));
    const birth=prepareRegionalBiology(reference);
    ensure(birth?.births>0,'Actual pending gestation must produce real children');
    const capture=state=>{
      const snapshot=createSimulationSnapshot(state,{savedAt:baseline.savedAt,reason:baseline.reason});
      snapshot.meta.key=slot;snapshot.meta.worldName=baseline.meta.worldName;
      return snapshot;
    };
    const expected=capture(reference);
    const failedReader=await manager.openRegionalReader(slot,{capacity:1});
    const originalPut=IDBObjectStore.prototype.put;
    let aborted=false;
    IDBObjectStore.prototype.put=function(value,key){
      if(this.name==='saves')throw new DOMException('Controlled birth publication failure','DataCloneError');
      return originalPut.call(this,value,key);
    };
    try{await failedReader.replayNext()}catch(error){
      aborted=/Controlled birth publication/.test(error.message);
    }finally{IDBObjectStore.prototype.put=originalPut}
    ensure(aborted&&failedReader.closed&&!failedReader.resident,
      'Aborted birth must release every decoded owner');
    ensure(encode(await manager.loadSnapshot())===baselineEncoded,
      'Aborted birth must leave the complete persisted pregnancy unchanged');

    const reader=await manager.openRegionalReader(slot,{capacity:1});
    const reads=[],writes=[],originalGet=IDBObjectStore.prototype.get;
    let peakLeases=0,replay;
    IDBObjectStore.prototype.get=function(key){
      peakLeases=Math.max(peakLeases,reader.resident);
      if(this.name===REGION_STORE)reads.push(key);
      return originalGet.call(this,key);
    };
    IDBObjectStore.prototype.put=function(value,key){
      if(this.name===REGION_STORE)writes.push(key);
      return originalPut.call(this,value,key);
    };
    try{replay=await reader.replayNext()}finally{
      IDBObjectStore.prototype.get=originalGet;
      IDBObjectStore.prototype.put=originalPut;
    }
    const actual=await manager.loadSnapshot();
    if(encode(actual)!==encode(expected))await window.retainGraphMismatch(encode(actual),encode(expected));
    ensure(encode(actual)===encode(expected),'Persisted birth differs from complete canonical graph');
    ensure(reads.length===2&&writes.length===2&&peakLeases===1&&reader.closed&&!reader.resident,
      'Birth must retain bounded one-page ownership and publish only two changed owners');
    const loaded=restoreSimulationSnapshot(structuredClone(actual));
    const children=actual.core.planetaryTravel.sessions.flatMap(s=>s.snapshot.animals)
      .filter(a=>a.parentIds?.includes(fixture.motherId)&&a.parentIds?.includes(fixture.fatherId));
    ensure(children.length===birth.births,'Every actual child must remain in its physical owner');
    for(const child of children){
      ensure(!child.lineage&&loaded.evolutionTree.taxonFor(child)===fixture.branchId,
        'Actual inherited identity must survive storage without becoming a player lineage');
    }
    const noWork=await manager.openRegionalReader(slot,{capacity:1});
    ensure(await noWork.replayNext()===null,'A committed birth must not replay twice');
    noWork.close();
    for(let n=0;n<6;n++){reference.update(null);loaded.update(null)}
    ensure(encode(capture(loaded))===encode(capture(reference)),
      'Six continued ticks differ after actual IndexedDB birth');
    ensure(encode(capture(sim))===baselineEncoded,'Storage replay mutated the unrelated live world');
    (await manager.db()).close();
    return {rules:sim.autonomousEvolutionRules,preBirthTicks:ticks,births:birth.births,
      motherId:fixture.motherId,fatherId:fixture.fatherId,branchId:fixture.branchId,
      parentEnergyBefore:fixture.beforeEnergy,parentEnergyAfter:fixture.afterEnergy,
      replay,reads,writes,peakLeases,aborted,completeGraphExact:true,continuedTicks:6,
      setup:'Controlled initial adult placement, reserves, sex, inherited phenotype and prior classification. Canonical paid conception, migration and complete gestation; no forced recognition or evolutionary outcome.',
      scope:'Headless Chromium with real IndexedDB. Persistence evidence; not native player journey or external usability acceptance.'};
  });
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify({...receipt,errors},null,2));
  console.log(JSON.stringify(receipt,null,2));
}catch(error){
  fs.writeFileSync(path.join(output,'failure.txt'),error.stack||String(error));
  throw error;
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
