import {ADAPTATIONS,adaptationEffects} from './evolution.js';
import {partEffectFactors} from './part-abilities.js';
import {isWildSpecies,wildStartPlan} from '../organisms/wild-bodies.js';
import {applyLineageTarget} from './reproduction-bridge.js';

// Read-only explanation of whether mounted armour plates protect this body right now, and why.
// It restates the canonical authorities instead of computing protection of its own:
//  * GenVo lineages: plates protect only as the expression of the Hardened Mantle trait,
//    whose bite reduction lives in adaptationEffects().predatorDamage (the factor tryKill uses).
//  * Wild species: part effects are measured relative to the species' founding body
//    (partEffectFactors().damageTaken), so founding plates add nothing beyond that species.
const PLATE='armor-plate',MANTLE='hardened-mantle';
const pct=f=>Math.round((1-f)*100);

export function plateProtectionReading(animal){
 const plan=animal?.bodyPlan;if(!plan?.nodes)return null;
 const plates=plan.nodes.filter(n=>n.partId===PLATE).length,adaptations=animal.adaptations||[],mantle=adaptations.includes(MANTLE);
 const wild=animal.species?isWildSpecies(animal.species):null;
 if(!plates&&!mantle)return null;
 if(wild===null&&!mantle)return{plates,protective:null,source:null,label:'Plate protection not recorded',detail:'This older observation did not record the species, so plate protection cannot be read.'};
 if(wild!==true){
  const factor=adaptationEffects({adaptations}).predatorDamage;
  if(mantle)return{plates,protective:factor<1,source:MANTLE,factor,label:`Plates protect · ${ADAPTATIONS[MANTLE].name}`,detail:`${ADAPTATIONS[MANTLE].name} is expressed${plates?` through ${plates===1?'the mounted plate':'the mounted plates'}`:''}: Stalker bites do about ${pct(factor)}% less damage.`};
  return{plates,protective:false,source:null,factor:1,label:`Plates don't protect · no ${ADAPTATIONS[MANTLE].name}`,detail:`${plates===1?'A plate is':'Plates are'} mounted, but ${ADAPTATIONS[MANTLE].name} is not expressed, so bites are not reduced; the plates' upkeep still applies. Plates gained through evolution express the trait.`};
 }
 const f=partEffectFactors(animal)?.damageTaken??1;
 if(plates&&f<1)return{plates,protective:true,source:'species-relative',factor:f,label:'Plates protect · tougher than its species',detail:`Takes about ${pct(f)}% less damage than its species' founding body.`};
 if(!wildStartPlan(animal.species)?.nodes?.some(n=>n.partId===PLATE))return{plates,protective:false,source:'species-relative',factor:f,label:'Plates offset by other parts',detail:"Plates are mounted, but with its other parts it takes no less damage than its species' founding body."};
 return{plates,protective:false,source:'species-founding',factor:f,label:'Plates: species baseline',detail:`${plates===1?'This plate belongs':'These plates belong'} to its species' founding body, so ${plates===1?'it adds':'they add'} no protection beyond that species' normal toughness.`};
}

// What a body plan would give a GenVo creature in play: the same lineage path the evolution
// editor uses (applyLineageTarget) expresses traits from mounted parts on a stand-in.
export function planProtectionInPlay(plan){
 const child={species:'genvo',alive:true,adaptations:[],anatomy:null,bodyPlan:null};
 if(!applyLineageTarget(child,plan))return null;
 return plateProtectionReading(child);
}
