# Botanical inheritance development checkpoint

Actual gameplay now carries paid pollen through anatomy- and diet-valid flower feeding. Pollen receipt, exact categorical recognition, funded fertilization, inherited embryo viability, canonical seed release and germination are separate biological stages. Dedicated botanical loci are independent of animal loci, species names, resource aliases, appearance and growth traits. Legacy adult body IDs remain fixed; reproductive companions and new schema-4 descendants retain diploid inheritance. Clonal reproduction and all positive rare seed cohorts remain available.

Creator decisions: dedicated inherited recognition and separate self-compatibility; eight shared ancestral self-recognition identities, separate physical producer identity. Mutations change categorical encoded identities through inherited changes, not genetic-distance cutoffs. There is no blanket selfing penalty. The existing clonal mutation rate is reused provisionally, not a settled balance value. Functional embryo copies and actual homozygous losses determine development; resources fund reproduction without defining recognition identity.

## Source functionality

- `src/ecology/botanical-genetics.js`: dedicated loci, independent segregation, inherited ordinary trait alleles, exact recognition, self-incompatibility, hybrid expression and viability; immutable canonical genotype caching.
- `src/ecology/botanical-reproduction.js`: finite funded structures, physical pollen cargo, staged fertilization/viability/release, live observations, boundary safety, malformed-payload validation and derived embryo indexing.
- `src/ecology/flora-genome-lifetime.js`: only unreferenced definitions are removed; every positive seed cohort and referenced parental genotype stays intact.
- Existing dispersal, flora inheritance, vegetation phase, plant growth and foraging controllers own execution. Nutrition, water requirement and growth reflect actual inherited genotypes. No UI feeding or reproduction controller was added.
- Native flora/creature rendering and the layered botanical inspector reflect actual reproductive stocks. Plain feeding feedback describes flower dust and reception; technical loci stay in optional inspection.
- This build also includes the preserved Lab/lineage-window checkpoint: whole-body native gait fitting, compatible mounts, pinned reference, expanded fixed-header inspectors and actual conception-parent/offspring anatomy comparisons.

## Evidence and practical limits

`botanical-sexual-proof.json` records actual Chromium 800x600 mouse/E feeding, pollen transfer, compatible cross-resource fertilization, exact inherited hybrid establishment in two canonical vegetation phases, and save/load parity. Player/camera placement and a naturally unoccupied release site were selected for this controlled proof; no plant genotype, biomass or terrain was authored into the scene. Screenshots and `botanical-sexual-runtime.webm` show the native game.

A separate unstaged 30-second fresh-world run produced three directly attributed sexual adults, 551 self-fertilizations and 239 rejected pollen receptions. It produced no animal-mediated crosses. These observations establish autonomous selfing/rejection and some seed establishment, not natural crossbreeding frequency, ecological equilibrium or human comprehension.

`botanical-populations-proof.json` tests recognition at founder population sizes 1, 2, 8, 32 and 128, isolated matching-genotype individuals, self-compatible reception, divergent signals, hybrid receptor inheritance and mutation. Matrices do not force fertilization or persistence and do not establish long-run drift/bottleneck outcomes. Ordinary inherited growth/water/nutrition enter canonical resource selection; adaptive selection in unstaged populations still needs validation.

`botanical-sexual-tests.json` records focused integration/regression checks. The inherited-coat test now explicitly expects schema 4 and verifies unchanged coat alleles and botanical inheritance. The existing nutrient/energy conservation test accounts for new reproductive stocks and paid investment with unchanged tolerances. Invalid delivery/restore payloads fail before stock mutation; pollen death transfers finite mass to litter; rare cohorts as small as 1e-30 remain exactly retained.

`botanical-sexual-resource-probe.json` covers three seeds and 100 resource-only days, without animal lifecycle fixtures. Raw snapshots remain approximately 148-159 MB, and measured vegetation phases average roughly 271-295 ms on this host before the final stricter haploid ancestry validation. This is a material scalability limitation. No rare quantity cutoff was used to hide it. Shared ancestral identities substantially reduce genotype duplication; resource-only accounting is not whole-ecosystem ecological proof.

Exact prior delivered seed-journey saves preserve plant stocks, seed banks, resource reserves, genotype cohorts and RNG on migration (`lab-windows-prior-save-receipt.json`). The full historical suite has documented unrelated implicit-action/birth/habitat failures. Creator visual approval, naturally adaptive reproduction and unfamiliar-player playtests remain open.

The full seven-priority development goal stays active. Next: bounded save/cohort scalability and a naturally occurring pollinator cross, followed by biological reaction/audio and phenotype-authority work already on the roadmap.
