// Discard only genotype definitions that no persistent living/seed/history record uses.
// Zero-quantity cohorts may be removed; every positive rare cohort is retained.
import {founderFloraGenome} from './flora-genotype.js';
export function pruneUnusedFloraGenomes(d){const f=d.floraState,live=new Set();const add=id=>{if(id)live.add(id)},record=r=>{if(!r)return;add(r.genome?.id);add(r.genomeId);add(r.parentGenomeId);for(const id of r.parentGenomeIds||[])add(id)};
 for(const kind of Object.keys(f.adults)){add(founderFloraGenome(kind)?.id);for(const id of f.adults[kind].values())add(id);for(const rows of f.seeds[kind].values())for(const [id,r] of [...rows]){if(r.amount<=0)rows.delete(id);else{add(id);record(r)}}for(const r of d.bankGenomes[kind]?.values()||[])record(r);for(const r of d.producerOrigins[kind]?.values()||[])record(r)}
 for(const r of f.births)record(r);for(const r of d.events)record(r);for(const r of d.botanical?.receipts||[])record(r);for(const r of [...(d.botanical?.flowers.values()||[]),...(d.botanical?.pollen.values()||[]),...(d.botanical?.embryos||[])])record(r);
 for(const a of d.sim.animals){record(a.pollenCargo);record(a.lastPlantMeal);for(const c of Object.values(a.seedCargo||{})){record(c);for(const r of c.cohorts?.values()||[])record(r)}}
 let removed=0;for(const id of [...f.genomes.keys()])if(!live.has(id)){f.genomes.delete(id);removed++}return{removed,retained:f.genomes.size};
}
