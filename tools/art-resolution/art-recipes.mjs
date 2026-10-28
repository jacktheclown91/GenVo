// Original code-authored pixel studies. Coordinates describe anatomical tissue in
// 32-unit part space; each output is rasterized natively, never resized from 32px.
// AI-assisted artwork; no external images or human source pixels are overwritten.
export const STUDY_PARTS=Object.freeze([
  'small-torso','soft-torso','dome-torso','head-base','walking-leg','runner-leg',
  'sturdy-leg','simple-eye','compound-eye','grazing-mouth','beak-mouth',
  'fur-mantle','feather-mantle','shell-back','balance-tail'
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ellipse=(x,y,cx,cy,rx,ry)=>Math.hypot((x-cx)/rx,(y-cy)/ry);
const distance=(x,y,a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);
  return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
};
function paint(id,x,y,facing,index,resolution){
  const angle=(facing-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle);
  const dx=x-16,dy=y-16,u=dx*co+dy*si,v=-dx*si+dy*co;
  const fine=32/resolution; // smallest actual authored pixel, not an enlargement.
  if(id.endsWith('torso')||id==='head-base'){
    const head=id==='head-base',rx=head?11.7:10.8,ry=head?10.5:9.8;
    const q=ellipse(u,v,head?.5:0,0,rx,ry);
    if(q>1)return null;
    if(q>1-.65/rx)return 0;
    // Clustered volume: a broad top-left shoulder highlight, curved terminator
    // and a cool lower rim. Fine detail follows tissue instead of a dot grid.
    const light=.38+.68*Math.sqrt(1-q*q)-.25*dy/ry-.16*dx/rx;
    const grain=.035*Math.sin(u*2.7+Math.sin(v*1.9))*.5;
    let tone=light+grain<.56?1:light+grain<.80?2:light+grain<1.12?3:4;
    const fold=Math.abs(v-.65*Math.sin(u*.32))<.18&&u<-2;
    if(fold&&q>.55)tone=Math.max(1,tone-1);
    if(resolution===128&&q>.70&&q<.74&&dy< -2&&dx<3)tone=4;
    return tone;
  }
  if(id.endsWith('-leg')){
    const row=y<16?8:24,lower=y>=16,slender=id==='runner-leg',heavy=id==='sturdy-leg';
    const t=clamp((x-4)/23,0,1),width=(heavy?4.5:slender?2.5:3.5)*(1-.32*t);
    const muscle=Math.sin(t*Math.PI)*(lower?.25:.8),dy=y-row;
    if(x<1||x>30||Math.abs(dy)>width+muscle)return null;
    const rim=Math.abs(dy)>width+muscle-.55||x<1.7||x>29.3;
    if(rim)return 0;
    if(x>24&&ellipse(x,y,27,row,2.3,3.1)<1)return dy<-.4?4:dy>1?1:2;
    if(Math.abs(dy+.8)<.22&&x>5&&x<23)return 4;
    if(lower&&index===1&&x>20&&Math.abs(dy)<.3)return 1;
    return dy<-width*.38?3:dy>width*.35?1:2;
  }
  if(id==='fur-mantle'){
    // Broad overlapping locks sweep toward the rump; they are not radial quills.
    let result=null;
    for(const side of [-1,1])for(let i=0;i<6;i++){
      const a=[7-i*2.7,side*(4.4+Math.sin(i)*.35)];
      const b=[.5-i*2.1,side*(9.1+Math.sin(i*2)*.8)];
      const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const t=clamp(((u-a[0])*(b[0]-a[0])+(v-a[1])*(b[1]-a[1]))/(len*len),0,1);
      const d=distance(u,v,a,b),width=(2.2+.2*Math.sin(i))*Math.sin(Math.PI*t)+.25;
      if(d>width||t<.06)continue;
      const strand=Math.sin(t*8+i+v*4)>.5;
      result=d>width-.22?0:d>width*.75?1:strand?3:v<0?4:2;
      if(resolution===128&&t>.72&&d<.18&&i%3===0)result=6;
    }
    return result;
  }
  if(id==='feather-mantle'){
    let result=null;
    for(const side of [-1,1])for(let i=0;i<6;i++){
      const a=[6-i*2.3,side*4],b=[1-i*2.1,side*(9.5+i*.55)];
      const len=Math.hypot(b[0]-a[0],b[1]-a[1]),t=clamp(((u-a[0])*(b[0]-a[0])+(v-a[1])*(b[1]-a[1]))/(len*len),0,1);
      const d=distance(u,v,a,b),width=2.0*Math.sin(Math.PI*t)+.30;
      if(d>width)continue;
      const shaft=d<fine*.7,barb=Math.sin(t*len*8+side*d*7)>.45;
      result=d>width-.22?0:shaft?7:barb?3:1;
    }
    return result;
  }
  if(id==='shell-back'){
    const q=ellipse(u,v,0,0,13,11);
    if(q>1)return null;if(q>.96)return 0;
    // Broad overlapping scutes on a domed surface. Offset seams and a broken
    // marginal ridge read as keratin, rather than concentric target rings.
    const row=Math.floor((v+12)/5.5),col=(u+18+(row%2)*3.6)%7.2;
    const seam=col<.20||Math.abs((v+12)%5.5)<.18;
    if(seam&&q<.88)return 1;
    if(q>.86&&q<.91)return dy<0?3:1;
    const light=.32+.75*Math.sqrt(1-q*q)-.25*dy/11-.16*dx/13;
    return light<.56?1:light<.80?2:light<1.12?3:4;
  }
  if(id==='balance-tail'){
    const sway=index===1?.7:0,axis=1.1*Math.sin((u+10)*.14)+sway;
    const width=2.5*(1-clamp((-u)/15,0,1))+.45;
    if(u>1||u<-14||Math.abs(v-axis)>width)return null;
    return Math.abs(v-axis)>width-.3?0:v<axis-.3?3:v>axis+.6?1:2;
  }
  if(id.includes('eye')){
    const q=ellipse(u,v,0,0,7,6);
    if(q>1)return null;if(q>.90)return 0;
    if(id==='compound-eye'){
      const band=Math.floor((u+12)/2),cy=(v+12+(band%2))*1.3;
      if(Math.abs((u+12)%2-1)<.17||Math.abs(cy%2-1)<.18)return 6;
      return u+v<-2?7:u+v>6?6:8;
    }
    if(ellipse(u,v,1.4,0,4.1,4.7)<1){
      if(ellipse(u,v,.4,-1.8,1.1,1.1)<1)return 8;
      return ellipse(u,v,1.7,.3,2.1,3.1)<1?6:7;
    }
    return v<-1?4:3;
  }
  if(id==='grazing-mouth'||id==='beak-mouth'){
    const beak=id==='beak-mouth',w=beak?9-((u+6)/2):7;
    if(u< -6||u>9||Math.abs(v)>Math.max(.6,w*.45))return null;
    if(Math.abs(v)<.25)return 0;
    return beak?(v<-.7?6:5):(v<0?4:1);
  }
  throw Error('Missing artwork recipe '+id);
}
export function authorStudyPart(source,resolution){
  if(![64,128].includes(resolution)||!STUDY_PARTS.includes(source.partId))throw Error('Unsupported study');
  const ratio=resolution/32,scale=value=>Array.isArray(value)?value.map(scale):typeof value==='number'?value*ratio:value;
  const rig=source.rig?structuredClone(source.rig):undefined;
  if(rig){
    if(rig.bodyBoundsPx)rig.bodyBoundsPx=scale(rig.bodyBoundsPx);
    for(const key of ['upper','lower','jointSurface','hipSurface'])if(rig[key])for(const field of ['rect','start','end','anchor'])if(rig[key][field])rig[key][field]=scale(rig[key][field]);
  }
  const regions=source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors}));
  const frames=[];
  for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
    const indices=[],alpha=[];
    for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
      const tone=paint(source.partId,(x+.5)/ratio,(y+.5)/ratio,facing,index,resolution);
      indices.push(tone??0);alpha.push(tone===null?0:255);
    }
    frames.push({state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index)?.durationMs||320,indices,alpha});
  }
  return{partId:source.partId,version:1,width:resolution,height:resolution,
    displayScale:(source.displayScale??1)/ratio,rootAnchorPx:scale(source.rootAnchorPx),
    ...(source.rootJoint?{rootJoint:source.rootJoint}:{}),...(source.expressionScale?{expressionScale:source.expressionScale}:{}),
    ...(rig?{rig}:{}),regions,frames};
}
