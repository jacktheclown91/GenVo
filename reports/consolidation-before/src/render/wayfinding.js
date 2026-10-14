import {habitatIdentityAt} from './identity.js';

// Renderer-only habitat transition + focal approach cues. These marks make the space
// between memorable regions easier to read without creating roads, paths, resources,
// collision, navigation state, or any other simulation authority.
export function collectHabitatTransitions(world,habitatField,{step=4,margin=6}={}){
  const out=[],s=Math.max(3,step|0),m=Math.max(4,margin|0);
  for(let y=m;y<world.n-m;y+=s)for(let x=m;x<world.n-m;x+=s){
    if(world.water[world.idx(x,y)])continue;
    const t=habitatTransitionAt(world,x,y,habitatField);if(!t||t.strength<.22)continue;
    const gate=hash(world.seedHash,x,y,4701);if(gate<.40)continue;
    out.push({...t,x,y,variant:Math.floor(hash(world.seedHash^0x4711,x,y,4703)*4)});
  }
  return out;
}

export function habitatTransitionAt(world,x,y,habitatField=null){
  const r=4,c=habitatIdentityAt(world,x,y,habitatField),e=habitatIdentityAt(world,x+r,y,habitatField),w=habitatIdentityAt(world,x-r,y,habitatField),n=habitatIdentityAt(world,x,y-r,habitatField),s=habitatIdentityAt(world,x,y+r,habitatField);
  const mgx=(e.moisture-w.moisture)*.5,mgy=(s.moisture-n.moisture)*.5;
  const tgx=((e.composition?.thicket||0)-(w.composition?.thicket||0))*.5,tgy=((s.composition?.thicket||0)-(n.composition?.thicket||0))*.5;
  const ogx=((e.composition?.openness||0)-(w.composition?.openness||0))*.5,ogy=((s.composition?.openness||0)-(n.composition?.openness||0))*.5;
  const fgx=(e.fertility-w.fertility)*.5,fgy=(s.fertility-n.fertility)*.5;
  const moisture=Math.hypot(mgx,mgy),thicket=Math.hypot(tgx,tgy),open=Math.hypot(ogx,ogy),fertility=Math.hypot(fgx,fgy);
  let kind='none',gx=0,gy=0,strength=0;
  if(moisture>.12){kind='wet-edge';gx=mgx;gy=mgy;strength=moisture*.95}
  if(thicket>.17&&thicket*1.06>strength){kind='thicket-edge';gx=tgx;gy=tgy;strength=thicket*1.06}
  if(open>.18&&open*.92>strength){kind='clearing-edge';gx=ogx;gy=ogy;strength=open*.92}
  if(fertility>.13&&fertility*.75>strength){kind='rich-edge';gx=fgx;gy=fgy;strength=fertility*.75}
  if(kind==='none'||strength<.16)return null;
  const mag=Math.max(.0001,Math.hypot(gx,gy)),nx=gx/mag,ny=gy/mag;
  // Tangent follows the habitat boundary; normal points toward the stronger side.
  return {kind,strength:clamp01(strength*1.8),nx,ny,tx:-ny,ty:nx,identity:c};
}

export function focalApproachFor(world,focal,habitatField=null){
  if(!focal)return null;let best=null;const dirs=[[1,0],[.707,.707],[0,1],[-.707,.707],[-1,0],[-.707,-.707],[0,-1],[.707,-.707]];
  for(let q=0;q<dirs.length;q++){
    const [dx,dy]=dirs[q],x=Math.round(focal.x+dx*6),y=Math.round(focal.y+dy*6);if(x<4||y<4||x>=world.n-4||y>=world.n-4)continue;
    const i=world.idx(x,y);if(world.water[i])continue;const id=habitatIdentityAt(world,x,y,habitatField),open=id.composition?.openness||0,thicket=id.composition?.thicket||0;
    let score=open*.70+(1-thicket)*.20+(1-Math.min(1,id.moisture))*.04+hash(world.seedHash^0x47af,focal.x+q,focal.y-q,4721)*.06;
    if(focal.kind==='reed-cove'||focal.kind==='reed-shelf')score+=id.moisture<.72?.10:-.05;
    if(!best||score>best.score)best={dx,dy,score};
  }
  return best?{...best,strength:clamp01(.45+best.score*.45)}:null;
}

