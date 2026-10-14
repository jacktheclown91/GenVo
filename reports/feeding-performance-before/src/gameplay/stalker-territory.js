import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {stalkerProfileFor} from './predator-encounter.js';

// Player-run Stalker home ranges.
// This authority is intentionally inert in headless ecology. Dens are persistent world
// sites rather than disposable owner markers: adults may be displaced, old scrapes can
// become abandoned, and overlapping Stalkers can deterministically take over a site.
// No territory establishment, competition, sign reading or takeover consumes sim RNG.
export class StalkerTerritoryController{
  constructor(sim){this.sim=sim;this.sites=new Map();this.nextSiteId=1;this.lastTakeover=null}

  enabled(hunter){return !!(this.sim.playerEnabled&&hunter?.alive&&hunter.species==='needlejaw'&&hunter.age>=SPECIES.needlejaw.maturity)}

  ownedSite(hunter){
    if(!hunter)return null;
    for(const den of this.sites.values())if(den.ownerId===hunter.id&&den.abandonedTick==null)return den;
    return null;
  }

  canEstablish(hunter){
    if(!this.enabled(hunter))return false;
    if((hunter.denDisplacedUntil||0)>this.sim.tickCount)return false;
    const from=hunter.denDisplacedFrom;
    if(from&&Math.hypot(hunter.x-from.x,hunter.y-from.y)<5.5)return false;
    return true;
  }

  ensure(hunter){
    if(!this.enabled(hunter))return null;
    const existing=this.ownedSite(hunter);if(existing)return existing;
    if(!this.canEstablish(hunter))return null;
    const style=stalkerProfileFor(hunter).id,radius=style==='rusher'?9:style==='wary'?6.8:8;
    const den={id:this.nextSiteId++,ownerId:hunter.id,x:hunter.x,y:hunter.y,radius,coreRadius:radius*.68,style,createdTick:this.sim.tickCount,feeds:0,lastKillTick:-Infinity,abandonedTick:null,known:false,everKnown:false,lastInspectedTick:null,takeovers:0,claimedTick:null,previousOwnerId:null,previousStyle:null,changed:false};
    this.sites.set(den.id,den);hunter.denDisplacedFrom=null;hunter.denDisplacedUntil=0;return den;
  }

  abandon(den,reason='owner-gone'){
    if(!den||den.abandonedTick!=null)return den;
    den.abandonedTick=this.sim.tickCount;den.abandonReason=reason;return den;
  }

  observe(){
    if(!this.sim.playerEnabled)return;
    const live=new Map();for(const hunter of this.sim.animals)if(this.enabled(hunter))live.set(hunter.id,hunter);
    for(const den of this.sites.values()){
      if(den.abandonedTick!=null)continue;
      const owner=live.get(den.ownerId);if(!owner){this.abandon(den);continue}
      den.style=stalkerProfileFor(owner).id;
    }
    for(const hunter of live.values())if(!this.ownedSite(hunter))this.ensure(hunter);
  }

  activeSites(){
    if(!this.sim.playerEnabled)return[];
    const fadeTicks=CFG.dayTicks*6;
    return[...this.sites.values()].filter(den=>den.abandonedTick==null||this.sim.tickCount-den.abandonedTick<fadeTicks);
  }

  siteFor(hunter){return this.ownedSite(hunter)||this.ensure(hunter)}

  pressureFor(hunter,player){
    const den=this.siteFor(hunter);if(!den||!player?.alive)return null;
    const distance=Math.hypot(player.x-den.x,player.y-den.y),ownerDistance=Math.hypot(hunter.x-den.x,hunter.y-den.y);
    return{den,distance,ownerDistance,inside:distance<=den.radius,insideCore:distance<=den.coreRadius};
  }

  nearbySite(player,{radius=2.0,includeAbandoned=true}={}){
    if(!player?.alive||!this.sim.playerEnabled)return null;let best=null;
    for(const den of this.activeSites()){
      if(!includeAbandoned&&den.abandonedTick!=null)continue;
      const distance=Math.hypot(player.x-den.x,player.y-den.y);if(distance>radius)continue;
      const owner=this.sim.animals.find(a=>a.id===den.ownerId&&a.alive)||null;
      const site={den,distance,known:!!den.known,abandoned:den.abandonedTick!=null,style:den.style,owner,ownerDistance:owner?Math.hypot(owner.x-player.x,owner.y-player.y):Infinity};
      if(!best||distance<best.distance)best=site;
    }
    return best;
  }

