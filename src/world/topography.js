// Dimensionless elevation above the existing freshwater datum. No biome bonuses or RNG draws.
import {coordNoise} from '../core/rng.js';
function noise(seed,x,y,scale){const ax=Math.floor(x/scale),ay=Math.floor(y/scale),tx=x/scale-ax,ty=y/scale-ay,s=t=>t*t*(3-2*t),u=s(tx),v=s(ty);return (coordNoise(seed,ax,ay)*(1-u)+coordNoise(seed,ax+1,ay)*u)*(1-v)+(coordNoise(seed,ax,ay+1)*(1-u)+coordNoise(seed,ax+1,ay+1)*u)*v}
export function initializeTopography(w){
 const elevation=new Float32Array(w.len);
 for(let i=0;i<w.len;i++){if(w.water[i])continue;const x=i%w.n,y=(i/w.n)|0,d=Math.min(w.n,w.waterDistance[i]);const upland=noise(w.seedHash^0x746f706f,x,y,24),ridges=noise(w.seedHash^0x72696467,x,y,11);elevation[i]=(1-Math.exp(-(d+1)/12))*(.15+.65*upland+.2*ridges)}
 w.terrain={schema:1,elevation};deriveDrainage(w);return w.terrain;
}
export function validateTopography(w,terrain){
 if(terrain?.travelEnabled!==undefined&&typeof terrain.travelEnabled!=='boolean')throw Error('Invalid terrain travel model.');
 if(terrain?.schema!==1||!(terrain.elevation instanceof Float32Array)||terrain.elevation.length!==w.len||terrain.elevation.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('Invalid saved terrain elevation.');
}
export function deriveDrainage(w){
 const t=w.terrain;if(!t)return;validateTopography(w,t);const e=t.elevation,slope=new Float32Array(w.len),downstream=new Int32Array(w.len).fill(-1);
 for(let i=0;i<w.len;i++){if(w.water[i])continue;const x=i%w.n,y=(i/w.n)|0;for(const j of [x>0?i-1:-1,x<w.n-1?i+1:-1,y>0?i-w.n:-1,y<w.n-1?i+w.n:-1])if(j>=0){const drop=e[i]-e[j];if(drop>slope[i]){slope[i]=drop;downstream[i]=j}}}
 t.slope=slope;t.downstream=downstream;
}
// Bilinear height at cell centers keeps short manual and longer AI steps on the same surface.
export function elevationAt(w,x,y){const e=w.terrain?.elevation;if(!e)return 0;const fx=x-.5,fy=y-.5,ix=Math.floor(fx),iy=Math.floor(fy),u=fx-ix,v=fy-iy;return (e[w.idx(ix,iy)]*(1-u)+e[w.idx(ix+1,iy)]*u)*(1-v)+(e[w.idx(ix,iy+1)]*(1-u)+e[w.idx(ix+1,iy+1)]*u)*v}
export function terrainTravel(w,fromX,fromY,toX,toY){const distance=Math.hypot(toX-fromX,toY-fromY);if(!w.terrain||w.terrain.travelEnabled===false||distance<1e-9)return{grade:0,speed:1,energy:1,routeCost:1};const grade=(elevationAt(w,toX,toY)-elevationAt(w,fromX,fromY))*8/distance,up=Math.max(0,grade),rough=Math.abs(grade)*.5;return{grade,speed:1/(1+up*2+rough),energy:1+up*3+rough,routeCost:1+up*3+rough};}
// Simultaneous conservative exchange, driven by bed elevation plus groundwater depth.
// Each donor can supply at most a quarter of its previous store per edge (four edges).
// Open water is the existing fixed reservoir; only its NET exchange crosses the land budget.
export function exchangeTerrainGroundwater(w,g,next,lateral){
 const e=w.terrain.elevation,n=w.n;next.set(g);let boundary=0;
 const pair=(i,j)=>{if(w.water[i]&&w.water[j])return;const gi=w.water[i]?1:g[i],gj=w.water[j]?1:g[j],head=(e[i]+gi)-(e[j]+gj);if(!head)return;const from=head>0?i:j,to=head>0?j:i,available=w.water[from]?1:g[from],flow=Math.min(Math.abs(head)*lateral*.25,available*.25);if(!w.water[from])next[from]-=flow;if(!w.water[to])next[to]+=flow;if(w.water[from])boundary+=flow;else if(w.water[to])boundary-=flow};
 for(let i=0;i<w.len;i++){if(i%n<n-1)pair(i,i+1);if(i+n<w.len)pair(i,i+n)}
 for(let i=0;i<w.len;i++)if(w.water[i])next[i]=1;
 return boundary;
}
