import {smoothedWaterScore} from './landform.js';
import {visualCompositionAt} from './composition.js';

// Presentation-only depth/lighting interpretation. It derives local shade, bank depth
// and contact shadows from existing habitat structure without changing world state.
export function depthProfileAt(world,x,y,habitatField=null){
  const c=visualCompositionAt(world,x+.5,y+.5,habitatField),i=world.idx(Math.max(0,Math.min(world.n-1,x|0)),Math.max(0,Math.min(world.n-1,y|0)));
  const moss=world.plants?.sunmoss?.[i]||0,berries=world.plants?.bramble?.[i]||0,reeds=world.plants?.marshroot?.[i]||0,pods=world.plants?.thistlepod?.[i]||0;
  const structure=Math.max(berries,reeds*.84,pods*.78,moss*.46);
  const canopy=clamp01(c.thicket*.62+c.landmark*.20+structure*.34-c.openness*.48);
  const shade=clamp01(canopy*.72+Math.max(0,c.moisture-.64)*.18-c.openness*.22);
  const light=clamp01(c.openness*.74+c.dryPocket*.12+(1-canopy)*.14);
  return{...c,structure,canopy,shade,light};
}

export function drawHabitatDepth(ctx,{world,habitatField,isWater,px,py,u,i,x,y,season='SPRING',depth=null}){
  const p=depthProfileAt(world,x,y,habitatField),h=hash2(x,y,2003);ctx.save();
  // Patchy canopy shadow: deliberately broken and offset southeast to imply a stable
  // north-west light source rather than a screen-space vignette.
  if(p.canopy>.32&&h>.50){
    // Sparse L-shaped fragments replace the old every-tile horizontal bars. The gate is
    // deliberate: dense habitat should feel shaded, not reveal the underlying tile grid.
    const alpha=Math.min(.16,.035+(p.canopy-.32)*.15),count=p.canopy>.70&&h>.76?2:1;
    for(let q=0;q<count;q++){
      const qh=hash2(x+q*7,y-q*5,2011+q*13),ox=(2+Math.floor(hash2(x+q,y,2017+q)*10))*u,oy=(3+Math.floor(hash2(y+q,x,2021+q)*9))*u,w=(1+Math.floor(qh*3))*u;
      ctx.fillStyle=`rgba(8,24,15,${alpha*(.72+qh*.28)})`;ctx.fillRect(px+ox,py+oy,w,u);
      if(qh>.58){ctx.fillRect(px+ox+(qh>.8?w-u:0),py+oy+u,u,(1+(p.canopy>.72?1:0))*u)}
    }
  }
  // Open glades get a few restrained warm floor flecks instead of a whole-tile tint.
  if(p.light>.68&&h>.43){const a=.055+(p.light-.68)*.10;ctx.fillStyle=`rgba(220,203,132,${Math.min(.13,a)})`;ctx.fillRect(px+(2+Math.floor(h*8))*u,py+(2+Math.floor(hash2(x,y,2027)*9))*u,(2+Math.floor(p.light*3))*u,u)}

  // Land immediately beside water receives an undercut on the water-facing edge and a
  // tiny top lip. This visually drops the water below the bank without changing masks.
  // v1.41.0: the undercut and lip follow the smooth shoreline per art pixel: a dark undercut right at
  // the visual water edge and a pale lip just inland, instead of straight bands on the tile edges.
  const edge=(dx,dy)=>{const nx=x+dx,ny=y+dy;return nx>=0&&ny>=0&&nx<world.n&&ny<world.n&&isWater(nx,ny)};
  if(edge(0,-1)||edge(0,1)||edge(-1,0)||edge(1,0)){
    for(let sy=0;sy<32;sy++)for(let sx=0;sx<32;sx++){const sc=depth?depth[sy*32+sx]/255:smoothedWaterScore(world,x+(sx+.5)/32,y+(sy+.5)/32);
      if(sc>=.50&&sc<.535){ctx.fillStyle='rgba(13,31,26,.34)';ctx.fillRect(px+sx*u/2,py+sy*u/2,u/2,u/2)}else if(sc>=.42&&sc<.46&&hash2(x*32+sx,y*32+sy,2039)>.4){ctx.fillStyle='rgba(185,174,111,.16)';ctx.fillRect(px+sx*u/2,py+sy*u/2,u/2,u/2)}}
  }
  // Winter shadows are a little cleaner; summer/autumn shade remains warmer/softer.
  if(season==='WINTER'&&p.shade>.52){ctx.fillStyle='rgba(28,46,42,.045)';ctx.fillRect(px+4*u,py+5*u,8*u,4*u)}
  ctx.restore();return p;
}

export function creatureShadowFor(world,animal,habitatField=null,{bodyScale=1,moving=false}={}){
  const x=Math.floor(animal.x),y=Math.floor(animal.y),p=depthProfileAt(world,x,y,habitatField),moisture=world.moisture[world.idx(x,y)]||0;
  const width=6+5*bodyScale,height=1.5+bodyScale*.65,offsetX=1.0+Math.max(0,p.light-.48)*1.5,offsetY=4.8+bodyScale*.7;
  const alpha=clamp(.18+.07*p.shade+.025*(moving?1:0)+(moisture>.68?.025:0),.16,.31);
  return{width,height,offsetX,offsetY,alpha,profile:p};
}

export function drawCreatureDepthShadow(ctx,{shadow,scale=1,hurt=false}){
  if(!shadow)return;const s=Math.max(1,scale),a=Math.min(.34,shadow.alpha+(hurt?.04:0));ctx.save();
  ctx.fillStyle=`rgba(4,13,9,${a})`;
  const x=Math.round((-shadow.width*.5+shadow.offsetX)*s),y=Math.round(shadow.offsetY*s),w=Math.max(2,Math.round(shadow.width*s)),h=Math.max(1,Math.round(shadow.height*s));
  ctx.fillRect(x,y,w,h);
  // A shorter core shadow prevents wide animals from appearing to hover above the soft edge.
  ctx.fillStyle=`rgba(3,10,7,${Math.min(.22,a*.72)})`;ctx.fillRect(Math.round(x+w*.22),y,Math.max(1,Math.round(w*.56)),Math.max(1,Math.round(h*.55)));
  ctx.restore();
}

export function drawSceneDepthForeground(ctx,{scene,px,py,u}){
  if(!scene)return;const c=scene.composition||{},k=scene.kind,shade=Math.max(c.thicket||0,k==='thicket-pocket'?.78:0);if(shade<.58)return;
  const h=hash2(scene.x,scene.y,2063),a=Math.min(.20,.07+(shade-.58)*.23);ctx.save();ctx.fillStyle=`rgba(8,23,14,${a})`;
  // Overhanging fragments deliberately cross the animal plane only in dense pockets.
  ctx.fillRect(px+(-14+Math.floor(h*4))*u,py-9*u,(7+Math.floor(shade*5))*u,3*u);
  ctx.fillRect(px+(4+Math.floor(hash2(scene.y,scene.x,2069)*4))*u,py-7*u,(7+Math.floor(shade*4))*u,2*u);
  ctx.fillStyle=`rgba(45,70,38,${Math.min(.36,a+.12)})`;ctx.fillRect(px-11*u,py-8*u,4*u,3*u);ctx.fillRect(px+8*u,py-6*u,5*u,3*u);ctx.restore();
}

function hash2(x,y,salt=0){let n=(Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function clamp01(v){return Math.max(0,Math.min(1,v))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
