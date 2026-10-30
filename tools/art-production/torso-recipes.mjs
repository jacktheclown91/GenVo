// Native indexed torso tissue. Broad contours survive normal gameplay zoom;
// finer creases and growth texture belong to the 64/128 artwork itself.
// All coordinates retain the existing 32-unit body and socket registration.
export const TORSO_PARTS=Object.freeze(['small-torso','soft-torso','dome-torso']);
export const BODY_FORM_PARTS=Object.freeze(['light-torso','long-torso','reinforced-torso']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ellipse=(u,v,x,y,rx,ry)=>Math.hypot((u-x)/rx,(v-y)/ry);
const bump=(u,center,width)=>Math.exp(-(((u-center)/width)**2));
// These contours describe existing body tissue, never new plates, organs or
// socket capacity. The long torso is already a segmented canonical body.
function bodyFormSurface(id,u,v,dx,dy,pixel){
  const light=id==='light-torso',long=id==='long-torso';
  const length=light?10.5:long?10.8:10.9;
  const width=light?8.4*(1+.08*bump(u,4,3)-.12*bump(u,-1.8,2.8)):
    long?8.8*(1+.045*Math.cos(u*1.45)):
    9.4*(1+.05*bump(u,4.2,3)+.045*bump(u,-5,3));
  const q=Math.hypot(u/length,v/width);
  if(q>1)return null;
  if(q>1-.25/Math.min(length,width))return 0;
  const height=Math.sqrt(Math.max(0,1-q*q));
  const illumination=.36+.72*height-.22*dy/width-.17*dx/length;
  let tone=illumination<.52?1:illumination<.77?2:illumination<1.05?3:4;
  if(long){
    // Short flexible folds cross the already segmented trunk. Broad central
    // highlights remain continuous; this is skin, not an armor capability.
    const fold=Math.abs(Math.sin((u+.2)*Math.PI/3.6));
    if(Math.abs(v)>2.5&&q<.94&&fold<pixel*.21)tone=Math.max(1,tone-1);
    if(Math.abs(v)>3&&q<.89&&fold>pixel*.21&&fold<pixel*.42&&dy<0)tone=Math.min(4,tone+1);
  }else{
    const shoulder=ellipse(u,Math.abs(v),3.7,3.2,3.4,3.8);
    const hip=ellipse(u,Math.abs(v),-5.0,3.3,2.7,3.1);
    if(q<.91&&Math.abs(v)>2&&Math.min(Math.abs(shoulder-.88),Math.abs(hip-.87))<pixel*.12)tone=Math.max(1,tone-1);
    if(!light&&Math.abs(v)<.65&&Math.abs(u)<7.5)tone=Math.min(4,tone+1);
  }
  const flank=width*.70-.4*Math.cos(u*.35);
  if(q<.91&&Math.abs(Math.abs(v)-flank)<pixel*.45&&Math.abs(u)<6)tone=Math.max(1,tone-1);
  if(q<.86&&q>.25&&Math.sin(u*3.6+v*1.9)>.98&&Math.sin(v*4.3-u*.6)>.7)tone=Math.max(1,tone-1);
  return tone;
}
function surface(id,u,v,dx,dy,pixel){
 if(BODY_FORM_PARTS.includes(id))return bodyFormSurface(id,u,v,dx,dy,pixel);
 const dome=id==='dome-torso',small=id==='small-torso';
 const length=dome?11.1:small?10.6:11.3;
 // Soft bodies have a tucked flank between shoulder and haunch tissue. The
 // compact body keeps a short, rounded core; shell anatomy has a broad rim.
 const width=dome?9.4*(1-.05*u/length):small?8.6*(1+.10*bump(u,3,4)-.06*u/length):8.4*(1+.13*bump(u,5,3.2)+.14*bump(u,-5,3.8)-.11*bump(u,0,2.7));
 const q=Math.hypot(u/length,v/width);if(q>1)return null;
 if(q>1-(dome?.34:.28)/Math.min(length,width))return 0;
 const height=Math.sqrt(Math.max(0,1-q*q));
 // Fixed screen light, regardless of facing; anatomical ridges turn with body.
 const light=.35+.73*height-.22*dy/width-.17*dx/length;
 let tone=light<.53?1:light<.76?2:light<1.06?3:4;
 if(dome){
  if(q>.88)return dy<0?3:1;
  if(q>.83)return dy<0?4:2;
  // Staggered broad scutes and a raised central keel belong only to this
  // registered shell torso. No plates are painted onto soft/compact anatomy.
  const size=2.65,aq=(Math.sqrt(3)/3*u-v/3)/size,ar=(2*v/3)/size;
  let hx=Math.round(aq),hz=Math.round(ar),hy=Math.round(-aq-ar);
  const ex=Math.abs(hx-aq),ey=Math.abs(hy+aq+ar),ez=Math.abs(hz-ar);
  if(ex>ey&&ex>ez)hx=-hy-hz;else if(ez>ey)hz=-hx-hy;
  const du=u-size*Math.sqrt(3)*(hx+hz/2),dv=v-size*1.5*hz;
  const seam=size*.866-Math.max(Math.abs(du),Math.abs(du)*.5+Math.abs(dv)*.866);
  if(q<.80&&seam<.22)return 1;
  if(q<.78&&seam<.48&&dy<3)return Math.min(4,tone+1);
  if(Math.abs(v)<.38&&Math.abs(u)<8.5)return dy<0?4:3;
  // Broken growth striae stay subordinate to plate volume.
  if(q<.78&&seam>.6&&Math.sin(u*3.1+Math.sin(v*1.2))>.94&&tone>1)return tone-1;
 }else{
  const side=Math.abs(v),shoulder=ellipse(u,side,4.5,3.0,3.4,3.2),haunch=ellipse(u,side,-5,3.4,3.0,3.2);
  if(q<.88&&side>1.5&&Math.min(Math.abs(shoulder-.84),Math.abs(haunch-.82))<.045&&u*v<22)tone=Math.max(1,tone-1);
  // Long, broken skin tension follows the flank, rather than a regular grid.
  const crease=width*.68-.6*Math.cos(u*.28);
  if(Math.abs(side-crease)<pixel*.55&&Math.abs(u)<5.8&&q>.55)tone=Math.max(1,tone-1);
  if(q<.88&&q>.22&&Math.sin(u*3.1+v*1.4)>.97&&Math.sin(v*3.8-u*.6)>.5)tone=Math.max(1,tone-1);
 }
 return tone;
}
const scaled=(v,r)=>Array.isArray(v)?v.map(x=>scaled(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaled(x,r)])):typeof v==='number'?v*r:v;
export function authorTorsoPart(source,resolution){
 if(![...TORSO_PARTS,...BODY_FORM_PARTS].includes(source.partId)||![64,128].includes(resolution)||source.rig?.kind!=='torso')throw Error('Unsupported detailed torso');
 const ratio=resolution/32,frames=[];
 for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
  const angle=(facing-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle),indices=[],alpha=[];
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
   const dx=(x+.5)/ratio-16,dy=(y+.5)/ratio-16,u=dx*co+dy*si,v=-dx*si+dy*co;
   const tone=surface(source.partId,u,v,dx,dy,1/ratio);indices.push(tone??0);alpha.push(tone===null?0:255);
  }
  // The existing rig already breathes. Fixed tissue avoids a second silhouette
  // pulse or slipping texture when that geometry selects the other skin frame.
  frames.push({state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index)?.durationMs||320,indices,alpha});
 }
 return{partId:source.partId,version:BODY_FORM_PARTS.includes(source.partId)?8:5,width:resolution,height:resolution,displayScale:(source.displayScale??1)/ratio,rootAnchorPx:source.rootAnchorPx.map(v=>v*ratio),rig:scaled(source.rig,ratio),regions:source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors})),frames};
}
