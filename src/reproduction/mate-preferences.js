// One authoritative inherited mate-preference genotype and reciprocal-choice model.
// The five preference axes are NOT survival state. Age, pregnancy, illness,
// hydration, resource needs and kinship remain external reproductive gates.
// Sex does not grant or remove choice; both individuals judge one another.
// All founder/mutation draws use a dedicated per-animal RNG to avoid perturbing
// the existing ecology's shared RNG stream.
import {RNG} from '../core/rng.js';
import {planPartCounts} from '../lineage/part-abilities.js';
import {SPECIES} from '../organisms/species.js';
import {bodyMass} from '../organisms/body-mass.js';
import {pigmentExpression} from '../organisms/pigmentation.js';

export const PREFERENCE_AXES=Object.freeze(['size','strength','ornament','display','behavior']);
export const RITUAL_ACTIONS=Object.freeze(['dance','call','flare','scent','gesture']);
export const LOCAL_ASSORTMENT='local-visual-assortment/1';
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
export function founderMatePreferences(seed,id,{assortment=false}={}){
  const rng=new RNG(`${seed}:mate-genotype:${id}`),weights={};
  for(const key of PREFERENCE_AXES)weights[key]=Number(rng.range(-.55,.55).toFixed(5));
  const ritualTastes=Object.fromEntries(RITUAL_ACTIONS.map(action=>[action,Number(rng.range(-1,1).toFixed(5))]));
  const selectivity=Number(rng.range(.25,.75).toFixed(5)),tempo=Number(rng.range(-1,1).toFixed(5));
  // Drawn last so every earlier founder value is unchanged.
  return {weights,selectivity,ritualTastes,tempo,similarity:Number(rng.range(assortment?-.18:-.55,assortment?.70:.55).toFixed(5))};
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
  const selectivity=Number(clamp(0,1,(sa+sb)/2+rng.range(-.08,.08)).toFixed(5));
  // Inherited similarity preference (drawn after every existing value): parental mean plus variation.
  const similarity=Number(clamp(-LIMIT,LIMIT,((matePreferencesFor(seed,mother).similarity??0)+(matePreferencesFor(seed,father).similarity??0))/2+rng.range(-.10,.10)).toFixed(5));
  return {weights,selectivity,ritualTastes,tempo,similarity};
}
export function matePreferencesFor(seed,animal){
  const founder=founderMatePreferences(seed,animal?.id??0);
  const own=animal?.matePreferences;return own?{...founder,...own,ritualTastes:{...founder.ritualTastes,...own.ritualTastes}}:founder;
}

