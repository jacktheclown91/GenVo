import {groundDiet,canHunt,preyPreference} from '../ecology/functional-diet.js';
import {wildTraits} from '../organisms/wild-bodies.js';
import {CFG,PLANTS} from '../sim/config.js';
import {SPECIES,canPreyOn} from '../organisms/species.js';

export function nearestThreat(sim,animal,radius=10){
  if(!sim||!animal)return null;
  let best=null,bestD=radius;
  for(const other of sim.animals||[]){
    if(!other.alive||other.id===animal.id||!canHunt(other)||preyPreference(other,animal)<=0)continue;
    const d=Math.hypot(other.x-animal.x,other.y-animal.y)/wildTraits(other).stealth;
    if(d<bestD){bestD=d;best=other}
  }
  return best?{animal:best,distance:bestD,label:SPECIES[best.species]?.label||best.species}:null;
}

export function nearbyFood(sim,animal,radius=6){
  if(!sim||!animal)return null;
  const spec=SPECIES[animal.species],w=sim.world;if(!spec||!w)return null;
  const minX=Math.max(1,Math.floor(animal.x-radius)),maxX=Math.min(CFG.worldSize-2,Math.ceil(animal.x+radius));
  const minY=Math.max(1,Math.floor(animal.y-radius)),maxY=Math.min(CFG.worldSize-2,Math.ceil(animal.y+radius));
  let best=null,bestScore=-Infinity;
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const d=Math.hypot(x+.5-animal.x,y+.5-animal.y);if(d>radius)continue;
    const i=w.idx(x,y);
    for(const [kind,eff] of Object.entries(groundDiet(animal))){
      if(eff<=0)continue;
      let amount=0,nutrition=0;
      if(kind==='carrion'){amount=w.carrion?.[i]||0;nutrition=34}
      else if(PLANTS[kind]){amount=w.plants?.[kind]?.[i]||0;nutrition=PLANTS[kind].nutrition}
      else continue;
      if(amount<.12)continue;
      const score=amount*eff*nutrition-d*.08;
      if(score>bestScore){bestScore=score;best={x:x+.5,y:y+.5,kind,label:kind==='carrion'?'Carrion':PLANTS[kind].label,distance:d}}
    }
  }
  return best;
}

export function directionWord(from,to){
  if(!from||!to)return'';const dx=to.x-from.x,dy=to.y-from.y;if(Math.hypot(dx,dy)<.5)return'right here';
  const a=Math.atan2(dy,dx),oct=(Math.round(a/(Math.PI/4))+8)%8;
  return['east','southeast','south','southwest','west','northwest','north','northeast'][oct];
}
