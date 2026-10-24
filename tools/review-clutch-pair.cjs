// Review-only: caller serves renderer.js.before as /src/render/clutch-before.js.
// Caller must freeze future animation frames after observing a genuine clutch.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function compareClutch(page,out){
 const setup=await page.evaluate(async()=>{
  const g=window.__GENVO8__,r=g.renderer,{Renderer}=await import('/src/render/clutch-before.js'),{createSimulationSnapshot}=await import('/src/persistence/save-manager.js'),{encodeSnapshotGraph}=await import('/src/persistence/scenario-codec.js');
  const snap=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(g.sim,{savedAt:'clutch-art-pair'}))),before=snap();
  if(!g.sim.eggs?.length)throw Error('No genuine clutch available after snapshot admission');
  window.__clutchPair={r,snap,before,baseline:Renderer.prototype.drawEggs,candidate:r.drawEggs,now:performance.now.bind(performance)};
  Object.defineProperty(performance,'now',{value:()=>r.lastRenderNow,configurable:true});
  return{day:g.sim.day,tick:g.sim.tickCount,eggs:g.sim.eggs.map(e=>({id:e.id,x:e.x,y:e.y,nestId:e.nestId,condition:e.condition})),nests:structuredClone(g.sim.nests||[])};
 });
 const frames={};try{
  for(const label of ['before','after','restored']){
   frames[label]=await page.evaluate(label=>{const p=window.__clutchPair,r=p.r;r.drawEggs=label==='after'?p.candidate:p.baseline;r.render();if(p.snap()!==p.before)throw Error('Clutch redraw changed full graph');const e=r.sim.eggs[0],n=r.sim.nests?.find(n=>n.id===e.nestId),x=Math.round((e.x-r.camera.x)*r.zoom*16+r.w/2),y=Math.round((e.y-r.camera.y)*r.zoom*16+r.h/2)-(n?.layer==='canopy'?7*Math.max(1,r.zoom*.75):0);if(x<48||y<48||x>r.w-48||y>r.h-48)throw Error('Clutch outside unobstructed focus bounds; ordinary camera observation needed');const focus={x:x-48,y:y-48,width:96,height:96};return{focus,pixels:Array.from(r.ctx.getImageData(focus.x,focus.y,96,96).data)}},label);
   await page.screenshot({path:path.join(out,label+'-world.png')});await page.screenshot({path:path.join(out,label+'-focus.png'),clip:frames[label].focus});
  }
  const a=frames.before.pixels,b=frames.after.pixels,z=frames.restored.pixels;let changedPixels=0;for(let i=0;i<a.length;i+=4)if(a.slice(i,i+4).some((v,k)=>v!==b[i+k]))changedPixels++;
  const result={scope:'Same retained renderer original/candidate/original clutch painter, fixed presentation time and complete canonical graph parity. All visible clutches switch together; no biological state authored.',...setup,stateParity:true,baselineStable:a.every((v,i)=>v===z[i]),changedPixels};fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify(result,null,2));assert.ok(result.baselineStable&&changedPixels>0);return result;
 }finally{await page.evaluate(()=>{const p=window.__clutchPair;p.r.drawEggs=p.candidate;Object.defineProperty(performance,'now',{value:p.now,configurable:true})})}
};
