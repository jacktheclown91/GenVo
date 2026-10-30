// Detailed tissue for the existing generic head. Eyes, mouths, feelers and
// coverings remain independently inherited parts; no new organs are painted.
const ellipse=(u,v,cx,cy,rx,ry)=>Math.hypot((u-cx)/rx,(v-cy)/ry);

function surface(u,v,dx,dy,pixel){
  // Rounded cranial vault, paired cheek volume and a narrower facial platform.
  // All tissue stays inside the canonical 24-by-22 head registration.
  const vault=ellipse(u,v,-1.6,0,10,8.8);
  const cheek=ellipse(u,Math.abs(v),4.0,3.6,5.5,4.0);
  const front=ellipse(u,v,6.3,0,4.7,5.4);
  const neck=ellipse(u,v,-8,0,3.2,4.8);
  const q=Math.min(vault,cheek,front,neck);
  if(q>1)return null;
  if(q>.958)return 0;
  const cranialRadius=ellipse(u,v,-.6,0,12,10);
  const height=Math.sqrt(Math.max(0,1-cranialRadius*cranialRadius));
  const light=.38+.70*height-.22*dy/9-.16*dx/11;
  let tone=light<.48?1:light<.72?2:light<1.02?3:4;
  // A broad transition describes cheek tissue without drawing eyes or a mouth.
  const cheekFold=ellipse(u,Math.abs(v),4.0,3.6,4.1,3.0);
  if(u>1.5&&u<7.5&&Math.abs(v)>3.2&&Math.abs(cheekFold-.90)<pixel*.08)tone=Math.max(1,tone-1);
  const neckFold=6.3+.24*v*v;
  if(u<0&&Math.abs(u+neckFold)<pixel*.6&&q<.9)tone=Math.max(1,tone-1);
  // Sparse, irregular short skin breaks preserve a quiet volume at game zoom.
  if(q<.85&&q>.35&&Math.sin(u*2.8+v*1.7)>.97&&Math.sin(v*4.1-u*.7)>.72)tone=Math.max(1,tone-1);
  return tone;
}

const scaled=(v,r)=>Array.isArray(v)?v.map(x=>scaled(x,r)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,scaled(x,r)])):typeof v==='number'?v*r:v;

export function authorHeadPart(source,resolution){
  if(source.partId!=='head-base'||source.rig?.kind!=='head'||![64,128].includes(resolution))throw Error('Unsupported detailed head');
  const ratio=resolution/32,frames=[];
  for(let facing=0;facing<8;facing++)for(let index=0;index<2;index++){
    const angle=(facing-2)*Math.PI/4,co=Math.cos(angle),si=Math.sin(angle),indices=[],alpha=[];
    for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
      const dx=(x+.5)/ratio-16,dy=(y+.5)/ratio-16;
      const u=dx*co+dy*si,v=-dx*si+dy*co;
      const tone=surface(u,v,dx,dy,1/ratio);
      indices.push(tone??0);
      alpha.push(tone===null?0:255);
    }
    // Actual head pose owns breathing/turning/feeding; tissue adds no motion.
    frames.push({state:'idle',facing,index,durationMs:source.frames.find(f=>f.facing===facing&&f.index===index)?.durationMs||320,indices,alpha});
  }
  return {partId:source.partId,version:6,width:resolution,height:resolution,
    displayScale:(source.displayScale??1)/ratio,rootAnchorPx:source.rootAnchorPx.map(v=>v*ratio),
    rig:scaled(source.rig,ratio),regions:source.regions.map(({id,protected:fixed,colors})=>({id,protected:fixed,colors})),frames};
}
