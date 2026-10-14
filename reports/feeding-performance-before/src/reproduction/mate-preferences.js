// One authoritative inherited mate-preference genotype and reciprocal-choice model.
// The five preference axes are NOT survival state. Age, pregnancy, illness,
// hydration, resource needs and kinship remain external reproductive gates.
// Sex does not grant or remove choice; both individuals judge one another.
// All founder/mutation draws use a dedicated per-animal RNG to avoid perturbing
// the existing ecology's shared RNG stream.
import {RNG} from '../core/rng.js';
import {planPartCounts} from '../lineage/part-abilities.js';

export const PREFERENCE_AXES=Object.freeze(['size','strength','ornament','display','behavior']);
export const RITUAL_ACTIONS=Object.freeze(['dance','call','flare','scent','gesture']);
const LIMIT=1;
const clamp=(lo,hi,x)=>Math.max(lo,Math.min(hi,Number.isFinite(x)?x:0));
const phenotypeClamp=x=>clamp(-1,1,x);
const PARTS_ORNAMENT=['display-frill','signal-crest','luminous-tail','flag-tail','scent-gland','display-eye'];
const PARTS_DISPLAY=['display-frill','luminous-tail','flag-tail','scent-gland','display-eye'];
const PARTS_STRENGTH=['sturdy-leg','reinforced-torso','claw','crushing-jaw','heavy-jaw'];

export function expressedMateTraits(animal){
  const g=animal?.genes||{},parts=planPartCounts(animal);
  const count=ids=>ids.reduce((n,id)=>n+(parts[id]||0),0);
  return {
    size:phenotypeClamp(((g.body??1)-1)*3.4+(parts['barrel-torso']||parts['stout-torso']?0.22:0)),
    strength:phenotypeClamp(((g.motion??1)-1)*1.35+((g.body??1)-1)*1.5+count(PARTS_STRENGTH)*.16),
    ornament:phenotypeClamp(count(PARTS_ORNAMENT)*.33-.12),
    display:phenotypeClamp(count(PARTS_DISPLAY)*.35-.12),
    behavior:phenotypeClamp(((g.temperament??1)-1)*3.7)
  };
}

// Positive alleles prefer stronger/larger/more ornamented/expression;
// negative alleles prefer smaller/quieter/less showy or a different temperament.
export function founderMatePreferences(seed,id){
  const rng=new RNG(`${seed}:mate-genotype:${id}`),weights={};
  for(const key of PREFERENCE_AXES)weights[key]=Number(rng.range(-.55,.55).toFixed(5));
  const ritualTastes=Object.fromEntries(RITUAL_ACTIONS.map(action=>[action,Number(rng.range(-1,1).toFixed(5))]));
  return {weights,selectivity:Number(rng.range(.25,.75).toFixed(5)),ritualTastes,tempo:Number(rng.range(-1,1).toFixed(5))};
}
export function inheritMatePreferences(seed,id,mother,father){
  const rng=new RNG(`${seed}:mate-offspring:${id}:${mother?.id??'unknown'}:${father?.id??'unknown'}`),weights={};
  const a=mother?.matePreferences?.weights||{},b=father?.matePreferences?.weights||{};
  for(const key of PREFERENCE_AXES){
    const aa=clamp(-LIMIT,LIMIT,a[key]),bb=clamp(-LIMIT,LIMIT,b[key]);
    weights[key]=Number(clamp(-LIMIT,LIMIT,(aa+bb)/2+rng.range(-.10,.10)+rng.range(-.045,.045)*(aa-bb)).toFixed(5));
  }
  const sa=mother?.matePreferences?.selectivity??.5,sb=father?.matePreferences?.selectivity??.5;
  const ra=matePreferencesFor(seed,mother).ritualTastes,rb=matePreferencesFor(seed,father).ritualTastes;
  const ritualTastes=Object.fromEntries(RITUAL_ACTIONS.map(action=>[action,Number(clamp(-1,1,((ra?.[action]??0)+(rb?.[action]??0))/2+rng.range(-.18,.18)).toFixed(5))]));
  const tempo=Number(clamp(-1,1,((matePreferencesFor(seed,mother).tempo??0)+(matePreferencesFor(seed,father).tempo??0))/2+rng.range(-.16,.16)).toFixed(5));
  return {weights,selectivity:Number(clamp(0,1,(sa+sb)/2+rng.range(-.08,.08)).toFixed(5)),ritualTastes,tempo};
}
export function matePreferencesFor(seed,animal){
  const founder=founderMatePreferences(seed,animal?.id??0);
  const own=animal?.matePreferences;return own?{...founder,...own,ritualTastes:{...founder.ritualTastes,...own.ritualTastes}}:founder;
}

