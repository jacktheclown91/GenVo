// Native-resolution facial tissue for the existing optional detailed-art catalog.
// Geometry uses canonical 32-unit part space, not an enlarged source raster.
export const FACE_PARTS=Object.freeze(['simple-eye','compound-eye','grazing-mouth','beak-mouth']);
const ellipse=(u,v,x,y,rx,ry)=>Math.hypot((u-x)/rx,(v-y)/ry);

function simpleEye(u,v,index,pixel){
 const q=ellipse(u,v,0,0,6.8,5.5);if(q>1)return null;
 if(q>.9)return 0;
 if(index===1){
  const seam=.32*Math.sin(u*.35);
  if(Math.abs(v-seam)<.25+pixel*.25&&Math.abs(u)<5.6)return 1;
  return v<seam-.5?3:v>seam+1?2:4;
 }
 if(q>.76)return v<-.5?4:2;
 const iris=ellipse(u,v,.7,0,4.7,4.2);
 if(iris>1)return v<-1?4:3;
 if(ellipse(u,v,-.6,-1.9,.85,.8)<1)return 8;
 if(ellipse(u,v,2,1.8,.35,.35)<1)return 8;
 if(ellipse(u,v,1.1,.1,2.1,3.0)<1)return 6;
 const angle=Math.atan2(v,u-.7),radius=Math.hypot(u-.7,v);
 return iris>.9||Math.sin(angle*21+radius*.9)>.7?6:7;
}

function compoundEye(u,v,index){
 const q=ellipse(u,v,0,0,6.8,5.6);if(q>1)return null;
 if(q>.9)return 0;if(q>.81)return v<-1?3:1;
 // Nearest axial hex cell: real facet clusters, rather than a square dot grid.
 const size=1.15,aq=(Math.sqrt(3)/3*u-v/3)/size,ar=(2*v/3)/size;
 let x=Math.round(aq),z=Math.round(ar),y=Math.round(-aq-ar);
 const ex=Math.abs(x-aq),ey=Math.abs(y+aq+ar),ez=Math.abs(z-ar);
 if(ex>ey&&ex>ez)x=-y-z;else if(ez>ey)z=-x-y;
 const cx=size*Math.sqrt(3)*(x+z/2),cy=size*1.5*z,du=u-cx,dv=v-cy;
 const edge=Math.max(Math.abs(du)*.866+Math.abs(dv)*.5,Math.abs(dv));
 if(edge>.85)return 6;
 // Compound organs retain their lenses during blink/squint requests. No
 // vertebrate eyelid or pupil is added to an inherited compound-eye part.
 if(index===0&&Math.hypot(du+.28,dv+.28)<.29&&u+v<3)return 7;
 return u+v>4||index===1&&q>.6?6:8;
}

function grazingMouth(u,v,index,pixel){
 const opening=index===1?1.35:.22;
 const upper=ellipse(u,v,.2,-1.45-opening*.55,5.1,2.45),lower=ellipse(u,v,.2,1.45+opening*.55,5.1,2.45);
 const cavity=ellipse(u,v,1.1,0,3.8,opening);
 if(upper>1&&lower>1&&cavity>1)return null;
 if(cavity<1&&u>-.9)return 6;
 const q=Math.min(upper,lower);if(q>.9)return 0;
 const inner=Math.abs(v)<opening+.55;
 if(inner&&u>2.8&&u<4.4)return 7;
 if(inner)return 1;
 // Curved lip pads and a restrained dorsal fold give the cropping surface
 // volume without the former two long parallel prongs.
 if(v<-.8&&q<.65)return 4;
 if(Math.abs(v+2.1)<pixel*.55&&u>-3&&u<2)return 3;
 return v>1.7?2:3;
}

function beak(u,v,index,pixel){
 if(u<-5.5||u>9)return null;
 const t=(u+5.5)/14.5,width=(1-t)*4.2+.2,gap=index===1?.85*Math.sin(Math.PI*t):0;
 const av=Math.abs(v),plate=av-gap;
 if(plate<0)return u<7.5?0:null;
 if(plate>width)return null;
 if(plate>width-.3||u<-5.1)return 0;
 if(av<gap+.25)return index===1?0:5;
 if(u<-2.5&&v<-.8&&Math.abs(v+width*.5)<.28+pixel*.1)return 0;
 const ridge=width*.42,grain=Math.sin(u*3.4+plate*.7);
 const highlight=v<0&&(plate<ridge||Math.abs(plate-ridge)<pixel*.4);
 if(u>-3&&u<6&&plate>width*.5&&grain>.85)return v<0?6:5;
 return highlight?6:5;
}

export function authorFacePart(source,resolution){
 if(!FACE_PARTS.includes(source.partId)||![64,128].includes(resolution))throw Error('Unsupported detailed face');
 const ratio=resolution/32,frames=[];
 for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
  const angle=(facing-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle),indices=[],alpha=[];
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
   const dx=(x+.5)/ratio-16,dy=(y+.5)/ratio-16,u=dx*co+dy*si,v=-dx*si+dy*co;
   const tone=source.partId==='simple-eye'?simpleEye(u,v,index,1/ratio):source.partId==='compound-eye'?compoundEye(u,v,index):source.partId==='grazing-mouth'?grazingMouth(u,v,index,1/ratio):beak(u,v,index,1/ratio);
   indices.push(tone??0);alpha.push(tone===null?0:255);
  }
  frames.push({state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index)?.durationMs||320,indices,alpha});
 }
 return{partId:source.partId,version:3,width:resolution,height:resolution,displayScale:(source.displayScale??1)/ratio,rootAnchorPx:source.rootAnchorPx.map(v=>v*ratio),...(source.expressionScale?{expressionScale:source.expressionScale}:{}),regions:source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors})),frames};
}
