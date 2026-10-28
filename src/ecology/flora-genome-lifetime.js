// Discard only genotype definitions that no persistent living/seed/history record uses.
// Zero-quantity cohorts may be removed; every positive rare cohort is retained.
// Map iterators safely visit surviving entries when the current entry is deleted.
// Stream these daily scans instead of allocating a snapshot of every seed cohort.
// The daily vegetation tick yields between seed cells, at most every 2048
// cohorts; nothing else steps while a tick is pending, so each slice sees the
// same records in the same order as the whole scan.
import {founderFloraGenome} from './flora-genotype.js';
import {drain} from '../sim/resumable.js';
export function pruneUnusedFloraGenomes(d){return drain(pruneUnusedFloraGenomesSteps(d))}
export function* pruneUnusedFloraGenomesSteps(d){const f=d.floraState,live=new Set();let visited=0;const add=id=>{if(id)live.add(id)},record=r=>{if(!r)return;add(r.genome?.id);add(r.genomeId);add(r.parentGenomeId);for(const id of r.parentGenomeIds||[])add(id)};
 // Map.forEach supplies its owning Map without allocating an entry pair for
 // each cohort; one callback serves every cell in this complete daily scan.
 const seedRecord=(r,id,rows)=>{if(r.amount<=0)rows.delete(id);else{add(id);record(r)}};
 for(const kind of Object.keys(f.adults)){add(founderFloraGenome(kind)?.id);for(const id of f.adults[kind].values())add(id);for(const rows of f.seeds[kind].values()){if(visited>=2048){visited=0;yield}visited+=rows.size;rows.forEach(seedRecord)}for(const r of d.bankGenomes[kind]?.values()||[])record(r);for(const r of d.producerOrigins[kind]?.values()||[])record(r)}
 for(const r of f.births)record(r);for(const r of d.events)record(r);for(const r of d.botanical?.receipts||[])record(r);for(const records of [d.botanical?.flowers,d.botanical?.pollen])if(records)for(const r of records.values())record(r);for(const r of d.botanical?.embryos||[])record(r);
 for(const a of d.sim.animals){record(a.pollenCargo);record(a.lastPlantMeal);for(const c of Object.values(a.seedCargo||{})){record(c);for(const r of c.cohorts?.values()||[])record(r)}}
 let removed=0;for(const id of f.genomes.keys())if(!live.has(id)){f.genomes.delete(id);removed++}return{removed,retained:f.genomes.size};
}
