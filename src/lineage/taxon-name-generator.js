// v1.64: Explainable, deterministic taxon naming. A NAME NEVER grants a capability,
// restricts mating or participates in ecology. Name a recognized branch once from
// its ancestry, the real mounted-part capabilities of its founding cohort and the
// cohort's settled habits. Dictionaries are data: add new anatomy/behavior rules
// without adding a new engine species, changing the speciation gates or consuming RNG.
import {PARTS} from './part-registry.js';

export const TAXON_NAMING_VERSION = 1;
export const TAXON_VOCABULARY = Object.freeze({
  anatomy: [
    {id:'sieve',word:'Silt',why:'filter-feeding mouth anatomy',actions:['filter'],weight:4.0},
    {id:'venom',word:'Viper',why:'inherited venom-delivering anatomy',actions:['venom'],weight:4.0},
    {id:'armor',word:'Shell',why:'protective body armor',actions:['armor'],tags:['shell','plate'],weight:3.4},
    {id:'spines',word:'Thorn',why:'defensive spines and retaliation',actions:['retaliate'],weight:3.2},
    {id:'seed',word:'Kernel',why:'seed-processing feeding anatomy',niches:['seeds'],weight:3.4},
    {id:'predator',word:'Fang',why:'flesh-tearing or prey-grasping anatomy',actions:['tear','swallow','crush'],weight:3.1},
    {id:'dig',word:'Burrow',why:'digging limbs',actions:['dig'],weight:3.3},
    {id:'swim',word:'Fin',why:'water-propelling limbs or tail',actions:['swim-propel','swim'],weight:2.7},
    {id:'spring',word:'Spring',why:'pouncing or springing limbs',actions:['pounce'],weight:2.6},
    {id:'runner',word:'Fleet',why:'running-specialized anatomy',actions:['run'],weight:2.5},
    {id:'display',word:'Crest',why:'courtship and signaling displays',actions:['signal','flare'],weight:2.2},
    {id:'senses',word:'Keen',why:'tracking or wide-field eyes',actions:['track','spot','see-wide'],weight:1.9},
    {id:'grazing',word:'Leaf',why:'plant-grazing mouthparts',actions:['graze','nibble'],weight:1.0}
  ],
  behavior: [
    {id:'hunting',word:'prowler',why:'a settled tendency to hunt',habit:'hunting',weight:1.3},
    {id:'range',word:'roamer',why:'habitual long-range exploration',habit:'range',weight:1.0},
    {id:'home',word:'keeper',why:'a strong home-range attachment',habit:'home',weight:1.0},
    {id:'caution',word:'lurker',why:'cautious, elusive behavior',habit:'caution',weight:1.0},
    {id:'boldness',word:'guard',why:'bold defensive behavior',habit:'boldness',weight:1.0}
  ],
  pressureFallback: {
    dryness:{word:'wanderer',why:'dry-habitat selection pressure'},
    wetness:{word:'wader',why:'wet-habitat selection pressure'},
    competition:{word:'strider',why:'competition for resources'},
    predation:{word:'watcher',why:'persistent predator pressure'},
    scarcity:{word:'seeker',why:'food scarcity'},
    cold:{word:'shelterer',why:'cold-habitat selection pressure'},
    heat:{word:'drifter',why:'hot-habitat selection pressure'}
  },
  genusChanges:['ari','ora','ethi','uvi','ell','ani','oro','ira'],
  collisionSuffixes:['an','el','in','or','ul','en','ir','is']
});

