// Browser diagnostic: explicit private anatomy/temperature illustration only.
export async function thermalSheet(){
 const {drawGenvoSprite}=await import('../src/render/genvo-draw.js'),{phenotypeFor}=await import('../src/organisms/species.js'),{starterPlan,attachPart}=await import('./creature-lab/assembly-model.js'),{ThermalPresentation,applyThermalExpression}=await import('../src/render/thermal-expression.js'),{behaviorVisualState}=await import('../src/render/behavior.js'),{loadPartArtVariant}=await import('../src/render/part-art-variants.js');
 const live=window.__GENVO8__.sim,source=live.player(),parts=Object.fromEntries((await loadPartArtVariant(new URL('../assets/art/production-candidate-v1/catalog.json',import.meta.url),{resolution:64})).parts);
 const base=starterPlan('small-torso'),fur=attachPart(base,'root','dorsal','fur-mantle'),core=attachPart(fur,'root','flank.right','endothermic-core'),frill=attachPart(base,'root','dorsal','heat-frill');
 const subjects=[['cold bare',base,-.3],['cold fur',fur,-.3],['cold fur + core',core,-.3],['heat bare',base,1.2],['heat fur',fur,1.2],['heat frill',frill,1.2]].map(([label,bodyPlan,temperature],i)=>{
  const world=Object.create(live.world);world.temperature=live.world.temperature.slice();world.temperature.fill(temperature);
  const sim=Object.create(live);sim.world=world;
  const animal={...structuredClone(source),id:12+i,player:false,lineage:false,bodyPlan,genes:{...source.genes,climate:1},intent:'idle',torpor:false,perched:false,airborne:false,underground:false,climb:null,caveTransit:null,burrowWork:null,diveDepth:0};
  return{label,sim,animal,tracker:new ThermalPresentation()};
 });
 const palette={body:'#80a660',shade:'#405c38',light:'#b8d38e'};
 function paint(c,s,updated,time,dir){const behavior=behaviorVisualState({bodyPlan:s.animal.bodyPlan,id:s.animal.id,action:'idle',phase:0});const thermal=s.tracker.sample(s.sim,s.animal,time);if(updated)applyThermalExpression(behavior,thermal);drawGenvoSprite(c,{animal:s.animal,phenotype:phenotypeFor(s.animal),scale:6,frame:0,moving:false,authoredParts:parts,palette,pose:{dir,action:'idle',behavior}});return thermal;}
 function sheet(rows,height,title){const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=height;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#14251d';c.fillRect(0,0,1200,height);c.fillStyle='#ddd3b8';c.font='14px sans-serif';c.fillText(title,12,23);for(let col=0;col<6;col++){c.font='13px sans-serif';c.fillText(subjects[col].label,col*200+8,47);}return{canvas,c};}
 const {canvas,c}=sheet(4,840,'Controlled private physiology illustration · actual 64px modular anatomy · no live world edits');const rows=[];
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){const updated=!!(row%2),time=row<2?.19:.25,x=col*200,y=56+row*196;c.strokeStyle='#304334';c.strokeRect(x,y,200,196);c.fillStyle='#ddd3b8';c.font='13px sans-serif';c.fillText((updated?'After':'Before')+' · '+time.toFixed(2)+'s',x+8,y+18);c.save();c.translate(x+100,y+112);const thermal=paint(c,subjects[col],updated,time,2);c.restore();if(updated)rows.push({label:subjects[col].label,time,thermal});}
 const {canvas:directions,c:dc}=sheet(8,1368,'Controlled private physiology illustration · eight directions · no biological history claimed');
 for(let dir=0;dir<8;dir++)for(let col=0;col<6;col++){const x=col*200,y=56+dir*164;dc.fillStyle='#ddd3b8';dc.font='13px sans-serif';dc.fillText(['N','NE','E','SE','S','SW','W','NW'][dir],x+8,y+18);dc.save();dc.translate(x+100,y+96);paint(dc,subjects[col],true,.23,dir);dc.restore();}
 return{comparison:canvas.toDataURL(),facings:directions.toDataURL(),rows,scope:'Private cloned actor/world draw inputs with explicit temperatures and actual supported mounted parts. Not natural heat or thermogenic-shiver observations; no live simulation edits.'};
}
