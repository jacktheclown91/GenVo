import {generateTaxonName} from '../lineage/taxon-name-generator.js';
import {PARTS} from '../lineage/part-registry.js';
import {SPECIES} from '../organisms/species.js';
import {developmentFor} from '../family/family.js';
// Display aliases are read-only; they never recognize a species or affect mating.
export function creatureIdentity(sim,a){
 if(!a)return{name:'Creature',stage:'unknown',traits:[],label:'Creature'};
 const recognized=sim.speciation?.identityFor?.(a),founder=a.lineage?sim.lineage?.records?.get(sim.lineage.founderId):null;
 const key=a.speciesBranch?.id||a.ancestryId||(a.lineage?'lineage:'+sim.lineage?.founderId:'wild:'+a.species+':'+(a.bodyPlan?.ancestryId||a.bodyPlan?.id||''));
 const name=recognized?.label||generateTaxonName({branchId:key,parentNode:{label:SPECIES[a.species]?.label||'GenVo',nameOrigin:{genus:(SPECIES[a.species]?.label||'GenVo').split(' ')[0]}},cohort:[founder?.bodyPlan?{...a,bodyPlan:founder.bodyPlan}:a]}).label;
 const nodes=a.bodyPlan?.nodes||[],traits=[...new Set(nodes.filter(n=>PARTS[n.partId]&&!/^(head-base|.*torso.*|.*body.*)$/.test(n.partId)).sort((n,m)=>rank(n)-rank(m)).map(n=>PARTS[n.partId].label||PARTS[n.partId].name||n.partId.replace(/-/g,' ')))].slice(0,2);
 const stage=developmentFor(a).stage;return{name,stage,traits,label:name+' · '+stage,description:traits.join(' · ')};
}
function rank(n){return /crest|mouth|jaw|spine|tail/.test(n.partId)?0:/leg|tail/.test(n.partId)?1:2}
