import {groundMoistureReading,conditionSeasonalGround,drawParchedGround} from './parched-ground.js';
import {drawSeasonalGroundMarks} from './seasonal-ground-art.js';
import {visualCompositionAt} from './composition.js';
import {visualHabitatAt} from './habitat.js';
import {substrateWeightsAt,drawNativeSubstrate} from './biome-substrates.js';

const WATER_CONTEXT_CACHE=new WeakMap();
const RIVER_ID_CACHE=new WeakMap();

// Presentation-only regional identity. It turns broad, already-existing habitat conditions
// into restrained local palette/silhouette biases so different reaches remain recognizable.
// No identity is written back to world state and no simulation RNG is consumed.
export function habitatIdentityAt(world,x,y,habitatField=null){
  const v=visualHabitatAt(world,x+.5,y+.5,habitatField),c=visualCompositionAt(world,x+.5,y+.5,habitatField),i=world.idx(clampI(x,world.n),clampI(y,world.n));
  const water=waterContextCached(world,x,y,2),plants=world.plants||{},moss=plants.sunmoss?.[i]||0,berries=plants.bramble?.[i]||0,reeds=plants.marshroot?.[i]||0,pods=plants.thistlepod?.[i]||0,fungus=plants.rotcap?.[i]||0;
  const signature=smoothNoise(world.seedHash^0x45a1,x,y,18),sub=smoothNoise(world.seedHash^0x1f39,x,y,9);
  let kind='meadow',strength=.35;
  if(water.edge>.16||reeds>.30||v.moisture>.72){kind='river-meadow';strength=Math.max(water.edge,reeds,v.moisture)*.78}
  else if(c.thicket>.63||berries>.42){kind='deep-thicket';strength=Math.max(c.thicket,berries)*.82}
  else if(c.dryPocket>.62||v.moisture<.27||pods>.40){kind='dry-grass';strength=Math.max(c.dryPocket,1-v.moisture,pods)*.72}
  else if(c.richPocket>.68||v.fertility>.76||fungus>.20){kind='rich-hollow';strength=Math.max(c.richPocket,v.fertility,fungus)*.70}
  else if(c.openness>.64){kind='open-meadow';strength=c.openness*.72}
  const palette=paletteFor(kind,signature,sub);
  return {kind,strength:clamp01(strength),signature,sub,palette,water,moisture:v.moisture,fertility:v.fertility,composition:c,moss,berries,reeds,pods,fungus};
}


export function terrainPaletteAt(world,wx,wy,moisture=null,fertility=null){
  const sample=(moisture==null||fertility==null)?visualHabitatAt(world,wx,wy):{moisture,fertility};
  const broad=smoothNoise(world.seedHash^0x45a1,wx,wy,18),sub=smoothNoise(world.seedHash^0x1f39,wx,wy,9);
  const wet=smoothstep(.50,.80,sample.moisture),dry=1-smoothstep(.22,.44,sample.moisture),rich=smoothstep(.56,.84,sample.fertility);
  // Continuous renderer-only ground bias. Unlike habitat identity labels, these values never
  // jump at a tile or category threshold, so broad meadow color reads as one landscape instead
  // of a checkerboard of independently tinted cells.
  const e=world.terrain?.elevation;
  const height=(x,y)=>e?.[world.idx(x,y)]||0;
  const x=Math.floor(wx),y=Math.floor(wy),u=wx-x,v=wy-y;
  const sampleHeight=(ox,oy)=>(height(x+ox,y+oy)*(1-u)+height(x+ox+1,y+oy)*u)*(1-v)+(height(x+ox,y+oy+1)*(1-u)+height(x+ox+1,y+oy+1)*u)*v;
  const relief=e?Math.max(-3,Math.min(3,(sampleHeight(-1,-1)-sampleHeight(1,1))*24)):0;
  const material=substrateWeightsAt(world,wx,wy,{moisture:sample.moisture});
  // Match the caller's legacy category offsets, then replace their hard steps
  // with gradual blends of the same physical moisture/fertility fields.
  const m=sample.moisture,f=sample.fertility,old=m>.68?[130,29,27]:f>.64?[102,30,30]:f<.34?[75,20,29]:[96,25,29];
  const lush=smoothstep(.48,.80,f),poor=1-smoothstep(.20,.48,f),damp=smoothstep(.52,.84,m);
  const baseHue=96+lush*6-poor*21,baseSat=25+lush*5-poor*5,baseLight=29+lush;
  return {
    hue:(baseHue*(1-damp)+130*damp-old[0])+(broad-.5)*3.2+(sub-.5)*1.4+wet*1.8-dry*5.4+rich*.9-material.dry*44+material.cold*4-material.rock*5,
    sat:(baseSat*(1-damp)+29*damp-old[1])+(broad-.5)*1.1+wet*1.5-dry*1.7+rich*1.8+material.dry*3-material.cold*7-material.rock*10,
    light:(baseLight*(1-damp)+27*damp-old[2])+(sub-.5)*1.0+dry*1.5-rich*.8-wet*.35+relief+material.dry*3+material.cold+material.rock*2
  };
}

export function riverIdentityAt(world,x,y){
  let cache=RIVER_ID_CACHE.get(world);if(!cache){cache=new Map();RIVER_ID_CACHE.set(world,cache)}const key=`${x},${y}`,hit=cache.get(key);if(hit)return hit;
  const r=waterContextCached(world,x,y,3),seed=smoothNoise(world.seedHash^0x7493,x,y,13),turn=riverTurn(world,x,y);
  let kind='run';if(r.density>.56)kind='pool';else if(turn>.50)kind='bend';else if(r.density<.28)kind='narrows';
  const axis=riverAxis(world,x,y),depth=clamp01((r.density-.18)/.58),out={kind,axis,turn,density:r.density,edge:r.edge,depth,seed};cache.set(key,out);return out;
}

