import {canHunt} from '../ecology/functional-diet.js';
import {hasAdaptation} from '../lineage/evolution.js';
import {CFG} from '../sim/config.js';

// Read-only player feedback. This translates simulation outcomes that already
// happened into short cause -> effect notices. It never changes ecology,
// adaptation values, or progression state.
export class EffectFeedbackController{
  constructor(sim){this.setSimulation(sim)}
  setSimulation(sim){
    this.sim=sim;
    this.lastActionTick=-Infinity;
    this.pendingAction=null;
    this.lastDamageTick=-Infinity;
    this.wasInWater=false;
    this.lastHeatDay=-Infinity;
    this.lastShelterWeatherDay=-Infinity;
    this.lastKnownDenId=null;
    this.denWasInside=false;
    this.lastIllnessMode='none';
    this.lastProtoDay=-Infinity;
    this.lastProtoThreatTick=-Infinity;
  }
  observe(){
    const sim=this.sim,p=sim?.player?.();if(!p?.alive)return null;
    const inWater=!!sim.world?.water?.[sim.world.idx(p.x,p.y)];
    if(inWater&&!this.wasInWater){const lifestyle=sim.speciesLifestyle?.lifestyleFor?.(p);if(lifestyle?.id==='aquatic'){this.wasInWater=true;return{message:'Aquatic lifestyle: open water is now ordinary travel space for this branch.',tone:'safe',kind:'lifestyle'}}if(hasAdaptation(p,'webbed-limbs')){this.wasInWater=true;return{message:'Webbed Limbs are letting you cross open water. Swimming costs extra energy.',tone:'safe',kind:'adaptation'}}}
    this.wasInWater=inWater;

    const action=sim.lastPlayerAction;
    if(action&&action.tick!==this.lastActionTick){this.lastActionTick=action.tick;this.pendingAction={...action}}
    if(this.pendingAction&&sim.tickCount-this.pendingAction.tick>=16){
      const completed=this.pendingAction;this.pendingAction=null;
      if(completed.type==='eat'&&hasAdaptation(p,'efficient-gut'))return{message:'Efficient Gut increased the energy gained from that meal.',tone:'success',kind:'adaptation'};
      if(completed.type==='hide'&&hasAdaptation(p,'camouflage-mantle'))return{message:'Camouflage Mantle is breaking your outline while you stay in dense cover.',tone:'safe',kind:'adaptation'};
      if(completed.type==='alarm'&&hasAdaptation(p,'alarm-pulse'))return{message:'Alarm Pulse carried your warning through nearby family.',tone:'safe',kind:'adaptation'};
      if(completed.type==='rally'&&hasAdaptation(p,'mobbing-instinct'))return{message:'Mobbing Instinct turned your signal into a family defense response.',tone:'safe',kind:'adaptation'};
      if(completed.type==='store-carry'&&hasAdaptation(p,'provisioning-pouches'))return{message:'Provisioning Pouches delivered a larger food load to shelter.',tone:'success',kind:'adaptation'};
    }

    const damage=sim.lastPlayerDamage;
    if(damage&&damage.tick!==this.lastDamageTick){
      this.lastDamageTick=damage.tick;
      if((damage.mantleReduction||0)>.25&&hasAdaptation(p,'hardened-mantle'))return{message:`Hardened Mantle absorbed about ${Math.round(damage.mantleReduction)} damage from that bite.`,tone:'success',kind:'adaptation'};
      if(damage.coordinatedReduction>0)return{message:'Coordinated defense reduced the force of that attack.',tone:'safe',kind:'adaptation'};
    }

    const illness=sim.illness?.snapshot?.(p);
    if(illness?.infected){
      const changed=illness.mode!==this.lastIllnessMode;this.lastIllnessMode=illness.mode;
      if(changed&&illness.mode==='shelter-rest')return{message:'Quiet shelter rest is cutting fever strain sharply. Close contact can still spread it.',tone:'safe',kind:'illness'};
      if(changed&&illness.mode==='strained')return{message:'Sprinting while feverish is increasing illness strain.',tone:'warn',kind:'illness'};
    }else this.lastIllnessMode='none';

    const exposure=sim.exposure?.snapshot?.(p),proto=sim.protoSpeciation?.traitFor?.(p)||null;
    if(exposure){
      if(hasAdaptation(p,'water-sacs')&&exposure.heatStress>.34&&sim.day!==this.lastHeatDay){this.lastHeatDay=sim.day;return{message:'Water Sacs are reducing water loss in the heat.',tone:'safe',kind:'adaptation'}}
      if(proto&&sim.day!==this.lastProtoDay){
        if(proto.pressure==='dryness'&&(exposure.heatStress>.22||p.hydration<72)){this.lastProtoDay=sim.day;return{message:'Dryland Skin is modestly slowing water loss under these dry conditions.',tone:'safe',kind:'proto'}}
        if(proto.pressure==='heat'&&exposure.heatStress>.26){this.lastProtoDay=sim.day;return{message:'Heat-Shed Mantle is reducing some of the current heat strain.',tone:'safe',kind:'proto'}}
        if(proto.pressure==='cold'&&exposure.coldStress>.26){this.lastProtoDay=sim.day;return{message:'Cold Mantle is reducing some of the current cold strain.',tone:'safe',kind:'proto'}}
        if(proto.pressure==='crowding'&&exposure.sheltered){this.lastProtoDay=sim.day;return{message:'Close-Brood Frame is adding a small protection advantage inside family shelter.',tone:'safe',kind:'proto'}}
      }
      if(exposure.sheltered&&(exposure.rain>.24||exposure.coldStress>.30)&&sim.day!==this.lastShelterWeatherDay){this.lastShelterWeatherDay=sim.day;const sh=sim.shelter?.nearest?.(p,{radius:1.7,familyOnly:true}),burrow=sim.speciesLifestyle?.lifestyleFor?.(p)?.id==='burrower'&&sh?.denStyle==='burrow';return{message:burrow?'Burrow den: deeper cover is cutting the current weather strain.':exposure.shelterLeaking?'Shelter is reducing the weather strain, but its cover is leaking.':'Shelter is cutting the current weather exposure.',tone:exposure.shelterLeaking&&!burrow?'warn':'safe',kind:burrow?'lifestyle':'environment'}}
    }
    if(proto&&sim.day!==this.lastProtoDay){
      const i=sim.world.idx(p.x,p.y),moist=sim.world.moisture?.[i]||0;
      if(proto.pressure==='wetness'&&moist>.58&&!sim.world.water?.[i]){this.lastProtoDay=sim.day;return{message:'Splayfoot is making this saturated ground slightly easier to cross.',tone:'safe',kind:'proto'}}
      if(proto.pressure==='scarcity'&&p.energy<78){this.lastProtoDay=sim.day;return{message:'Frugal Frame is trimming resting energy use while food is tight.',tone:'safe',kind:'proto'}}
      if(proto.pressure==='competition'&&p.energy<92){this.lastProtoDay=sim.day;return{message:'Range Sense is widening food search under sustained competition.',tone:'safe',kind:'proto'}}
    }
    if(proto?.pressure==='predation'&&sim.tickCount-this.lastProtoThreatTick>CFG.dayTicks){
      const base=5*p.genes.senses*(sim.divergence?.sensoryMultiplier?.(p)||1),extended=base*(sim.protoSpeciation?.sensoryMultiplier?.(p,'threat')||1);
      const edge=sim.animals.find(a=>a.alive&&canHunt(a)&&Math.hypot(a.x-p.x,a.y-p.y)>base&&Math.hypot(a.x-p.x,a.y-p.y)<=extended);
      if(edge){this.lastProtoThreatTick=sim.tickCount;return{message:'Watch Crest picked up a Stalker just beyond the ordinary sensing edge.',tone:'warn',kind:'proto'}}
    }

    const den=sim.stalkerTerritory?.playerStatus?.(p);
    if(den?.known&&den.inside&&!this.denWasInside){this.denWasInside=true;this.lastKnownDenId=den.siteId;return{message:'Known Stalker territory: even a well-fed owner may defend this ground.',tone:'warn',kind:'territory'}}
    if(!den?.inside)this.denWasInside=false;
    return null;
  }
}
