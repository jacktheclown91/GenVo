import {CFG,PLANTS} from '../sim/config.js';
import {ANATOMICAL_MASS,massPolicy,bodyMass} from '../organisms/body-mass.js';
import {remainingPreyBiomass} from './prey-biomass.js';
import {SPECIES} from '../organisms/species.js';

// Environmental memory. These fields record consequences already produced by the simulation
// so the renderer can show years of use. Since v1.33.3 one of them feeds back: ground grazed
// hard enough carries a scar that slows plant regrowth until the grazing wear fades.
export class EnvironmentalHistoryController{
  constructor(sim){
    this.sim=sim;const n=sim.world.len;
    this.traffic=new Float32Array(n);
    this.grazing=new Float32Array(n);
    this.nutrientLegacy=new Float32Array(n);
    this.recovery=new Float32Array(n);
    this.previousBiomass=new Float32Array(n);
    this.active=new Set();
    this.producerKeys=Object.keys(PLANTS).filter(k=>k!=='rotcap');
  }
  biomassAt(i){let total=0;for(const kind of this.producerKeys)total+=this.sim.world.plants[kind]?.[i]||0;return total}
  activate(i,{previous=null}={}){if(!this.active.has(i)){this.active.add(i);this.previousBiomass[i]=previous??this.biomassAt(i)}}
  noteStep(animal,weight=1){
    if(animal?.aerialMode||(animal?.diveDepth||0)>.03)return; // No surface contact in flight or below water.
    if(!animal?.alive)return;this.sim.discovery?.noteMovementTrace(animal);const i=this.sim.world.idx(animal.x,animal.y),mass=massPolicy(animal)===ANATOMICAL_MASS?bodyMass(animal):(SPECIES[animal.species]?.mass||1);this.activate(i);
    this.traffic[i]=Math.min(2.2,this.traffic[i]+.010*Math.sqrt(Math.max(.25,mass))*Math.max(0,weight));
  }
  notePlantConsumption(kind,x,y,amount){
    if(!PLANTS[kind]||kind==='rotcap'||!(amount>0))return;const i=this.sim.world.idx(x,y);this.activate(i,{previous:this.biomassAt(i)});
    this.grazing[i]=Math.min(2.2,this.grazing[i]+amount*1.55);
  }
  noteDeath(animal){
    if(!animal)return;const i=this.sim.world.idx(animal.x,animal.y),mass=massPolicy(animal)===ANATOMICAL_MASS?remainingPreyBiomass(animal):(SPECIES[animal.species]?.mass||1);this.activate(i);
    this.nutrientLegacy[i]=Math.min(2.5,this.nutrientLegacy[i]+mass*.16);
  }
  noteDecomposition(i,amount){
    if(!(amount>0))return;this.activate(i);this.nutrientLegacy[i]=Math.min(2.5,this.nutrientLegacy[i]+amount*.72);
  }
  advanceCell(i){
    if(this.grazing[i]>.001||this.recovery[i]>.001){const biomass=this.biomassAt(i),before=this.previousBiomass[i],gain=Math.max(0,biomass-before);if(this.grazing[i]>.10&&gain>.008)this.recovery[i]=Math.min(1.8,this.recovery[i]+gain*.92+Math.min(.018,this.grazing[i]*.012));this.previousBiomass[i]=biomass}
    this.traffic[i]*=.965;this.grazing[i]*=.955;this.nutrientLegacy[i]*=.992;this.recovery[i]*=.935;
  }
  advanceDay(){
    for(const i of [...this.active]){this.advanceCell(i);if(this.traffic[i]<.002&&this.grazing[i]<.002&&this.nutrientLegacy[i]<.002&&this.recovery[i]<.002)this.active.delete(i)}
  }
  // Share of normal regrowth lost on this tile to grazing wear (0 = unharmed).
  scarAt(i){const g=this.grazing[i],S=CFG.grazingScar;if(!(g>S.start))return 0;return Math.min(1,(g-S.start)/S.span)*S.maxSlow}
  cell(i){return{traffic:this.traffic[i]||0,grazing:this.grazing[i]||0,scar:this.scarAt(i),nutrient:this.nutrientLegacy[i]||0,recovery:this.recovery[i]||0,biomass:this.biomassAt(i)}}
}
