import {CFG} from '../sim/config.js';
import {nearestWater,isWaterDweller} from '../lineage/aquatic.js';
import {canHunt,ecologicalCapabilities,plantPreference} from './functional-diet.js';
import {hasPart} from '../lineage/part-abilities.js';

// Anatomy-directed ambient behavior cadence for healthy autonomous wildlife.
// This controller is deliberately stateless and consumes no simulation RNG: it only
// turns the shared ecology beat into distinct, ID-staggered anatomy-derived rhythms.
const DIRS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];

export class WildlifeRhythmController{
  constructor(sim){this.sim=sim}

  decision(a,{energy=1,hydration=1}={}){
    if(!this.sim.playerEnabled||!a?.alive||a.player||a.lineage||a.infected||a.health<82||energy<.72||hydration<.60)return null;
    const step=Math.floor(this.sim.tickCount/Math.max(1,CFG.lifeStride));
    // A newly inherited mouth, claw, or aquatic body changes ambient behavior
    // immediately even when its ancestry label is unchanged.
    const role=ecologicalCapabilities(a);
    if(isWaterDweller(a))return this.sifter(a,step);
    if(canHunt(a))return this.bankHunter(a,step);
    if(hasPart(a,'digging-forelimb'))return this.digger(a,step);
    if(role.filterFeeder)return this.sifter(a,step);
    if(role.carrion&&plantPreference(a,'rotcap')>=.6)return this.scavenger(a,step);
    if(hasPart(a,'kernel-beak'))return this.seedCarrier(a,step);
    return this.hopper(a,step);

  }

  seedCarrier(a,step){
    // Feeding, seed ingestion and deposition remain owned by the shared controllers.
    const phase=(step+a.id*3)%32;
    if(phase<7)return{intent:'pod-watch',target:null,mode:'watch'};
    if(phase<16)return{intent:'pod-browse',target:this.localTarget(a,2.8,step,3),mode:'browse'};
    if(phase<22)return{intent:'pod-rest',target:null,mode:'rest'};
    return{intent:'pod-wander',target:this.localTarget(a,5.2,step,1),mode:'travel'};
  }

  bankHunter(a,step){
    // Hunting and freshwater feeding have priority when hungry. These are only
    // background animations and navigation while the animal is satiated.
    const phase=(step+a.id*7)%36;
    if(phase<11)return{intent:'bank-watch',target:null,mode:'watch'};
    if(phase<25)return{intent:'bank-patrol',target:this.localTarget(a,4,step,2),mode:'patrol'};
    return{intent:'bank-rest',target:null,mode:'rest'};
  }

  sifter(a,step){
    // Wetland specialists do not teleport between pools: the water return and shared
    // feeding decision have precedence. Ambient travel searches only reachable water.
    const phase=(step+a.id*3)%26;
    if(phase<6)return{intent:'shoal-rest',target:null,mode:'rest'};
    if(phase<11)return{intent:'shoal-signal',target:null,mode:'signal'};
    const center=nearestWater(this.sim.world,a.x,a.y,5);
    if(center){const goal=this.localWaterTarget(a,step);if(goal)return{intent:'shoal-glide',target:goal,mode:'travel'}}
    return null;
  }

  scavenger(a,step){
    // Scarce carcasses are sought by the ordinary bestFood decision when hungry.
    // Otherwise scavengers nose through wet soil, linger, and wander separately.
    const phase=(step+a.id*5)%28;
    if(phase<7)return{intent:'mire-sniff',target:null,mode:'probe'};
    if(phase<13)return{intent:'mire-rest',target:null,mode:'rest'};
    return{intent:'mire-prowl',target:this.localTarget(a,3.3,step,6),mode:'roam'};
  }

  localWaterTarget(a,step){
    const world=this.sim.world,base=(a.id*7+step)&7;
    for(let i=0;i<8;i++){const d=DIRS[(base+i)&7],x=a.x+d[0]*(i<4?2.8:1.4),y=a.y+d[1]*(i<4?2.8:1.4);
      if(world.isPlayable(x,y)&&world.water[world.idx(x,y)])return{x,y,ambient:true};}
    return null;
  }

  hopper(a,step){
    const phase=(step+a.id*3)%24;
    if(phase<5)return{intent:'herd-listen',target:null,mode:'listen'};
    if(phase<12)return{intent:'herd-browse',target:this.localTarget(a,2.8,step,1),mode:'browse'};
    if(phase<16)return{intent:'herd-rest',target:null,mode:'rest'};
    return{intent:'herd-hop',target:this.localTarget(a,4.4,step,3),mode:'travel'};
  }

  digger(a,step){
    const phase=(step+a.id*5)%30;
    if(phase<8)return{intent:'ground-probe',target:null,mode:'probe'};
    if(phase<14)return{intent:'burrow-rest',target:null,mode:'rest'};
    if(phase<24)return{intent:'root-roam',target:this.localTarget(a,3.1,step,5),mode:'roam'};
    return{intent:'ground-probe',target:null,mode:'probe'};
  }

  stalker(a,step){
    const phase=(step+a.id*7)%36;
    if(phase<10)return{intent:'scent-watch',target:null,mode:'watch'};
    if(phase<28)return{intent:'shadow-patrol',target:this.localTarget(a,5.6,step,7),mode:'patrol'};
    return{intent:'stalker-rest',target:null,mode:'rest'};
  }

  genvo(a,step){
    const phase=(step+a.id*11)%28;
    if(phase<6)return{intent:'band-watch',target:null,mode:'watch'};
    if(phase<11)return{intent:'band-social',target:null,mode:'social'};
    return{intent:'band-wander',target:this.localTarget(a,3.8,step,2),mode:'travel'};
  }

  localTarget(a,distance,step,salt=0){
    const world=this.sim.world,size=CFG.worldSize,base=(a.id*5+Math.floor(step/3)+salt)&7;
    for(let turn=0;turn<8;turn++){
      const dir=DIRS[(base+turn)&7],scale=turn<4?distance:distance*.65;
      const x=a.x+dir[0]*scale,y=a.y+dir[1]*scale;
      if(x<=2||y<=2||x>=size-2||y>=size-2)continue;
      if(world.water[world.idx(x,y)])continue;
      if(!world.sameLand(a.x,a.y,x,y))continue;
      return{x,y,ambient:true};
    }
    return null;
  }
}
