import {coordNoise,hashString} from '../core/rng.js';
const TAU=Math.PI*2,C=1048576,W=512,H=256,SEA=.49,PAGE=64;
const cache=new Map(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=(x,n)=>(x%n+n)%n;
function noise3(seed,x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),smooth=t=>t*t*(3-2*t),u=smooth(x-a),v=smooth(y-b),w=smooth(z-c);let out=0;for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)out+=coordNoise(seed^Math.imul(c+dz,1013904223),a+dx,b+dy)*(dx?u:1-u)*(dy?v:1-v)*(dz?w:1-w);return out}
function fine(seed,x,y,size){const a=Math.floor(x/size),b=Math.floor(y/size),s=t=>t*t*(3-2*t),u=s(x/size-a),v=s(y/size-b);return (coordNoise(seed,a,b)*(1-u)+coordNoise(seed,a+1,b)*u)*(1-v)+(coordNoise(seed,a,b+1)*(1-u)+coordNoise(seed,a+1,b+1)*u)*v}
function macroFor(seed){
 if(cache.has(seed))return cache.get(seed);
 const sh=hashString(seed),height=new Float32Array(W*H),rain=new Float32Array(W*H),substrate=new Float32Array(W*H),down=new Int32Array(W*H).fill(-1),basin=new Uint32Array(W*H),flow=new Float64Array(W*H).fill(1);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,lat=Math.PI/2-(y+.5)/H*Math.PI,lon=(x+.5)/W*TAU-Math.PI,px=Math.cos(lat)*Math.cos(lon),py=Math.sin(lat),pz=Math.cos(lat)*Math.sin(lon);
  height[i]=.58*noise3(sh,px*2+9,py*2+9,pz*2+9)+.28*noise3(sh^0x217f,px*5+21,py*5+21,pz*5+21)+.14*noise3(sh^0x781b,px*13+40,py*13+40,pz*13+40);
  rain[i]=clamp(.22+.9*noise3(sh^0x7261,px*3+15,py*3+15,pz*3+15)+.18*Math.cos(lat*3),.08,1.5);
  substrate[i]=noise3(sh^0x736f,px*8+30,py*8+30,pz*8+30);
 }
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(height[i]<=SEA)continue;let best=-1,min=height[i];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy||y+dy<0||y+dy>=H)continue;const j=(y+dy)*W+wrap(x+dx,W);if(height[j]<min||height[j]===min&&best>=0&&j<best){min=height[j];best=j}}down[i]=best;
  let ridge=height[i];for(let k=1;k<=5;k++)ridge=Math.max(ridge,height[y*W+wrap(x+k,W)]);rain[i]*=Math.exp(-2*Math.max(0,ridge-height[i]));
 }
 const order=Uint32Array.from({length:W*H},(_,i)=>i);order.sort((a,b)=>height[b]-height[a]||a-b);
 for(const i of order)if(down[i]>=0)flow[down[i]]+=flow[i];
 for(let k=order.length-1;k>=0;k--){const i=order[k];basin[i]=down[i]>=0?basin[down[i]]:i}
 const macro={sh,height,rain,substrate,down,basin,flow};cache.set(seed,macro);if(cache.size>4)cache.delete(cache.keys().next().value);return macro;
}
function geoCell(i){return {latitude:Math.PI/2-(Math.floor(i/W)+.5)/H*Math.PI,longitude:(i%W+.5)/W*TAU-Math.PI}}
function landing(m){let best=null;for(let i=0;i<m.down.length;i++){const j=m.down[i];if(j<0||m.flow[i]<8||m.height[i]<SEA+.025||m.height[j]<SEA+.01)continue;const a=geoCell(i),b=geoCell(j),latitude=(a.latitude+b.latitude)/2,longitude=a.longitude+wrap(b.longitude-a.longitude+Math.PI,TAU)-Math.PI;const midpoint=wrap((a.longitude+longitude)/2+Math.PI,TAU)-Math.PI;if(Math.abs(latitude)>Math.PI/3)continue;const score=Math.abs(latitude-35*Math.PI/180)+Math.abs(midpoint)*.35;if(!best||score<best.score||score===best.score&&i<best.edge)best={edge:i,latitude,longitude:midpoint,score}}
 if(!best)throw Error('Planet has no supported inland river landing.');return best;
}
function freezeDescriptor(d){return Object.freeze({...d,anchor:Object.freeze({...d.anchor})})}
export function createPlanetDescriptor(seed){seed=String(seed);const site=landing(macroFor(seed)),latitude=site.latitude+TAU*64/C,longitude=site.longitude-TAU*64/(C*Math.cos(latitude));return freezeDescriptor({schema:1,generator:'planetary/1',planetId:'planet:'+seed,seed,coordinateUnits:'terrain-tiles',equatorialCircumferenceTiles:C,macroWidth:W,macroHeight:H,pageSizeTiles:PAGE,projection:'regional-equirectangular/1',anchor:{latitude,longitude},landingEdge:site.edge})}
export function validatePlanetDescriptor(seed,d){
 const expected=createPlanetDescriptor(seed);
 if(!d||Object.keys(d).length!==Object.keys(expected).length||Object.keys(expected).some(k=>k==='anchor'?(!d.anchor||Object.keys(d.anchor).length!==2||d.anchor.latitude!==expected.anchor.latitude||d.anchor.longitude!==expected.anchor.longitude):d[k]!==expected[k]))throw Error('Invalid or unsupported planet descriptor.');return freezeDescriptor(d);
}
export class PlanetGeography{
 #m;
 constructor(seed,descriptor=null){this.descriptor=descriptor?validatePlanetDescriptor(seed,descriptor):createPlanetDescriptor(seed);this.#m=macroFor(String(seed));Object.freeze(this)}
 localToGeo(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid planetary coordinate.');const a=this.descriptor.anchor,latitude=a.latitude-TAU*y/C,delta=TAU*x/(C*Math.cos(a.latitude));if(Math.abs(latitude)>Math.PI/3||Math.abs(latitude-a.latitude)>Math.PI/12||Math.abs(delta)>Math.PI/12)throw Error('Coordinate outside supported regional projection.');return {latitude,longitude:wrap(a.longitude+delta+Math.PI,TAU)-Math.PI}}
 #worldPoint(i){const g=geoCell(i),a=this.descriptor.anchor,delta=wrap(g.longitude-a.longitude+Math.PI,TAU)-Math.PI;return{x:delta*C*Math.cos(a.latitude)/TAU,y:(a.latitude-g.latitude)*C/TAU}}
 macroCell(x,y){if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||y<0||y>=H)throw Error('Invalid macro coordinate.');const i=y*W+wrap(x,W),m=this.#m;return Object.freeze({id:i,...geoCell(i),elevation:m.height[i],rain:m.rain[i],substrate:m.substrate[i],downstream:m.down[i],watershed:m.basin[i],flow:m.flow[i],ocean:m.height[i]<=SEA})}
 #grid(g){return {u:wrap((g.longitude+Math.PI)/TAU*W-.5,W),v:clamp((Math.PI/2-g.latitude)/Math.PI*H-.5,0,H-1)}}
 #field(field,g){const {u,v}=this.#grid(g),x=Math.floor(u),y=Math.floor(v),a=u-x,b=v-y,x1=wrap(x+1,W),y1=Math.min(H-1,y+1);return(field[y*W+x]*(1-a)+field[y*W+x1]*a)*(1-b)+(field[y1*W+x]*(1-a)+field[y1*W+x1]*a)*b}
 #segments(x,y,width=0,height=0){const g=this.#grid(this.localToGeo(x+width/2,y+height/2)),cx=Math.floor(g.u),cy=Math.floor(g.v),radius=2+Math.ceil(Math.max(width,height)/1024),out=[],seen=new Set(),m=this.#m;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const row=cy+dy;if(row<0||row>=H)continue;const i=row*W+wrap(cx+dx,W),j=m.down[i];if(seen.has(i)||j<0||m.flow[i]<8||m.height[i]<=SEA)continue;seen.add(i);out.push({id:i,to:j,watershed:m.basin[i],width:1.25+Math.min(3,Math.pow(m.flow[i],.3)*.22),a:this.#worldPoint(i),b:this.#worldPoint(j)})}return out}
 #sample(x,y,segments){const g=this.localToGeo(x,y),m=this.#m,grid=this.#grid(g),ci=Math.round(grid.v)*W+wrap(Math.round(grid.u),W),macroHeight=this.#field(m.height,g),elevation=clamp(macroHeight+(fine(m.sh^0x6465,x,y,96)-.5)*.004+(fine(m.sh^0x6669,x,y,24)-.5)*.001,0,1);let distance=64,river=null,riverDistance=Infinity;
  for(const s of segments){const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,t=clamp(((x-s.a.x)*dx+(y-s.a.y)*dy)/(dx*dx+dy*dy),0,1),d=Math.hypot(x-s.a.x-t*dx,y-s.a.y-t*dy);distance=Math.min(distance,d);if(d<=s.width&&(d<riverDistance||d===riverDistance&&s.id<river.id)){river=s;riverDistance=d}}
  const root=m.basin[ci],lakePoint=this.#worldPoint(root),lake=m.height[root]>SEA&&m.down[root]<0&&m.flow[root]>=4&&Math.hypot(x-lakePoint.x,y-lakePoint.y)<16+Math.sqrt(m.flow[root])*12;
  const ocean=elevation<=SEA,water=ocean||!!river||lake,rain=this.#field(m.rain,g),altitude=Math.max(0,(elevation-SEA)/(1-SEA)),temperature=clamp(.83-.55*Math.abs(Math.sin(g.latitude))-.4*altitude,0,1),moisture=clamp(.2+.38*rain+.4*Math.exp(-distance/8),0,1);
  return Object.freeze({x,y,...g,elevation:altitude,water:water?1:0,ocean,riverEdge:river?.id??null,watershed:river?.watershed??root,closedBasin:m.height[root]>SEA,rainScale:clamp(rain,.08,2),temperature,moisture,fertility:clamp(.2+.55*this.#field(m.substrate,g)+.2*moisture,0,1),depth:water?(ocean?clamp(.15+(SEA-elevation)*6,.15,2):.2):0,salinity:ocean?1:0});
 }
 sample(x,y){return this.#sample(x,y,this.#segments(x,y))}
 region(x,y,width,height){if(![x,y,width,height].every(Number.isSafeInteger)||width<1||height<1||width>128||height>128)throw Error('Invalid current-sized geography region.');this.localToGeo(x+width,y+height);const segments=this.#segments(x,y,width,height),rows=[];for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++)rows.push(this.#sample(x+dx+.5,y+dy+.5,segments));return rows}
 boundary(axis,position,start,end){if(!['x','y'].includes(axis)||![position,start,end].every(Number.isFinite)||end<=start)throw Error('Invalid geography boundary.');const vertical=axis==='x',segments=this.#segments(vertical?position:start,vertical?start:position,vertical?0:end-start,vertical?end-start:0),crossings=[];
  for(const s of segments){const a=vertical?s.a.x:s.a.y,b=vertical?s.b.x:s.b.y,p=vertical?s.a.y:s.a.x,q=vertical?s.b.y:s.b.x;if(a===b){if(Math.abs(a-position)<1e-8&&Math.max(p,q)>=start&&Math.min(p,q)<=end)crossings.push({riverEdge:s.id,watershed:s.watershed,kind:'overlap',start:Math.max(start,Math.min(p,q)),end:Math.min(end,Math.max(p,q))});continue}const t=(position-a)/(b-a),at=p+(q-p)*t;if(t>=0&&t<=1&&at>=start&&at<=end)crossings.push({riverEdge:s.id,watershed:s.watershed,kind:'point',at})}
  return Object.freeze({key:`${axis}:${position}:${start}:${end}`,crossings:crossings.sort((a,b)=>a.riverEdge-b.riverEdge)});
 }
 pageCrossings(cx,cy){if(!Number.isSafeInteger(cx)||!Number.isSafeInteger(cy))throw Error('Invalid geography page.');const x=cx*PAGE,y=cy*PAGE;return{west:this.boundary('x',x,y,y+PAGE),east:this.boundary('x',x+PAGE,y,y+PAGE),north:this.boundary('y',y,x,x+PAGE),south:this.boundary('y',y+PAGE,x,x+PAGE)}}
}
