// Creator decision: dedicated inherited reproductive loci, independent of tastes,
// survival genes, body plans and taxon labels. Development model, NOT settled balance.
// The existing bounded allele domain and heredity mutation scale are reused rather
// than inventing a species-distance cutoff or a universal generation timer.
import {GENETIC_DOMAIN} from '../organisms/species.js';
import {CFG} from '../sim/config.js';
import {RNG} from '../core/rng.js';
export const REPRODUCTIVE_LOCI=Object.freeze(['gamete','development']);
const clamp=v=>Math.max(GENETIC_DOMAIN.min,Math.min(GENETIC_DOMAIN.max,v));
export function ancestralReproductiveGenome(){return {schema:1,loci:{gamete:[1,1],development:[1,1]},origin:'shared-ancestral-baseline'}}
export function validReproductiveGenome(g){return g?.schema===1&&REPRODUCTIVE_LOCI.every(k=>Array.isArray(g.loci?.[k])&&g.loci[k].length===2&&g.loci[k].every(v=>Number.isFinite(v)&&v>=GENETIC_DOMAIN.min&&v<=GENETIC_DOMAIN.max))}
export function reproductiveGenomeFor(a){const g=a?.reproductiveGenome;return g===undefined?ancestralReproductiveGenome():validReproductiveGenome(g)?g:null}
export function inheritReproductiveGenome(seed,id,parents){
 if(!parents)return ancestralReproductiveGenome();
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
