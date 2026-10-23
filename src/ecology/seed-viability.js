import {PLANTS} from '../sim/config.js';

// Seed viability (seed-viability/1, creator direction 2026-10-22). A seed is a
// discrete propagule: the existing ovule unit (`dispersal.localRelease`, the
// mass of one fertilizable ovule) is the provision of one seed. Continuous bank
// decay used to leave every cohort as an ever-shrinking positive fraction, so
// cohorts holding a hundredth of one seed, which can never germinate, kept
// their genomes alive indefinitely.
// Each day, within one cell, the cohorts holding less than one whole seed pool
// their mass. That pool funds a whole number of discrete seeds (stochastically
// rounded, so the expected count is unchanged). Surviving genotypes are drawn
// weighted by their seed mass, so a rare genotype persists with the chance its
// share of seeds gives it: finite-seed drift, never a cap or a rarity filter.
// Survivors share the pool exactly; when no seed survives, the mass returns to
// litter through the existing seed-litter route. Cohorts holding one or more
// whole seeds are untouched. Draws are hashed (world, kind, cell, day, genome),
// never the simulation RNG.
export const SEED_VIABILITY=Object.freeze({policy:'seed-viability/1'});
export const seedViabilityEnabled=sim=>sim?.seedViabilityRules===SEED_VIABILITY.policy;
export const seedUnit=kind=>PLANTS[kind]?.dispersal?.localRelease||0;
function mix(x){x|=0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);return(x^(x>>>16))>>>0}
function idHash(s){let h=2166136261;for(let k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,16777619)}return h>>>0}
const unitDraw=(...parts)=>parts.reduce((h,p)=>mix(h^p),0x5eed)/4294967296;
// Returns the mass sent to litter (0 when every pooled seed survives).
export function settleSeedCell(d,kind,i){
 const rows=d.floraState.seeds[kind]?.get(i),unit=seedUnit(kind);if(!rows||!(unit>0))return 0;
 const small=[];let pool=0;for(const [id,r] of rows)if(r.amount<unit){small.push([id,r]);pool+=r.amount}
 if(!small.length)return 0;
 const w=d.sim.world,day=d.sim.day,kindHash=idHash(kind),expected=pool/unit,whole=Math.floor(expected);
 const seeds=Math.min(small.length,whole+(unitDraw(w.seedHash,kindHash,i,day,0x51)<expected-whole?1:0));
 // A single sub-seed cohort that is drawn to survive keeps its own mass.
 if(seeds===small.length)return 0;
 // Weighted draw without replacement over the pooled cohorts.
 const chosen=new Set();let remaining=pool;
 for(let k=0;k<seeds;k++){let draw=unitDraw(w.seedHash,kindHash,i,day,k+1)*remaining;
  for(const [id,r] of small){if(chosen.has(id))continue;draw-=r.amount;if(draw<=0){chosen.add(id);remaining-=r.amount;break}}
  if(chosen.size===k){const fallback=small.find(([id])=>!chosen.has(id));chosen.add(fallback[0]);remaining-=fallback[1].amount}}
 for(const [id] of small)if(!chosen.has(id))rows.delete(id);
 if(seeds>0){const share=pool/seeds;for(const [id,r] of small)if(chosen.has(id))r.amount=share;return 0}
 return pool;
}
export function validateSeedViabilityRules(core){
 if(core.seedViabilityRules!==undefined&&core.seedViabilityRules!==SEED_VIABILITY.policy)throw Error('Unknown seed viability policy.');
}
