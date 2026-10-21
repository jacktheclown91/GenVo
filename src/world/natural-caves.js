import {coordNoise} from '../core/rng.js';
import {deriveDrainage} from './topography.js';
import {CAVES} from './cave-policy.js';
import {excavatePassage,validateSubsurface,batchExcavation} from './subsurface.js';
import {TERRAIN_SEDIMENT} from './terrain-sediment.js';
export {CAVES};
export function caveFracture(w,i){const x=i%w.n+(w.regionOrigin?.x||0),y=(i/w.n|0)+(w.regionOrigin?.y||0);return coordNoise(w.seedHash^0x63617665,Math.floor(x/3),Math.floor(y/3))}
// Coherent geological cavities have real multi-cell widths. The candidate
// field is used only during formation; saved passages remain the sole spatial
// authority. Material is deposited on the nearby exterior talus ring so spoil
// does not raise the very floor subsequently being opened into a chamber.
export function growGeologicalChamber(w,entrance){
 const root=w.subsurface?.passages.get(entrance);if(!root||root.closed||root.origin!==CAVES.policy)return 0;
 return batchExcavation(w,()=>{
  const n=w.n,cx=entrance%n,cy=entrance/n|0,seed=w.seedHash^entrance;
  const rx=3+coordNoise(seed,cx,cy)*3,ry=2+coordNoise(seed^719,cy,cx)*3,r=Math.ceil(Math.max(rx,ry))+1;
  const field=new Set(),sinks=[];
  for(let y=Math.max(1,cy-r);y<Math.min(n-1,cy+r+1);y++)for(let x=Math.max(1,cx-r);x<Math.min(n-1,cx+r+1);x++){
   const i=y*n+x;if(w.water[i]||!w.isPlayable(x+.5,y+.5))continue;
   const bend=(coordNoise(seed,Math.floor(y/2),1)-.5)*1.8;
   const d=((x-cx-bend)/rx)**2+((y-cy)/ry)**2;
   if(d<.72+coordNoise(seed,Math.floor(x/2),Math.floor(y/2))*.5&&w.moisture[i]>.23&&caveFracture(w,i)>.35)field.add(i);
   else if(d>=1.25&&d<2.6&&!w.subsurface.passages.has(i))sinks.push(i);
  }
  const frontier=[entrance],seen=new Set(frontier);let created=0;
  for(let k=0;k<frontier.length;k++){
   const i=frontier[k],p=w.subsurface.passages.get(i),x=i%n,y=i/n|0;
   for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,y>0?i-n:-1,y<n-1?i+n:-1]){
    if(!field.has(j)||seen.has(j))continue;
    seen.add(j);const existing=w.subsurface.passages.get(j);
    if(existing){if(!existing.closed&&Math.abs(existing.floor-p.floor)<=.6)frontier.push(j);continue}
    if(Math.abs(w.terrain.elevation[j]*20-1.2-p.floor)>.6)continue;
    const receiver=sinks.filter(q=>w.terrain.elevation[q]+.04<.99).sort((a,b)=>w.terrain.elevation[a]-w.terrain.elevation[b]||a-b)[0];
    if(receiver===undefined)continue;
    const opened=excavatePassage(w,j,{origin:CAVES.policy,receiver});
    if(opened){frontier.push(j);created++}
   }
  }
  return created;
 });
}
export function initializeCaves(w,{generate=false}={}){
 w.subsurface={...w.subsurface,cavePolicy:CAVES.policy,caveErosion:new Map(),naturalEroded:0,initialCaves:0};
 if(!generate)return;
 w.subsurface.formation='fracture-chambers/2';
 return batchExcavation(w,()=>{
 // Initial geological conditions, not a claim of elapsed ecological history.
 // Existing drainage and material heterogeneity place connected cavities.
 for(let y=5;y<w.n-5;y++)for(let x=5;x<w.n-5;x++){
  const i=y*w.n+x;if(w.water[i]||w.terrain.elevation[i]<.09||w.moisture[i]<.45||caveFracture(w,i)<.992||w.subsurface.passages.has(i))continue;
  // Strong local fracture concentrations make fewer, better connected natural caverns.
  // Adjacent fractures extend one cavity rather than opening a shaft in every
  // cell of the same rock patch. This is geometry, not a population quota.
  let nearbyOpening=false;for(let dy=-3;dy<=3&&!nearbyOpening;dy++)for(let dx=-3;dx<=3;dx++)if(Math.abs(dx)+Math.abs(dy)<=3&&w.subsurface.passages.get((y+dy)*w.n+x+dx)?.entry){nearbyOpening=true;break}
  if(nearbyOpening)continue;
  const receiver=w.terrain.downstream[i];if(receiver<0||w.water[receiver]||w.terrain.elevation[receiver]+.1>=.98)continue;
  const opened=excavatePassage(w,i,{entry:true,origin:CAVES.policy,receiver});if(!opened)continue;w.subsurface.initialCaves++;
  // Spread each conserved cavity across local geological fractures instead of
  // drawing a straight one-cell dungeon corridor. The entire open structure is
  // still made of real, individually financed excavations; failure to find a
  // valid spoil receiver or roof clearance ends growth without phantom space.
  growGeologicalChamber(w,i);

 }
 });
}
// Deterministic, material-funded multi-front geology. Each accepted chamber
// or branch is an actual open passage with the same roof/load, slope, spoil,
// collapse, and save contracts as animal excavation. No biological RNG draws.
export function growNaturalCavern(w,entrance,limit=10){
 const opened=w.subsurface?.passages?.get(entrance);
 if(!opened||opened.closed||opened.origin!==CAVES.policy||!Number.isSafeInteger(limit)||limit<0||limit>24)return 0;
 const roots=[entrance],seen=new Set(roots),n=w.n,ex=entrance%n,ey=entrance/n|0;
 let created=0;
 for(let count=0;count<limit;count++){
  const candidates=new Map();
  for(const at of roots){
   const p=w.subsurface.passages.get(at);if(!p||p.closed)continue;
   const x=at%n,y=at/n|0;
   for(const j of [x>0?at-1:-1,x<n-1?at+1:-1,y>0?at-n:-1,y<n-1?at+n:-1]){
    if(j<0||seen.has(j)||w.water[j]||w.subsurface.passages.has(j))continue;
    const jx=j%n,jy=j/n|0;
    if(!w.isPlayable(jx+.5,jy+.5)||Math.abs(w.terrain.elevation[j]*20-1.2-p.floor)>.6)continue;
    const fracture=caveFracture(w,j),moisture=w.moisture[j];
    if(fracture<.48||moisture<.23)continue;
    const adjacent=[jx>0?j-1:-1,jx<n-1?j+1:-1,jy>0?j-n:-1,jy<n-1?j+n:-1]
      .filter(q=>w.subsurface.passages.get(q)&&!w.subsurface.passages.get(q).closed).length;
    const travel=Math.hypot(jx-ex,jy-ey);
    const score=fracture*.7+Math.min(3,adjacent)*.13+moisture*.1-travel*.012;
    if(!candidates.has(j)||score>candidates.get(j))candidates.set(j,score);
   }
  }
  if(!candidates.size)break;
  let gained=false;
  for(const [j] of [...candidates].sort((a,b)=>b[1]-a[1]||a[0]-b[0])){
   seen.add(j);
   const p=excavatePassage(w,j,{origin:CAVES.policy});
   if(!p)continue;
   roots.push(j);created++;gained=true;break;
  }
  if(!gained)break;
 }
 return created;
}

