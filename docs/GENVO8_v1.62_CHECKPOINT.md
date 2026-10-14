# GenVo8 v1.62.0 — Development checkpoint (2026-10-12)

**Status:** Development candidate; creator art/UI acceptance and stable-release certification outstanding.

## Integrated gameplay

- Podshell (18 world founders): a dryland seed-grazing niche. `kernel-beak` raises energy gain from finite thistlepod biomass, but reduces soft-plant feeding and adds upkeep. Viable seed cargo is carried through the pre-existing animal gut transit, real local seed bank and germination loop. Changing the mouth changes its advantage.
- `thorn-carapace`: inherited heavy dorsal armor. It reduces wild predator bite damage, can make a predator retreat, physically costs sprint speed/metabolism, and presents contact spines against a player who attacks the armored animal. Losing it removes those effects.
- Bankjaw (8 world founders): webbed amphibiotic hunter with a real gape mouth and paddle tail. Swims but is not a permanently water-dwelling creature. Can bite river Rillsifters, scavenge, and harvest existing finite submerged fry where its anatomy permits. This expands the wetland food web rather than adding synthetic spawns after world creation.
- All founding body plans are assembled by the existing registries. New parts are evolvable/inheritable and have separate pixel-art draw components. Sound cues are inherited from existing authored sounds, not represented as dedicated new recordings.

## Verification performed

- Canonical source audit: 145 runtime-reachable modules; 78 registered parts; 78 drawing implementations; no missing imports or duplicate source module copies.
- `tests/seed-shore-niches.mjs`: PASS — finite plant consumption, seed transit and seed-bank deposition; body-part loss and effects; biome-appropriate spawn; forced single-bite fixture through the real predator authority; inheritance; save/load; ambient update.
- `tests/wetland-niches.mjs`: PASS — preceding Rillsifter/Mirelick integration remains functional.
- Gameplay compatibility tests: `wildlife-rhythm`, `predator-retaliation`, `predator-encounter`, `save-persistence`, `physical-breeding`, `reproductive-anatomy-eggs`, `dispersal`, `dispersal-feeding-priority`, `species-body-language`, `species-coexistence`, `wild-pressure-movement`, `predator-interference`, `targeted-feeding`, `surface-water-persistence`, `public-export`: PASS.
- Chromium: screenshots `docs/runtime-v162-podshell.png`, `docs/runtime-v162-bankjaw.png`, taken from actual loaded gameplay with camera staged next to real actors. No page errors or failed asset requests. Real visual capture is not creator visual approval.
- Long-horizon `wild-evolution` was not completed in the focused pass (timed out before the natural 420-day run). The obsolete fixed-count fixture was adjusted to permit additional body plans, but no result is claimed for its full extended test.
- Existing `birth-hydration` failure inherited from prior milestone remains outstanding, not changed for this pass.

## Authority and release boundaries

- Source archive remains canonical; playable web files are exact exports of runtime-reachable source and authored web assets.
- Avoid guarantee-based ecology tests. Authentic divergence, survival failures and extinctions are allowed if mechanical rules hold.
- Provenance explicitly distinguishes creator's expansion direction from AI-assisted concrete species proposals, code and art.
- Stable-release manifest is intentionally not refreshed for this unfinished development pass.