export function drawHabitatTransition(ctx,{transition,px,py,u,season='SPRING'}){
  if(!transition)return;const {kind,strength,nx,ny,tx,ty,variant=0}=transition,p=palette(season,kind);ctx.save();ctx.translate(px,py);ctx.globalAlpha=.38+.28*strength;
  const tangent=(d)=>({x:Math.round(tx*d)*u,y:Math.round(ty*d)*u}),normal=(d)=>({x:Math.round(nx*d)*u,y:Math.round(ny*d)*u});
  if(kind==='wet-edge'){
    for(const d of [-4,0,5]){const a=tangent(d),b=normal(d===0?1:-1);ctx.fillStyle=p.low;ctx.fillRect(a.x+b.x-2*u,a.y+b.y,u*(2+(d===0?2:0)),u);}
    const wet=normal(4);ctx.fillStyle=p.high;ctx.fillRect(wet.x-2*u,wet.y-3*u,u,4*u);ctx.fillRect(wet.x+u,wet.y-4*u,u,5*u);
  }else if(kind==='thicket-edge'){
    for(const d of [-5,-1,4]){const a=tangent(d),b=normal(variant%2?1:2);ctx.fillStyle=d===-1?p.high:p.low;ctx.fillRect(a.x+b.x-2*u,a.y+b.y,(3+(Math.abs(d)%2))*u,(1+(d===-1?1:0))*u)}
  }else if(kind==='clearing-edge'){
    for(const d of [-5,1,5]){const a=tangent(d),b=normal(-1);ctx.fillStyle=p.low;ctx.fillRect(a.x+b.x-2*u,a.y+b.y,(2+(d===1?2:0))*u,u);if(d===1){ctx.fillStyle=p.high;ctx.fillRect(a.x+b.x,a.y+b.y-2*u,u,2*u)}}
  }else{
    for(const d of [-4,0,4]){const a=tangent(d),b=normal(1);ctx.fillStyle=d===0?p.high:p.low;ctx.fillRect(a.x+b.x-1*u,a.y+b.y,(2+(d===0?1:0))*u,u)}
  }
  ctx.restore();
}

export function drawFocalApproach(ctx,{focal,approach,px,py,u,season='SPRING'}){
  if(!focal||!approach)return;const p=palette(season,focal.kind),dx=approach.dx,dy=approach.dy;ctx.save();ctx.translate(px,py);ctx.globalAlpha=.40+.20*approach.strength;
  // Three diminishing marks lead toward the focal. They are habitat texture, never a road.
  for(let q=1;q<=3;q++){
    const dist=10+q*7,x=Math.round(dx*dist)*u,y=Math.round(dy*dist)*u,fade=1-(q-1)*.18;ctx.globalAlpha=(.42+.16*approach.strength)*fade;
    if(focal.kind==='reed-cove'||focal.kind==='reed-shelf'){
      ctx.fillStyle=p.low;ctx.fillRect(x-2*u,y,4*u,u);if(q<3){ctx.fillStyle=p.high;ctx.fillRect(x,y-2*u,u,2*u)}
    }else if(focal.kind==='berry-grove'||focal.kind==='old-root'||focal.kind==='trail-gate'){
      ctx.fillStyle=p.low;ctx.fillRect(x-2*u,y,(3+(q===1?2:0))*u,u);if(q===1){ctx.fillStyle=p.high;ctx.fillRect(x+u,y-u,2*u,u)}
    }else if(focal.kind==='stone-rise'){
      ctx.fillStyle=p.low;ctx.fillRect(x-2*u,y-1*u,(3+(q===1?2:0))*u,2*u);ctx.fillStyle=p.high;ctx.fillRect(x-u,y-u,2*u,u)
    }else{
      ctx.fillStyle=p.low;ctx.fillRect(x-2*u,y,3*u,u);if(q===1){ctx.fillStyle=p.high;ctx.fillRect(x,y-2*u,u,2*u)}
    }
  }
  ctx.restore();
}

function palette(season,kind){
  const winter=season==='WINTER',autumn=season==='AUTUMN',summer=season==='SUMMER';
  if(kind==='wet-edge'||kind==='reed-cove'||kind==='reed-shelf')return {low:winter?'rgba(148,145,111,.46)':autumn?'rgba(111,112,68,.45)':'rgba(73,106,67,.44)',high:winter?'rgba(193,181,137,.54)':autumn?'rgba(166,147,91,.52)':'rgba(133,159,93,.54)'};
  if(kind==='thicket-edge'||kind==='berry-grove'||kind==='old-root'||kind==='trail-gate')return {low:winter?'rgba(78,79,61,.42)':autumn?'rgba(83,73,45,.46)':'rgba(42,68,42,.44)',high:winter?'rgba(113,111,82,.48)':autumn?'rgba(126,105,62,.50)':'rgba(82,111,61,.50)'};
  if(kind==='clearing-edge'||kind==='stone-rise')return {low:summer?'rgba(147,117,67,.42)':'rgba(124,105,66,.36)',high:summer?'rgba(188,151,87,.45)':'rgba(170,145,89,.40)'};
  return {low:winter?'rgba(115,124,96,.34)':'rgba(85,111,62,.38)',high:winter?'rgba(155,159,124,.40)':'rgba(129,154,85,.42)'};
}
function hash(seed,x,y,salt=0){let n=(seed^Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function clamp01(v){return Math.max(0,Math.min(1,v))}