  inspect(player,siteId=null){
    const chosenDen=siteId===null?null:this.activeSites().find(d=>d.id===siteId),owner=chosenDen?this.sim.animals.find(a=>a.id===chosenDen.ownerId&&a.alive):null;const site=siteId===null?this.nearbySite(player,{radius:1.9,includeAbandoned:true}):chosenDen&&Math.hypot(player.x-chosenDen.x,player.y-chosenDen.y)<=1.9?{den:chosenDen,known:!!chosenDen.known,abandoned:chosenDen.abandonedTick!=null,style:chosenDen.style,owner,ownerDistance:owner?Math.hypot(owner.x-player.x,owner.y-player.y):Infinity}:null;
    if(!site)return{ok:false,type:'den-inspect',message:'No Stalker scrape close enough to read.'};
    const {den}=site,wasChanged=!!den.changed;den.known=true;den.everKnown=true;den.changed=false;den.lastInspectedTick=this.sim.tickCount;
    const evidence=this.describe(den,player,{wasChanged});
    this.sim.cognition?.record?.(player,'den-inspected',evidence.note,{siteId:den.id,ownerId:den.ownerId,style:den.style,abandoned:site.abandoned,takeovers:den.takeovers||0,x:den.x,y:den.y});
    this.sim.lastPlayerAction={type:'den-inspect',siteId:den.id,ownerId:den.ownerId,tick:this.sim.tickCount};
    return{ok:true,type:'den-inspect',style:den.style,abandoned:site.abandoned,changed:wasChanged,ownerDistance:site.ownerDistance,message:evidence.message};
  }

  describe(den,player=this.sim.player(),{wasChanged=false}={}){
    if(!den)return{message:'No readable sign.',note:'Read an empty scrape'};
    const abandoned=den.abandonedTick!=null,owner=this.sim.animals.find(a=>a.id===den.ownerId&&a.alive)||null;
    const ownerDistance=owner&&player?Math.hypot(owner.x-player.x,owner.y-player.y):Infinity;
    const daysSinceKill=Number.isFinite(den.lastKillTick)?Math.max(0,(this.sim.tickCount-den.lastKillTick)/CFG.dayTicks):Infinity;
    const sinceClaim=Number.isFinite(den.claimedTick)?Math.max(0,(this.sim.tickCount-den.claimedTick)/CFG.dayTicks):Infinity;
    const activity=abandoned?'abandoned':sinceClaim<1.5&&den.takeovers>0?'newly claimed':daysSinceKill<1.5?'very fresh':daysSinceKill<4?'recently used':(den.feeds||0)>0?'old feeding sign':'freshly worked';
    const tendency=den.style==='rusher'?'deep straight gouges point to a hunter that commits early and fast':den.style==='wary'?'broken stop-start tracks suggest a hunter that hesitates longer and may retreat when hurt':'side-scuffed drag marks suggest a hunter that circles and waits until close';
    const proximity=Number.isFinite(ownerDistance)?ownerDistance<6?' The owner is very close.':ownerDistance<12?' The owner is somewhere nearby.':' The owner is away from the scrape.':'';
    const turnover=(wasChanged||den.takeovers>0&&den.previousOwnerId!=null)?' New tracks cross older sign.':'';
    const prefix=abandoned?'Abandoned scrape':den.takeovers>0?'Claimed Stalker scrape':'Stalker scrape';
    return{message:`${prefix} · ${activity} · ${tendency}.${turnover}${proximity}`,note:`Read ${abandoned?'abandoned ':''}${den.takeovers>0?'claimed ':''}Stalker den signs: ${tendency}`};
  }

  knownStatus(player=this.sim.player(),radius=3.2){
    const site=this.nearbySite(player,{radius,includeAbandoned:true});if(!site)return null;
    return{...site,description:site.known?this.describe(site.den,player):null};
  }

  playerStatus(player=this.sim.player()){
    if(!player?.alive||!this.sim.playerEnabled)return null;let best=null;
    for(const den of this.activeSites()){
      if(den.abandonedTick!=null)continue;
      const owner=this.sim.animals.find(a=>a.id===den.ownerId&&a.alive);if(!owner)continue;
      const distance=Math.hypot(player.x-den.x,player.y-den.y);if(distance>den.radius+2.5)continue;
      const insideCore=distance<=den.coreRadius,inside=distance<=den.radius;
      if(!best||distance<best.distance)best={siteId:den.id,ownerId:owner.id,x:den.x,y:den.y,radius:den.radius,coreRadius:den.coreRadius,distance,inside,insideCore,style:den.style,ownerDistance:Math.hypot(owner.x-player.x,owner.y-player.y),takeovers:den.takeovers||0,known:!!den.known,changed:!!den.changed};
    }
    return best;
  }

