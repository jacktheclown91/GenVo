# Regional evolutionary founding — October 21, 2026

New planetary worlds record `regional-founding-templates/1`. When the player first enters a planetary region, `src/ecology/regional-founding.js` founds it from the authored catalog in `src/organisms/founding-templates.js`; the home valley keeps its established `CFG.initial` founding. Worlds without the policy, including every earlier save, keep `spawnInitial()` for new regions. Archived and surveyed regions are restored from their records and never founded again: founding throws if a receipt already exists or the region is populated.

## Templates

39 templates (`founding-templates/1`): the seven original wildlife bodies, the GenVo founder body, and 31 further land, shore and freshwater bodies covering grazers, browsers, seed specialists, climbers, burrowers, cold-, dry- and warm-humid-adapted forms, filter feeders, scavengers and predators. The seven warm-humid templates were added once the continental projection made tropical regions reachable; before that, such regions founded nothing because no authored tolerance covered them. Each is a modular body plan from the shared part registry placed on a legacy life-history carrier (`SPECIES` maturity, lifespan, litter, gestation, social mode). The carrier grants no diet or ability: feeding, hunting, swimming, digging, climbing and thermal physiology follow the mounted parts through the existing authorities. Predator templates use hunter carriers so that existing prey-gated breeding applies.

Catalog validation runs at import and fails visibly:

- every placement is a registered part on a valid socket, and the whole plan passes `validatePlan`;
- developmental depth of every part is at most 3;
- no relic (`exclusive`), powered-flight, gliding-membrane or lactation parts — those must arise by inheritance in the world;
- every body has a mouth.

Templates may declare part variants (for example tail alternatives) drawn per founder. Genes, pigment genomes, reproductive genomes and mate preferences come from the ordinary `spawnAnimal` founder path, so every founder is individually varied.

## Selection and founding

1. **Habitat tolerance.** Each template's medium (land, shore within three cells of water, water) and temperature/moisture ranges select the actual region cells it may be offered on. At least 96 such cells are required.
2. **Measured support.** A detached probe body for each remaining template (RNG, identity counter, population and page index restored exactly afterwards) is evaluated at 24 sampled cells. The measure is the existing `renewableFood` (plants and freshwater food its mouth can use, and prey actually present) over `founderDailyNeed` multiplied by one plus the body's `thermalSiteDemand` load there. Templates are ranked by the square root of their habitat share times the mean of the best six ratios, with a deterministic regional jitter of up to 35%.
3. **Roles in trophic order.** Up to six primary consumers, then up to two scavengers, then up to two predators, each ranked only after the previous role is founded, so predators are measured against real prey. At most two groups share one mouth part per region.
4. **Founding groups.** Group size scales with habitat share within the template's range. Founders are placed on occupiable cells in their medium around the two best measured sites. Each group is trimmed to what its shared renewable food supports, the same rule as resource-informed founding; fewer than two means the template is absent. Both sexes are guaranteed.

Template ranking and placement use the stream `seed|regional-founding|<region>`, so an unexplored region is founded identically whenever it is first reached. Founding a region takes roughly 60–160 ms in Node.

## Provenance

Every founder is generation 1 with no parents and carries `foundingOrigin {schema, policy, template, region, day, tick}`. The region records `regionalFounding` with its habitat profile, every introduced group (configured and supportable counts, renewable food, need, sites, founder IDs) and every absent template with its reason. Restore validates the receipt and rejects founders whose template or region disagrees with it. Founders that later travel with a family keep their original region's provenance. Offspring are ordinary births with real parents; no ancestry, generation or achievement is fabricated.

## Verification

`tests/regional-founding.mjs`: catalog bounds; three generated regions founding food-supported breeding groups with both sexes and varied genes; anatomy, medium, hunting ability and provenance per founder; predators only with prey; determinism; refusal to re-found; exact save/restore and forged-receipt rejection; one day of ordinary simulation; real border crossing under the policy; and a policy-less historical save still using `CFG.initial`. Existing E14–E18 travel and offscreen tests, planetary preparation, regional ecology, dirty saves and persistence tests pass unchanged.

## Limits

Within the original ±15° projection, regions were climatically similar (mean temperature roughly 0.31–0.50). The continental projection now reaches subpolar (≈0.22) and equatorial (≈0.55–0.61) climates with distinct founded communities. Open ocean still founds nothing: there is no marine food web. Ranking and group sizes are authored proposals pending ecological review. No long-run outcome is claimed. The distant-ecology population model is a separate pass.
