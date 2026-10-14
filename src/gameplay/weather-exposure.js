import {CFG} from '../sim/config.js';

const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));

// Player-facing weather/exposure authority. It reads the simulation's existing
// climate values and shelter/vegetation state; it never rolls weather or consumes RNG.
// Background ecology intentionally does not use this controller.
export class WeatherExposureController{
  constructor(sim){this.sim=sim;this.states=new Map()}
  enabled(animal){return !!(this.sim.playerEnabled&&animal?.alive&&animal.player&&animal.species==='genvo')}
  state(animal=this.sim.player()){
    if(!animal)return null;let s=this.states.get(animal.id);if(!s){s={wetness:0,strain:0,lastLabel:'comfortable',lastSevereTick:-Infinity};this.states.set(animal.id,s)}return s;
  }
  conditions(animal=this.sim.player()){
    if(!animal)return null;const climate=this.sim.climate||{temp:.55,rain:0},rainRaw=clamp01(climate.rain),temp=clamp01(climate.temp);
    const shelter=this.sim.shelter?.nearest?.(animal,{radius:1.65,familyOnly:true})||null,shelterStrength=shelter?clamp01(this.sim.shelter?.weatherQuality?.(shelter)??shelter.integrity/100):0;
    const cover=clamp01(this.sim.coverAt?.(animal)||0),rain=clamp01((rainRaw-.30)/.42),cold=clamp01((.49-temp)/.23),heat=clamp01((temp-.72)/.17);
    const shelterProtection=shelterStrength*.88,coverProtection=Math.min(.42,cover*.46),rainProtection=Math.max(shelterProtection,coverProtection);
    const shelterLeaking=!!(shelter&&rain>.10&&shelterStrength<.62);return{temp,rainRaw,rain,cold,heat,cover,shelter,shelterStrength,shelterProtection,rainProtection,shelterLeaking};
  }
  phasePlayer(){
    const animal=this.sim.player();if(!this.enabled(animal))return null;const s=this.state(animal),w=this.conditions(animal);if(!w)return null;
    if(w.shelter){s.wetness=clamp01(s.wetness-(.16+.10*w.shelterStrength))}
    else if(w.rain>.04){s.wetness=clamp01(s.wetness+w.rain*(.055+.045*(1-w.rainProtection)))}
    else{s.wetness=clamp01(s.wetness-(.045+w.heat*.025+w.cover*.015))}
    const coldTrait=this.sim.protoSpeciation?.thermalMultiplier?.(animal,'cold')||1,heatTrait=this.sim.protoSpeciation?.thermalMultiplier?.(animal,'heat')||1;
    const coldStress=clamp01(w.cold*(.30+.70*s.wetness)*(1-w.shelterProtection*.84)*coldTrait);
    const heatStress=clamp01(w.heat*(1-w.shelterProtection*.55)*heatTrait);
    const stormStress=clamp01(w.rain*.24*(1-w.rainProtection));
    const target=Math.max(coldStress,heatStress,stormStress);s.strain=clamp01(s.strain+(target-s.strain)*.26-(w.shelter?.06:0));
    const protectedStart=this.sim.isOpeningProtected?.(animal);
    if(!protectedStart){animal.energy=Math.max(0,animal.energy-coldStress*.075);animal.hydration=Math.max(0,animal.hydration-heatStress*.095)}
    const snap=this.snapshot(animal,{conditions:w});
    if(snap.severe&&this.sim.tickCount-s.lastSevereTick>=CFG.dayTicks){s.lastSevereTick=this.sim.tickCount;this.sim.cognition?.record?.(animal,'weather-exposure',snap.sheltered?`Recovered from rough weather at shelter`:`Endured ${snap.label.toLowerCase()}`,{wetness:s.wetness,strain:s.strain,temp:w.temp,rain:w.rainRaw})}
    s.lastLabel=snap.label;return snap;
  }
  snapshot(animal=this.sim.player(),{conditions=null}={}){
    if(!animal)return null;const s=this.state(animal),w=conditions||this.conditions(animal);if(!s||!w)return null;
    const coldTrait=this.sim.protoSpeciation?.thermalMultiplier?.(animal,'cold')||1,heatTrait=this.sim.protoSpeciation?.thermalMultiplier?.(animal,'heat')||1;
    const coldStress=clamp01(w.cold*(.30+.70*s.wetness)*(1-w.shelterProtection*.84)*coldTrait),heatStress=clamp01(w.heat*(1-w.shelterProtection*.55)*heatTrait),stormStress=clamp01(w.rain*.24*(1-w.rainProtection));
    const stress=Math.max(s.strain,coldStress,heatStress,stormStress),sheltered=!!w.shelter;
    let label='Comfortable';
    if(sheltered&&w.shelterLeaking&&w.rain>.22)label='Shelter leaking';
    else if(sheltered&&s.wetness>.34)label='Drying under shelter';
    else if(sheltered)label='Sheltered';
    else if(coldStress>.58&&s.wetness>.5)label='Soaked and chilled';
    else if(heatStress>.58)label='Heat-stressed';
    else if(s.wetness>.62)label='Soaked';
    else if(coldStress>.38)label='Chilled';
    else if(w.rain>.35)label='Cold rain';
    else if(w.rain>.12)label='Wet weather';
    else if(heatStress>.34)label='Hot weather';
    const exposedEnough=!sheltered||w.shelterLeaking;const severe=exposedEnough&&stress>=.52&&!this.sim.isOpeningProtected?.(animal),urgent=exposedEnough&&stress>=.42&&!this.sim.isOpeningProtected?.(animal);
    return{...w,wetness:s.wetness,strain:s.strain,stress,coldStress,heatStress,stormStress,label,sheltered,severe,urgent,travelPressure:clamp01(stress*.72+w.rain*.22)};
  }
  routePenalty(distance,animal=this.sim.player()){
    const snap=this.snapshot(animal);if(!snap||snap.sheltered||snap.travelPressure<.24)return 0;return Math.max(0,Number(distance)||0)*snap.travelPressure*.012;
  }
}