  restDecision(hunter,energyRatio){
    const den=this.siteFor(hunter);if(!den||hunter.playerHunt||hunter.playerAversion?.untilTick>this.sim.tickCount)return null;
    if(energyRatio<.78)return null;
    const d=Math.hypot(hunter.x-den.x,hunter.y-den.y);
    if(d>den.radius*1.18)return{intent:'return-den',target:{x:den.x,y:den.y,den:true,siteId:den.id}};
    if(d<1.6&&energyRatio>.88)return{intent:'den-rest',target:null};
    return null;
  }

  retreatTarget(hunter,player){
    const den=this.siteFor(hunter);if(!den||!player)return null;
    const toDen=Math.hypot(hunter.x-den.x,hunter.y-den.y),playerFromDen=Math.hypot(player.x-den.x,player.y-den.y);
    if(toDen<2.2||playerFromDen<den.coreRadius*.65)return null;
    return{x:den.x,y:den.y,den:true,siteId:den.id,retreat:true};
  }

  dominanceScore(hunter){
    if(!this.enabled(hunter))return-Infinity;
    const s=SPECIES[hunter.species],g=hunter.genes||{},health=Math.max(0,Math.min(1,(hunter.health||0)/100)),energy=Math.max(0,Math.min(1,(hunter.energy||0)/s.maxEnergy));
    const prime=Math.max(0,Math.min(1,(hunter.age-s.maturity)/(s.maturity*1.5)));
    return(g.body||1)*.38+(g.motion||1)*.16+health*.22+energy*.17+prime*.07;
  }

  overlappingRival(hunter){
    const own=this.ownedSite(hunter);if(!own)return null;let best=null;
    for(const den of this.sites.values()){
      if(den.id===own.id||den.abandonedTick!=null||den.ownerId===hunter.id)continue;
      const owner=this.sim.animals.find(a=>a.id===den.ownerId&&this.enabled(a));if(!owner)continue;
      if(!this.sim.world.sameLand(own.x,own.y,den.x,den.y))continue;
      const centerDistance=Math.hypot(own.x-den.x,own.y-den.y),overlap=(own.radius+den.radius)-centerDistance;
      if(overlap<=Math.min(own.radius,den.radius)*.34)continue;
      const candidate={own,den,owner,centerDistance,overlap};if(!best||overlap>best.overlap)best=candidate;
    }
    return best;
  }

  displacementDecision(hunter){
    const from=hunter?.denDisplacedFrom;if(!from)return null;
    const distance=Math.hypot(hunter.x-from.x,hunter.y-from.y);
    if((hunter.denDisplacedUntil||0)<=this.sim.tickCount&&distance>=5.5){hunter.denDisplacedFrom=null;hunter.denDisplacedUntil=0;this.ensure(hunter);return null}
    const dx=hunter.x-from.x,dy=hunter.y-from.y,len=Math.hypot(dx,dy)||1;
    return{intent:'territory-displaced',target:{x:hunter.x+dx/len*7,y:hunter.y+dy/len*7,displaced:true}};
  }

  competitionDecision(hunter){
    if(!this.enabled(hunter))return null;
    const displaced=this.displacementDecision(hunter);if(displaced)return displaced;
    if(hunter.playerHunt||hunter.playerAversion?.untilTick>this.sim.tickCount||(hunter.denContestCooldownUntil||0)>this.sim.tickCount)return null;
    const s=SPECIES[hunter.species],energy=(hunter.energy||0)/s.maxEnergy;if(hunter.health<58||energy<.58)return null;
    const rival=this.overlappingRival(hunter);if(!rival)return null;
    const myScore=this.dominanceScore(hunter),otherScore=this.dominanceScore(rival.owner),margin=myScore-otherScore;
    if(Math.abs(margin)<.045){
      // Near-even adults respect the overlap boundary instead of fighting forever.
      const mx=(rival.own.x+rival.den.x)/2,my=(rival.own.y+rival.den.y)/2,dx=hunter.x-mx,dy=hunter.y-my,len=Math.hypot(dx,dy)||1;
      if(Math.hypot(hunter.x-mx,hunter.y-my)<Math.max(3,rival.overlap*.8))return{intent:'territory-avoid',target:{x:hunter.x+dx/len*4.5,y:hunter.y+dy/len*4.5,boundary:true}};
      return null;
    }
    if(margin<0){
      const challenger=rival.owner,d=Math.hypot(challenger.x-rival.own.x,challenger.y-rival.own.y);
      if(d<=rival.own.radius+2){const dx=hunter.x-challenger.x,dy=hunter.y-challenger.y,len=Math.hypot(dx,dy)||1;return{intent:'territory-yield',target:{x:hunter.x+dx/len*7,y:hunter.y+dy/len*7,yield:true}}}
      return null;
    }
    const distanceToSite=Math.hypot(hunter.x-rival.den.x,hunter.y-rival.den.y),distanceToOwner=Math.hypot(hunter.x-rival.owner.x,hunter.y-rival.owner.y);
    if(distanceToSite<=1.35||distanceToOwner<=1.1){const claimed=this.claimSite(hunter,rival.den,rival.owner);return claimed?{intent:'territory-claim',target:null,site:claimed}:null}
    return{intent:'territory-challenge',target:{x:rival.den.x,y:rival.den.y,siteId:rival.den.id,ownerId:rival.owner.id}};
  }

