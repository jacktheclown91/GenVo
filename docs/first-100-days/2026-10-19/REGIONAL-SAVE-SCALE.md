# Regional save scale: day-60 attribution

The retained three-region checkpoint is 265,412,169 bytes. A read-only diagnostic separately V8-encodes fields without restoring, simulating or removing anything. Shared references and per-encoding overhead mean these field sizes are not additive accounting of the original artifact. The active core excludes nested regional archives to avoid recursive attribution.

All three regions show the same dominant pattern: controllers encode to about 83-86 MB per region, physical World fields to about 4.67 MB and animals to about 1.08-1.12 MB. Within dispersal, floraState encodes to about 39.9-41.0 MB, botanical to 22.3-24.1 MB, bankGenomes to 10.9-11.0 MB and producerOrigins to 8.5-8.8 MB. These are actual component measurements, not a claim of redundant or obsolete biology.

Receipt: ../../performance/regional-checkpoint-field-sizes-day60-2026-10-19.json. Tool: tools/profile-regional-checkpoint-fields.mjs. The receipt records the source checkpoint hash, per-region clock, all controller fields and detailed dispersal/World field sizes. The existing day-60 lineage inspection remains separate.

Next performance work should inspect those representations for repeated immutable genotype/provenance data and lossless transport opportunities, preserving all variants, origins, cohort amounts, RNG and exact future behavior. Existing compact seed transport is not proof that the remaining live structures or archives are compact. Any representation change needs complete-state comparison after decoding, mutation-isolation checks, current/historical save coverage and continued canonical biology parity. Browser persistence and resident memory are separate measurements; compressed file size alone cannot establish responsive gameplay. No runtime change or new efficiency claim follows from this diagnostic.

## Nested fields and browser boundary

The deeper attribution receipt, ../../performance/regional-checkpoint-field-sizes-day60-r2-2026-10-19.json, identifies the already packed floraState.seeds as about 28.1-29.1 MB per region and floraState.genomes as about 11.2-11.3 MB. Botanical state includes adultGenomes (about 7.7-7.8 MB), pollen (about 6.2-7.4 MB) and substantial embryos/flowers. These are ongoing biological structures, not simply disposable historical logs. This diagnostic does not establish which records are semantically redundant.

Canonical createSimulationSnapshot already applies packFloraSeedBanks; repeating that existing compression is not new work. SaveManager.saveNow writes the structured snapshot directly to IndexedDB via objectStore.put, not this diagnostic V8 binary. Therefore V8 component attribution is a direction for investigation, not a browser storage/quota or save-latency measurement. Future proof must separately cover snapshot construction, transaction completion, loading, decoded mutable ownership and live simulation memory.

## Growth between milestones

The same read-only field profiler also covers the retained day-30 checkpoint: ../../performance/regional-checkpoint-field-sizes-day30-2026-10-19.json. Total artifact bytes grow from 140,143,857 to 265,412,169 by day 60 (about 1.89 times). Compare corresponding named regions and fields rather than summing independently encoded fields. The receipts retain populations and physical World sizes alongside lineage/controller state, allowing future optimization to target measured growth rather than assuming animals caused it. Both horizons share the fixed runtime trial but are observations of different biological states, not a before/after optimization benchmark.
