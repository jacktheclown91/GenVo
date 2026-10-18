// Creator decision: dedicated inherited reproductive loci, independent of tastes,
// survival genes, body plans and taxon labels. Development model, NOT settled balance.
// The existing bounded allele domain and heredity mutation scale are reused rather
// than inventing a species-distance cutoff or a universal generation timer.
import {GENETIC_DOMAIN,SPECIES} from '../organisms/species.js';
import {wildStartPlan} from '../organisms/wild-bodies.js';
import {founderPlan} from '../lineage/body-inheritance.js';
import {bodyMass} from '../organisms/body-mass.js';
import {aquaticScore} from '../lineage/aquatic.js';
import {canHunt} from '../ecology/functional-diet.js';
import {CFG} from '../sim/config.js';
import {RNG} from '../core/rng.js';
export const REPRODUCTIVE_LOCI=Object.freeze(['gamete','development']);
const clamp=v=>Math.max(GENETIC_DOMAIN.min,Math.min(GENETIC_DOMAIN.max,v));
export function ancestralReproductiveGenome(){return {schema:1,loci:{gamete:[1,1],development:[1,1]},origin:'shared-ancestral-baseline'}}
export function validReproductiveGenome(g){return g?.schema===1&&REPRODUCTIVE_LOCI.every(k=>Array.isArray(g.loci?.[k])&&g.loci[k].length===2&&g.loci[k].every(v=>Number.isFinite(v)&&v>=GENETIC_DOMAIN.min&&v<=GENETIC_DOMAIN.max))}
export function reproductiveGenomeFor(a){const g=a?.reproductiveGenome;return g===undefined?ancestralReproductiveGenome():validReproductiveGenome(g)?g:null}
// Founding reproductive genotypes (creator decision 2026-10-15): every founding lineage shares the
// conserved ancestral architecture (same loci, centred on the ancestral value 1) but carries its own
// inherited lineage offset, and every founder its own small allelic variation. Compatibility still
// comes only from allele matching (no species-name gate); hybrids inherit one development allele from
// each lineage, so their own fertility falls through the existing heterozygosity term; ordinary
// mutation can drift lineages further apart. Divergence magnitudes are PROPOSALS.
export const FOUNDING_GENETICS={enabled:true,gamete:.16,development:.10,individual:.02};
// Lineage relatedness comes from founding ANATOMY, not names: lineages of similar body size start
// close at the gamete locus (log body mass across the founding range, +/- FOUNDING_GENETICS.gamete),
// and lineages with similar aquatic bodies and feeding mouths start close at the development locus.
const centres=new Map();
export function foundingLineageCentre(species){
 if(centres.has(species))return centres.get(species);
 const planFor=sp=>wildStartPlan(sp)||(sp==='genvo'?founderPlan():null),founder=sp=>({species:sp,alive:true,age:(SPECIES[sp]?.maturity||0)+1,genes:{body:1,motion:1},adaptations:[],bodyPlan:planFor(sp)});
 const masses=Object.keys(SPECIES).filter(sp=>planFor(sp)).map(sp=>Math.log(bodyMass(founder(sp))));if(!SPECIES[species]||!planFor(species))return null;
 const lo=Math.min(...masses),hi=Math.max(...masses),a=founder(species),t=hi>lo?(Math.log(bodyMass(a))-lo)/(hi-lo):.5;
 const ecology=Math.max(-1,Math.min(1,1.4*aquaticScore(a)+(canHunt(a)?.8:0)-.5));
 const c={gamete:1+FOUNDING_GENETICS.gamete*(2*t-1),development:1+FOUNDING_GENETICS.development*ecology};centres.set(species,c);return c;
}
export function founderReproductiveGenome(seed,id,species){
 if(!FOUNDING_GENETICS.enabled||!species)return ancestralReproductiveGenome();
 const centre=foundingLineageCentre(species);if(!centre)return ancestralReproductiveGenome();const gameteCentre=centre.gamete,developmentCentre=centre.development;
 const own=new RNG(`${seed}:founder-reproductive:${id}`),allele=c=>Number(clamp(c+own.range(-FOUNDING_GENETICS.individual,FOUNDING_GENETICS.individual)).toFixed(5));
 // Founders are homozygous at the development locus (a pure lineage keeps full fertility); hybrids
 // inherit one development allele from each lineage and pay the existing heterozygosity cost.
 const development=allele(developmentCentre);
 return {schema:1,loci:{gamete:[allele(gameteCentre),allele(gameteCentre)],development:[development,development]},origin:'founding-lineage',lineage:species};
}
export function inheritReproductiveGenome(seed,id,parents,{species=null}={}){
 if(!parents)return founderReproductiveGenome(seed,id,species);
 const rng=new RNG(`${seed}:reproductive-offspring:${id}:${parents[0].id}:${parents[1].id}`),loci={},inheritance={};
 for(const key of REPRODUCTIVE_LOCI){loci[key]=[];inheritance[key]=[];for(const parent of parents){const genome=reproductiveGenomeFor(parent);if(!genome)throw Error('Invalid parental reproductive genome');const alleleIndex=rng.int(0,1),baseline=genome.loci[key][alleleIndex],value=Number(clamp(baseline+rng.range(-CFG.heredity.mutation,CFG.heredity.mutation)).toFixed(5));loci[key].push(value);inheritance[key].push({parentId:parent.id,alleleIndex,baseline,mutation:Number((value-baseline).toFixed(5))})}}
 return {schema:1,loci,inheritance,origin:'parental-gametes'};
}
const match=(a,b)=>Math.max(0,1-Math.abs(a-b)/(GENETIC_DOMAIN.max-GENETIC_DOMAIN.min));
export function reproductiveCompatibility(a,b){
 const x=reproductiveGenomeFor(a),y=reproductiveGenomeFor(b);if(!x||!y)return{enabled:false,reason:'Reproductive inheritance data is invalid.',conceptionChance:0};
 const fertilityA=match(...x.loci.development),fertilityB=match(...y.loci.development);
 const gameteMatch=x.loci.gamete.reduce((sum,p)=>sum+y.loci.gamete.reduce((total,q)=>total+match(p,q),0),0)/4;
 const conceptionChance=gameteMatch*fertilityA*fertilityB;
 return {enabled:conceptionChance>0,reason:conceptionChance>0?'':'Inherited reproductive differences prevent conception.',gameteMatch,fertilityA,fertilityB,conceptionChance,model:'provisional-diploid-loci/1'};
}