// Small, platform-independent FNV-1a variant; name assignment must never advance
// simulation RNG. A seed is purely a tie-break and collision suffix source.
function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function cap(s){return s?s[0].toUpperCase()+s.slice(1):''}
function matches(def,rule){
  const action=def.actionCapabilities||[],tag=def.tags||[],niche=def.ecologicalNicheTags||[];
  return !!(rule.actions?.some(a=>action.includes(a))||rule.tags?.some(a=>tag.includes(a))||rule.niches?.some(a=>niche.includes(a)));
}
function anatomyEvidence(cohort){
  const adults=(cohort||[]).filter(a=>a?.bodyPlan?.nodes?.length);
  if(!adults.length)return null;
  const rows=[];
  for(const rule of TAXON_VOCABULARY.anatomy){
    let count=0,uniqueParts=new Set();
    for(const animal of adults){
      const used=new Set(animal.bodyPlan.nodes.map(n=>n.partId));
      const matching=[...used].filter(id=>PARTS[id]&&matches(PARTS[id],rule));
      if(matching.length){count++;matching.forEach(id=>uniqueParts.add(id))}
    }
    if(count)rows.push({rule,score:(count/adults.length)*rule.weight,share:count/adults.length,parts:[...uniqueParts].sort()});
  }
  return rows.sort((a,b)=>b.score-a.score||a.rule.id.localeCompare(b.rule.id))[0]||null;
}
function behaviorEvidence(cohort,pressure){
  const adults=(cohort||[]).filter(a=>a?.habits&&typeof a.habits==='object');
  const ranking=TAXON_VOCABULARY.behavior.map(rule=>{
    const avg=adults.length?adults.reduce((n,a)=>n+Math.max(0,Number(a.habits?.[rule.habit])||0),0)/adults.length:0;
    return{rule,score:avg*rule.weight,average:avg};
  }).sort((a,b)=>b.score-a.score||a.rule.id.localeCompare(b.rule.id));
  const strongest=ranking[0];
  // Do not invent a behavioral trait from random low-level noise. An ecological
  // pressure is explicitly labeled as a FALLBACK, not falsely claimed as behavior.
  if(strongest?.average>=.23)return{word:strongest.rule.word,why:strongest.rule.why,source:'behavior',habit:strongest.rule.id,average:strongest.average};
  const fallback=TAXON_VOCABULARY.pressureFallback[pressure]||{word:'walker',why:'ancestral roaming ecology'};
  return{word:fallback.word,why:fallback.why,source:'pressure',pressure:pressure||null};
}
function genusFor(parentNode,branchId){
  const depth=(parentNode?.depth??0)+1;
  const parentGenus=parentNode?.nameOrigin?.genus||(/^([A-Za-z]+)\s/.exec(parentNode?.label||'')||[])[1]||'Genvo';
  // The ancestral root stays GenVo; its first daughters share a genus. Only
  // deeper descendants branch to a new pronounceable genus, inherited thereafter.
  if(depth<=2||depth%3!==0)return parentGenus==='GenVo'?'Genvo':parentGenus;
  const syllable=TAXON_VOCABULARY.genusChanges[hash(branchId+'|genus')%TAXON_VOCABULARY.genusChanges.length];
  return cap(parentGenus.toLowerCase().replace(/[aeiou]+$/,'').slice(0,7)+syllable);
}

export function generateTaxonName({branchId,parentNode=null,cohort=[],pressure=null,usedNames=[]}={}){
  if(!branchId)throw new Error('Taxon naming requires a stable branch ID.');
  const anatomy=anatomyEvidence(cohort),behavior=behaviorEvidence(cohort,pressure);
  const genus=genusFor(parentNode,branchId),prefix=anatomy?.rule.word||'Kin',epithet=cap(prefix+behavior.word);
  const occupied=new Set(usedNames),base=`${genus} ${epithet}`;
  let label=base;
  if(occupied.has(label)){
    const options=TAXON_VOCABULARY.collisionSuffixes,start=hash(branchId+'|suffix')%options.length;
    let resolved=false;
    for(let i=0;i<options.length;i++){
      const next=`${base}${options[(start+i)%options.length]}`;
      if(!occupied.has(next)){label=next;resolved=true;break}
    }
    if(!resolved)label=`${base}${hash(branchId).toString(36)}`;
  }
  const nameOrigin={version:TAXON_NAMING_VERSION,genus,epithet:label.slice(genus.length+1),
    ancestor:parentNode?.label||'GenVo',
    anatomy:anatomy?{id:anatomy.rule.id,description:anatomy.rule.why,parts:anatomy.parts,share:anatomy.share}:null,
    behavior:{description:behavior.why,source:behavior.source,habit:behavior.habit||null,average:behavior.average??null,pressure:behavior.pressure||null},
    branchId};
  return{label,nameOrigin};
}

export function taxonNameExplanation(nameOrigin){
  if(!nameOrigin)return'';
  const parts=[nameOrigin.anatomy?.description,nameOrigin.behavior?.description].filter(Boolean);
  return`${parts.length?`Named for ${parts.join(' and ')}.`:'Named from ancestral lineage.'} Descended from ${nameOrigin.ancestor||'GenVo'}.`;
}
