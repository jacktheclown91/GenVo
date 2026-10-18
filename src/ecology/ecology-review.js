import {canSwim} from '../lineage/lifestyle.js';
import {SPECIES} from '../organisms/species.js';
import {wildStartPlan} from '../organisms/wild-bodies.js';
import {FRESHWATER_FOOD,freshwaterField,freshwaterPreference} from './freshwater-food.js';
// amphibiousForage: a hungry animal that can SWIM also seeks the freshwater food its mouth can use
//   while on land (previously only while already standing in water). Uses the existing
//   bestFreshwaterFood search (reach, bank access); non-swimmers are unaffected.
// Provisional development defaults with the integrated aquatic candidate (?ecologyReview=0 disables).
export const ECOLOGY_REVIEW={amphibiousForage:true,shoreHabitat:true};
export function amphibiousForager(a){return ECOLOGY_REVIEW.amphibiousForage&&canSwim(a)}
// shoreHabitat: a land-start species whose FOUNDING BODY swims keeps its inherited habitat association
//   (e.g. Bankjaw spawnNear Mirelick) but each founding site moves to the nearest shoreline cell (searched
//   outward from the inherited site in SHORE_HABITAT_RANGE steps). World generation only: no animals or food are created or moved later.
export const SHORE_HABITAT_RANGE=14;
const founding=new Map();
// Conditional, anatomy-based founding habitat (creator decision 2026-10-15). Applies only to a land-start
// species whose FOUNDING BODY swims. Candidate sites are shoreline land cells (reachable water beside
// them); each is scored by the freshwater food this founder's own mouth can eat within 4 tiles, less a
// distance cost from the inherited site. If no shoreline offers food the founder can use, the inherited
// site is kept. World generation only: nothing is created or moved later.
export function shoreHabitatCenter(world,species,center){
  if(!ECOLOGY_REVIEW.shoreHabitat||!center||SPECIES[species]?.spawnInWater)return center;
  if(!founding.has(species)){const f={species,alive:true,adaptations:[],bodyPlan:wildStartPlan(species)};founding.set(species,{swims:canSwim(f),diet:Object.keys(FRESHWATER_FOOD).map(kind=>[kind,freshwaterPreference(f,kind)]).filter(([,p])=>p>0)})}
  const f=founding.get(species);if(!f.swims||!f.diet.length)return center;
  const foodNear=(x,y)=>{let v=0;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const px=x+dx,py=y+dy;if(!world.isPlayable(px,py))continue;const i=world.idx(px,py);if(!world.water[i])continue;for(const [kind,p] of f.diet)v+=(freshwaterField(world,kind)?.[i]||0)*FRESHWATER_FOOD[kind].nutrition*p}return v};
  for(let r=SHORE_HABITAT_RANGE;r<=world.n;r+=SHORE_HABITAT_RANGE){
    let best=null,bestScore=0;
    for(let y=Math.floor(center.y-r);y<=center.y+r;y+=2)for(let x=Math.floor(center.x-r);x<=center.x+r;x+=2){
      const px=x+.5,py=y+.5;if(!world.isPlayable(px,py)||world.water[world.idx(px,py)])continue;
      const shore=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>world.isPlayable(px+dx,py+dy)&&world.water[world.idx(px+dx,py+dy)]);if(!shore)continue;
      const d=Math.hypot(px-center.x,py-center.y);if(d>r)continue;const food=foodNear(px,py);if(food<=0)continue;
      const score=food/(1+d/SHORE_HABITAT_RANGE);if(score>bestScore){bestScore=score;best={...center,x:px,y:py,shoreFood:+food.toFixed(2)}}
    }
    if(best)return best;
  }
  return center;
}
