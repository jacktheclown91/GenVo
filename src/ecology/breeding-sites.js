import {SPECIES} from '../organisms/species.js';
import {hasPart} from '../lineage/part-abilities.js';

// EO: a temporary, remembered breeding site after actual mating. No pair is
// created, selected, made receptive or assigned a fixed sex-role here. Wild
// burrower-colony behavior is gated by functional digging anatomy.
export const BREEDING_SITE=Object.freeze({radius:2.6,maxReturnDistance:12,postGestationDays:30,qualityIntervalDays:4});

export function rememberBreedingSite(sim,a,b){
  if(!a?.alive||!b?.alive||a.player||b.player||a.lineage||b.lineage||a.species!==b.species)return false;
  if(SPECIES[a.species]?.social?.mode!=='colony'||
    (!hasPart(a,'digging-forelimb')&&!hasPart(b,'digging-forelimb')))return false;
  const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
  if(!sim.canOccupy(a,x,y)||!sim.canReach(a,x,y)||!sim.canOccupy(b,x,y)||!sim.canReach(b,x,y))return false;
  const span=(SPECIES[a.species].gestation||0)+BREEDING_SITE.postGestationDays;
  // The two partners share a place because they mated there, not because either
  // individual is assigned to nest-making by sex.
  for(const animal of [a,b])animal.breedingSite={x,y,partnerId:animal.id===a.id?b.id:a.id,
    conceivedDay:sim.day,untilDay:sim.day+span,lastQualityDay:null,locallySuitable:true};
  return true;
}

export function breedingSiteDecision(sim,a,{energy=1,hydration=1}={}){
  const site=a?.breedingSite;
  if(!site||!a.alive)return null;
  if(sim.day>site.untilDay||!Number.isFinite(site.x)||!Number.isFinite(site.y)||
    a.player||a.lineage||SPECIES[a.species]?.social?.mode!=='colony'){
    delete a.breedingSite;return null;
  }
  // Existing survival/flight, feeding and immigration priorities take precedence.
  // Environmental attachment is an optional healthy-animal behavior only.
  if(energy<.75||hydration<.62||a.health<76||a.infected)return null;
  if(sim.migration.isAway(a))return null;
  const d=Math.hypot(a.x-site.x,a.y-site.y);
  if(d>BREEDING_SITE.maxReturnDistance){delete a.breedingSite;return null;}
  if(site.lastQualityDay===null||sim.day-site.lastQualityDay>=BREEDING_SITE.qualityIntervalDays){
    const q=sim.migration.habitatQuality(a,site.x,site.y);
    site.lastQualityDay=sim.day;
    site.locallySuitable=q.food>=.10&&q.water>=.16&&q.danger<.48&&
      sim.canOccupy(a,site.x,site.y)&&sim.canReach(a,site.x,site.y);
  }
  if(!site.locallySuitable){delete a.breedingSite;return null;}
  if(d>BREEDING_SITE.radius)return{intent:'breeding-site-return',target:{x:site.x,y:site.y,breedingSite:true}};
  // Once home, animals can rest instead of drift away in continuous roaming.
  // The normal decision phase is re-evaluated; actual hunger or danger releases
  // them immediately and the finite memory eventually expires.
  return{intent:'breeding-site-rest',target:null};
}
