// Browser-only diagnostic: private draw inputs, never a biological world replay.
export async function feedingSheet(){
 const {drawGenvoSprite}=await import('../src/render/genvo-draw.js'),{phenotypeFor}=await import('../src/organisms/species.js'),{starterPlan,attachPart}=await import('./creature-lab/assembly-model.js'),{behaviorVisualState}=await import('../src/render/behavior.js'),current=await import('../src/render/feeding-expression.js'),before=await import('./fixtures/feeding-expression-before-2026-10-28.js'),{loadPartArtVariant}=await import('../src/render/part-art-variants.js');
 const authoredParts=Object.fromEntries((await loadPartArtVariant(new URL('../assets/art/production-candidate-v1/catalog.json',import.meta.url),{resolution:64})).parts);
 const mouths=['grazing-mouth','nibbler-mouth','beak-mouth','kernel-beak','tearing-jaw','filter-mouth','sucker-mouth','gape-mouth'];
 const subjects=mouths.map((mouth,id)=>{
  const animal={id,player:true,bodyPlan:attachPart(starterPlan('small-torso'),'root','mouth',mouth),species:'genvo',alive:true,age:60,intent:'idle',genes:{body:1,motion:1,senses:1,temperament:1},adaptations:[]};
  const kind=id>=4&&id!==5?'carrion':id===5?'algae':'sunmoss',receipt=Object.freeze({actorId:id,tick:0,kind,energyGain:2,...(id<4?{removed:.2,edible:.12,tissue:id===3?'kernel':'leaf',processingCost:id===3?.5:0}:id===5?{amount:.1}:{type:'eat'})});
  if(id<4)animal.lastPlantMeal=receipt;else if(id===5)animal.lastFreshwaterMeal=receipt;
  const sim={world:{n:16},tickCount:0,lastPlayerAction:kind==='carrion'?receipt:null,foraging:{states:new Map([[id,{lastMeal:receipt}]])}};
  return{animal,sim,mode:current.feedingExpression(sim,animal).mode};
 });
 const palette={body:'#80a660',shade:'#405c38',light:'#b8d38e'};
 function paint(ctx,subject,updated,elapsed,dir,phase=3){
  const module=updated?current:before,{animal,sim}=subject,feeding=module.feedingExpression(sim,animal,{elapsedSeconds:elapsed}),behavior=behaviorVisualState({bodyPlan:animal.bodyPlan,action:'eat',phase,feeding:updated?feeding:null});
  module.applyFeedingExpression(behavior,feeding);
  drawGenvoSprite(ctx,{animal,phenotype:phenotypeFor(animal),scale:4,frame:phase,moving:false,authoredParts,palette,pose:{dir,action:'eat',behavior}});
 }
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=1152;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#14251d';ctx.fillRect(0,0,1280,1152);ctx.fillStyle='#ddd3b8';ctx.font='15px sans-serif';ctx.fillText('Private receipt replay · actual modular 64px artwork · identical world size · not observed biological meals',12,23);
 for(let col=0;col<8;col++){ctx.font='13px sans-serif';ctx.fillText(subjects[col].mode+' / '+mouths[col].replace('-mouth',''),col*160+8,47);}
 const rows=[];
 for(let stage=0;stage<4;stage++)for(const updated of [false,true])for(let col=0;col<8;col++){
  const elapsed=[.1,.35,.6,.82][stage],row=stage*2+Number(updated),x=col*160,y=64+row*136;
  ctx.strokeStyle='#304334';ctx.strokeRect(x,y,160,136);ctx.fillStyle='#ddd3b8';ctx.font='12px sans-serif';ctx.fillText((updated?'After':'Before')+' · '+elapsed.toFixed(2)+'s',x+8,y+16);
  ctx.save();ctx.translate(x+80,y+78);paint(ctx,subjects[col],updated,elapsed,2);ctx.restore();
  if(updated)rows.push({mouth:mouths[col],elapsed,mode:subjects[col].mode});
 }
 const facings=document.createElement('canvas');facings.width=1280;facings.height=1120;const fc=facings.getContext('2d');fc.imageSmoothingEnabled=false;fc.fillStyle='#14251d';fc.fillRect(0,0,1280,1120);fc.fillStyle='#ddd3b8';fc.font='14px sans-serif';fc.fillText('Current anatomy feeding · private receipt replay · eight directions · native modular 64px',12,23);
 for(let row=0;row<8;row++)for(let dir=0;dir<8;dir++){const x=dir*160,y=32+row*136;fc.fillStyle='#ddd3b8';fc.font='12px sans-serif';fc.fillText(subjects[row].mode+' '+['N','NE','E','SE','S','SW','W','NW'][dir],x+8,y+16);fc.save();fc.translate(x+80,y+76);paint(fc,subjects[row],true,.42,dir);fc.restore();}
 const scratch=document.createElement('canvas');scratch.width=scratch.height=180;const sc=scratch.getContext('2d'),timings=[];
 // Alternate old/new to reduce order bias; all art and target canvases are reused.
 const samples=[[],[]];for(let i=0;i<36;i++)for(const updated of i%2?[true,false]:[false,true]){const start=performance.now();for(const subject of subjects){sc.clearRect(0,0,180,180);sc.save();sc.translate(90,90);paint(sc,subject,updated,.42,2);sc.restore();}if(i>=6)samples[Number(updated)].push(performance.now()-start);}
 for(const updated of [false,true]){const values=samples[Number(updated)].sort((a,b)=>a-b);timings.push({updated,medianMs:values[15],p95Ms:values[28],samples:values.length,spritesPerSample:8});}
 return{comparison:canvas.toDataURL(),facings:facings.toDataURL(),rows,timings,scope:'Explicit private receipt replay, actual canonical modular draw/64px assets; missing live carnivore/filter/suction events are not claimed. Timings measure uncached eight-sprite composition, not full-world FPS.'};
}