export function seasonalGroundProfile(season,identity){
  const wet=identity?.moisture||0,dry=identity?.kind==='dry-grass',rich=identity?.fertility>.68;
  if(season==='SPRING')return {kind:'spring',shoots:clamp01((rich?.42:.18)+wet*.22),litter:0,frost:0,dry:.02};
  if(season==='SUMMER')return {kind:'summer',shoots:.05,litter:.02,frost:0,dry:clamp01((dry?.46:.08)+(1-wet)*.20)};
  if(season==='AUTUMN')return {kind:'autumn',shoots:.02,litter:clamp01((identity?.berries||0)*.75+(identity?.composition?.thicket||0)*.18),frost:0,dry:.15};
  return {kind:'winter',shoots:0,litter:.06,frost:clamp01(wet*.35+(identity?.composition?.openness||0)*.16),dry:.08};
}

export function drawSeasonalGround(ctx,{world,habitatField,season,px,py,u,x,y,identity=null,climate=null}){
  drawNativeSubstrate(ctx,{world,px,py,u,x,y});
  const id=identity||habitatIdentityAt(world,x,y,habitatField),reading=groundMoistureReading(world,world.idx(x,y),{climate}),profile=conditionSeasonalGround(seasonalGroundProfile(season,id),reading);
  drawParchedGround(ctx,{world,reading,px,py,u,x,y});
  drawSeasonalGroundMarks(ctx,{world,profile,px,py,u,x,y});return id;
}

function paletteFor(kind,a,b){
  const drift=(a-.5)*4+(b-.5)*2;
  if(kind==='river-meadow')return {hue:5+drift,sat:2,light:-1,waterHue:4,waterLight:2};
  if(kind==='deep-thicket')return {hue:-5+drift,sat:3,light:-3,waterHue:-2,waterLight:-1};
  if(kind==='dry-grass')return {hue:-13+drift,sat:-3,light:3,waterHue:-5,waterLight:0};
  if(kind==='rich-hollow')return {hue:2+drift,sat:4,light:-2,waterHue:2,waterLight:-1};
  if(kind==='open-meadow')return {hue:-4+drift,sat:-1,light:2,waterHue:0,waterLight:1};
  return {hue:drift,sat:0,light:0,waterHue:0,waterLight:0};
}
function waterContextCached(world,x,y,r){let cache=WATER_CONTEXT_CACHE.get(world);if(!cache){cache=new Map();WATER_CONTEXT_CACHE.set(world,cache)}const key=`${r}:${x},${y}`,hit=cache.get(key);if(hit)return hit;const out=waterContext(world,x,y,r);cache.set(key,out);return out}
function waterContext(world,x,y,r){let water=0,total=0,edge=0;for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=world.n||ny>=world.n)continue;total++;if(world.water[world.idx(nx,ny)])water++}if(!world.water[world.idx(clampI(x,world.n),clampI(y,world.n))]){for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const nx=x+ox,ny=y+oy;if(nx>=0&&ny>=0&&nx<world.n&&ny<world.n&&world.water[world.idx(nx,ny)])edge++}}return {density:total?water/total:0,edge:edge/8}}
function riverAxis(world,x,y){const sample=(dx,dy)=>{let n=0;for(let k=-3;k<=3;k++){const nx=x+dx*k,ny=y+dy*k;if(nx>=0&&ny>=0&&nx<world.n&&ny<world.n&&world.water[world.idx(nx,ny)])n++}return n};const h=sample(1,0),v=sample(0,1),d1=sample(1,1),d2=sample(1,-1),m=Math.max(h,v,d1,d2);return m===v?'vertical':m===d1?'diag-down':m===d2?'diag-up':'horizontal'}
function riverTurn(world,x,y){const w=(dx,dy)=>{const nx=x+dx,ny=y+dy;return nx>=0&&ny>=0&&nx<world.n&&ny<world.n&&world.water[world.idx(nx,ny)]?1:0},n=w(0,-1),s=w(0,1),e=w(1,0),we=w(-1,0),straight=(n&&s)||(e&&we),corner=(n&&(e||we))||(s&&(e||we));return corner&&!straight?.82:corner?.58:straight?.12:.34}
function smoothNoise(seed,x,y,cell){const gx=Math.floor(x/cell),gy=Math.floor(y/cell),fx=(x-gx*cell)/cell,fy=(y-gy*cell)/cell,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=hash(seed,gx,gy,1),b=hash(seed,gx+1,gy,1),c=hash(seed,gx,gy+1,1),d=hash(seed,gx+1,gy+1,1),top=a+(b-a)*sx,bottom=c+(d-c)*sx;return top+(bottom-top)*sy}
function hash(seed,x,y,salt=0){let n=(seed^Math.imul((x|0)+374761393,668265263)^Math.imul((y|0)+1274126177,2246822519)^Math.imul(salt+31,3266489917))>>>0;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295}
function smoothstep(a,b,v){const t=clamp01((v-a)/(b-a));return t*t*(3-2*t)}
function clampI(v,n){return Math.max(0,Math.min(n-1,v|0))}
function clamp01(v){return Math.max(0,Math.min(1,v))}

// Presentation grain crosses cache/tile boundaries. No random stream is consumed.
export function terrainGrainAt(world,wx,wy){const x=wx+(world.regionOrigin?.x||0),y=wy+(world.regionOrigin?.y||0);return .5+(smoothNoise(world.seedHash^0x3719,x,y,3.7)-.5)*.8+(smoothNoise(world.seedHash^0x238f,x,y,.43)-.5)*.12}
