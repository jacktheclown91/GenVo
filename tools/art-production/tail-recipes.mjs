// Native detailed tail tissue in the existing 32-unit attachment frame.
// Swimming/turning motion remains owned by the actual pose, not this artwork.
export const TAIL_PARTS=Object.freeze(['balance-tail','paddle-tail']);
const ellipse=(u,v,x,y,rx,ry)=>Math.hypot((u-x)/rx,(v-y)/ry);
function surface(id,u,v,dx,dy,pixel){
  if(u<-.6||u>14.6)return null;
  const paddle=id==='paddle-tail';
  if(paddle){
    const stem=ellipse(u,v,2.6,0,3.8,1.8),blade=ellipse(u,v,8.9,0,5.7,7.3),q=Math.min(stem,blade);
    if(q>1)return null;
    if(q>.955)return 0;
    if(blade<1&&u>4.2){
      // Existing protected teal membrane, with inherited skin ribs and a folded rim.
      if(blade>.88)return dy<0?3:1;
      const fan=Math.atan2(v,u-2.4),rib=Math.abs(Math.sin(fan*12));
      if(rib<pixel*.16)return dy<0?4:2;
      if(blade>.78&&Math.sin(u*3.2+v*1.3)>.7)return 2;
      // Shallow surface folds and broken edge light describe thickness without
      // turning the existing membrane into a newly armored or feathered organ.
      const crease=Math.abs(Math.sin((u-4.6)*1.5+v*.12));
      if(u>5&&crease<pixel*.2)return dy<0?3:1;
      const grain=Math.sin(u*8.1+v*5.3)*Math.sin(v*6.7-u*1.2);
      if(dy>1&&grain>.78-blade*.2)return 1;
      if(dy<-.5&&blade<.82&&grain<-.89)return 4;
      return 6;
    }
    return dy<-.5?4:dy>.6?1:3;
  }
  const t=Math.max(0,u)/14.6,center=1.3*Math.sin(t*Math.PI)-.7*Math.sin(t*2*Math.PI),width=.28+2.1*(1-t)**1.15;
  const q=Math.abs(v-center)/width;
  if(q>1)return null;
  if(q>1-.18/Math.max(.5,width))return 0;
  const light=.28+.67*Math.sqrt(Math.max(0,1-q*q))-.25*dy/(width+.2)-.08*dx/14.6;
  let tone=light>.86?4:light>.65?3:light>.40?2:1;
  if(u>2&&u<11&&q>.35&&Math.abs(Math.sin(u*1.9+v*.6))<pixel*.18)tone=Math.max(1,tone-1);
  if(q<.4&&u>3&&u<12&&Math.sin(u*4.7)>.92)tone=Math.min(4,tone+1);
  return tone;
}
export function authorTailPart(source,resolution){
  if(!TAIL_PARTS.includes(source.partId)||![64,128].includes(resolution)||source.rig)throw Error('Unsupported detailed tail');
  const ratio=resolution/32,frames=[];
  for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
    const angle=(facing-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle),indices=[],alpha=[];
    for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
      const dx=(x+.5)/ratio-16,dy=(y+.5)/ratio-16,u=-dx*co-dy*si,v=-dx*si+dy*co;
      const tone=surface(source.partId,u,v,dx,dy,1/ratio);indices.push(tone??0);alpha.push(tone===null?0:255);
    }
    frames.push({state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index).durationMs,indices,alpha});
  }
  return{partId:source.partId,version:1,width:resolution,height:resolution,displayScale:(source.displayScale??1)/ratio,
    rootAnchorPx:source.rootAnchorPx.map(v=>v*ratio),regions:source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors})),frames};
}
