// Native feather tissue for the existing inherited precursor and powered wing.
// The canonical dorsal rig and real aerial clock still own deployment/strokes.
export const WING_PARTS=Object.freeze(['proto-wing','flight-wing']);
const ellipse=(u,v,cx,cy,rx,ry)=>Math.hypot((u-cx)/rx,(v-cy)/ry);
const tips=[[7.8,10.5],[5.8,12.2],[3.2,13.2],[.2,13.4],[-2.8,12.6],[-5.5,11],[-7.3,8.8]];

function feather(u,v,start,end,width,pixel,dx,dy,protectedQuill){
  const ax=end[0]-start[0],ay=end[1]-start[1],length=Math.hypot(ax,ay);
  const along=((u-start[0])*ax+(v-start[1])*ay)/(length*length);
  if(along<=0||along>=1)return null;
  const cross=((u-start[0])*(-ay)+(v-start[1])*ax)/length;
  const radius=width*Math.sin(Math.PI*along)**.58;
  const edge=Math.abs(cross)/radius;
  if(edge>1)return null;
  if(edge>.94)return 0;
  const light=(-dy*.7-dx*.3)/15;
  let tone=edge>.74?1:light>.2?3:2;
  // Rachis and fine angled vanes are new native pixels at each resolution.
  if(Math.abs(cross)<pixel*.48&&along>.12&&along<.92)return protectedQuill?(light>0?6:5):(light>0?4:3);
  const barb=(along*length*1.7-Math.abs(cross)*1.1)%1;
  if(edge<.86&&edge>.15&&barb>.83)tone=Math.max(1,tone-1);
  if(edge<.72&&edge>.45&&light>.05)tone=Math.min(4,tone+1);
  return tone;
}

function tissue(id,u,v,index,pixel,dx,dy){
  const precursor=id==='proto-wing';
  const scale=precursor?.67:1;
  const x=u/scale,y=Math.abs(v)/scale;
  let tone=null;
  // Separate overlapping primaries/secondaries; the small precursor is not
  // painted as a deployed full-sized powered wing.
  for(let k=tips.length-1;k>=0;k--){
    const tip=tips[k],end=[tip[0]*(index?.96:1),tip[1]*(index?.97:1)];
    const start=[2.0-k*.65,1.6+k*.16];
    const paint=feather(x,y,start,end,k<3?1.35:1.65,pixel/scale,dx,dy,id==='flight-wing');
    if(paint!==null)tone=paint;
  }
  // Small overlapping coverts bridge the panel hinges. Keep the dorsal root
  // compact so a flat strip cannot cover most of the actual torso underneath.
  for(let row=2;row>=0;row--)for(let k=0;k<4;k++){
    const cx=2.6-k*1.55-(row%2)*.45,cy=1.35+row*1.45;
    const q=ellipse(x,y,cx,cy,1.22,1.4);
    if(q<1){
      tone=q>.86?1:dy<0?3:2;
      if(q<.72&&x<cx&&dy<0)tone=4;
      if(Math.abs(x-cx)<pixel*.38&&y>cy-.7&&y<cy+.85)tone=dy<0?3:1;
    }
  }
  const root=ellipse(u,v,-.35*scale,0,4.45*scale,1.7);
  if(root<1){
    const height=Math.sqrt(Math.max(0,1-root*root));
    const light=.45+.62*height-.18*dy/2-.10*dx/5;
    tone=root>.87?1:light<.7?2:light<1?3:4;
    // Fine feather overlap follows the attachment, instead of one solid bar.
    const crease=Math.abs(Math.sin((u/scale+.2)*Math.PI/1.6));
    if(root<.88&&Math.abs(v)>.38&&crease<pixel*.22)tone=Math.max(1,tone-1);
  }
  return tone;
}

const scaled=(v,r)=>Array.isArray(v)?v.map(x=>scaled(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaled(x,r)])):typeof v==='number'?v*r:v;
export function authorWingPart(source,resolution){
  if(!WING_PARTS.includes(source.partId)||![64,128].includes(resolution))throw Error('Unsupported detailed wing');
  const ratio=resolution/32,frames=[];
  for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
    const angle=(facing-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle),indices=[],alpha=[];
    for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
      const dx=(x+.5)/ratio-16,dy=(y+.5)/ratio-16;
      const tone=tissue(source.partId,dx*co+dy*si,-dx*si+dy*co,index,1/ratio,dx,dy);
      indices.push(tone??0);alpha.push(tone===null?0:255);
    }
    frames.push({state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index).durationMs,indices,alpha});
  }
  return {partId:source.partId,version:4,width:resolution,height:resolution,
    displayScale:(source.displayScale??1)/ratio,rootAnchorPx:source.rootAnchorPx.map(v=>v*ratio),
    ...(source.rig?{rig:{...source.rig,rootRect:scaled(source.rig.rootRect,ratio),panels:scaled(source.rig.panels,ratio)}}:{}),
    regions:source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors})),frames};
}
