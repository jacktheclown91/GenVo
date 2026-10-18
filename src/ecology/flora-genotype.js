import {validSexualFloraGenome,cloneBotanicalFloraGenome} from './botanical-genetics.js';
// Canonical founder migration, clonal inheritance and dedicated botanical genetics.
// Fractions partition existing standing crop; they never add a second biomass stock.
import {PLANTS} from '../sim/config.js';
import {mouthOf,feedingProfile} from './functional-diet.js';
import {PARTS} from '../lineage/part-registry.js';
export const FLORA_TISSUES=Object.freeze({bramble:{seed:.20,coat:0,label:'Fruit'},thistlepod:{seed:.20,coat:.25,label:'Pods'},woodspire:{seed:.16,coat:.24,label:'Canopy seeds'}});
const genomes=new Map(),validated=new WeakSet();
export function founderFloraGenome(kind){if(genomes.has(kind))return genomes.get(kind);const p=PLANTS[kind];if(!p?.dispersal)return null;const t=FLORA_TISSUES[kind];const genome={schema:1,id:'flora1-'+kind,resourceAlias:kind,traits:{growth:p.growth,waterNeed:p.waterNeed,nutrition:p.nutrition,seedAllocation:t?.seed??0,coatAllocation:t?.coat??0},reproduction:'propagule',mutationEnabled:false};Object.freeze(genome.traits);Object.freeze(genome);genomes.set(kind,genome);return genome}
export function canCrackSeeds(a){return !!PARTS[mouthOf(a)]?.actionCapabilities.includes('crush')}
export function floraMealChannels(a,kind){
 if(!FLORA_TISSUES[kind])return[];const profile=feedingProfile(a),plant=PLANTS[kind],out=[];
 const whole=profile[plant.guild]||0;if(whole>0)out.push({tissue:'crop',eff:whole,label:kind==='bramble'?'Eat fruit':'Eat pods',reason:'Feeds on edible tissue; intact propagules may travel with you.'});
 const seed=profile.seed_producer||0;if(canCrackSeeds(a)&&seed>0)out.push({tissue:'kernel',eff:seed,label:'Crush seeds',reason:'Consumes kernels and destroys their propagules; discarded tissue returns to the soil.'});
 return out;
}

export function clonalFloraGenome(parent,seedAllocation){if(parent.schema===4)return cloneBotanicalFloraGenome(parent,seedAllocation);if(parent.schema===3)return coatedClonalFloraGenome(parent,seedAllocation,parent.traits.coatAllocation);const traits={...parent.traits,seedAllocation:Math.round(seedAllocation*100000)/100000},id='flora2-'+parent.resourceAlias+'-'+traits.seedAllocation.toFixed(5);return Object.freeze({schema:2,id,resourceAlias:parent.resourceAlias,traits:Object.freeze(traits),reproduction:'clonal-propagule',mutationEnabled:true});}
// Version 3 admits coat variation only for lineages already owning finite coat tissue.
export const COAT_ALLOCATION=Object.freeze({min:.10,max:.40,step:.025});
export function coatedClonalFloraGenome(parent,seedAllocation,coatAllocation){if(parent.schema===4)return cloneBotanicalFloraGenome(parent,seedAllocation,coatAllocation);const traits={...parent.traits,seedAllocation:Math.round(seedAllocation*100000)/100000,coatAllocation:Math.round(coatAllocation*100000)/100000},id='flora3-'+parent.resourceAlias+'-'+traits.seedAllocation.toFixed(5)+'-'+traits.coatAllocation.toFixed(5);return Object.freeze({schema:3,id,resourceAlias:parent.resourceAlias,traits:Object.freeze(traits),reproduction:'clonal-propagule',mutationEnabled:true})}
export function validFloraGenome(g,kind=g?.resourceAlias){const f=founderFloraGenome(kind);if(!f||!g)return false;if(g.schema===4)return g.resourceAlias===kind&&validSexualFloraGenome(g);if(validated.has(g)&&g.resourceAlias===kind)return true;if(g.schema===1)return g.resourceAlias===kind&&g.reproduction==='propagule'&&g.id===f.id&&JSON.stringify(g.traits)===JSON.stringify(f.traits)&&g.mutationEnabled===false;
 if(g.schema===3){if(!(f.traits.coatAllocation>0)||g.resourceAlias!==kind||g.reproduction!=='clonal-propagule'||g.mutationEnabled!==true||!Number.isFinite(g.traits?.seedAllocation)||g.traits.seedAllocation<.08||g.traits.seedAllocation>.36||!Number.isFinite(g.traits.coatAllocation)||g.traits.coatAllocation<COAT_ALLOCATION.min||g.traits.coatAllocation>COAT_ALLOCATION.max||g.traits.seedAllocation+g.traits.coatAllocation>=1)return false;const expected=coatedClonalFloraGenome(f,g.traits.seedAllocation,g.traits.coatAllocation),ok=g.id===expected.id&&JSON.stringify(g.traits)===JSON.stringify(expected.traits);if(ok&&Object.isFrozen(g)&&Object.isFrozen(g.traits))validated.add(g);return ok;}
 if(g.schema!==2||g.resourceAlias!==kind||g.reproduction!=='clonal-propagule'||g.mutationEnabled!==true||!Number.isFinite(g.traits?.seedAllocation)||g.traits.seedAllocation<.08||g.traits.seedAllocation>.36)return false;const expected=clonalFloraGenome(f,g.traits.seedAllocation);const ok=g.id===expected.id&&JSON.stringify(g.traits)===JSON.stringify(expected.traits);if(ok&&Object.isFrozen(g)&&Object.isFrozen(g.traits))validated.add(g);return ok;
}