  claimSite(challenger,den,previousOwner){
    if(!this.enabled(challenger)||!den||den.abandonedTick!=null||den.ownerId===challenger.id)return null;
    const oldSite=this.ownedSite(challenger);if(oldSite&&oldSite.id!==den.id)this.abandon(oldSite,'relocated-after-takeover');
    const oldOwnerId=den.ownerId,oldStyle=den.style,hadKnowledge=!!(den.known||den.everKnown);
    den.previousOwnerId=oldOwnerId;den.previousStyle=oldStyle;den.ownerId=challenger.id;den.style=stalkerProfileFor(challenger).id;den.abandonedTick=null;den.abandonReason=null;den.claimedTick=this.sim.tickCount;den.takeovers=(den.takeovers||0)+1;den.changed=hadKnowledge;den.everKnown=hadKnowledge;den.known=false;den.lastInspectedTick=null;den.feeds=Math.max(0,Math.floor((den.feeds||0)*.5));
    challenger.denContestCooldownUntil=this.sim.tickCount+CFG.dayTicks*2;challenger.denDisplacedFrom=null;challenger.denDisplacedUntil=0;challenger.target=null;challenger.playerHunt=null;
    const loser=previousOwner&&previousOwner.alive?previousOwner:this.sim.animals.find(a=>a.id===oldOwnerId&&a.alive);
    if(loser){loser.denDisplacedFrom={x:den.x,y:den.y};loser.denDisplacedUntil=this.sim.tickCount+CFG.dayTicks*2.5;loser.denContestCooldownUntil=this.sim.tickCount+CFG.dayTicks*3;loser.playerHunt=null;loser.target=null}
    this.lastTakeover={tick:this.sim.tickCount,siteId:den.id,fromOwnerId:oldOwnerId,toOwnerId:challenger.id,fromStyle:oldStyle,toStyle:den.style,x:den.x,y:den.y};
    const active=this.sim.player?.();if(active?.lineage){const family=this.familyLandscape(active);if(family?.changedSite?.den?.id===den.id)this.sim.cognition?.recordOnce?.(active,`stalker-shift:${den.id}:${den.takeovers}`,'A learned Stalker den near home changed owner',{siteId:den.id,takeovers:den.takeovers,x:den.x,y:den.y});if(oldSite?.everKnown&&family?.openingSite?.den?.id===oldSite.id)this.sim.cognition?.recordOnce?.(active,`stalker-opening:${oldSite.id}:${den.takeovers}`,'A learned Stalker range near home opened after its owner relocated',{siteId:oldSite.id,x:oldSite.x,y:oldSite.y})}
    return den;
  }

  landscapeAt(x,y,{animal=null}={}){
    if(!this.sim.playerEnabled)return{risk:0,uncertainty:0,opening:0,riskSite:null,openingSite:null};
    let risk=0,uncertainty=0,opening=0,riskSite=null,openingSite=null;const openingTicks=CFG.dayTicks*4;
    for(const den of this.activeSites()){
      const distance=Math.hypot(x-den.x,y-den.y);
      if(den.abandonedTick==null){
        const learned=!!den.known,changed=!!(den.changed&&den.everKnown);if(!learned&&!changed)continue;
        const reach=den.radius+4.5,fall=Math.max(0,1-distance/reach);if(fall<=0)continue;
        const value=(changed?.58:.30)+fall*(changed?.42:.70);if(value>risk){risk=value;riskSite={den,distance,changed}}
        if(changed)uncertainty=Math.max(uncertainty,.45+.55*fall);
      }else if(den.everKnown){
        const age=this.sim.tickCount-den.abandonedTick;if(age<0||age>openingTicks)continue;
        if(!['relocated-after-takeover','owner-gone'].includes(den.abandonReason))continue;
        const reach=den.radius+5.5,fall=Math.max(0,1-distance/reach),fresh=Math.max(0,1-age/openingTicks),value=fall*fresh;if(value>opening){opening=value;openingSite={den,distance,ageDays:age/CFG.dayTicks}}
      }
    }
    return{risk:clamp01(risk),uncertainty:clamp01(uncertainty),opening:clamp01(opening),riskSite,openingSite};
  }

