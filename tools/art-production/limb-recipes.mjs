// Native indexed anatomical tissue for the existing two-bone mounting contract.
export const LIMB_PARTS=Object.freeze(['walking-leg','runner-leg','sturdy-leg','padded-leg']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function ellipse(x,y,cx,cy,rx,ry){return Math.hypot((x-cx)/rx,(y-cy)/ry)}
function crossSection(id,x,row){
 const runner=id==='runner-leg',sturdy=id==='sturdy-leg',padded=id==='padded-leg';
 if(row===0){
  const muscle=runner?2.65:sturdy?5.05:padded?4.7:4.15,shaft=runner?1.15:sturdy?2.9:padded?2.25:1.8;
  const belly=muscle*Math.sqrt(Math.max(0,1-((x-9)/8.1)**2));
  const tendon=x>=7&&x<=27?shaft*(1-.25*clamp((x-16)/10,0,1)):0;
  const joint=(runner?1.9:sturdy?3.75:padded?3.2:2.6)*Math.sqrt(Math.max(0,1-((x-26.1)/(runner?2.6:3.1))**2));
  return Math.max(belly,tendon,joint);
 }
 const shaft=runner?1.3:sturdy?3.15:padded?2.3:2.0;
 return x>=3&&x<=23?shaft*(padded?1:(.8+.2*Math.cos((x-5)*.17))):0;
}
function footShape(id,x,y,index){
 if(id==='padded-leg'){
  // A broad compliant heel joins three rounded digital cushions. No claws,
  // webbing or fur are implied by this bare padded-limb anatomy.
  const heel=1-ellipse(x,y,21.5,0,3.2,2.8);
  let cushion=-1;
  for(const offset of [-2.6,0,2.6]){
   const center=25.7-(index?.8:0),spread=offset*(index?.83:1);
   cushion=Math.max(cushion,1-ellipse(x,y,center,spread,2.4,index?.86:1.0));
  }
  return Math.max(heel,cushion);
 }

 const sturdy=id==='sturdy-leg',runner=id==='runner-leg';
 const heel=ellipse(x,y,21.6,0,sturdy?3.3:2.4,sturdy?3.0:runner?1.5:2.1);
 if(heel<=1)return 1-heel;
 // Individual forward digital pads; recovery tissue flexes toward the shared ankle.
 const offsets=runner?[-1,0,1]:sturdy?[-2.4,0,2.4]:[-1.6,0,1.6];
 let best=-1;
 for(let i=0;i<offsets.length;i++){
  const length=runner?(i===1?6.2:4.5):sturdy?5.1:(i===1?5.4:4.7),start=23,end=start+length-(index?1.0:0),cy=offsets[i]*(index?.72:1),ry=sturdy?1.0:runner?.48:.65;
  const q=ellipse(x,y,(start+end)/2,cy,(end-start)/2+1,ry);best=Math.max(best,1-q);
 }
 return best;
}
function toneAt(id,x,y,row,index,facing,pixel){
 const width=crossSection(id,x,row),foot=row===1&&x>19?footShape(id,x,y,index):-1;
 const within=width>0&&Math.abs(y)<width,atFoot=foot>=0;
 if(!within&&!atFoot)return null;
 const edge=atFoot&&x>23?foot:width-Math.abs(y);
 if(edge<(atFoot&&x>23?.12:.28))return 0;
 const lightSide=Math.cos((facing-2)*Math.PI/4)>=0?-1:1,v=y*lightSide;
 if(id==='padded-leg'){
  // Soft tissue reads through broad quiet planes, not the wiry fascicles of
  // runners. Keep native ankle and digital creases distinct at game zoom.
  if(row===1&&x>23){
   if(foot<.16)return 0;
   if(x<24.4&&Math.abs(y)<2.4)return 1;
   return v<-.3?3:v<.65?2:1;
  }
  if(row===0&&x>23&&Math.abs(ellipse(x,y,26.1,0,2.8,2.7)-.75)<pixel*.15)return 1;
  if(row===1&&x>19&&Math.abs(x-22.2-y*.3)<pixel*.7)return 1;
  const plane=v/Math.max(.5,width);
  if(row===0&&x>24.5&&x<27&&v>-.9&&v<-.4)return 4;
  return plane>.48?1:plane>-.45?2:3;
 }

 if(row===0){
  // Shoulder/hip insertion, bundled muscle belly and patellar fold are separate surfaces.
  const cap=ellipse(x,y,26.1,0,id==='runner-leg'?2:2.8,id==='sturdy-leg'?3.5:2.3);
  if(x>24&&v<0&&Math.abs(cap-.72)<.12)return v<0?1:3;
  if(x>3&&x<8&&v<0&&Math.abs(ellipse(x,y,5.8,0,2.4,3.1)-.8)<.12)return 1;
  const strand=Math.sin(x*1.1+y*.8);
  if(x>8&&x<21&&Math.abs(y-width*.18*Math.sin(x*.2))<pixel*.55)return 3;
  if(x>9&&x<22&&strand>.86&&v<width*.1)return 1;
 }else{
  if(x<8&&Math.abs(x-5.4-y*.35)<.3)return 1;
  if(x>10&&x<20&&Math.abs(y)<pixel*.65)return 3;
  if(x>20&&x<25&&Math.abs(x-22.4-y*.25)<.35)return index?1:2;
  if(x>25&&Math.abs(Math.sin((x-25)*2.6))>.94)return 1;
 }
 const normalized=v/Math.max(.4,width||2);
 let tone=normalized>.45?4:normalized>-.05?3:normalized>-.62?2:1;
 // Fine broken longitudinal fascicles and stippled highlights are authored at
 // native resolution; they are not an enlarged copy of the 32px surface.
 const grain=(Math.sin(x*4.1+Math.abs(y)*3.7)+Math.sin(x*2.2-y*5.1))*.5;
 if(x>5&&x<23&&Math.abs(y)>.3){if(grain>.62)tone=Math.min(4,tone+1);else if(grain<-.72)tone=Math.max(1,tone-1)}
 return tone;
}
const scaled=(value,ratio)=>Array.isArray(value)?value.map(v=>scaled(v,ratio)):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,scaled(v,ratio)])):typeof value==='number'?value*ratio:value;
export function authorLimbPart(source,resolution){
 if(!LIMB_PARTS.includes(source.partId)||![64,128].includes(resolution)||source.rig?.kind!=='two-bone')throw Error('Unsupported detailed limb');
 const ratio=resolution/32,frames=[];
 for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
  const indices=[],alpha=[];
  for(let py=0;py<resolution;py++)for(let px=0;px<resolution;px++){
   const x=(px+.5)/ratio,y=(py+.5)/ratio,row=y<16?0:1,tone=toneAt(source.partId,x,y-(row?24:8),row,index,facing,1/ratio);
   indices.push(tone??0);alpha.push(tone===null?0:255);
  }
  frames.push({state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index)?.durationMs||320,indices,alpha});
 }
 return{partId:source.partId,version:4,width:resolution,height:resolution,displayScale:(source.displayScale??1)/ratio,rootAnchorPx:source.rootAnchorPx.map(v=>v*ratio),rig:scaled(source.rig,ratio),regions:source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors})),frames};
}
