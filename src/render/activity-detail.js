// Small deterministic ground-contact cues derived from existing creature action.
// These are visual consequences only: no footprints/resources/history are written.
export function drawActivityGround(ctx,{bodyPlan=null,id=0,frame=0,moving=false,action='idle',scale=1,dir=0}){
  const f=((Math.floor(frame)%8)+8)%8,h=hash(id,Math.floor(frame),bodyPlan?.nodes?.length||0),side=f<4?-1:1;
  const parts=new Set(bodyPlan?.nodes?.map(n=>n.partId)||[]);
  ctx.save();
  if(parts.has('spring-leg')&&moving&&(f===0||f===7)){
    dot(ctx,-5+side,6,2,1,scale,'rgba(170,154,96,.34)');dot(ctx,3-side,7,2,1,scale,'rgba(91,112,62,.44)');
  }else if(parts.has('digging-forelimb')&&(action==='eat'||action==='dig')){
    const digging=action==='dig',alpha=digging?'.56':'.48';dot(ctx,-5+side*2,6,2,1,scale,`rgba(113,84,58,${alpha})`);dot(ctx,4-side,7,1,1,scale,'rgba(160,122,78,.50)');if(digging||f===2||f===6)dot(ctx,side*7,4,1,1,scale,'rgba(126,95,62,.42)');
  }else if(parts.has('digging-forelimb')&&moving&&(f===1||f===5)){
    dot(ctx,-5*side,7,3,1,scale,'rgba(80,68,49,.25)');
  }else if(parts.has('hunter-eye')&&(action==='stalk'||action==='hunt'||action==='prowl')){
    const a=h>.5?1:-1;dot(ctx,-7*a,6,1,3,scale,'rgba(83,111,55,.34)');dot(ctx,-5*a,7,2,1,scale,'rgba(55,68,42,.25)');
  }else if(true&&moving&&(f===0||f===4)){
    dot(ctx,-5*side,7,2,1,scale,'rgba(54,73,64,.22)');
  }
  ctx.restore();
}
function dot(c,x,y,w,h,s,color){c.fillStyle=color;c.fillRect(Math.round(x*s),Math.round(y*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)))}
function hash(a,b,c){let n=(a*73856093^b*19349663^c*83492791)>>>0;n=(n^(n>>>13))*1274126177>>>0;return((n^(n>>>16))>>>0)/4294967295}