  familyLandscape(animal){
    if(!animal?.alive||!animal.lineage||!this.sim.playerEnabled)return null;const state=this.sim.territory?.state?.(animal);if(!state?.established||!state.home)return null;
    const home=this.landscapeAt(state.home.x,state.home.y,{animal}),radius=state.radius||6;let changedSite=null,openingSite=null;
    for(const den of this.activeSites()){const distance=Math.hypot(state.home.x-den.x,state.home.y-den.y);if(distance>radius+den.radius+5)continue;
      if(den.abandonedTick==null&&den.changed&&den.everKnown){if(!changedSite||distance<changedSite.distance)changedSite={den,distance}}
      else if(den.abandonedTick!=null&&den.everKnown&&['relocated-after-takeover','owner-gone'].includes(den.abandonReason)){const ageDays=(this.sim.tickCount-den.abandonedTick)/CFG.dayTicks;if(ageDays<=4&&(!openingSite||distance<openingSite.distance))openingSite={den,distance,ageDays}}
    }
    return{home,state,risk:home.risk,uncertainty:home.uncertainty,opening:home.opening,changedSite,openingSite};
  }

  landscapeNotice(animal){
    if(!this.lastTakeover||!animal?.lineage||!this.sim.playerEnabled)return null;const age=this.sim.tickCount-this.lastTakeover.tick;if(age<0||age>CFG.dayTicks*1.25)return null;
    const family=this.familyLandscape(animal);if(!family)return null;
    if(family.changedSite?.den?.id===this.lastTakeover.siteId)return{type:'changed',siteId:this.lastTakeover.siteId,title:'Stalker territory shifted near home',body:'A den you learned has a new owner. Its old track reading is stale. Reread the scrape before trusting that route.'};
    if(family.openingSite)return{type:'opening',siteId:family.openingSite.den.id,title:'Predator gap near home',body:'A learned Stalker range was abandoned during the territory shift. Nearby ground is temporarily less defended.'};
    return null;
  }

  migrationAdjustment(animal,x,y){
    if(!animal?.lineage||!this.sim.playerEnabled)return{score:0,...this.landscapeAt(x,y,{animal})};const land=this.landscapeAt(x,y,{animal});
    const score=land.opening*.055-land.risk*.12-land.uncertainty*.055;return{...land,score};
  }

  forageAdjustment(animal,x,y){
    if(!animal?.lineage||this.sim.isManualPlayer?.(animal)||!this.sim.playerEnabled)return 0;const land=this.landscapeAt(x,y,{animal});
    return land.opening*.16-land.risk*.62-land.uncertainty*.24;
  }

  adjustRoamTarget(animal,target){
    if(!animal?.lineage||this.sim.isManualPlayer?.(animal)||!target||!this.sim.playerEnabled)return target;const land=this.landscapeAt(target.x,target.y,{animal});
    if(land.risk<.34||!land.riskSite?.den)return land.opening>.28?{...target,territoryOpening:true}:target;
    const den=land.riskSite.den,state=this.sim.territory?.state?.(animal),anchor=state?.home||animal,dx=anchor.x-den.x,dy=anchor.y-den.y,len=Math.hypot(dx,dy)||1,distance=Math.max(3,Math.min(7,(state?.radius||7)*.65));
    let x=clamp(2,CFG.worldSize-3,anchor.x+dx/len*distance),y=clamp(2,CFG.worldSize-3,anchor.y+dy/len*distance);
    if(this.sim.world.water[this.sim.world.idx(x,y)]||!this.sim.world.sameLand(animal.x,animal.y,x,y)){x=anchor.x;y=anchor.y}
    return{x,y,knownDenAvoidance:true,siteId:den.id};
  }

  noteKill(hunter){
    const den=this.siteFor(hunter);if(!den)return;
    den.feeds=Math.min(8,(den.feeds||0)+1);den.lastKillTick=this.sim.tickCount;
  }
}

function clamp(min,max,v){return Math.max(min,Math.min(max,v))}
function clamp01(v){return clamp(0,1,v)}