export const SIMILARITY_PREFERENCE={enabled:true};
const ORNAMENTS=['display-frill','signal-crest','luminous-tail','flag-tail','scent-gland','display-eye'];
function hueOf(animal){const hex=SPECIES[animal?.species]?.color||'#888888',r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d)h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;const gs=animal?.genes||{};return(h*60+360+((gs.climate??1)-1)*165+((gs.temperament??1)-1)*36)%360}
// Expressed palette hue, not unrelated thermal/temperament genes, informs modern mate choice.
function visibleHue(animal){const pigment=pigmentExpression(animal?.pigmentGenome);return pigment?(145+pigment.hueShift+360)%360:hueOf(animal)}
function bodyGroups(animal){
 const nodes=animal?.bodyPlan?.nodes||[];
 const root=nodes.find(n=>!n.parent)?.partId||null;
 const legs=nodes.filter(n=>String(n.socket||'').startsWith('limb.')).map(n=>n.partId);
 const organs=nodes.filter(n=>n.parent&&!String(n.socket||'').startsWith('limb.')&&!String(n.socket||'').startsWith('eye')).map(n=>n.partId);
 return{root,legs,organs};
}
function groupDistance(a,b){
 const ca=new Map(),cb=new Map();for(const id of a)ca.set(id,(ca.get(id)||0)+1);
 for(const id of b)cb.set(id,(cb.get(id)||0)+1);
 const keys=new Set([...ca.keys(),...cb.keys()]);
 const delta=[...keys].reduce((sum,id)=>sum+Math.abs((ca.get(id)||0)-(cb.get(id)||0)),0);
 return delta/Math.max(1,a.length+b.length);
}
export function perceivedAppearance(animal,{assortment=false}={}){
 const parts=planPartCounts(animal),legs=Object.entries(parts).filter(([id])=>/leg|forelimb|grasper/.test(id)).reduce((n,[,c])=>n+c,0),webbed=parts['webbed-leg']||0;
 return{size:Math.log(Math.max(.05,bodyMass(animal))),limb:legs?webbed/legs:0,ornament:ORNAMENTS.reduce((n,id)=>n+(parts[id]||0),0),
  hue:assortment?visibleHue(animal):hueOf(animal),...(assortment?{build:bodyGroups(animal)}:{})};
}
export function appearanceDistance(a,b,{assortment=false}={}){
 const x=perceivedAppearance(a,{assortment}),y=perceivedAppearance(b,{assortment});
 const dh=Math.min(Math.abs(x.hue-y.hue),360-Math.abs(x.hue-y.hue))/180;
 const size=Math.min(1,Math.abs(x.size-y.size)/Math.log(4)),ornament=Math.min(1,Math.abs(x.ornament-y.ornament)/3);
 if(!assortment)return(size+Math.abs(x.limb-y.limb)+ornament+dh)/4;
 const silhouette=(x.build.root===y.build.root?0:1)*.35+
  groupDistance(x.build.legs,y.build.legs)*.4+groupDistance(x.build.organs,y.build.organs)*.25;
 return size*.16+ornament*.14+dh*.30+silhouette*.40;
}
export function perceptionOf(animal){const parts=planPartCounts(animal),eyes=Object.entries(parts).filter(([id])=>/eye/.test(id)).reduce((n,[,c])=>n+c,0),senses=animal?.genes?.senses??1;return eyes?Math.max(.5,Math.min(1.2,senses)):.3*senses}
export function individualMateChoice(chooser,candidate,seed='GENVO8',{assortment=false}={}){
  const genotype=matePreferencesFor(seed,chooser),traits=expressedMateTraits(candidate),w=genotype.weights||{};
  let total=0,dominant=null,largest=0;
  for(const axis of PREFERENCE_AXES){
    const allele=clamp(-LIMIT,LIMIT,w[axis]);
    const term=allele*traits[axis];
    total+=term;
    if(Math.abs(term)>largest){largest=Math.abs(term);dominant=axis}
  }
  // Heritable similarity preference (creator decision 2026-10-15): positive alleles favour partners whose
  // PERCEPTIBLE anatomy (size, limb build, ornament, colour) resembles the chooser's own, negative alleles
  // favour contrast. Weighted by the chooser's perception (senses; much weaker without eyes). It is one
  // more inherited axis of the same score, never a compatibility gate.
  if(SIMILARITY_PREFERENCE.enabled){const allele=clamp(-LIMIT,LIMIT,genotype.similarity??0),term=allele*(1-2*appearanceDistance(chooser,candidate,{assortment}))*perceptionOf(chooser)*(assortment?1.3:1);total+=term;if(Math.abs(term)>largest){largest=Math.abs(term);dominant='similarity'}}
  // Absolute allele magnitude matters: a weakly inherited preference must
  // not behave as though it were a strong preference simply by normalization.
  const score=clamp(-1,1,total/PREFERENCE_AXES.length);
  const threshold=-.16+.08*clamp(0,1,genotype.selectivity??.5);
  const accepted=score>=threshold;
  const dominantAllele=dominant==='similarity'?clamp(-1,1,genotype.similarity??0):dominant?clamp(-1,1,w[dominant]):0;
  const direction=dominantAllele>=0?'greater':'less';
  return {accepted,score,threshold,reason:accepted?'accepted':`preference-${dominant||'general'}`,dominant,direction};
}
// Plain-language inclination for the player's own creature (Phase 3J): which inherited taste led it to hold
// back, never a number. axis/direction come from individualMateChoice's dominant term.
const TASTE={similarity:['partners that look like itself','partners that look unlike itself'],size:['larger partners','smaller partners'],strength:['stronger partners','slighter partners'],ornament:['more ornamented partners','plainer partners'],display:['bolder displays','quieter displays'],behavior:['livelier partners','calmer partners']};
export function tasteText(taste){const t=TASTE[taste?.axis];return t?`it is drawn to ${t[taste.direction==='less'?1:0]}`:'it is not drawn to this partner'}
export function reciprocalMateChoice(a,b,seed='GENVO8',options={}){
  const aChoice=individualMateChoice(a,b,seed,options),bChoice=individualMateChoice(b,a,seed,options);
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
export function mateOptionAssessment(chooser,candidate,seed='GENVO8',distance=0,radius=12,{assortment=false}={}){
  const choice=reciprocalMateChoice(chooser,candidate,seed,{assortment});
  const preferenceValue=.8*choice.a.score+.2*choice.b.score;
  const travelCost=Math.max(0,distance)/Math.max(1,radius);
  const value=preferenceValue-(assortment?.18:.12)*travelCost;
  return {choice,preferenceValue,travelCost,value,
    label:!choice.accepted?(choice.reason==='first-declines'?'you decline':'partner declines'):
      preferenceValue>.075?'strong fit':preferenceValue>.015?'favored':'compatible'};
}

// Same-taxon search tendency (docs/HERITABLE_MATE_CHOICE.md: same taxon before gene flow).
// A TENDENCY, not a barrier: it is added to the ordinal value, so a compatible cross-taxon
// candidate the chooser clearly prefers can still rank first. Measured scale (3 seeds x 30
// days): accepted preference values mostly lie within +/-0.03 and a chooser's best-to-worst
// accepted gap has median 0.055, p90 0.09. CANDIDATE 0.01 (creator: 0.04 too strong); sweep across
// set sizes and preference strengths in docs/mate-affinity/sweep-2026-10-15.json. Not final.
export const SAME_TAXON_AFFINITY=.01;
export function compareMateOptions(chooser,first,second,seed='GENVO8',radius=12,{affinity=null,assortment=false}={}){
  const ad=Math.hypot(chooser.x-first.x,chooser.y-first.y);
  const bd=Math.hypot(chooser.x-second.x,chooser.y-second.y);
  const a=mateOptionAssessment(chooser,first,seed,ad,radius,{assortment});
  const b=mateOptionAssessment(chooser,second,seed,bd,radius,{assortment});
  if(a.choice.accepted!==b.choice.accepted)return a.choice.accepted?-1:1;
  const av=a.value+(affinity?affinity(first):0),bv=b.value+(affinity?affinity(second):0);
  return bv-av||ad-bd||first.id-second.id;
}