export function individualMateChoice(chooser,candidate,seed='GENVO8'){
  const genotype=matePreferencesFor(seed,chooser),traits=expressedMateTraits(candidate),w=genotype.weights||{};
  let total=0,dominant=null,largest=0;
  for(const axis of PREFERENCE_AXES){
    const allele=clamp(-LIMIT,LIMIT,w[axis]);
    const term=allele*traits[axis];
    total+=term;
    if(Math.abs(term)>largest){largest=Math.abs(term);dominant=axis}
  }
  // Absolute allele magnitude matters: a weakly inherited preference must
  // not behave as though it were a strong preference simply by normalization.
  const score=clamp(-1,1,total/PREFERENCE_AXES.length);
  const threshold=-.16+.08*clamp(0,1,genotype.selectivity??.5);
  const accepted=score>=threshold;
  const dominantAllele=dominant?clamp(-1,1,w[dominant]):0;
  const direction=dominantAllele>=0?'greater':'less';
  return {accepted,score,threshold,reason:accepted?'accepted':`preference-${dominant||'general'}`,dominant,direction};
}
export function reciprocalMateChoice(a,b,seed='GENVO8'){
  const aChoice=individualMateChoice(a,b,seed),bChoice=individualMateChoice(b,a,seed);
  return {accepted:aChoice.accepted&&bChoice.accepted,
    reason:!aChoice.accepted?'first-declines':!bChoice.accepted?'second-declines':'mutual-acceptance',
    a:aChoice,b:bChoice};
}
export function preferenceSummary(animal,seed='GENVO8'){
  const {weights,selectivity}=matePreferencesFor(seed,animal);
  const sorted=PREFERENCE_AXES.map(axis=>({axis,value:weights?.[axis]??0})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
  const best=sorted[0];
  const direction=best.value>=0?'favors':'avoids';
  return `${direction} ${best.axis} (${Math.round(clamp(0,1,selectivity)*100)}% selective)`;
}


// Compare real candidates without a random attraction roll or a universal
// "best" phenotype. The chooser's HERITABLE tastes dominate its ranking;
// the other's opinion and travel distance matter, but do not override consent.
// A score is an ordinal preference signal, never a mating probability.
export function mateOptionAssessment(chooser,candidate,seed='GENVO8',distance=0,radius=12){
  const choice=reciprocalMateChoice(chooser,candidate,seed);
  const preferenceValue=.8*choice.a.score+.2*choice.b.score;
  const travelCost=Math.max(0,distance)/Math.max(1,radius);
  const value=preferenceValue-.12*travelCost;
  return {choice,preferenceValue,travelCost,value,
    label:!choice.accepted?(choice.reason==='first-declines'?'you decline':'partner declines'):
      preferenceValue>.075?'strong fit':preferenceValue>.015?'favored':'compatible'};
}

export function compareMateOptions(chooser,first,second,seed='GENVO8',radius=12){
  const ad=Math.hypot(chooser.x-first.x,chooser.y-first.y);
  const bd=Math.hypot(chooser.x-second.x,chooser.y-second.y);
  const a=mateOptionAssessment(chooser,first,seed,ad,radius);
  const b=mateOptionAssessment(chooser,second,seed,bd,radius);
  if(a.choice.accepted!==b.choice.accepted)return a.choice.accepted?-1:1;
  return b.value-a.value||ad-bd||first.id-second.id;
}