export function naturalErosionEligible(w,i,j){
 return w.subsurface?.cavePolicy===CAVES.policy&&!w.water[i]&&!w.water[j]&&w.isPlayable(i%w.n+.5,(i/w.n|0)+.5)&&w.isPlayable(j%w.n+.5,(j/w.n|0)+.5)&&w.terrain.elevation[i]>=CAVES.minimumColumn&&caveFracture(w,i)>.65&&(!w.subsurface.passages.has(i)||w.subsurface.passages.get(i).origin===CAVES.policy&&!w.subsurface.passages.get(i).entry&&!w.subsurface.passages.get(i).closed);
}
// Called with actual committed dry-land runoff edges, never rainfall alone.
// The flow transports undercut material into its real downstream cell.
export function erodeNaturalCaves(w,flows){
 const s=w.subsurface;if(s?.cavePolicy!==CAVES.policy)return 0;validateCaves(w,CAVES.policy);let moved=0;const spent=new Map();
 for(const edge of flows)if(!Array.isArray(edge)||edge.length!==3||!Number.isSafeInteger(edge[0])||!Number.isSafeInteger(edge[1])||edge[0]<0||edge[1]<0||edge[0]>=w.len||edge[1]>=w.len||!Number.isFinite(edge[2])||edge[2]<0)throw Error('Invalid cave erosion water flux.');
 for(const [i,j,water] of flows){
  if(!Number.isFinite(water)||water<0)throw Error('Invalid cave erosion water flux.');if(!naturalErosionEligible(w,i,j)||!water)continue;
  const prior=s.passages.get(i),partial=s.caveErosion.get(i),floor=prior?.floor??partial?.floor??w.terrain.elevation[i]*20-1.2,volume=prior?.void??partial?.void??0;
  const target=w.terrain.elevation[i]-floor/20;if(target<.04||target>.119999)continue;
  const wanted=Math.min(water*CAVES.erosionPerWater*(.25+.75*caveFracture(w,i)),TERRAIN_SEDIMENT.dailyCellCap-(spent.get(i)||0),target-volume,.99-w.terrain.elevation[j]);if(!(wanted>0))continue;
  const before=w.terrain.elevation[j],after=Math.fround(before+wanted),actual=after-before;if(!(actual>0)||volume+actual>target+1e-6)continue;
  w.terrain.elevation[j]=after;spent.set(i,(spent.get(i)||0)+actual);const next=volume+actual;s.excavated+=actual;s.naturalEroded+=actual;moved+=actual;
  if(next>=CAVES.passageVolume-1e-6){s.passages.set(i,{i,floor,void:next,entry:next>=target-1e-6,closed:false,origin:CAVES.policy});s.caveErosion.delete(i)}else s.caveErosion.set(i,{i,floor,void:next});
  s.revision++;
 }
 if(moved){deriveDrainage(w);w.buildHydrology()}return moved;
}
export function validateCaves(w,rule){
 const s=w.subsurface;if(s?.formation!==undefined&&s.formation!=='fracture-chambers/2')throw Error('Unknown cave formation version.');if(rule!==undefined&&rule!==CAVES.policy)throw Error('Unknown saved natural-cave rules.');
 if(rule===undefined){if(s?.cavePolicy!==undefined||s?.caveErosion!==undefined||s?.naturalEroded!==undefined||s?.initialCaves!==undefined||[...(s?.passages?.values()||[])].some(p=>p.origin===CAVES.policy))throw Error('Natural cave geometry requires its recorded policy.');return}
 if(s?.cavePolicy!==CAVES.policy||!(s.caveErosion instanceof Map)||!Number.isFinite(s.naturalEroded)||s.naturalEroded<0||s.naturalEroded>s.excavated+1e-6||!Number.isSafeInteger(s.initialCaves)||s.initialCaves<0)throw Error('Invalid saved natural-cave state.');
 for(const [i,p] of s.caveErosion)if(i!==p?.i||!Number.isSafeInteger(i)||i<0||i>=w.len||!Number.isFinite(p.floor)||p.floor<0||p.floor>20||!Number.isFinite(p.void)||p.void<=0||p.void>=CAVES.passageVolume||s.passages.has(i))throw Error('Invalid saved partial cave.');
 validateSubsurface(w,true);
}
