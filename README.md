# GenVo

Canonical source for the evolutionary survival game. Development happens on **main**; this repository has one branch.

Current checkpoint: **Funded Feeding Performance (2026-10-14)**. Anatomy-driven meals now produce source-facing reach, processing and settling for players and wildlife. The mouse-first interactions, Creature Lab, inherited animal/botanical genetics and save continuity remain integrated. See [the current implementation report](docs/GenVo-Feeding-Performance-Review.md) and [the full development goal status](docs/GenVo-Development-Goal-Status.md).

Run the game from the repository root:

```sh
python -m http.server 8000
```

Open http://localhost:8000/ . The optional Creature Lab is at http://localhost:8000/tools/creature-lab/index.html . E performs the displayed contextual interaction, Q cycles choices, Shift+E drinks, Space attacks, and J braces.

The `src/` tree is canonical runtime source. `assets/` contains runtime artwork/audio; `Original (human) arts/` preserves original artwork. `tools/`, `tests/`, `design/` and `docs/` retain authoring tools, checks, plans and real runtime evidence. Exact older source under the two named `reports/*-before/` directories is only a comparison fixture for paired tests; it is not another development branch. Local exported builds and private tool settings are ignored.

Focused verification (Node.js required):

```sh
node tests/feeding-performance.mjs
node tests/targeted-feeding.mjs
node tests/seed-observations.mjs
node tests/save-persistence.mjs
node tests/consolidation-demand-parity.mjs
```

Browser capture tools expect the configured Playwright dependency runtime. Development checkpoints do not establish creator visual approval, unfamiliar-player comprehension or full ecological balance. Physical mass/swimming changes remain proposals awaiting creator review.

## Historical development checkpoints

The entries below preserve earlier milestone reports; their version numbers and remaining-work statements describe those earlier checkpoints.

**Current checkpoint — Clonal Flora Inheritance:** Creator-approved clonal propagules inherit and mutate reproductive allocation; adults stay unchanged, rare seed/cargo genotypes remain separate, and feeding reflects actual tissue allocation. Native controlled workflows, natural occurrence, exact prior-save migration and measured resource/cohort probes are documented in `docs/GenVo-Clonal-Flora-Inheritance-Review.md`. Sexual reproduction and ecological balance remain open. Next: inherited protective tissues and anatomy-specific feeding consequences.

**Current checkpoint — Organic Food-Web Resource Cycle:** Substrate-funded fungi, finite aquatic producer growth, retained trophic waste, lossless material returns/overflow and partial shelter storage now share existing authorities. Native controlled workflows, separate natural observation and three-seed resource reconciliation are documented in `docs/GenVo-Organic-Resource-Cycle-Review.md`. Whole-organism nutrient accounting and final visual approval remain open. Next: botanical reproductive genetics and one inherited adaptive feedback loop.

**Current checkpoint — Producer Resource Contract:** Land growth now funds finite water/mineral/chemical-energy inputs, shares scarce soil resources fairly, recycles plant/seed litter and persists accountable transfers. Actual nutrient-limited inspection and separate natural resource observation are documented in `docs/GenVo-Producer-Resource-Contract-Review.md`. Prototype units remain unbalanced; whole-ecosystem accounting, plant reproduction and vertical locomotion remain open.

**Current substantive development checkpoint — Flora Tissue and Propagule Bridge:** Existing crop biomass now supports anatomy-specific flesh versus kernel feeding, viable-seed transport versus destruction, paid dispersal and genotype-preserving establishment. Real native 800×600 workflows and separate unstaged observation are documented in `docs/GenVo-Flora-Tissue-Bridge-Review.md`. Founder genotypes remain fixed; environmental growth accounting and plant evolution are next.

**Current substantive development checkpoint — Hybrid Lineages (provisional model):** Dedicated inherited reproductive loci now connect shared mate validity to actual cross-founding conception, recombined offspring, frozen parental inheritance, distinct acceptance/fertility feedback, physical-build editing and save migration. Sixteen gameplay modules changed. Numerical balance remains provisional; the neutral probe exposed within-population fertility decline needing calibration. Native controlled and separate natural evidence, including four prior-source suite failures, are recorded in `docs/GenVo-Hybrid-Lineages-Review.md`.

**Current substantive development checkpoint — World Trails:** Real movement and meals now leave temporary, anatomy-readable world evidence. Mouse Read marks investigates it; tracking organs can Follow trail through existing movement controls, and compatible feeding evidence teaches an existing food patch without granting a meal or mutation reward. Controlled 800×600 workflows, native animation and separate unstaged observation are recorded in `docs/GenVo-World-Trails-Review.md`. Creator visual approval, human comprehension and long-term ecology remain open.

**Current substantive development checkpoint — Embodied Encounters:** Live funded future-beat courtship choices now extend the existing performance controller; all five body-enabled displays have distinct shared-anatomy choreography, performers plant within their valid range, and actual encounter outcomes/combat injuries have stronger physical responses. Native controlled browser workflows and separate normal-speed natural observation are recorded in `docs/GenVo-Embodied-Encounters-Review.md`. This is a development checkpoint, not creator visual approval, human playtest success or full ecological verification.

**Current modular anatomy development pass (v1.76):** Added a native `head-base` part with head-owned facial sockets, shared head pose/rendering, organ-preserving editor and Lab placement, compatible legacy defaults and optional headless bodies. Registry coverage is now 79 native assets. Head-specific checks and browser review passed; two unrelated existing test failures remain documented in `docs/GenVo-Modular-Head-v176.md`.

**Current creature-art development pass (v1.75):** Re-authored 35 modular native anatomy assets with organic tissue, tapered limbs, skin-framed eyes and rooted tails; continuous support/swing motion and inherited RGB pigments now share one anatomy renderer. Field Guide portraits and current exports use actual observed/runtime body plans. Fixed biological species rules remain unfinished. See `docs/GenVo-Organic-Creatures-v175-Review.md` for inspected gameplay, tests and remaining visual gaps.

**Current working development checkpoint (v1.71.0):** Nine torso and eight limb parts received a 32×32 clustered-art quality revision. The biological registry still has 78 native assets; revised art and assembled Chromium screenshots are development review evidence, not creator approval. See `docs/GenVo-v1.71-Creature-Forms-Art-Revision.md`.

## v1.70.0 — All registered anatomy now has editable native 32×32 art (development)

**78/78 native candidate art packs** with 8 facings × 2 idle frames; the last 17 specialized organs and attachments are now integrated through the existing indexed renderer. Corrected Creature Lab's loss of hidden RGB from transparent pixels during native edit/preview, with a genuine WebCrypto-equivalent fallback digest when crypto.subtle is absent. Browser review verified 17 assembled anatomical combinations and actual gameplay; artwork is **not visually approved** and ordinary moving creatures still need silhouette and motion refinement. See `docs/ART-REVIEW-v1.70.0.md`.

## v1.69.0 — Readable creature assembly and flank/spur artwork (development)

**61/78** registered biological parts have native editable 32×32 art (13 new flank/spur candidate packs). Their 976 directional/frame images compile with exact RGBA identity. Native claws, barbs and similar protrusions now mount at the appropriate knee, shin or foot, while tails and flank/dorsal parts use authored torso sockets when present. Anatomical limb depth and head occlusion have been clarified without changing biology, genetics, movement physics or the existing sprite registry. **Pending creator visual approval; 17 procedural fallbacks remain.** See `docs/ART-REVIEW-v1.69.0.md`.

## v1.68.0 — Inherited native pigments and tail/dorsal art (development)

**48/78** modular biological parts now have 32×32 native review-candidate art. Added nine tails and eight dorsal structures with 8 facings × 2 frames, linked inherited body pigmentation to existing indexed artwork while protecting accent colors, and corrected anatomical native mounts so tails, fins and crests do not draw at the face. **No genetic or ecological rules changed.** Artwork awaits creator approval and 30 parts remain procedural. See `docs/ART-REVIEW-v1.68.0.md` for tests and known limitations.

## v1.67.0 — Native torso silhouettes and jointed limb artwork (development)

**31 of 78 parts** now have installed 32×32 review-candidate artwork (14 eyes/mouths, 9 torso forms, 8 articulated limb types). New limbs follow the existing hip, knee and foot pose with two independently drawn bone sections; no new genetics, biology or animation controller was introduced. Creature Lab edits/presents torsos and limbs in real assembled creatures and displays the two-section guides. **All art is pending creator visual review**, with 47 procedural fallbacks and inherited pigmentation integration still outstanding. See `docs/ART-REVIEW-v1.67.0.md` for precise scope, tests, limitations and publication workflow. The original human-authored Pix2D/GIF files were not modified.

## v1.66.0 — Native creature art and editor workflow (development)

**14 of the 78 registered anatomy parts now load source-preserving, indexed native 32×32 art into actual gameplay:** seven eyes and seven feeding structures, each with 8 facings × 2 frames. The original human reference files remain intact; this wave contains AI-assisted draft art pending creator visual review. `assets/art/catalog.json` plus `src/render/runtime-part-art.js` is the single installed pixel source alongside the existing procedural fallback. The art does **not** alter inherited biological abilities, mating or species identity.

The developer-only `tools/creature-lab/index.html` now provides searchable native art, facing/frame editing, temporary assembled preview and portable JSON export. After review, use `node tools/install-native-art-draft.mjs <draft.json> <registered-id> <facing>` and `node tests/native-part-catalog.mjs` to apply a draft into the build. See `docs/ART-REVIEW-v1.66.0.md` for limitations: the other 64 parts (including every torso/limb) are still procedural; joint/rig art, inherited runtime palettes and full visual acceptance are outstanding. This is not a final art pass or creator approval.

## v1.65.0 — GenVo main menu overhaul (development)

The former tutorial-heavy title is replaced with authored, visually restrained navigation over the frozen real world. New world creation, world browser with independent save keys, Escape/P pause, audio settings, credits, and Save & Return are available. First lessons occur via existing in-game goal prompts. See `docs/GenVo-Menu-Redesign-v1.65.0.md` for scope, limitations and verification. The latest checkpoint is a **development build**, not a visual signoff.

# GenVo — current development title (formerly GenVo8)

**Renamed on October 12, 2026.** Game title: **GenVo**. Old save storage keys,
seed defaults, asset IDs and schema identifiers stay unchanged for compatibility.
The Rule of 8 is the design heritage, not a gameplay limit. New evolutionary
branches receive one stable generated name derived from ancestral lineage,
observed anatomy, and cohort habits; names do not affect gameplay rules.
Historical reports and provenance retain their original recorded project title.

## Current development checkpoint — Phenotype-directed ecology (v1.63.0)

**Correction of the creator-rejected hardcoded-species approach.** Named wildlife templates remain in old saves and founding-population initialization, but the live creature's mounted mouth now governs plant diets, scavenging and ability to hunt, including actual bites and meal energy. Behavioral ambient roles, reproduction carrying pressure, migration, family forage summaries, known-food retention and threat recognition have been migrated onto the functional ecology model. Aquatic feeding already uses functional gills, legs and mouths. A seed carrier that inherits a predatory jaw can become a hunter without changing its ancestral identifier; losing that jaw removes hunting ability. No separate species-only resource pool or reproductive controller was added.

**Not full speciation.** The names/IDs still act as starting lineage tags and in some existing mating, life-history, render, social and encounter code. Wild lineages do not yet receive independently emerging species IDs through reproductive isolation. Remaining work is tracked in `docs/GENVO8_v1.63_FUNCTIONAL_ECOLOGY.md`. This is a development-only checkpoint pending creator playtest approval. The untouched v1.62.0 baseline was independently confirmed to fail `birth-hydration` and `birth-reserves` at breeding-habitat fixture setup. Focused v1.63 tests and real Chromium source/web parity were checked; no universal species survival outcome is guaranteed.

## Current development checkpoint — Seed carriers and shoreline hunters (v1.62.0)

Added **Podshell**, a guarded seed-pod grazer with a functional inherited `kernel-beak` and `thorn-carapace`, and **Bankjaw**, an amphibious shoreline hunter of small aquatic and bank wildlife. Podshells transfer finite consumed seed pods through the existing gut-cargo, seed-bank and germination pipelines; a lost beak or carapace changes feeding/defense. Bankjaws use real webbed legs, an ordinary gape mouth and the shared predation/underwater-food authorities. Original reproductive selection, inheritance and save systems remain canonical. Two new parts have procedural 32px-oriented art and a documented gain/cost. Existing creature audio cues are reused pending dedicated sound design.

This **development checkpoint is not creator-accepted**. Focused mechanical integration, existing save compatibility, browser export, source graph and renderer capture were checked; see `docs/GENVO8_v1.62_CHECKPOINT.md`. The known inherited `birth-hydration` regression has not been changed.

## Current development checkpoint — Wetland ecological niches (v1.61.1)

GenVo8 now has two additional wild organisms, **Rillsifter** (river-dwelling filter feeder) and **Mirelick** (wetland-edge scavenger). Rillsifter starts with functional gills, webbed legs, a fin and a new sieve mouth that harvests finite river larvae/detritus. Mirelick starts as a terrestrial scavenger with an inherited sucker mouth and scent/tracking anatomy. Their distinct body plans, behaviors, ecological guilds, sounds, field-guide entries and food-web relations all run through the original wildlife, body-part, freshwater and reproductive authorities. The two new parts, `silt-fin` and `reed-sieve-mouth`, are inherited and have modeled habitat-specific advantages and costs. New aquatic founders start in existing water cells and wetland scavengers on land. See `docs/WETLAND_NICHE_EXPANSION.md`.

**Development checkpoint only.** Actual Chromium capture and focused functional tests passed; this is not stable-release approval or a guarantee that populations persist in any seed. One inherited `birth-hydration` test still fails at its mating setup. The pre-existing stable release provenance manifest has not been promoted.

### Earlier development checkpoint notes (preserved history)

## Current development checkpoint — Dual reproductive specialization

GenVo8 now includes a mountable live-bearing `live-womb` organ alongside the existing egg-laying `egg-chamber`. Creatures with both can use the existing live or egg lifecycle by selecting a mode at conception, with 12 combined mutation points, two physical attachment slots, extra metabolism and one-time breeding costs. The gestating player can cycle adaptive / live / egg via `V` in the mate panel. The choice cannot rewrite an existing pregnancy. See `docs/DUAL_MODE_REPRODUCTIVE_EVOLUTION.md`. **Development checkpoint only**, not a stable release or a mandated ecological outcome.

### Previous checkpoint notes (preserved history)

## Earlier development feature: paid nesting, care and egg predation

The egg-laying body-part system now supports optional nest construction using finite vegetation and maternal energy, conditional parent care, stronger care from the existing `brood-pouch`, and real egg predation by hungry wild hunters. Eggs remain physically persistent and can hatch without their parents. This is a **development** slice, not a stable release or proof of population balance. Egg transport, specialized nesting parts and authored egg animations remain unfinished; dual-mode reproduction was added in the current checkpoint. See `docs/EGG_NEST_CARE_AND_PREDATION.md`.

## Development checkpoint — modular reproductive anatomy: egg lifecycle

Mounted `egg-chamber` anatomy now selects egg laying at conception. The real egg entities carry finite parental reserves, persist through saving, incubate in the actual terrain, and hatch through the canonical newborn path. Legacy builds without the part remain live-bearing. A distinct live-birth organ and expensive dual-mode reproduction are **not** yet available. See `docs/MODULAR_REPRODUCTIVE_ANATOMY.md`. This is a focused development checkpoint, not a stable public release.

## Current development checkpoint — physical breeding and editor gating

Matching parent body plans (mounted parts and sockets, not learned behavior) now unlock the reproductive editor. A biologically compatible pair with different builds instead contributes socket-mounted part groups to real offspring, without a wholesale editor override. Repeated selective pairing can stabilize a new build, but no seed or number of generations guarantees convergence. Egg laying, live birth as anatomy, and dual-mode breeding are **design-only** and not yet implemented. See `docs/PHYSICAL_BREEDING_AND_REPRODUCTIVE_ANATOMY.md`. This is a development checkpoint, not a stable release.

## Current development checkpoint — evolving courtship rituals

Courtship abilities now come from functional body parts rather than a universal display. Creatures can discover and observe learned action sequences; recipients have inherited action-specific tastes, and excellent ritual matches especially matter when competing for a mate. No ritual is mandatory, and less-preferred sequences can sometimes succeed without any guarantee of consent. The mate panel lets players queue up to three available moves (1–5, Backspace to clear, C to court). See `docs/EVOLVING_COURTSHIP_RITUALS.md`. This is a focused development feature, not a stable release.

## Current development checkpoint — Costed courtship and local mate competition

Wild and player-lineage suitors can perform finite, energy-costing displays in real proximity to a mate. Visible signals reuse canonical creature art and inherited anatomy. Local rivals are judged through the receiver's own inherited preferences, without fixed dominance roles or guaranteed pairing; pregnancy is still owned by the original simulation. See `docs/HERITABLE_MATE_CHOICE.md` and `reports/FEATURE-COSTED-COURTSHIP-AND-COMPETITION.md`. Stable release approval remains pending.

## Heritable mate choice — first evolution-expansion slice (development only)

Both wild and player-lineage creatures now carry individually inherited preferences for size, strength, ornament, display and temperament. Real mutual acceptance is required at mating; current survival state remains a separate gate. The mate inspector provides basic preference and pairing feedback. Genotypes survive birth, gestation, lineage history and old-save restoration. No new sprites or competing controllers were introduced, and no fixed-seed population result is required. This is an initial vertical slice, **not** complete mating competition or a stable-release promotion. See `docs/HERITABLE_MATE_CHOICE.md` and `reports/PASS-MATE-CHOICE-SLICE.md`.

## Pass ET -- Natural water access and family retention (development checkpoint)

New passive, saved regional water-access observations distinguish adult engineer hydration from actual water routes, completed drinking, and location relative to an active breeding site. Two 130-day seeded worlds logged 9,684 adult observation-days: 7,505 below courtship hydration, 6,335 more than three bank-steps from water, and 713 completed water-uptake actions. Of 1,807 site-active observations, 972 were outside the remembered site's region. All 21 selected focused tests, both original 130-day natural regional acceptance tests, and the inherited 168-day engineering-recovery test passed unchanged. This pass adds **no** drinking, mating, birth, movement, ecology-stock, or RNG behavior changes. Stable-release promotion and full long-term colony acceptance remain pending. See `reports/PASS-ET-NATURAL-WATER-ACCESS-AND-FAMILY-RETENTION.md`.

## Pass ER — Physiological recovery foraging (development checkpoint)

Injured wild animals carrying **functional digging forelimbs** now consider usable roots before exhausting their food reserves. Nearby edible plants, urgent thirst, danger, true soil restrictions, inherited anatomy, and the six-day root cooldown retain priority. Healthy wildlife and player-controlled creatures retain their previous rules. The formerly failing 168-day ecological-engineering interruption test now passes with 53 post-interruption digs, versus 10 in the same EQ baseline. Both natural 130-day regional succession tests also pass; **no sustainable multigenerational breeding colony has yet been demonstrated**. See `reports/PASS-ER-ENGINEER-PHYSIOLOGICAL-RECOVERY.md`. The stable-release manifest remains unchanged.

## Pass EQ — Local courtship receptivity (development only)

Wild Diggers no longer repeatedly attempt physical mating with a nearby, presently unreceptive partner. Close-range selection can choose a compatible, receptive alternative; the original distant search, real mate decision, finite resources, natural mortality and gestation remain intact. The same 70-day seed reduced repeated failed mating contacts from 2,286 to 4, but this is **not evidence of colony sustainability**. Both 130-day regional ecology checks pass, while natural breeding-colony assays still report no established colonies. An inherited 168-day engineering-resumption regression fails even in the untouched EP baseline, and remains an explicit open issue. See `reports/PASS-EQ-LOCAL-COURTSHIP-RECEPTIVITY.md`. The stable-release manifest is unchanged.

## Pass EP — Reciprocal partner encounters (development only)

Anatomy-qualified autonomous Digger colonies can respond individually to an approaching nearby suitor when their own reproductive drive, health, resources and kinship permit it. A real mating rechecks readiness on arrival, rather than trusting an old pursuit target. No artificial pairings, offspring, resource grants, sex-role assignments or universal success increases were introduced. The approved inherited mate-preference genotype remains future work. Natural colony sustainability is still unproven; see `reports/PASS-EP-RECIPROCAL-PARTNER-ENCOUNTERS.md`. This is not a stable-release promotion.

## Pass EO -- Temporary breeding-site attachment (development only)

After actual autonomous mating, anatomy-capable colony wildlife now remembers a temporary, resource-dependent breeding location; both partners can return without altering fertility or spawning animals. Hunger, thirst, threat and migration still take priority; the site expires or is abandoned if unsuitable. All 19 selected focused scripts and both natural 130-day assays passed, but neither assay produced an established multigenerational engineering colony. See `reports/PASS-EO-BREEDING-SITE-ATTACHMENT.md`. Stable-release manifest intentionally unchanged.

# GenVo8 — canonical development source (stable baseline v1.60.2)

**START HERE (2026-10-12):** [Current status and priorities](docs/PROJECT_STATUS_AND_PRIORITY.md) · [Emergent evolution / testing policy](docs/EMERGENT_EVOLUTION_AND_TEST_POLICY.md) · [Canonical source and art authorities](docs/CANONICAL_SOURCE_AND_ART.md) · [Test classification](docs/TEST_INVENTORY_AND_POLICY.md).

The lengthy historical section below is retained as a chronological record, **not** a statement that every feature described is complete or every past seeded assertion is a universal balance target. The stable-release manifest is older than the current development source. Only the linked current documentation governs new expansion and test acceptance.


GenVo8 is a browser-first 16×16 lineage/ecosystem simulator. The Rule of 8 is a design language, not a content ceiling.

The Rule of 8 is a minimum design standard. Generation 8 establishes the introductory lineage milestone; living descendants remain playable afterward. The long-term direction is one persistent world of surface, aquatic and sparse underground habitats, with regional seasonal ecology and anatomy-dependent survival strategies. See [the long-term ecology design](docs/LONG_TERM_ECOLOGY_DESIGN.md) for the implementation sequence and acceptance gates. These are planned systems, not a claim that the expansion is already complete.


## Autonomous soil engineering — Pass EJ (development checkpoint, not a release)

Normal wild Diggers now forage for roots when hungry and edible plants are sufficiently distant; the ability requires actual digging forelimbs, so evolving offspring and other equipped creatures can do the same. Their successful digging makes persistent, recoverable soil patches. With real seeds and suitable habitat, disturbed soil modestly improves Thistlepod establishment even when seeds arrive in very small quantities. Paired 90-day natural-world tests verified 77 and 116 digs, and a small causal plant difference across generations; **no population improvement or long-term ecological balance is claimed**. See `reports/PASS-EJ-AUTONOMOUS-SOIL-ENGINEERING.md`. The canonical stable version and release manifest are unchanged.

## Narrow-screen editor and turn reset (v1.60.2)

- **Tablets (761 to 1100 px wide):** the parts tray no longer covers the creature, so tapping a socket attaches the part.
- **Phones:** the creature stays pinned at the top while you scroll the parts, so you can drag a part onto it even on a 360x640 screen.
- **Buttons:** quick taps no longer select button text.
- **New or loaded worlds:** creatures start at their own facing instead of finishing a turn left over from the previous world.

## Editor pass (v1.60.0)

- **The points counter shows the real balance:** it goes negative when a design is over budget (for example -2, "points over").
- **Points spent:** the What changes card lists each change in the order you made it, with its cost. Changes that pushed the design over budget are marked in red.
- **Larger preview you can zoom:** the stage is bigger, and the - and + buttons or the mouse wheel zoom from 60% to 175%, centred on the creature.
- **What changes lists every new part (v1.60.1):** older parts such as the armor plate and tearing jaw now appear there too.
- **Part tiles use each part's own art:** every part (63 of them) has a standalone drawing, so the tiles no longer cut parts out of a reference creature.

## Animation pass (v1.59.0)

- **Smoother wild creatures:** they animate between whole poses while moving (32 poses a stride instead of 8), so their bodies no longer jump from pose to pose.
- **Each leg type moves its own way:**
  - Runner legs take long, low strides on slender limbs with long toes.
  - Sturdy legs take short, heavy steps on thick legs with broad feet.
  - Spring legs fold at a raised hock and lift high.
  - Webbed legs end in paddles, and padded legs in soft pads.
- **Legs and the body overlap properly:** legs on the near side of the body overlap it, and legs on the far side are hidden behind it.
- **Turning eases:** creatures turn through the in-between facings (one every 70 ms) instead of snapping.
- **Editor preview:** the walk preview moves as smoothly as the game.

## Compressed audio (v1.58.0)

- **Same sound, smaller download:** the approved audio is unchanged, now compressed.
  - The game loads each sound as Ogg Opus, falling back to AAC (.m4a) in browsers without Opus.
  - The game's audio went from 4.1 MB to 1.4 MB, both formats together.
- **Seamless loops:** loops record their exact length, so they stay seamless in either format.
- **WAV masters:** they live in `assets/audio-source` (toolkit only). `tools/generate_audio_assets.py` writes the masters and encodes the compressed copies with ffmpeg.

## Creatures draw fast on graphics cards (v1.57.3)

- **Creature drawing on GPUs:** it was the remaining slowdown on machines that draw with the graphics card (35 ms a frame on the creator's machine).
  - Creatures are now composed on CPU canvases.
  - Each finished look is kept as a GPU-ready image (ImageBitmap), so drawing a creature never makes the graphics card stop and catch up.
- **Measured:** with GPU drawing emulated, creature time per frame fell from about 34 ms to about 2.6 ms. Without it, 1920x1080 runs at about 59 FPS.

## Smoother in wide windows (v1.57.2)

- **Terrain repaints:** the whole visible terrain is repainted at most every 20 seconds or when the season turns. It used to repaint every in-game day, which is only a few seconds of play. Plants next to your creature are still drawn live, so nearby food is always current.
- **Sprite storage:** cached creature sprites now live in a few large canvases instead of hundreds of small ones.
- **Frame counter:** the counter (backquote key, left of 1) adds a second line showing the milliseconds per frame each part takes (terrain builds, tiles, creatures, plant fringes and so on).
- **Performance mode:** if frames stay below 40 per second for three seconds, it turns on by itself and skips the decorative foreground and weather layers. Shift+backquote switches it by hand.

## The editor cannot be skipped (v1.57.1)

- **AUTO mode:** when your creature mates on its own in AUTO mode, the game pauses and the creature editor opens, exactly as when you steer. A test covers this.
- **Escape:** it no longer closes the editor. It only puts down the part you are holding. To leave without changes, use "Keep the old body".

## The editor from the first litter, real bodies everywhere, faster on big screens (v1.57.0)

- **The creature editor opens from your founder's first litter.** It used to wait for Generation 2, so the founder's long first life never reached it.
- **Handoff and journal portraits show your creatures' real bodies.** Their parts appear exactly as you designed them; they no longer show the old fixed body. The handoff list starts with what changed in the body, for example "new runner leg".
- **Faster on large screens:**
  - Plant fringes no longer check every creature for every tile.
  - Creatures reuse their finished sprite when a pose repeats.
  - In tests at 1920x1080, frames per second rose from about 46 to about 58; at 2560x1440, from about 26 to about 45.
- **Frame-rate counter:** press the backquote key (left of 1) to show frames per second, the slowest frame and the window size.

## Audio pass (v1.56.0)

Every sound is still generated in code (`tools/generate_audio_assets.py`), now from small synthesised instruments instead of bare sine waves:

- **Music:**
  - The lineage theme plays on a soft mallet over a kalimba arpeggio and warm pad chords, in A minor.
  - The lineage bed is slow pad chords with a distant flute.
  - The home bed is a fingerpicked string arpeggio in A major.
  - The danger loop is tremolo low strings over a heartbeat drum.
  - Each strategy has its own short instrument motif.
- **Ambience:**
  - Field: wind gusts, rustling grass, birdsong and crickets.
  - Wetland: soft rain, drips and frogs.
  - Shore: lapping water and bubbles.
- **Creatures:** voices are shaped through vocal resonances:
  - GenVo8s coo, yelp, warble and call;
  - Hoppers chirp;
  - Diggers snuffle;
  - Stalkers growl, rattle, roar and snap.
- **Eating and building:** leafy pulls, juicy pops, fibre snaps, crisp seed cracks, wet tearing and woody knocks.
- **Seamless loops:** every loop repeats without a seam, with reverb tails folded back to the start.
- **Live theme:** it now moves through keys that fit the music beds (A, D, E and a low D) instead of clashing with them in summer, and its notes have a soft struck-mallet tone.

## Performance and a leaner build (v1.55.0)

- **About a tenth less CPU per second of play.**
  - The active creature is looked up once and remembered. It used to be searched for among every animal, many times a frame.
  - Landscape composition lookups use number keys instead of building text keys.
- **Same results:** the simulation's results are unchanged; the baseline test matches exactly.
- **Smaller itch build:** the itch download no longer includes the old sprite-sheet test exports, which the game never loads. The toolkit still has them.

## Bodies own their sockets, parts own their art (v1.54.0)

- **The body decides where parts attach.** The round founder body now carries an authored place for each of its sockets in the part registry:
  - four hips;
  - a mouth;
  - two eyes;
  - a back socket;
  - two side sockets;
  - a tail socket.

  The game and the editor both place parts there, and the places turn with the body in all eight facings. Other bodies keep computed places until they are authored.
- **Each part draws itself.** A leg now draws its own thigh, knee, shin and foot from the hip the body gives it, and the mouth line belongs to the mouth part.
- **Socket dots exist only in the editor**, as glowing rings while you place a part; the game never draws them.
- **Field guide notices:** several new parts seen on one creature now give one notice (for example "spotted a stout torso, eyespot and fat tail"), with "a" and "an" used correctly.

## Drag-and-attach creature editor and readable menus (v1.53.0)

- **Creature editor:**
  - Parts sit in drawers (Body, Legs, Mouth, Eyes, Back, Sides, Tail, Knees).
  - Each part tile shows the part on its own, cut from the game's own drawing.
  - Drag a part onto a glowing socket on your creature to attach it, or click the part and then the socket.
  - Drag an attached part off the body to remove it.
  - Both sides change together unless you switch to one side.
  - Points left show as gold pips.
  - The right panel shows what changes and how the young compare, with small pixel icons.
  - On phones the editor stacks into one column.
- **Field guide:**
  - It is now a field journal with four pages: Creatures, Places, Trials and Parts.
  - Creatures and places are drawn; ones you have not found yet show as dark silhouettes.
  - Each page fits without scrolling.
- **Readable text:** no text in the game is smaller than 11 pixels; the family journal was 7 to 9 pixels.
- **Info panels:** panels that overflowed now fit the screen and scroll instead of cutting text off.

## Seasons (v1.52.0)

Each season now reads at a glance:

- **Spring:** lush green (unchanged).
- **Summer:** warmer, drier-looking ground.
- **Autumn:** red-brown shrubs and golden ground (unchanged).
- **Winter:** pale, blue-grey frosty ground, lighter plants, and a line of frost along the top of every plant. Winter plants used to turn dark and murky against dull ground.

## World art pass, ground and places (v1.51.0)

- **Calmer ground:** small seedlings no longer appear on almost every tile of open ground. They show in patches, and a seedling that is nearly grown always shows, so you can still see where plants are coming back.
- **Places get outlines:** root mounds, pod groves, still pools, hollow logs, thorn brakes, lookout rocks, nest ruins, relics and carcasses have the same dark outline as creatures and plants.

## World art pass, plants (v1.50.0)

- **Plants get outlines:** shrubs, reeds, mushrooms, seed pods and moss now have the same dark outline as creatures, so they read as objects on the ground. Seedlings and faint plant traces stay soft, so open ground stays calm.
- **Clumps, not a grid:** each plant leans towards a shared clump centre (one per 2x2 tiles), so plants gather in thickets with open ground between, instead of one plant per tile in rows.
- **No cut-off plants:** plants are drawn after the ground and may spread past their own tile without being clipped.

Plants still show where the food is: each one is drawn within about half a tile of the ground it grows on.

## Creature art redo, third pass: parts at play size (v1.49.0)

- **Back parts stand up from the back:** every back part now sits on the body's top edge and rises above it, so its shape shows in the outline. Sail fins, spine ridges, crests, quills, frills, moss, water humps and back armor are larger, with stronger colours. Back armor plates were not being drawn at all before; they are now.
- **Bolder eyes:** hunter eyes are red with a dark brow, compound eyes are larger, tracker eyes have a gold iris, and eyespots are visible dark spots.
- **Bolder mouths:** the beak is a clear orange point, the nibbler shows two front teeth, and the filter mouth has a dark rim.
- **Legs on wide bodies:** feet always reach clear of the body, so a Digger's legs show when it walks diagonally.

## Creature art redo, second pass (v1.48.0)

- **Legs that read as legs:** on every designed body, legs splay out to the sides (front legs forward-out, rear legs back-out) instead of radiating like spokes. They are a little shorter, the knee is raised, a stepping foot folds up towards the knee, and planted feet sit on the ground.
- **Three-tone bodies:** a lit back, a mid-tone flank and a shaded underside.
- **Species markings:** Stalkers have dark bands across the back, Hoppers light dapples, and Diggers a darker saddle. Special creatures keep these markings in their own colours.

## Creature art redo, first pass (v1.47.0)

Every creature (GenVo8s, Stalkers, Hoppers, Diggers and the special creatures, in the world, the editor and portraits) is still drawn in code from its body parts, now with:

- a dark one-pixel outline round the whole creature, tinted from its own colours, so it reads clearly on grass, mud and water;
- a distinct head at the front of the body, in a lighter tone, with the eyes, mouth and mouth parts on it, so you can see which way a creature faces;
- chunkier legs: a thick shaded upper leg, a lower leg and a foot pad.

Movement, animation and every part's shape are unchanged.

## Special creatures and relic parts (v1.46.0)

Four special creatures now appear in the world, one of each at a time. Each is an ordinary creature that visibly carries two relic parts no creature ever evolves. When one dies, whether you hunt it or not, it leaves a relic where it fell. Press E on the relic to unlock both parts in your editor.

| Creature | First appears | Relic parts | How to get the relic |
|---|---|---|---|
| Elder Stalker (gold) | day 20 | horn crest, tusk jaw | fight it, or find where it falls |
| Golden Hopper (gold, glowing tail) | day 28 | gliding membrane (much faster sprint), luminous tail (cheaper courtship, lures prey) | hunt it; it is faster than other Hoppers |
| Crystal Digger (pale blue) | day 36 | shell back (half damage from behind), armored hide (less damage, attackers may recoil) | hunt it; it is hard to hurt, and Stalkers sometimes get it first |
| Ghost GenVo8 (pale, see-through) | day 44 | glow eye (finds food and water much farther away), echo crest (spots threats much farther away) | it fades away after 30 days and leaves its relic |

Each arrival is announced with the direction it was last seen in. A new one of a kind can appear after the last one is gone. Their young never inherit relic parts.

## Wildlife built from your parts (v1.45.0)

Stalkers, Hoppers and Diggers are now built from the same parts you evolve, each on its own core body, and drawn by the same modular body drawer:

- **Stalker (predator):** sleek torso, four runner legs, tearing jaw, hunter eyes, whip tail, spine ridge.
- **Hopper (prey):** light torso, spring and walking legs, grazing mouth, wide-field eyes, balance tail.
- **Digger (prey):** stout torso, digging forelimbs and walking legs, nibbler mouth, eyespots, fat tail.

Each species' starting body plays exactly like the old creature. Their young inherit a parent's body and sometimes change it, using the same mutation as GenVo8s, so branches appear in the world over time: Burrowing, Sprinting, Silent, Swimming and Armored Hoppers; Heavy, Armored and Leaping Diggers; Crushing, Long and Mossy Stalkers, and more. A part works the same on any creature: armor makes a Stalker harder to bite, more legs make it faster, spines hurt whoever bites it, a venom gland poisons. Every part you see on any wild creature goes into your field guide and costs 1 MP less in your editor. The Elder Stalker visibly carries its relic parts, a horn crest and tusk jaw, and drops a relic when it dies.

## Evolving Stalkers and special creatures (v1.44.0)

- **Stalkers evolve.** Every Stalker has a body of four slots (legs, jaw, hide, eyes) with three or four variants each, every one with an advantage and a cost: sprinter, ambush or heavy legs; crushing, venom or gape jaws; armored, spined or mottled hide; keen or tracker eyes. Stalkers start alike; each newborn inherits a parent's body and sometimes changes one slot, so populations drift into named branches (Sprinter, Shade, Brute, Venom, Thorn and Keen Stalkers) that hunt differently. The field guide notes each branch you see.
- **Special creatures.** Every few weeks an Elder Stalker appears: bigger, gold-marked and tougher. When it dies, by your bite or anything else, it leaves a relic. Take it with E to unlock two relic parts that cannot evolve any other way: the horn crest and the tusk jaw. They then appear in the editor at their normal cost.

## Places, field guide and trials (v1.43.0)

There is now more to do before your first litter.

- **Places to discover.** Eight kinds of place grow out of the world's habitats, with one of each near the start: root mounds (digging forelimbs dig a big meal), pod groves (more filling food, best for beaks), still pools (drinking also feeds; filter mouths feed twice as well), hollow logs (press V to hide, no cover or camouflage needed), thorn brakes (Stalkers will not follow you in; soft bodies get scratched, armored ones pass freely), lookout rocks (reveal nearby places and every Stalker in sight; better eyes see farther), nest ruins (E gathers material for a home; graspers carry more) and carcasses that appear now and then (a big meal, better for meat-eating mouths, but they draw a Stalker).
- **Field guide (Y).** Trials, places found, species seen and the body parts you have seen on wild GenVo8s. Parts you have seen cost 1 MP less in the editor.
- **Trials.** Outrun a Stalker, eat four kinds of food, reach a lookout, discover three places, raise a pup to adulthood, spot five wild body parts. Each counts toward the bonus mutation points (up to +4 MP).

## Wave 2: tails, backs, flanks and spurs (v1.42.0)

Every socket family now has eight parts (64 parts in all), each with one ability and one cost, drawn in code at 32 pixels.

| Tails | Backs | Flanks | Spurs (per leg, up to four) |
|---|---|---|---|
| Paddle: swims better | Signal crest: family alarm | Armor plate: less damage | Barb: attackers recoil |
| Balance: faster sprint | Armor plate: less damage | Storage sac: holds water | Claw: attacks land sooner |
| Club: struck hunters may break off | Sail fin: uses less water | Venom gland: poison bites | Hook: hunts land more often |
| Spined: less damage from behind | Spine ridge: stronger brace | Fat pad: lasts longer without food | Dew claw: stronger brace |
| Whip: harder bites | Water hump: much less water | Gill slits: better swimming | Heel spike: less damage from behind |
| Prehensile: carries more | Display frill: courts at lower energy | Scent gland: courts at lower energy | Sensory bristle: spots threats farther |
| Fat: lasts longer without food | Moss back: hides in thinner cover | Spine cluster: struck hunters may break off | Grip pad: faster on land |
| Flag: courts at lower energy | Sensory quills: spots threats farther | Brood pouch: carries more | Kick: harder bites |

Each also has a cost (more food, slower sprint, less carried, easier to spot, and so on); the editor lists both. Wild and family bodies can evolve these parts too.

## 32-pixel world (v1.41.0)

The ground and water now match the creatures at 32 pixels per tile.

- **Smooth rivers.** Shorelines are traced at 32 points per tile edge, and the water is shaded per pixel by how deep it lies, so the shallow band follows the bank instead of stepping tile by tile. River colour drifts smoothly between pools, bends and narrows.
- **Natural banks.** The damp bank foot and the undercut follow the shoreline, replacing straight bands along tile edges.
- **Living ground.** Fine single-pixel grain on open ground, habitat edges at double resolution, and plants and seedlings set off-centre in each tile so they no longer line up in rows.
- Terrain chunks cost a little more to build (about 4.9 ms against 3.2 ms per 4x4 chunk); the frame rate holds.

## 32-pixel creatures and a wider view (v1.40.0)

Creatures and plants are now drawn as 32-pixel art: positions and lines sit on a grid twice as fine, bodies have smooth one-pixel outlines, and feelers are single pixels. The view is wider: one tile is 32 screen pixels instead of 48, so you see about 40 by 22 tiles at 1280x720 and each creature art pixel is exactly one screen pixel. Creatures are about two-thirds of their old size on screen, with twice the detail. The ground still uses the 16-pixel tile art, shown at two screen pixels per art pixel.

## A new start and eight of every part (v1.39.0)

**Every GenVo8 now starts small.** The founder, its mate and every wild GenVo8 begin with a small body, four legs, a grazing mouth and two simple eyes. The old eight-legged body is now a mid-developed creature you evolve toward. Saves start fresh: saves from earlier versions are not carried over.

- **Bodies grow.** The small body has four leg slots. A soft body has eight; light, sleek, stout, reinforced, barrel, dome and long bodies follow, each with its own shape and slots. Barrel bodies have ten leg slots and four eyes; long bodies have twelve leg slots, four eyes, three flank slots a side and two back slots. Bigger bodies cost more mutation points and more food.
- **Legs set speed.** Four legs move at the original speed; each extra leg is faster (eight legs about 12% faster, twelve about 17%), and every part adds food upkeep.
- **Eight of each core part.** Bodies, legs (walking, spring, grasper, digging, runner, sturdy, webbed, padded), mouths (grazing, tearing, crushing, beak, filter, nibbler, sucker, gape) and eyes (simple, wide-field, hunter, stalk, compound, tracker, display, eyespot), each with one ability and one cost, drawn in code in the GenVo8 style.
- **Bodies evolve on their own.** Each newborn inherits a parent's body, sometimes with one small change its lineage can reach, so wild and family bodies drift and survival selects among them. Traits a newborn gets from heredity or pressure (a Heavy Jaw, Spring Tendons, Hardened Mantle) show as the matching part. A design you commit in the editor still shapes its own litter.
- The editor shows only the sites a body has, adds Middle legs and Back eyes for big bodies, and measures leg count and land speed.

## Evolution Expansion, Phase D: bodies decide what you can do (v1.38.0)

All 18 parts in the creature editor now work. The six parts that were locked each give one ability and carry one cost:

| Part | Ability | Cost |
|---|---|---|
| Digging forelimb | E digs roots on open ground (food in lean times); hiding needs less plant cover | Sprint a little slower |
| Claw | Attacks land sooner | Hits a little weaker, carries less |
| Venom gland | Bites poison: the target slows, loses health for a few seconds and breaks off. 3 doses a day | A little more food |
| Wide-field eye | Threats are marked farther away; a braced attack from behind is met like one from the side | A little more food and water |
| Reinforced torso | Less damage from any attacker | Slower sprint, more food |
| Paddle tail | Faster, cheaper swimming for a body that can already swim (it never grants swimming) | Slightly slower on land |

- **No part, no action.** Without digging forelimbs, E does not dig; without a venom gland, bites do not poison.
- **Everyone follows the same rules.** Family members and wild creatures with these parts use them too: a hungry digger with no plants nearby digs, a venomous biter poisons, a reinforced body takes less damage, wide eyes notice threats farther away.
- **Three bodies, one danger.** In the same lean-ground Stalker charge, checked in the real browser: a spring-legged runner sprints out of it untouched; an armored digger braces, takes less damage than a plain body, then digs roots for food; a venom-and-wide-eye body bites once and the poisoned Stalker breaks off.
- The editor lists each part's ability and cost, the torso can be swapped for a reinforced one, and the measured table adds attack wind-up and threat range. Creatures without designed bodies are unchanged.

## Evolution Expansion, Phase C: the creature editor (v1.37.0)

From Generation 2, when your active creature mates and a litter is on the way, the game pauses and the creature editor opens. You design the body the coming litter will be born with, starting from your creature's own body. Living creatures are never changed.

- **Spend the mutation budget.** Each edit costs mutation points: 8 MP per design plus up to 4 earned since the last handoff (raising young, surviving Stalkers, hunting, a first home, teaching, hard conditions). Adding a part costs its listed price, and removing or moving one costs 1. Committing spends the earned bonus. Cancelling (Esc) spends nothing, and the litter inherits normally.
- **Choose a body site, then a part.** Torso, front, side and rear legs, leg spurs, mouth, eyes, flanks, back and tail. Symmetry (M) applies a choice to both sides or to the whole leg group. Undo (Z), Redo (Y), Revert, Rotate (R), Test (T) to watch it walk, Compare to parent (C) and Commit (Enter) are all buttons too.
- **See what changes before you commit.** The inspector lists each ability gained or lost with its trade-off, and measured numbers for the litter against the parent: sprint, bite strength, damage taken, water use, food value, pounce reach and whether it crosses water.
- **Parts that already have an ability work at birth.** Spring legs give Spring Tendons, a tearing jaw gives Heavy Jaw, armor plates give Hardened Mantle, and so on. Removing a part removes its ability. The six parts with no ability yet (digging forelimb, claw, venom gland, wide-field eye, reinforced torso, paddle tail) are shown locked and marked "arrives with Phase D".
- **Ancestry matters.** Some parts need an earlier one in the lineage, for example a crushing jaw needs a tearing jaw first. The design is remembered, so the next generation's editor starts from the shaped body.
- The editor works with a mouse, the keyboard or touch, at desktop and phone widths, with large hit targets.

## Evolution Expansion, Phase B: visible assembly (v1.36.0)

Bodies are now drawn from their parts. Each of the 18 starter parts has its own pixel component, drawn in code in the GenVo8 style at the 16x16 look, with no outside art. A creature's body plan is assembled into legs, spurs, mouth, eyes, flanks, back and tail, and the sprite draws each part on its socket in all eight facings, walking or attacking.

- **Existing creatures look the same.** Parts that already existed reuse their exact pixels. Checked by recording every pixel drawn for all 113 frozen v1.33.7 creatures in 8 facings and 8 frames, still and walking: identical, except that Spring Tendons legs now show a heel tendon.
- **New parts are visible:** a brown spade on digging forelimbs, hooked claws, a green venom sac, a wide outer eye, a ridge of dark scutes on a reinforced torso, and a paddle tail. They only appear on bodies built from a plan, which the coming editor will make. Drawing a part never grants its ability: a drawn paddle tail does not swim.
- **Performance holds:** 560 animals stay at a 16.7 ms median and 95th-percentile frame at 1x to 4x.
- Known gap: the paddle tail and jaws are still subtle at normal zoom.

## Evolution Expansion, Phase A: contract foundation (v1.35.0)

GenVo8 is now following the Evolution Expansion design (`GenVo8_Evolution_Expansion_GDD_v1.md`, decisions locked by the creator): guided evolution, an editor for the next generation's lineage at reproduction only, a mutation budget, and bodies built from functional parts that wildlife can evolve too. Phase A lays the foundation and **changes nothing you can see or play**.

- **Parts and bodies.** A registry of the 18 starter parts (torsos, walking and spring legs, graspers, digging forelimbs, three mouths, two eyes, armor, barbs, claws, venom gland, storage sac, signal crest, paddle tail), and a body plan: a rooted part graph with validation, saving and stable ids.
- **One resolver.** A pure phenotype resolver that, for now, takes every number from the existing anatomy, adaptations, effects, Pounce and water rules, so nothing can be counted twice.
- **No-op migration.** All 113 creatures in a frozen v1.33.7 fixture convert to valid body plans that resolve to exactly the adaptations, effects, Pounce reach, carrying and water results they had. Same-seed natural runs match v1.33.7 exactly and the 20-year ecology test passes.
- **Mutation budget.** Valued as the design's base 8 MP plus a capped earned bonus of 0 to 4 from raising young, surviving Stalkers, hunting, a first home, teaching and hard conditions. Nothing spends it yet and nothing is shown.
- The paused v1.34.0 "Shape and spring" work was salvaged: its ledger feeds the capped bonus, its newborn nudge and spending on living creatures are gone, and its development-drawn bodies wait for Phase B.

## AUTO builds the first home (v1.33.7)

With AUTO on, your creature now builds the family's first shelter on its own once its home range settles, exactly as pressing N would (same ground, plant material and energy conditions). A toast says so, the Home goal ticks, and the Stalker grace period ends just as it does when you build. Second homes and brood shelters are still yours to place. Watching a game now progresses past the opening.

- In headless AUTO runs the first home is built on day 4 to 6.
- The Stage A baseline was regenerated on purpose, because its natural runs use AUTO. Every single-factor number is identical. In the natural runs, deaths moved 24 to 22 and 15 to 19, and the family's forage range grew in one run (median 8.1 to 10.1 tiles) because feeding trips are now measured from a shelter. One Grasping Limbs adaptation no longer appears by day 60 in one run. Family survival and generations are unchanged.

## Readability pass 3: AUTO goals (v1.33.6)

Presentation only. Watching a fresh game in AUTO showed the opening goals giving key instructions ("press E to eat", "N builds a family shelter here") while the creature acted on its own, and the Home goal could never complete because AUTO never builds a shelter.

- **In AUTO the opening goals speak to watching.** The next step reads "your creature looks for food and water on its own", then "it courts a mate when one is close", then "it builds a family shelter on its own once this ground becomes home" (since v1.33.7).
- **Any goal that names a key** adds "take over to do this" while AUTO is on.

## Readability pass 2: habits, handoffs and who follows you (v1.33.5)

Presentation only.

- **TAB says who you switched to.** "G2 #134 · stays near home · wary of Stalkers · knows 1 place · fears 1 · 3/5" instead of only a family number. The habit line under the creature now wraps to two lines instead of being cut off.
- **Handoffs say what the new creature brings.** The reveal's opening line now ends with its habits and what it knows: "What it brings: stays near home · wary of Stalkers · knows 1 place · fears 1."
- **Who is following you.** Relatives on screen near you carry a small marker above them: a gold pip while they carry out your Family Command, a faint hollow ring while they act on their own.

## Readability pass 1: bodies, AUTO and knowledge (v1.33.4)

The first slice of the runtime and UI playtest pass. Presentation only; nothing in the simulation changes.

- **Successor cards show the body.** Each descendant's card now draws its portrait, so a smaller frame, longer legs, a Forager build or a proto-trait reads at a glance next to the written differences.
- **AUTO says what your creature is doing.** Under the creature's stage, the HUD shows "now: Foraging", "now: Seeking water", "now: Returning home" and so on, and "Steering clear of a feared place" when learned fear turns it away. Outside AUTO the habit line is shown as before.
- **The journal lists real knowledge.** "Places remembered" now says what the creature itself knows ("knows 2 water banks, 3 food patches, 1 shelter") and what it fears ("fears 1 place where a Stalker struck"). A dead creature's entry says its places died with it. This replaces the old last-glimpse lines and their broken "today ago" wording.

## Grazing scars (v1.33.3)

Overgrazing now leaves a mark. The game has long recorded how hard each patch of ground is grazed; now the most heavily worked ground (roughly the top 1% of grazed tiles) regrows more slowly, up to 40% slower, until the wear fades over a few weeks. A scar never strips plants that are already there. A family or herd that keeps feeding on one spot finds it slow to come back and does better moving on, and remembered patches there turn out thin.

- An earlier, stronger tuning scarred ordinary grazing and collapsed the Digger population in the 20-year ecology test, so it was rejected.
- With this tuning the 20-year ecology stability test passes for the first time since v1.27: slowing only the worst-worn spots spreads grazing out and Hoppers recover.
- The Stage A baseline was regenerated on purpose. Every single-factor number is identical. In the natural 60-day runs fewer animals died overall (29 to 24 in one run, 23 to 20 in another, the third unchanged), and the family's forage range moved by under 1%.

## Learned fear (v1.33.2)

The first ecological consequence. Where a Stalker attacks or kills a family creature becomes a place the family fears, held in the same knowledge as water and food.

- **Who learns it.** The creature that was attacked (if it survives) and any relative within sight. Young learn it from a caregiver who is wary near it, less surely.
- **What it does.** Family members you are not controlling keep their feeding, exploring and roaming trips out of a feared zone while the fear is strong. Food route suggestions skip feared feeding grounds. Walking your own creature back in brings it back: "Your creature remembers a Stalker taking #12 here". Thirst, escape and family defense are never overridden, and neither is your control.
- **How it ends.** Fear lasts about 24 days and fades as it goes, so an old fear stops turning the family away before it is forgotten. It dies with the creatures that hold it, with the same field note as other lost knowledge. A family can keep avoiding a place after its Stalker is gone, until the memory fades.
- Also fixed: since v1.33.0, a creature rarely recorded a shelter it used itself in live play (taught shelters were unaffected).
- No new meters. The Stage A baseline matches exactly.

## Pounce, the first evolved ability (v1.33.1)

Pounce is not an adaptation you are given. It is what a body can do once its rear-leg tendons, the body part behind Spring Tendons, are developed far enough (past 0.8). Lineages that already have Spring Tendons keep developing those legs over generations when they live under predator, scarce or dry conditions, and successor cards show "Close to: Pounce" as a body approaches it.

- **Shift+Space** toward a Hopper, Digger or Stalker in front of you, 2.5 to 3.5 tiles away (farther with more developed legs). The prompt shows "Shift+Space · Pounce Hopper" when one is in range.
- It uses the attack you already know: a still crouch, a leap that closes the gap (stopping at water or rock), the normal bite on landing, then a longer recovery. A miss leaves you exposed for longer.
- A pounce lands a harder bite on a Stalker and a better chance on prey.
- It costs 32 breath, about twice a bite. Without the body for it, the breath, or a creature in front, Shift+Space is the ordinary bite. There is no new meter.
- Only the creature you control pounces for now. Wild animals and autonomous family are unchanged, and the Stage A baseline matches exactly.

## Knowledge inheritance and loss (v1.33.0)

Places are now known by particular creatures. Each lineage creature knows the water banks it has drunk at, the shelters it has used and the food patches it has eaten from, and nothing else.

- **Teaching is imperfect.** A young beside its caregiver learns every place the caregiver uses in front of it, not only its first lesson of each kind. Its copy is less sure, can sit a little off, and a food patch comes without knowing how picked-over it was. Its own first visit replaces the copy.
- **Forgetting.** A place grows less sure when it is not revisited and is forgotten after about 16 days.
- **Loss.** What only one creature knew dies with it, and a field note says so ("Only #14 knew a Berries patch 12 tiles north · that knowledge died with it").
- **Your successor knows only what it learned.** After the founder's opening, a thirsty creature is guided only to water it knows ("Known water"). With none in sight and none remembered, it is told to search. Food route suggestions already used only the creature's own patches, and taught patches now appear there too.
- No new meters. Autonomous creatures still find water as before, wild animals are unchanged, and the Stage A baseline matches exactly. Save schema stays 8.

## Evolution consolidation Stage G: cleanup (v1.32.7)

The last consolidation stage removes what Stages D to F left behind once their results had matched twice. Forms and proto-traits no longer keep a cached copy on each creature: their strength exists only on the body, and their history (when a form appeared, where a trait came from, how long it was reinforced, gene flow) sits beside it. Every reader, from movement and senses to portraits, the inspector, lineage records and the test tools, now reads the body. Unused lifestyle evidence code from Stage F is gone, and the simulation spec now describes the consolidated model in one place.

- **Same play.** The Stage A baseline matches exactly, including the natural 60-day runs.
- **Kept on purpose.** Each creature's adaptation list stays as the cache of what its body expresses, because every ability check reads it. Each system's own effect factor stays as the input to the shared effect pipeline.
- **Saves.** Save schema 8. Older saves convert their cached forms and proto-traits into body values and history, so no creature gains or loses one.

## Opening drink goal fix (v1.32.6)

Drinking at a bank was recorded, but the first opening goal, "Fed and watered", stayed unticked until the creature had also eaten, so a drink looked as if it had not registered. The goal now shows each half as soon as it is done ("Watered · now feed" or "Fed · now drink"). A second, slower fault is fixed too: the goal looked for the first drink in the creature's recent history, which keeps only the latest 24 events, and a first drink is recorded only once, so after enough later events the goal could never tick again. Firsts are now read from the creature's permanent record. No simulation or save change.

## Terrain fix after loading a world (v1.32.5)

Loading a save or starting a new world replaces the world shown on the title screen. The renderer cleared its terrain chunks on that swap but kept several per-tile caches from the title world, most visibly the landform masks that decide where water and banks are drawn. Tiles that were land on the title screen but water in the loaded world drew as flat green land with a dark stepped bank edge, and the reverse showed phantom water. All per-tile terrain caches and the habitat field are now rebuilt for the new world. No simulation or save change.

## Evolution consolidation Stage F: lifestyles and generation goals are readings (v1.32.4)

Lifestyles (Aquatic, Nomadic, Guardian, Burrower, Hunter, Grazer) used to keep their own daily score, built from how far a taxon travelled, what it ate and how often it hunted that day. A lifestyle is now recognized from what the taxon's adults are, on average: their bodies (including the Stage E form and proto-trait axes), the adaptations those bodies express, the habits they have settled into, the pressure their population lived under and how settled they are. Once a lifestyle forms it stays, as before.

- **What forms each lifestyle.** Aquatic: webbed adults, a water-holding body and wet pressure. Nomadic: a ranging habit, long reach, Forager form and a spread-out population. Guardian: predator pressure, defensive adaptations and a habit of standing ground. Burrower: a home habit, Colony form and dens. Hunter: a settled hunting habit plus a hunting build. Grazer: Efficient Gut, Forager form and no hunting habit.
- **The day's counts still matter once a lifestyle exists.** Hunts, plant meals and water travel drive each lifestyle's play loop (take live prey, work the feeding ground), but no longer decide whether a lifestyle forms.
- **Generation goals.** The G2 trials are now goals read from real state, in any order, shown like the opening goals with a 0/2 count. Rangebreak (Forager): feed beyond the old range, and make ranging a habit. Kin Gathering (Colony): gather the family at home with Family Command, and make home a habit. The G3 population goals (found a ranging band or a satellite colony) show as the same checklist. Rewards are unchanged.
- **Strategy branch** (stealth, offense, social, utility) was already a reading of adaptations and is unchanged.
- **Saves.** Save schema stays 7. Lifestyles already formed are kept. A G2 trial in progress keeps its gathering progress; a Forager whose old trial was half done needs to feed far from home once more.
- The Stage A baseline matches exactly (lifestyles do not form within the 60-day runs).

## Evolution consolidation Stage E: forms and proto-traits are anatomy readings (v1.32.3)

Forager and Colony forms, and the eight proto-traits (Frugal Frame, Range Sense, Watch Crest, Close-Brood Frame, Dryland Skin, Splayfoot, Heat-Shed Mantle, Cold Mantle), used to be stored as their own objects with their own strength. Their strength now lives on the body, next to the Stage D body parts: a form is how far a creature has developed long reach or a compact frame, and each proto-trait has its own body axis (thrifty frame, searching senses, watch crest, close-brood frame, dry mantle, splayed feet, heat-shedding mantle, full cold mantle). The label is read from whichever axis is developed, in `lineage/readings.js`.

- **Same play.** Births write the form and trait onto the newborn's body using the same rules as before, and every effect reads the same numbers. The Stage A baseline matches exactly, including the three natural 60-day AUTO runs.
- **History stays.** Where a trait came from, how many generations reinforced it and gene flow are history, not anatomy, so they stay on the old `lineageForm` and `populationTrait` fields, which are now a cache of the body reading until the Stage G cleanup. A cache edited directly (older saves, tests, probes) is folded back into the body.
- **Saves.** Save schema 7. Every creature's form and proto-trait moves onto its body, so none gains or loses one on load.

## Evolution consolidation Stage D: adaptations are anatomy (v1.32.2)

Adaptations used to be discrete inherited objects. Now every founder-line GenVo8 carries twelve inherited body parts (mantle plating, limb barbs, mantle glands, rear-leg tendons, water-holding body, gut, tissue repair, signal crest, rally crest, skin pigment, jaw, forelimbs), each a value from 0 to 1. An adaptation is expressed when its body part crosses a threshold, and a tier 2 adaptation is the same body part developed further: Heavy Jaw at 0.5 and Crushing Jaw at 0.8, Camouflage Mantle and Adaptive Chromatophores on skin pigment, Water Sacs and Webbed Limbs on the water-holding body, and so on. The adaptation list on each animal is now a cache of what its anatomy expresses, so every ability, cost, button and label works as before.

- **Inheritance is anatomy.** A body part one parent developed past a threshold reaches about 72% of the young, and both parents carrying it reaches all of them, as in v1.31. Siblings now differ slightly in how developed each part is.
- **Pressure grows bodies over generations.** Each newborn's body part that best fits the pressures its parents lived through grows a little. A lineage that keeps living under the same pressure develops that part over several generations until the adaptation appears. The occasional sudden newborn variation from v1.31 remains.
- **Visible development.** Successor cards and family journal cards show body parts that are close to a threshold ("Close to: Hardened Mantle"), so choosing a successor or a mate can be about where a body is heading, not only what it already expresses.
- **The successor choice is kept** and reads the same anatomy.
- **Saves.** Save schema 6. Each existing adaptation becomes the body part that expresses it, so no creature gains or loses an adaptation on load.
- The Stage A baseline matched exactly, and the real-browser Stalker probe still passes.

## Evolution consolidation Stage C: one effect pipeline (v1.32.1)

Forms, proto-traits, lifestyles, habits and adaptations used to be multiplied together separately at every place they mattered, with nothing limiting how they stacked. They now meet once, in `lineage/effects.js`, under a shared limit for each effect: travel, forage range, family-guided forage range, threat sense, shelter exposure, metabolism and water use. Each system still supplies its own factor, so nothing was removed and no layer was added; the scattered multiplication chains in movement, foraging, threat sensing, metabolism and shelter now call the same functions.

- The limits were chosen so no single system loses any of its effect. The Stage A baseline confirms it: every one-factor row is unchanged, and the natural AUTO runs match exactly.
- Only stacked lineages change. The widest-ranging stack now searches 18.9 tiles instead of 28.5 and walks at 2.89 instead of 3.0 (a plain sprint is 3.33). The most vigilant stack notices threats at 10.2 tiles instead of 13.7. The most sheltered stack keeps at least 78% exposure instead of 71%.
- The real-browser Stalker probe (flee, hide, fight, brace succeed; Shift+E fails) and the 4x observer probe at 560 animals still pass with 0 console errors. Save schema stays 5.

## Evolution consolidation Stage B: one pressure vocabulary (v1.32.0)

v1.32.0 is the first consolidation stage that touches simulation state. GenVo8 used to record lived pressure twice, with different names: each creature's lifetime exposure (predation, water, scarcity, thermal, disease, bottleneck) and each population's pressure memory (scarcity, competition, predation, crowding, dryness, wetness, heat, cold). Now there is one vocabulary, owned by `lineage/pressure.js`: scarcity, competition, predation, crowding, dryness, wetness, heat, cold, disease and few mates. Population memory, proto-traits, species evidence, adaptation emergence at birth and the legacy draft all use it.

- Low water and dry ground are both **dryness**. Being blocked by water is **wetness**. Temperature strain is **heat** or **cold** by its direction. Few mates keeps its meaning.
- Adaptation pressure weights moved onto the shared ids with the same values. One deliberate change: Webbed Limbs now emerges from wetness (living against water) rather than from thirst, so a thirsty but landlocked line leans toward Water Sacs instead.
- The Stage A baseline matched exactly after the change, both the factor matrix and the natural AUTO runs.
- Save schema 5. Older saves rename their per-creature kinds on load: water to dryness, bottleneck to few mates, and old thermal exposure split evenly between heat and cold because its direction was never stored.

## Evolution consolidation Stage A: baseline (tooling, no gameplay change)

`tools/evolution-baseline.mjs` measures how today's evolution systems combine into the numbers a creature lives by: walking speed, forage range, threat sense, metabolism, water use, heat and cold strain, shelter exposure, food value, strike and damage taken. It records each gene, adaptation, form, proto-trait, lifestyle, habit and family tendency on its own, three fully stacked cases, and three natural 60-day AUTO runs, in `docs/evolution-baseline.json`. `tests/evolution-baseline.mjs` fails if any of those numbers change, so each later consolidation stage has to reproduce the baseline or regenerate it on purpose with `--write`.

What it shows today: with every range system stacked, forage range reaches about 3.2 times the neutral 9 tiles (28.5), and walking speed reaches 3.0, about the same as a neutral sprint. A fully vigilant stack notices threats at 13.7 tiles against a neutral 5. In the natural 60-day runs, forms, proto-traits and lifestyles had not yet appeared, so these systems only matter in long multi-generation play.

## Release and provenance cleanup (v1.31.1)

v1.31.1 changes no gameplay. The packaged v1.29.0, v1.30.0 and v1.31.0 ZIPs carried a `release-provenance.json` whose version field said 1.28.0, because the packaging step passed a fixed version instead of reading `CFG.version`. Their source, payload and ledger hashes were correct. Packaging now reads the version from the build, and each package is checked after zipping: the manifest version must match the build, the unzipped itch payload must match its fingerprint, and the toolkit tree must match the ledger head. Save schema stays 4.

## Succession as selection pass (v1.31.0)

v1.31.0 makes continuing the line a choice between real, different descendants instead of a pick-one-of-three upgrade at handoff.

- **Variation in actual offspring.** Founder-line young now blend both parents and differ from their siblings, with an occasional larger jump. Wild populations keep their original inheritance, so background ecology is unchanged.
- **Adaptations are inherited, not guaranteed.** An adaptation carried by one parent reaches about 72% of the young. Carried by both parents, it reaches all of them. An upgrade always keeps its foundation.
- **New adaptations appear in newborns.** When the parents lived under real pressure, some newborns are born with a new adaptation suited to it, weighted by the same pressure ranking the old draft used. Siblings can go in different directions. A field note records "Born with ..." and the handoff screen shows it.
- **The adaptation draft begins retirement.** New handoffs no longer offer a pick-one-of-three. The draft code remains behind `CFG.evolution.handoffDraft` so a choice already pending in an older save can still be made.
- **Visible body differences.** Size, limb length, feelers and hue respond more strongly to inherited genes, so relatives look different at a glance. This is presentation only.
- **Choosing a successor.** With more than one grown descendant, H opens a comparison: each card shows how the body differs from you, which adaptations it carries (and which were new at birth), what it did not inherit, its habits, and how ready it is. Pick with 1-4 or the arrows and confirm with H or Enter. With one grown descendant, H hands off directly as before.
- **Mate choice matters more.** Young blend both parents, so a faster or hardier mate shifts the litter. The mate panel now lists which adaptations your young may carry and how likely each is.
- **Saves.** Save schema 4. Adaptations already earned stay on every animal, and a draft choice pending in a schema 3 or older save is still offered.

## Habits pass (v1.30.0)

v1.30.0 makes what you do with a creature persist in how it behaves when you are not controlling it. It is built through the existing stack: cognition records habits, the family observation code passes them to young, the existing autonomous decisions read them, and the family tendency adds them up. No new progression screen or meter was added.

- **Five habits.** Every founder-line GenVo8 carries five small habit values: ranges far to feed, stays near home, wary of Stalkers, stands its ground, and hunts small prey. Ranging and staying home pull against each other, as do caution and boldness.
- **Your actions train the creature you control.** Feeding far from the family shelter builds ranging, feeding near it builds staying home. Escaping a Stalker builds caution, driving one off or bracing against it builds boldness, hiding builds caution, and biting prey builds hunting. Autonomous creatures reinforce what they already do at about a third of that rate, and every habit fades slowly if it is not used.
- **Young copy their caregivers, weakly.** Habits are not genetic. A newborn has none. Each day a dependent young that stays close to its caregiver drifts a little toward the caregiver's habits, and watching a caregiver flee or stand up to a Stalker teaches that response directly.
- **Autonomous AI reads habits.** Cautious creatures notice threats from farther away. A bold, healthy adult stands its ground and fights a nearby Stalker instead of fleeing. Ranging creatures search wider for food and roam with the Independent forager pattern, home-loving ones stay with the Colony pattern, even before the whole family has a tendency. A hungry creature with a hunting habit looks for small prey. The same reading applies to a creature you hand to AUTO or switch away from with Tab, so a relative you played acts the way you played it.
- **The teaching checklist is folded in.** The family guide no longer counts four lessons. It says what the young is picking up from you and what it still needs to see. Lesson tracking still drives independence and practice underneath, so succession readiness is unchanged.
- **Visible habits.** The HUD shows the controlled creature's strongest habit under its life stage, and every family journal card has a Habits line, kept for dead relatives too.
- **Family tendencies come from real habits.** The daily Independent forager and Colony cohesion scores now include the family's average ranging and home habits.
- **Saves.** Save schema 3 adds habits. Schema 1 and 2 saves migrate in place with no settled habits.

## Observer play pass (v1.29.0)

v1.29.0 lets a slow simulation run faster when you want to watch, without ever letting it run past something that needs you.

- **1x / 2x / 4x.** A speed button sits beside AUTO in the quick menu, and `[` and `]` step the speed down and up. Speed is a runtime choice only. It is not saved, and the simulation advances through exactly the same control steps and ecology ticks, just more of them per real second.
- **Tied to AUTO.** Choosing 2x or 4x hands the selected creature to its own AI. Moving, acting, or turning AUTO off returns to 1x with manual control. You cannot speed up while a Stalker is already hunting your creature.
- **Automatic danger slowdown.** Time drops back to 1x when a Stalker starts hunting your creature or a nearby relative, your creature is hurt or badly wounded, a family member dies, or control moves to another relative.
- **Event summary.** Every return to 1x shows a short plain-language summary of what happened while time ran faster: days passed, births, deaths and their causes, a new highest generation, and new shelters, plus why it slowed down.
- **Performance at 4x.** `tools/runtime_observer_probe.py` fills the world to the 560-animal performance target, then switches speed with real clicks. In Chromium at 1280x720, 1x, 2x and 4x all held a 16.7 ms median frame with 0 frames over 50 ms, and a staged Stalker hunt at 4x slowed the game to 1x within about 0.12 s. Headless, 4x with 560 animals costs about 45 ms of simulation per real second.

## Decisions under pressure pass (v1.28.0)

v1.28.0 makes a Stalker encounter a real decision instead of a reflex. Before this pass, engaged Stalkers moved on the slow ambient life stride, so in real time they covered about one sixth of their listed speed and simply walking away always worked, while E ran a priority list that put "fight" first. Now fleeing, hiding, fighting and bracing each win in different circumstances, and the old Shift+E habit loses.

- **Breath (exertion).** A new short-term meter under Health, Energy and Water. Sprinting, bracing and attacking spend it. Walking and standing refill it quickly, so walking stays practical. Running dry makes the creature **winded**: no sprint and no brace until breath returns, and attacks wind up slower. Walking speed and health are never reduced, so there is no fatigue collapse. Winded creatures pant visibly and the HUD says so.
- **Space attacks.** Attack is its own key with a short wind-up and a recovery. The strike resolves through the existing `Simulation.playerStrike()` and `tryKill()` authorities, so Opening bite, Counterbite and every evolved weapon keep working. Space also bites Hoppers and Diggers.
- **E no longer attacks.** E is for using the world: drink, eat, tend, check young, read Stalker signs. Pressing E next to a Stalker explains that Space attacks and J braces.
- **Hold J to brace.** Facing the attacker cuts a hit to about a third, nearly removes knockback, and staggers a charging Stalker into a longer recovery that costs it pursuit stamina. Bracing from the side or with your back turned gives little or no protection. Bracing slows movement and drains breath, and a guard that runs dry breaks and cannot be raised again for a moment, so permanent turtling does not work.
- **Real-time Stalker pursuit.** Engaged Stalkers now decide every tick and move every control step at their real speed. At 2.8 a Stalker is faster than a GenVo8 walk (2.15) and slower than a sprint (about 3.3). A committed charge runs its whole locked lane, so walking straight away is no longer a dodge; stepping out of the marked line is.
- **Stalkers tire and give up.** Each engagement has pursuit stamina. Chasing, charging, being braced against, and taking wounds all spend it. Two clean wounds in one engagement drive a Stalker off. A Stalker that runs out of stamina gives up.
- **Cover breaks sight.** A GenVo8 that is not sprinting or attacking in dense plants cannot be seen from more than about three tiles, and from less than two if it stays still. Light cover works at longer range. A Stalker that loses sight searches where it last saw you and gives up if it finds nothing. Sprinting or attacking is noisy and gives you away. Camouflage keeps its stronger, closer-range concealment.
- **Readable feedback.** The context lane and the Stalker alert explain chase, search, braced and wrong-angle hits, and winded states in plain language. The renderer shows a guard arc while bracing, a coiled wind-up and strike flash for attacks, breath puffs when winded, a searching mark over a Stalker that lost sight, and a tired Stalker panting.
- **Performance.** Engaged pursuit uses the existing local spatial query and only runs while a hunt exists or may have started. No per-frame global scans or hot-path allocation were added. Real Chromium probes at 1280x720 matched v1.27: motion median 16.7 ms, p95 16.8 ms, 0 frames over 50 ms; staged 50-creature direct render about 6.7 ms against 6.5 ms for v1.27.
- **Saves.** Save schema 2 adds breath, stance and pursuit stamina. Schema 1 saves from v1.24 to v1.27 migrate on load with full breath and fresh pursuit stamina for any hunt in progress.
- **Runtime proof.** `tools/runtime_decision_probe.py` loads the real build in Chromium and plays five staged encounters with real key presses: flee (sidestep, then walk off), hide (slip quietly into dense plants), fight (sidestep, then bite the overrun until it is driven off), brace (hold J facing a Rusher, then bite), and Shift+E, which is expected to fail. It records a video and a JSON outcome log.
- **The opening is broad goals, not chores.** The fixed six-step lesson (move, eat, drink, pair, settle, build) is now three goals shown together: stay fed and watered, find a mate, make a home. They can be done in any order. The guide suggests one next step based on what the creature needs most right now, and keys appear near the creature when they become useful instead of being taught up front. The safe start ends when all three goals are done or the first shelter is built. Saves that stopped mid-sequence resume on the new goals.

## Family agency + readable data controls pass (v1.27.0)

v1.27.0 makes the living family easier to actively play without turning GenVo8 into a party-control game. You still inhabit one creature at a time, but once the founder line has another living member you can move between relatives and then leave them to their own AI.

- **Tab switches the currently controlled family member.** Shift+Tab cycles backward. This is temporary point-of-view control only; it does not rewrite the lineage lead or count as a generational handoff. `H` remains the explicit succession action.
- **Automation is an explicit quick-menu toggle.** The selected creature can use the same autonomous survival and family behavior available to relatives. Movement or a direct world interaction immediately returns the creature to manual control.
- **Lineage succession remains safe while control is elsewhere.** If the active lineage lead dies while the player is temporarily controlling another relative, normal succession still resolves. If a temporarily controlled non-lead relative dies, control returns to the living lineage without silently changing leadership.
- **Family control is exposed when it becomes relevant.** A one-time notice explains Tab switching and automation as soon as another controllable lineage member exists. The HUD shows family position and AUTO state instead of hiding the feature behind the deeper data screens.
- **Expandable simulation rows are easier to use.** Population, Home Range, and other readable data panels now use a larger full-row click target with a clear 22 px expand/collapse control instead of requiring a precise click on a tiny marker.
- Save schema 1 remains compatible. The new family-control flags are normal runtime/UI state and do not require a save migration. The v1.18.1 smooth-play contract remains release-critical.















## Food-web feedback pass (v1.26.0)

v1.26.0 makes the new Hunter and Grazer lifestyles change the behavior of the ecosystem around them instead of acting mostly as private feeding bonuses. This pass deliberately deepens the existing branches before adding more lifestyle names.

- **Hunter becomes an ecological predator.** Hoppers and Diggers now recognize an established Hunter GenVo8 as a valid threat when the Hunter can actually eat that species. Individual prey flee, and social prey can relay the warning through their existing herd/colony alarm authority. An ancestral or non-Hunter GenVo8 does not trigger this response.
- **Grazer feeding grounds wear out.** Grazer forage selection now reads the existing plant-consumption history already used to render grazing scars and ecological recovery. Productive but repeatedly worked cells become less attractive than fresh or recovering plant patches.
- **Depleted ground causes rotation before starvation.** A Grazer adult on genuinely depleted ground can seek fresh forage before the normal deep-hunger threshold, so a large plant-specialist branch is pushed across the landscape rather than standing on one patch until it is empty.
- **Task guidance reflects the consequence.** A Grazer branch can receive a `Move to fresh grazing` goal when its current ground is depleted, with a target toward usable fresh forage. Hunter guidance now tells the player that prey recognize the branch as predators.
- Predator recognition is routed through a shared `Simulation.isPredatorTo()` query so the prey decision and social-alarm systems agree on what counts as danger. Stalker-specific territory/combat systems remain Stalker-specific.
- The new logic is deterministic and save-schema compatible. It reuses existing lifestyle state, grazing history, local spatial queries, and bounded forage sampling. The v1.18.1 responsiveness contract remains release-critical.

## Hunter and Grazer diet divergence pass (v1.25.0)

v1.25.0 expands the established species-lifestyle system with two food-web paths that emerge from how a taxon actually survives. Hunter and Grazer are not menu classes. They compete with the existing lifestyle evidence and require three sustained qualifying days from Generation 4 onward, using real feeding, hunting, inherited form, and adaptation evidence already present in the lineage.

- **Hunter** requires repeated live-prey attempts, at least one real kill, and a meaningful share of adults carrying offensive anatomy such as Heavy Jaw, Crushing Jaw, or Barbed Limbs. Once established, hungry adults can autonomously pursue edible Hoppers and Diggers even though ancestral GenVo8 is not a hunter species. Live prey gives more energy, hunting success and prey-search reach improve modestly, and plant food becomes less efficient.
- **Grazer** requires repeated plant meals, a strongly plant-biased diet, Efficient Gut representation, and inherited Forager-form representation. Grazer adults begin feeding before deep hunger, search a little farther for productive vegetation, and gain more energy from plants while carrion and live prey become worse fallbacks.
- Diet evidence is prospective and daily. Old v1.24 saves safely normalize missing diet counters to zero; the existing save schema remains compatible because the persistence layer already snapshots controller-owned Maps and taxon lifestyle records generically.
- Carrying pressure now follows the established food strategy. Hunter reproduction is limited by nearby edible prey instead of plant forage, while Grazer and ancestral GenVo8 remain tied to local plant availability. This makes diet specialization matter at population scale rather than only at the individual energy bar.
- Hunter and Grazer receive restrained renderer-owned silhouettes and markings so established diet divergence can be read in ordinary play. These presentation changes do not alter collision size or movement authority.
- The v1.18.1 smooth-play contract remains release-critical. Diet targeting is bounded and deterministic, adds no new high-frequency world scan, and consumes no simulation RNG while lifestyle evidence is evaluated.

## Persistent lineage save/load pass (v1.24.0)

v1.24.0 adds persistent browser saves so a lineage survives refreshes and later visits. The save schema is explicitly versioned from the first release and stores the living simulation rather than only the active creature: world biomass and moisture, all animals, ancestry, RNG state, shelters, family guidance, cognition, populations, migration, evolutionary-tree state, species/lifestyle progression, disease/injury state, and the other canonical controllers are rehydrated into their existing authorities. Static terrain is regenerated from the saved world seed and mutable world fields are restored over it.

- Saves use IndexedDB rather than a small localStorage blob. Save schema 1 is recorded independently from the game version so future builds can migrate saves deliberately.
- The opening screen shows **Continue** and **New lineage** when a save exists. Starting a new lineage requires confirmation and removes the previous local save.
- The Help panel includes **Save now** and **Load last save** controls. Saves are local to the current browser/device.
- Autosave runs on an idle/debounced path roughly every 45 seconds and after major lineage changes such as births/deaths, shelter count changes, handoffs, evolutionary-tree events, progression completion, or a new highest generation. Hiding/leaving the page also requests a save.
- Autosave observation itself is lightweight. Snapshot work is deferred to idle time during play so persistence does not become a new control-step or render hot path. The v1.18.1 smooth-play contract remains release-critical.
- `tests/save-persistence.mjs` proves structured-clone roundtrip of RNG, mutable world fields, creature references, shelters, controller Maps/Sets, tutorial stage, and continued simulation after restore. The runtime screenshot workflow includes a real `save-continue` opening-state capture.

## Species body-language animation pass (v1.23.0)

v1.23.0 builds on the v1.22 autonomous gait bridge without changing locomotion authority. The remaining quality gap was species anatomy: wildlife could now move smoothly while still reading as a rigid sprite carried between points. The fauna renderer now gives each existing non-GenVo species its own continuous movement language. Hoppers launch, tuck both leg pairs, trail their ears, and visibly replant for landing. Diggers travel as a low three-mass body wave with alternating mole-claw strokes and belly traction instead of translating as one rigid block. Stalkers use a diagonal four-leg prowl with planted and recovering feet, shoulder/head counter-motion, and a balancing tail sweep. Fractional presentation gait remains driven by rendered travel from v1.22; simulation positions, speed, AI decisions, collisions, ecology cadence, combat, RNG, and saves remain unchanged. The v1.18.1 worst-frame smoothness contract remains release-critical.

## Autonomous gait articulation pass (v1.22.0)

v1.22.0 closes the remaining presentation gap between the controlled GenVo and autonomous creatures without changing AI cadence or movement authority. Autonomous gait phase is now driven by actual rendered travel distance rather than depending only on coarse ecology animation beats, with a short presentation seam across adjacent 8 Hz movement segments. The renderer also faces autonomous bodies from their real visual travel heading while moving. GenVo feet remain articulated through the high step: raised legs fold inward and keep the distal segment/toe visible instead of blinking out at the top of a step. The same distance-driven presentation phase feeds non-GenVo fauna, so visible wildlife limb/hop/prowl animation tracks rendered travel rather than square-to-square authority updates. Simulation coordinates, path decisions, collisions, movement speed, energy costs, RNG, and the v1.18.1 smooth-play contract are unchanged.

## G2 new-home + autonomous locomotion pass (v1.21.0)

v1.21.0 removes two live-play friction points. A paired G2+ controlled descendant can establish one new **brood shelter** away from the founder shelter before population-scale satellite nesting unlocks; the birth-preparation task now guides that second-home loop and prefers the new brood shelter for stocking. Autonomous creature presentation also uses linear between-tick motion and treats visual displacement as walking, removing the repeated ease-stop/ease-start cadence that made non-player creatures read as hopping between squares. The v1.18.1 movement/performance hotfix remains a hard baseline.

## Current usability pass - readable inspectors + teachable Stalker escape (v1.20.0)

v1.20.0 responds to live playtest friction without adding a new simulation authority. The existing Population, Home Range, Help, family-learning, and Stalker systems remain canonical; this pass changes how their information and teaching requirements are presented.

- **Population** and **Home Range** now open with compact four-item summaries and keep deeper simulation diagnostics in expandable sections. The panels scroll internally instead of clipping lower data off-screen, while live refresh preserves scroll position and which sections the player opened.
- **Help** is split into short topic sections with a compact control summary instead of one uninterrupted manual-sized text wall. Mouse-free family guidance and the existing concise AI-development disclosure remain available.
- The fourth child **Danger** lesson accepts a real retreat from an engaged Stalker as a valid survival response. Sprinting away counts, and moving away while the Stalker is actively pursuing the caregiver also counts. Defensive responses remain valid.
- While Danger is the next lesson, the learning juvenile temporarily follows the caregiver more tightly and can observe the response from farther than the Stalker's bite-danger radius. This reduces positioning friction without globally changing child-follow behavior.
- Player-facing copy teaches the actual goal: keep the young close enough to witness the threat, then escape or defend. The lesson records whether the demonstrated response was flee or defend.
- The v1.18.1 smooth-play contract remains a release gate. Menu and task changes must not reintroduce movement/input frame spikes.

## Current gameplay pass - lifestyle play loops (v1.19.0)

v1.19.0 turns the four established species lifestyles into ordinary gameplay behavior instead of leaving them mainly as modifiers and Population-panel labels. This pass deliberately adds no new lifestyle names.

- **Aquatic** now makes open water part of the branch's actual traversal identity. Members of an established Aquatic taxon can swim even when an individual does not carry the original Webbed Limbs adaptation flag, and the Task Guide points the branch toward wet-margin settlement when that habitat is not yet represented.
- **Nomadic** adults use the existing migration authority with a lower threshold for worthwhile habitat gains and shorter refuge stays, so a Nomadic population visibly keeps moving rather than merely receiving a speed/range bonus.
- **Guardian** adults can hold/intercept around threatened taxon shelters and young before the generic flee response takes over. This reuses canonical mob/guard combat rather than adding a second damage system.
- **Burrower** branch shelters are marked and rendered as lower burrow dens. New Burrower construction uses the existing reduced-material benefit, improved cover, and stronger weather sealing; healthy adults also return to den cover earlier under poor weather or moderate energy strain.
- Established lifestyle goals are contextual. They appear only while the branch has an unmet lifestyle-specific need, so the Task Guide does not become a permanent lifestyle status panel.
- v1.18.1 frame-time protections remain part of the release contract. No lifestyle feature is allowed to reintroduce synchronous terrain/audio work or per-control-step taxon recomputation.

## Current hotfix - input and movement hitch removal (v1.18.1)

v1.18.1 is a performance-only stabilization pass prompted by live playtest lag during movement and actions. The older average-render benchmark hid rare main-thread stalls, so this pass measures worst-frame latency as well as average rendering.

- Daily terrain presentation no longer clears and rebuilds every visible chunk in one frame. Existing chunks stay drawable while 4x4 replacements refresh incrementally after the day boundary.
- Terrain refresh work is delayed away from the simulation's daily ecology update, processed every other frame, and prewarmed around the visible camera area to reduce movement-triggered cache misses.
- Manual render prediction now uses the same divergence, proto-trait, and species-lifestyle speed modifiers as authoritative movement, preventing evolved creatures from visually fighting their canonical position.
- Established species lifestyles are cached on the creature hot path instead of resolving the evolutionary tree repeatedly during 64 Hz control queries.
- Daily vegetation and seed dispersal retain their deterministic formulas while reusing plant descriptors, seed-bank references, precomputed dispersal hashes, and one shared direction table.
- Audio context creation is no longer triggered by movement keydown, repeated key events no longer redo unlock work, and authored WAV decoding is deferred and paced around interactive activity instead of being launched as one bulk first-input task.
- The original v1.18 runtime probe reached roughly 300-400 ms frame stalls at day transitions. Post-hotfix long movement probes reduce the normal worst case to roughly one missed 60 Hz frame, with no repeated 300+ ms terrain stalls.

No gameplay balance, lifestyle thresholds, ecology formulas, species rules, or player-facing progression were intentionally changed by this hotfix.

## Current pass - emergent species lifestyles (v1.18.0)

v1.18 begins the broader lifestyle-evolution layer on top of the living species tree. A taxon can establish one ecological lifestyle only after several sustained days of matching behavior, habitat use, inherited form, adaptations, and population pressure. There is no lifestyle menu and the controller consumes no simulation RNG.

- **Aquatic** emerges from repeated water travel plus wet habitat pressure and Webbed Limbs. Swimming becomes faster and cheaper, while prolonged dry-land travel is slightly less efficient.
- **Nomadic** emerges from sustained travel, low attachment to one population center, multi-center use, and Forager ancestry. Adults travel and search farther, with a small energy cost for constant movement.
- **Guardian** emerges from persistent predator pressure, defensive adaptations, Colony ancestry, and residence around defended kin. Threats are sensed sooner and sheltered defense improves.
- **Burrower** emerges from sustained shelter use, Colony ancestry, and cold/predator pressure. Taxon nests require less material and provide stronger physical and thermal protection, with a slight open-ground speed tradeoff.
- Lifestyle state belongs to the current living taxon and is stored on the evolutionary-tree node. It is separate from ordinary adaptations, proto-traits, and species recognition. If a young species boundary rejoins, stale branch lifestyle tags are not silently retained as a root-species trait.
- Existing movement, foraging, shelter, territory, population ecology, Task Guide, generation reveal, portraits, and GenVo rendering consume the lifestyle authority rather than duplicating its logic. The default HUD remains unchanged; the optional Population view reports established/forming lifestyles.
- Hunter and Grazer diet divergence was added in v1.25.0 after the first four lifestyle loops were validated.

## Current pass - species coexistence and branch territory (v1.17.0)

v1.17 makes simultaneous living taxa compete and settle through the same physical world instead of differing only in command scope and taxonomy. The new `SpeciesCoexistenceController` reads existing evolutionary-tree identity, population centers, residence history, biomass, predators, and local positions. It creates no resources and grants no species stat bonuses.

- A population center is evaluated from the perspective of the taxon whose branch originated there. Other living GenVo taxa physically sharing that range count as cross-taxon competitors rather than simply being folded into the owner's resident load. Their overlap therefore lowers the same carrying-quality and settlement assessments already used by population ecology.
- Each living taxon gets a dynamic population priority from real local conditions. Heavy cross-taxon overlap can produce a **Separate feeding range** goal, poor carrying conditions can produce a relief goal, a scattered branch can be asked to rebuild its resident cohort, and a stable branch can identify stronger nearby habitat for expansion. These goals appear through the existing contextual Task Guide and Population/Home Range inspectors rather than a new permanent HUD layer.
- Autonomous grown descendants can respond to severe branch pressure by moving part of their taxon toward a deterministic nearby relief site. Immediate survival and explicit player guidance remain higher priority.
- When several living taxa coexist, autonomous mate search prefers the animal's current taxon before falling back to compatible cross-taxon mates. Gene flow remains physically possible when same-taxon partners are unavailable, so species boundaries can still weaken or rejoin.
- Taxon-scoped Nest orders now remain taxon-scoped through construction. Only matching adults work the project, and a completed branch shelter is reserved for that living taxon while multiple taxa coexist. The finished nest becomes a persistent species settlement population center, giving that branch a new place to build independent pressure history and potentially diverge again later.
- Branch settlement scoring uses real forage, danger, cross-taxon overlap, and the environmental direction associated with the species' inherited proto-trait. It does not force organisms into a habitat, but extremely poor branch-matched settlement ground can be rejected before material is spent.
- The evolutionary tree, speciation threshold, proto-traits, and base `genvo` ecology registry remain unchanged authorities. v1.17 is a coexistence/leadership consequence layer, not another speciation algorithm.

## Current pass - species-level leadership (v1.16.0)

v1.16 makes living taxonomic branches matter during ordinary play instead of existing only in the evolutionary-tree readout. Direct creature control remains available, but guidance, mating, and succession now acknowledge which living taxon the active creature belongs to.

- When multiple living taxa coexist, broad family direction and radial area guidance default to the active creature's taxon rather than silently commanding every descendant in the lineage. The radial wheel names the active taxon directly and can be toggled explicitly to **LINEAGE** when the player intends a cross-branch order.
- Area orders capture the taxonomic scope that existed when the mark was placed. Switching the controlled creature or later changing the global guidance scope does not retroactively retarget an old Scout, Gather, Forage, Nest, or Avoid order.
- Mate discovery prefers ready mates from the active taxon before compatible members of another living branch. Cross-taxon courtship remains possible, but the mate inspector explicitly labels it **GENE FLOW** and explains that repeated cross-branch births can weaken a young species boundary.
- Successor selection prefers living descendants from the current taxon. A deliberate handoff to another branch remains allowed and is recorded as a leadership shift in the generation reveal. After a cross-branch handoff, family guidance returns to taxon scope so the new branch is not accidentally given a lineage-wide command.
- Population and territory inspection summarize active-taxon leadership, nearby cross-taxon contacts, and shared population use without adding another permanent HUD panel.
- These changes do not create a new species authority, stat bonus, reproductive incompatibility, or RNG path. `EvolutionaryTreeController` still owns taxonomy/history, `SpeciationController` still owns species recognition, and the shared engine species remains `genvo`.

## Current pass - living evolutionary tree (v1.15.0)

v1.15 turns reversible species recognition into durable lineage history. Current taxonomic boundaries can still strengthen, rejoin, or disappear, but a species branch that genuinely formed is no longer erased from the evolutionary record.

- `EvolutionaryTreeController` owns the persistent taxonomic tree separately from `SpeciationController`. Speciation still decides whether a population is currently recognized as a distinct species; the tree records branch ancestry and historical outcomes.
- Ancestral GenVo8 and recognized descendant species can coexist as independently counted living taxa. Each tree node reports current living members and the population histories those members occupy.
- Rejoined boundaries remain visible as **REJOINED** historical branches. A branch whose last living members die remains visible as **EXTINCT**. Neither outcome deletes the lineage records of animals that belonged to that species.
- Lineage records now retain `speciesBranchHistory` separately from the current `speciesBranch`. Current identity can therefore be cleared by renewed gene flow without rewriting what species an ancestor belonged to while the boundary existed.
- New species branches attach to the most common currently recognized parent species in their founding cohort. A population founded by Range GenVo can therefore later produce a Dryland GenVo child branch instead of every species being forced to branch directly from GenVo8.
- Physical-separation evidence for a later split is measured from the parent branch's origin population when one exists. First-order branches still use the ancestral Home Range reference.
- Species identity remains player-facing taxonomy over the shared `genvo` ecology implementation. The tree adds no stat bonus and consumes no simulation RNG.
- The optional Population view exposes the living tree. The default HUD remains unchanged.

## Current pass - reversible species threshold (v1.14.0)

v1.14 introduces the first player-facing species split, but only after several independent kinds of prospective evidence agree. A secondary population must remain ecologically distinct long enough to build a deep local proto-trait, maintain a resident breeding cohort, and reproduce mostly within that population. The base simulation registry still uses `genvo` so existing ecology, predators, diets, family systems, and rendering authorities do not fork into parallel implementations.

- Species recognition is evaluated only for established secondary population centers. The current gates require at least ten recorded pressure days, meaningful ecological separation from another population, a substantial physical split from Home Range, at least three resident adults, a dominant local proto-trait shared by the cohort, three or more inherited trait generations, and enough local births to measure reproductive isolation.
- Recent gene flow is explicit evidence. A candidate population needs at least four local births and no more than 25% recent cross-population reproduction before the boundary can qualify. One qualifying day is not enough; the evidence must remain aligned across consecutive evaluations.
- Crossing the threshold creates a named descendant species identity tied to the local proto-trait, such as Range GenVo or Dryland GenVo. The population's existing inherited trait remains the mechanical adaptation; species recognition does not add a second bonus layer.
- Recognized species identity is visible in the Population view, generation handoff, lineage records, and a restrained shared GenVo body mark. The generation reveal explains the pressure history, inherited depth, and recent reproductive isolation that produced the split.
- Young species boundaries remain reversible. Renewed cross-population breeding or strong ecological convergence can weaken the boundary and eventually rejoin the population with ancestral GenVo8. A split is therefore an outcome of maintained separation, not a permanent scripted unlock.
- The controller is deterministic and consumes no simulation RNG. Reproduction remains physically possible across a young species boundary so gene flow can actively test whether the split persists.

## Current pass - proto-trait persistence and gene flow (v1.13.0)

v1.13 tests whether the first population-specific traits can survive contact across generations instead of behaving like one-generation unlocks. GenVo8 still remains one species.

- A proto-trait now reinforces when descendants remain in the population and pressure that produced it. Reinforcement increases expression gradually and records how many generations the trait has persisted.
- Moving into a population without the supporting pressure no longer erases the trait immediately. It can persist at lower strength, then continue weakening in later descendants if the pressure is not restored.
- When differently adapted populations reproduce, gene flow is explicit. The birth population's supported trait remains the dominant expression, while the other parent's proto-trait is recorded as mixed ancestry and softens the local expression instead of stacking both bonuses.
- A descendant still expresses at most one mechanically active proto-trait. Mixed ancestry is visible as a restrained secondary marking and is reported in generation handoff and population inspection without creating a second hidden skill tree.
- Trait strength now scales the small mechanical benefit more directly, so reinforcement, dilution, and weakening have real but restrained consequences.
- Origin population is preserved separately from current birth population. Migration and inter-population reproduction therefore do not rewrite where a trait first emerged.
- All inheritance remains deterministic and consumes no simulation RNG. No species ID changes occur in this pass.

## Current pass - first proto-speciation (v1.12.0)

v1.12 consumes the prospective population histories recorded in v1.11 and allows the first small inherited population-specific traits to emerge. This is intentionally a proto-speciation layer, not a new-species declaration or a menu-selected evolution branch.

- A proto-trait can first emerge in G4+ descendants only after the birth population has at least five recorded pressure days, another population has at least five comparable days, and their average pressure-history separation is meaningful.
- The inherited cause must be local and prospective. At least one parent must have spent three or more recorded days with a majority residence share in the same population where the descendant is born. Birth population is resolved from the actual physical population center near the birth location, not assigned retroactively from a later adult role.
- The strongest local pressure must be materially higher than the comparison population before it can seed a trait. The first eight mappings are Frugal Frame from scarcity, Range Sense from competition, Watch Crest from predation, Close-Brood Frame from crowding, Dryland Skin from dryness, Splayfoot from wetness, Heat-Shed Mantle from heat, and Cold Mantle from cold.
- Each descendant receives at most one proto-trait in this first pass. Effects stay deliberately small, generally about 4-8%: modest metabolic, search, threat-sensing, shelter, water-use, wet-ground movement, or thermal advantages.
- Proto-traits have restrained morphology and markings in the normal GenVo sprite and generation portraits. Population and Home Range views describe them as proto-divergence and explicitly state that GenVo8 remains one species.
- Generation handoff can now show which population pressure produced the inherited change and its concrete small effect. Existing adaptation choices remain separate and are still governed by the normal evolution controller.
- The proto-speciation controller is deterministic and consumes no simulation RNG. It does not alter world pressure history, reproduction eligibility, adaptation offers, species IDs, or population-center assignments.

## Current pass - population-specific pressure memory (v1.11.0)

v1.11 turns the separated G3 populations into distinct lived histories without declaring new species yet. The original Home Range and every established Ranging Band or Satellite Colony now accumulate their own ecological pressure record from conditions that actually exist around that population.

- Each population records eight pressure axes from canonical world state: food scarcity, competing feeders, predators, crowding, dry ground, wet ground, heat, and cold. These are observations only; they do not alter plant growth, AI, genes, adaptations, reproduction, or species identity.
- The original Home Range is tracked separately from each persistent G3 population center. A rich inland home and a depleted river-side ranging band can therefore build different histories even while both remain one ancestral lineage.
- Individual lineage members also accumulate residence history. Grown relatives assigned to a secondary center record that population automatically, while young physically raised around a secondary center can develop the same population affinity before they are old enough for adult family assignments.
- Population and Home Range inspectors show recorded days, dominant pressures, and the current separation between the strongest secondary history and the original home. The default HUD remains unchanged.
- When two established populations have lived under meaningfully different conditions for several days, a concise contextual notice can call out the strongest pressure difference.
- Generation handoff details can identify the population in which a descendant was raised and summarize that population's dominant lived pressures. This is presentation of recorded history, not an evolutionary effect yet.
- This pass deliberately stops before proto-speciation. v1.12 can consume the prospective pressure and residence histories instead of inventing a divergence reason retroactively or asking the player to select a species branch from a menu.

## Current pass - first-run clarity and cause/effect readability (v1.10.0)

v1.10 deliberately pauses deeper speciation work to make the systems already in the game easier to understand during ordinary play. It keeps the default HUD restrained and adds explanation at the moment an existing mechanic matters instead of asking the player to diagnose everything through deeper panels.

- The guided opening now runs through six concrete needs: move, find food, drink, pair, establish a familiar home, and build the first family shelter. Pairing no longer ends the protected opening immediately; normal predator pressure returns after the first shelter milestone.
- Opening briefings are reduced to two short ideas: control one creature and solve one immediate need at a time, then understand that the long game is raising a lineage rather than manually controlling every relative.
- The Task Guide and existing contextual action line carry the onboarding work. The default HUD gains no permanent tutorial panel.
- A read-only effect-feedback layer turns existing simulation outcomes into short contextual notices. Webbed Limbs, Efficient Gut, Camouflage Mantle, Alarm Pulse, Mobbing Instinct, Provisioning Pouches, Hardened Mantle, coordinated defense, Water Sacs, shelter weather protection, illness rest/strain, and known Stalker territory can now explain themselves when their effects are actually relevant.
- Age, illness, and kinship are easier to read in-world. Elder GenVo8 have a lower, shorter-limbed posture and subtle mantle edging; sick creatures carry a strained posture and fever motes; nearby lineage relatives receive restrained ground-side kin marks rather than floating labels. Existing newborn/juvenile sizing and injury/exhaustion poses remain intact.
- Known active Stalker dens gain sparse physical territory scratches near the defended edge, making dangerous ground more legible without drawing a large permanent danger ring.
- The feedback controller does not change ecology, combat, adaptation math, illness progression, or AI decisions. It reads those authorities after they resolve and explains selected high-value consequences.

## Current pass - population ecology and settlement viability (v1.09.0)

v1.09 makes the G3 population split ecologically consequential before adding full speciation. Persistent Ranging Band and Satellite Colony centers now draw their usefulness from the same real local ecology as the rest of the simulation instead of remaining equally valuable markers forever.

- Each population center is evaluated from nearby edible plant biomass, grazing history, competing feeders, predator pressure, and actual or assigned grown family load.
- Centers report **STRONG**, **VIABLE**, **CONTESTED**, or **CRITICAL** conditions plus a local carrying capacity. The carrying limit can rise or fall as food recovers, competitors arrive, predators occupy the area, or too many family members depend on the same ground.
- Sustained center pressure changes autonomous behavior. When a center is overloaded or ecologically weak, part of its assigned adult cohort begins using stronger nearby cells as relief ground instead of clustering around the stressed center indefinitely.
- G3 Forager establishment now requires durable frontier ecology. If the marked Scout site is too weak, establishment pauses and the player can move the Scout mark to stronger ground. Retargeting genuinely changes the prospective center.
- Satellite nest placement now checks broader local settlement viability in addition to dry ground, learned range, construction material, spacing, and predator safety. Heavy food competition or depleted forage can make a location impractical even if it is physically buildable.
- Population and Home Range panels expose center status, carrying load, forage level, competitors, and the strongest local pressure. The territory overlay colors population-center markers by ecological health without adding permanent HUD clutter.
- A concise notification appears when an established center worsens into pressured conditions or recovers, so center ecology can matter without restoring the old information wall.
- This pass records pressure conditions that can later drive population-specific evolution, but it does **not** yet declare separate species or add multiple new lifestyle branches.

## Current pass - Generation 3 population centers (v1.08.0)

v1.08 continues the generation-progression work without opening a large lifestyle tree. Generation 2 proves the first inherited Forager or Colony form. Generation 3 now asks the lineage to use that earned family leadership to establish a second population center, making the family begin to behave like a population rather than one controlled creature plus followers.

- **Forager G3: Found a Ranging Band.** Use Family Command to mark an outer Scout area and let at least one grown relative establish it. The active creature does not need to walk the route itself. Completing the job creates a persistent **Ranging Band** population center and earns **Range Network**.
- **Colony G3: Found a Satellite Colony.** Grow until another nest can be supported, mark **New nest** on viable learned ground, let relatives construct the real shelter from local plant material, then establish adult occupancy there. Completing it creates a persistent **Satellite Colony** population center.
- Population centers are not presentation-only markers. While Family Direction is Auto, part of the matching inherited-form adult cohort can use the secondary center as its autonomous roaming or home anchor. The other adults remain centered on the existing family range, producing the first deliberate population split.
- The optional Population readout reports established centers, and the territory overlay can show them without adding permanent HUD clutter.
- Generation handoff now announces the G3 population-scale job and explains what the second center changes.
- This is groundwork for later separated populations and speciation. It does not yet declare separate species, add a skill tree, or introduce several new lifestyle branches at once.

## Current pass - Generation 2 ecological progression (v1.07.0)

v1.07 addresses the repeated Generation 2 stall without expanding into a large menu of new lifestyle branches. The first inherited Forager or Colony body now creates a generation-specific ecological test after takeover. Completing that test earns a population-scale capability tied to the way the lineage has been living.

- **Forager G2: Rangebreak.** Reach a marked outer family-range cell and feed there. Completing it proves that the inherited ranging body is useful in the world and earns **Trail Scout**, lowering the Scout leadership threshold from 3 adults across 6 familiar cells to 2 adults across 4 familiar cells.
- **Colony G2: Kin Gathering.** Use the existing Family Command system to mark **Gather here** at the family home, then keep the active G2 and at least one grown relative together long enough to establish coordinated home use. Completing it earns **Kin Network**, lowering the future satellite-nest threshold from 4 adults across 8 familiar cells to 3 adults across 6 familiar cells.
- The generation handoff now announces the new ecological test alongside inherited body changes, so the player sees both **what changed** and **what this generation is now for**.
- The compact Task Guide prioritizes the active generation challenge after immediate succession footing, while danger, illness, weather and injury can still override it.
- The Population and Family Reach readouts expose earned generation gains and dynamically report the changed Scout or nest thresholds.
- This pass intentionally does **not** add aquatic, hunter, burrower, guardian or other new species branches yet. It first proves that G2 can become mechanically different and that lineage evolution can unlock higher-level family leadership.

## Current pass - visible lineage divergence (v1.06.0)

v1.06 turns the v1.05 family tendency foundation into the first inherited species-level divergence. Sustained Independent Forager or Colony Cohesion behavior can now shape descendants from Generation 2 onward. The tendency itself remains reversible family culture, while each descendant's inherited form is fixed at birth. Continuing the same lifestyle into later generations deepens the inherited form.

Forager-form descendants become visibly leaner, longer-limbed, and more sensory-forward. They travel faster and search a wider area for food, so distant resource patches become more practical rather than merely producing a hidden score bonus. Colony-form descendants become broader and more compact, with distinct family markings. They store more usable food per shelter deposit and receive stronger protection while using family shelter, tying the body change to close-group survival.

The normal HUD remains quiet. The optional Population panel reports how many living descendants carry each inherited form and shows the active body's concrete effects. Generation handoff now adds the lineage form to the visual comparison, names the behavior that produced it, and explains the new opportunity it creates. Existing gene inheritance, pressure-selected adaptations, swimming, family commands, and ecology remain separate authorities.

## Current tooling pass - provenance foundation (v1.05.1)

v1.05.1 adds prospective provenance tracking without changing gameplay. Formal tracking begins from the canonical v1.05.0 toolkit as a clearly labeled pre-provenance baseline. Earlier passes are not recreated as if they had been logged at the time.

The toolkit now carries a hash-chained `provenance/ledger.jsonl`, a central `provenance/decision-map.json`, an honest `provenance/authorship-manifest.json`, and standard Node tools for recording and verifying stable passes. A small derived `provenance/tree-state.json` lets the recorder identify added, modified, and removed files even when the project is not using Git. It is helper state, not authorship evidence.

`node tools/provenance-record.mjs record` fingerprints the canonical tree, detects changed files from the previous stable record, links the creator decision IDs that caused the pass, stores verification notes, and appends a SHA-256 chained ledger entry. `node tools/provenance-verify.mjs` validates the ledger chain and confirms that the current source tree still matches the last stable record.

Release fingerprinting uses `release-provenance.json`. The embedded manifest hashes the canonical source tree, the final ledger head, and the exact unzipped web payload excluding the manifest itself. The final ZIP byte hash is emitted separately as a `.sha256` sidecar because embedding an archive's own final hash inside that archive would be circular.


## Current pass - behavioral species specialization (v1.05.0)

v1.05 begins the post-Generation-2 progression shift requested by playtesters. The founder lineage now develops a family-scale behavioral tendency from both player leadership and sustained observed behavior instead of only accumulating individual adaptations. Two deliberately contrasting strategies form the first layer: **Independent Foragers** and **Colony Cohesion**.

Forage/Scout guidance, wide adult spread, and repeated feeding away from the family core build independent-forager evidence. Follow/Home/Gather/Nest guidance, adults staying near family homes, shelter use, and tight regrouping build colony evidence. Button spam is rate-limited and daily observed family behavior contributes independently, so the result is based on how the lineage actually lives. The system is deterministic and does not consume simulation RNG.

Once a tendency becomes established it changes autonomous behavior while Family Direction is set to Auto. Independent foragers search farther and make deliberate long-range feeding/roaming decisions. Colony-specialized adults preferentially return toward family shelters and maintain tighter grouping. Explicit family commands, danger, hunger, thirst, illness, juvenile learning, weather, and care retain higher authority.

The default HUD remains unchanged. The optional Population panel shows the developing balance and explains the current tendency, and a short toast appears only when a recognizable tendency begins forming or becomes established. This is intentionally a behavioral foundation for later true species divergence rather than a menu-selected class.


## Current pass - accessible species command entry (v1.04.0)

v1.04 addresses playtest discovery failure around family leadership on trackpads and one-button pointing setups. Local family guidance no longer depends on knowing that right-click exists. A new target icon in the existing quick-access strip arms a one-shot command placement mode: click or tap the icon, then click or tap dry ground to open the same icon-first radial wheel. The R key provides the same command-mode toggle during a living run. Right-click and touch-hold remain fast shortcuts rather than the only route into the system.

While command placement is armed, the existing bottom context lane says only `CHOOSE GROUND · click or tap · R cancel`, and the canvas uses a targeting cursor. The target icon changes state instead of adding another permanent text panel. Once a grown relative first makes local leadership available, a short one-time notification points players toward the target icon or R. Clicking another quick-access inspector or pressing Escape cancels command placement cleanly.

The R key now has contextual behavior: during a living run it opens family command placement; after the family has ended it retains the existing new-run behavior. Family simulation authority is unchanged. Commands still guide autonomous adults, and urgent danger, hunger, thirst, illness, weather, juvenile learning, and care override player direction.


## Current pass - motion feel + fullscreen renderer performance (v1.03.0)

v1.03 pauses feature expansion to address repeated playtest reports that ordinary movement feels stepped or laggy. Manual control authority now runs at **64 Hz** while ecology remains at the canonical **8 Hz**, preserving deterministic ecology cadence and movement/resource totals while halving the maximum direct-control step. A new presentation-only player predictor projects the already-authoritative movement model across the fraction of a control step still pending in the current animation frame. Releasing movement or pausing drops prediction immediately, so the renderer no longer trails input by another interpolation step. Camera follow now tracks that predicted pose with a small bounded lag instead of easing behind an already-smoothed player target.

Renderer cost was also attacked directly. Stable terrain away from the controlled creature's small clarity pocket is now composed into deterministic **8x8 world chunks** and reused until the daily habitat refresh. The immediate player area still redraws through the live visual-hierarchy path, and dynamic water motion, environmental history, carrion, creatures, weather, guidance, and foreground vegetation remain live. This avoids replaying hundreds of terrain draw calls every animation frame without freezing the ecology or flattening the world.

The runtime performance probe now accepts viewport dimensions, and a new `tools/runtime_motion_probe.py` samples real requestAnimationFrame movement cadence. On the same Chromium environment with 50 staged visible creatures, v1.02 measured about **25.0 ms/direct render at 1280x720** and **42.2 ms at 1920x1080**; v1.03 measured about **10.5 ms** and **13.1 ms** respectively. In a real held-movement browser probe at 1280x720, v1.02 produced 49 sampled frames over the test interval with a 25 ms median frame and authority movement on about 77% of frames; v1.03 produced 73 frames with a 16.7 ms median frame and visible/authority movement on every sampled frame. At 1920x1080 the same probe improved from a 50 ms median frame to 16.7 ms in this Chromium environment. These are development comparisons, not claims about every browser or machine, but they directly target the Firefox/fullscreen complaint.

## Current pass - terrain cohesion + visual-noise cleanup (v1.02.0)

v1.02 closes the remaining terrain-readability issue from community screenshots. The broad grassland base no longer applies a discrete habitat-identity palette to an entire 16x16 world cell. Ground hue, saturation, and lightness now use continuous sub-tile regional sampling, so wet/dry/rich influences blend across cell boundaries instead of producing bright green/brown checkerboard patches. This is renderer-only and does not change canonical moisture, fertility, plants, pathing, or ecology.

Large habitat motifs were also revised so their low-alpha ground treatment is broken into irregular soil/vegetation fragments rather than broad translucent rectangles. The same ecological landmarks remain visible, but they read as terrain forms instead of selection-like overlays. A new terrain-cohesion regression checks nearby palette continuity, renderer RNG isolation, and prevents large translucent motif slabs from returning.

The v1.01 quick-access strip and Current Task guide remain unchanged, preserving the balance of a quiet default HUD with one-click instructions for tasks such as teaching young.

## Current pass - quick access + task guidance (v1.01.0)

v1.01 corrects the over-reduction from the v1.00 glance-HUD pass. The default play view remains quiet, but a small icon-only quick-access strip now exposes the information players repeatedly asked for without restoring the old wall of text. The strip opens the current task guide, family journal, home range, population view, and Help. Labels appear only as normal hover/focus tooltips.

The current objective now keeps its full instructional body internally even when the top-center glance card shows only the short goal. Clicking the target icon opens a compact **Current Task** panel that surfaces the exact live how-to instruction already selected by the tutorial/lineage state. This means states such as **Teach the young** can explain the active lesson (follow to water, feed together, return to shelter, demonstrate danger response, etc.) on demand instead of forcing the player to guess or permanently filling the screen with prose.

The quick strip stays available while ordinary inspectors are open so players can switch information views with the mouse, but it yields during welcome, lineage briefing, and generation-transition modals. Existing keyboard shortcuts remain supported.

## Current pass - readability and visual hierarchy milestone (v1.00.0)

v1.00 treats new-player comprehension as the milestone feature. The default HUD is now a glance layer rather than a simulation dashboard: generation/stage, three icon-based survival meters, and at most one urgent status signal. Family directives, family reach, range-food pressure, shelter capacity, and other deeper simulation data remain available through the existing opt-in inspectors instead of competing for attention during ordinary movement.

The normal post-tutorial objective collapses to one short current goal. Context interactions no longer float beside the controlled creature; they occupy a reserved bottom-center lane above action-result toasts. In-world water/food/goal cues now use rings and marks without text labels, and the ambiguous gold arrow above the player has been removed in favor of the persistent gold ground ring. Tutorial copy refers to that ring directly.

The underlying simulation, family leadership, ecology, combat, nesting, and evolutionary lifestyle systems are unchanged by this pass. The goal is to expose them progressively instead of showing their internal state all at once.

## Current pass - first evolutionary lifestyle: swimming (v0.99.0)

v0.99 begins the promised lifestyle evolution layer with a real traversal change rather than another stat modifier. **Webbed Limbs** is a second-stage aquatic adaptation that can emerge after **Water Sacs** under sustained water pressure. A lineage member with Webbed Limbs can cross open water; ordinary GenVo8 and other land species still stop or steer around it. Swimming is deliberately slower than land travel and costs more energy, so rivers become usable routes and refuges without becoming free movement.

Blocked attempts to enter water now contribute a small, rate-limited water selection pressure for the active lineage, making the adaptation respond to what the player actually tries to do. Autonomous descendants inherit the adaptation normally and can follow family guidance across water. Water crossing is traversal only for now: open-water cells do not count as settled home-range familiarity, and nests still require dry ground. Satellite nests may be established across a river once the living adult family actually includes swimmers and has learned viable ground there.

The renderer gives swimmers a distinct low paddling pose, visible foot webbing, and water ripples/wake so the ability reads in-world without another permanent text panel. Help explains that swimming is evolved rather than available at the start.

## Current pass - player-facing copy + non-blocking action feedback (v0.98.0)

v0.98 is a focused presentation cleanup driven by playtest feedback. Player-facing runtime copy no longer uses em dashes. The opening briefing, welcome goal, combat safety warning, Stalker field-sign copy, and runtime placeholders were rewritten with periods, colons, or plain words instead. A regression now scans runtime JavaScript and HTML so the style does not quietly return.

Short action-result messages remain because they help confirm eating, drinking, building, family guidance, combat, and other interactions, but they no longer occupy the objective area. The toast now lives in a dedicated bottom-center feedback lane. Context prompts are clamped above that lane, and ephemeral toasts yield entirely while secondary detail panels are open, preventing action feedback from covering persistent UI.

## Previous pass - satellite family nests + area settlement (v0.97.0)

v0.97 extends the icon-first local guidance system into the first real multi-home population mechanic. Once the founder lineage sustains **4 adults across 8 familiar cells** and has already built its first shelter, the radial wheel unlocks **Nest Here**. This is not a free map placement: the chosen point must be reachable dry ground, close enough to territory the family has actually learned, far enough from an existing shelter, reasonably supplied with real edible/structural vegetation, and free of immediate known predator pressure.

Choosing Nest Here creates a physical construction project rather than instantly spawning a structure. Healthy grown relatives travel to the marked site through the existing family-directive authority, and construction advances only while bodies are actually present. Progress consumes the same local plant biomass used by the rest of the ecosystem. When complete, the site becomes a smaller satellite family shelter with its own weather seal, integrity, food capacity, refuge behavior, and normal shelter maintenance. The temporary local order then clears.

Shelter capacity scales with the living family footprint rather than becoming unlimited: larger adult populations spread across more familiar ground can support additional home sites. The HUD and Home Range/Shelter inspectors expose current shelter capacity without adding a permanent new strategy panel. Under-construction sites and completed satellite nests have restrained in-world visual treatment, and the radial remains icon-first with hover/focus labels only.

Added `tests/family-nesting.mjs` plus real Chromium `family-nest-project` and `family-nest-built` screenshot scenarios.

## Previous pass — contextual family guidance wheel (v0.96.0)

v0.96 adds an **icon-first radial guidance wheel** for local species leadership without turning GenVo8 into a text-heavy RTS. Right-clicking dry ground (or long-pressing on touch) opens four quick actions around the cursor: **Gather Here**, **Forage Here**, **Scout Here**, and **Avoid Area**. A small center control clears local guidance. Labels appear only on hover/focus; the normal play view remains free of another permanent command panel.

These are real simulation directives, not decorative pings. Gather distributes autonomous grown relatives around the selected point, Forage biases them toward food within the marked patch, Scout sends eligible adults toward a chosen frontier after the existing Scout unlock, and Avoid creates a temporary family exclusion zone. Immediate danger, serious hunger/thirst, illness, weather response, dependent learning, and care responsibilities still override the local marks.

Local guidance sits underneath the existing broad family stance rather than replacing it: the number-key modes answer **what the family is generally doing**, while the radial answers **where you want attention right now**. Marks expire naturally, avoid zones are capped, and the local forage search uses deterministic sparse sampling so the feature does not introduce a new RNG stream or undo recent performance work. The renderer draws only restrained ground symbols/rings for active marks.

Added `src/ui/leadership-wheel.js`, `tests/context-guidance.mjs`, and a real Chromium `family-guidance` screenshot scenario.

## Previous pass — population food pressure + ecological competition (v0.95.0)

v0.95 makes family expansion carry an ecological cost instead of being only a territory-growth number. A new `FamilySustainabilityController` reads the real founder-line footprint, real edible plant biomass, existing grazing/recovery history, shelter food reserves, and other living species whose diets overlap GenVo8. It does not create a separate food economy or alter plant growth: family members and wildlife continue consuming the same world biomass they already used.

The normal HUD now exposes **RANGE FOOD** as abundant / stable / strained / depleted once the lineage has more than one living member. The Home Range panel shows forage condition, shelter reserve, competing feeders, and the weakest familiar cell. With the territory overlay open, shared-family cells subtly shift from green-gold toward amber/red as local sustainability worsens, so population pressure has a spatial read without becoming a permanent strategy-game heatmap.

Family leadership now reacts to that pressure. **3 · Forage** behaves as before while the range is healthy, but when the family range is strained it can route autonomous adults toward richer, lower-competition cells before resuming ordinary feeding. **5 · Scout** now scores frontier ground using edible biomass and competing feeders as well as Stalker danger, so range expansion naturally seeks relief instead of blindly painting more territory. Serious thirst, hunger, illness, care duties and danger still override all family orders.

This pass is intentionally observational/behavioral rather than a new buff/debuff layer: reproduction already responds to local forage through the carrying-pressure system, and all feeding still depletes canonical world biomass. The new controller consumes no simulation RNG and is inactive as a gameplay authority in playerless benchmark runs. `tests/family-sustainability.mjs` covers resource depletion, competitor pressure, shelter reserves, deterministic calculation and relief routing. `tools/runtime_screenshot.py` adds a `family-pressure` scenario for real Chromium inspection.

## Previous pass — shared family reach + unlockable scouting (v0.94.0)

- Added a modular **FamilyExpansionController** that aggregates the living founder-line family's learned home-range cells into one shared, decaying footprint. This is ecological presence rather than hard tile ownership: only ground actually kept familiar by living lineage members contributes.
- The primary HUD and population/home-range views now expose **Family Reach** as familiar cells + living adults, with progression from Foothold → Family Range → Expanding → Population. This gives population growth a visible spatial consequence instead of only increasing a counter.
- Added the first growth-unlocked leadership capability: **5 Scout**. It unlocks once the lineage sustains at least 3 adults across 6 familiar cells. Independent adults then probe dry frontier cells around the shared range while hunger, thirst, danger, illness, weather, learning, and care remain higher-priority authorities.
- Scout destinations are deterministic and distributed by individual ID, so multiple relatives do not march as one synchronized stack and the system consumes no simulation RNG. Losing enough adults can close the capability again; it is supported by the living population rather than permanently granted.
- The T home-range overlay now distinguishes the active creature's learned range from the broader family's shared presence and shows possible Scout frontier ground.
- Added `tests/family-expansion.mjs` plus a real-runtime family-expansion screenshot scenario.

## Previous pass — family leadership + authorship-forward AI disclosure (v0.93.0)

- Added the first real **species-leadership** layer. The player still directly controls one GenVo8, but grown founder-line relatives can now receive a broad family direction with **1 Auto · 2 Follow · 3 Forage · 4 Home**.
- Directions are intentionally not RTS puppeteering. Immediate danger, serious hunger/thirst, illness, weather refuge, dependent learning, and care continue to override player orders. The family remains alive and autonomous while becoming meaningfully steerable.
- Follow gathers independent relatives around the active creature with staggered personal positions; Forage fans them toward remembered/local food; Home returns them to the family shelter or learned range; Auto hands behavior fully back to existing simulation authorities.
- Added a compact family-direction strip to the normal HUD only when a grown relative exists, plus Help and population-panel explanation.
- Rewrote the jam AI disclosure to be factual and proportionate: **AI-assisted development** rather than a giant category-forward warning. It states that AI tools supported parts of programming/visual/audio/writing workflows while design direction, selection/editing, integration, testing, balancing, and final decisions remain developer-led. The detailed submission file still names the assisted areas for rule compliance.
- Added `tests/family-directives.mjs` and updated AI disclosure coverage.

## Previous pass — lineage purpose + narrative onboarding (v0.92.0)

- Reframed the opening around the actual long-form fantasy: the player controls **one living GenVo8 at a time**, while mates, offspring, wildlife, and competitors remain autonomous. The opening no longer presents GenVo8 as four disconnected tutorial chores.
- Added a three-card, large-format **Lineage Briefing** before the mechanical tutorial. It explicitly explains what the player controls, why survival/reproduction matter, how offspring become successors, how `L` + `H` advances control forward, and what the real lineage failure condition is.
- Clarified the Generation 8 contract everywhere it matters: **G8 establishes the lineage for the jam milestone; it is not the ending.** The ecosystem and descendants can continue afterward as long as the family survives. The G8 generation reveal now says this directly instead of implying a conventional ending.
- The persistent HUD purpose line is now state-aware: it changes from building the first family, to starting G2, to raising successors, to handing control forward, to post-G8 continuation. This ties moment-to-moment tasks to the lineage goal instead of only showing `G#/8`.
- Help now has a dedicated **How the lineage works** section answering the exact playtest questions: one active body at a time, autonomous family members, how handoff works, and what happens after G8.
- Enlarged the opening explanation and added a high-contrast narrative panel without replacing the authored in-world HUD with generic dashboard cards.
- Added `tests/lineage-purpose.mjs` to lock the onboarding/control-scope/G8-continuation contract.

## Previous pass — playtest clarity + pause/input safety (v0.91.0)

- Removed **Space** as an in-game pause toggle. Space still starts/continues tutorial modal screens, while **P** is now the sole gameplay pause key. This closes a likely playtest failure mode where an accidental Space press froze movement while Q/E still appeared to work.
- Manual pause now has a large explicit screen notice and world actions are blocked while paused; panel navigation can still be inspected. Browser blur also clears held movement keys.
- Eating while completely full no longer consumes food and reports a false-looking `+0 energy`. Tiny real gains display as `<1` instead of rounding to zero.
- Success/failure action feedback is now visually explicit and shelter/store success audio receives a short positive confirmation accent so successful actions no longer read like failures.
- Added a persistent run-purpose line to the primary HUD: reach Generation 8 by surviving, pairing, raising young, and continuing as descendants. The objective step also keeps the current generation visible after onboarding.

## Previous pass — multi-Stalker pressure + tactical evolution (v0.90.0)

- Nearby Stalkers no longer all commit their attack tells at once. The player-facing encounter controller arbitrates a single active wind-up/charge lane while additional Stalkers remain mobile and spread around deterministic pressure positions. They do not freeze or disappear; they keep closing/circling until the active attack resolves.
- A short post-attack breathing window prevents another Stalker from starting a fresh wind-up on the exact resolution beat. Multi-predator encounters stay dangerous without stacking unavoidable simultaneous charge hitboxes.
- Threat status now reports how many Stalkers are actively pressuring the controlled lineage. Context/tutorial copy calls out multi-Stalker pressure and explains that one hunter commits while the others reposition.
- Evolutionary defense/mobility now changes encounter decisions more directly: **Spring Tendons** reduce the separation needed to break pursuit, **Hardened Mantle** creates extra Stalker rebound/recovery after a survived bite, and **Bitter Slime** preserves its real predator-aversion result by immediately ending the active hunt instead of being overwritten by generic recovery. Existing camouflage, rally, jaw and barbed counterplay remain intact.
- Added `tests/combat-pressure.mjs` plus a real-runtime `combat-pressure` screenshot scenario for repeatable multi-Stalker QA.


## Previous pass — Stalker combat footwork + punish/escape choices (v0.89.0)

- Player-facing Stalker charges are no longer homing attacks. Wind-up snapshots a straight committed lane through the player's current position; the charge follows that lane even if the player moves afterward, so lateral movement and sprint timing can produce a genuine evade. Background predator/prey ecology remains on the canonical hunt path.
- Wind-up/charge presentation now draws a restrained profile-colored ground lane from the real committed target. The controlled GenVo8 can visibly cross that lane instead of relying on hidden timing. The Stalker body faces the same committed aim.
- Recovery after a missed, blocked, or interrupted charge is now a real tactical window. Biting during wind-up or recovery receives a bounded accuracy/damage opening through the existing player strike authority; no second damage system is added.
- Recovery also creates a retreat choice: making profile-specific distance breaks the engagement and briefly routes the Stalker through existing player-aversion/escape behavior instead of immediately restarting the same stalk loop.
- Dynamic objective/context copy now distinguishes **sidestep**, **committed charge**, **opening bite**, and **break pursuit** states. Existing camouflage, barbed/crushing strikes, bitter slime and family rally remain valid evolved answers rather than being replaced by the new footwork layer.
- Added `tests/combat-footwork.mjs` plus real-runtime `combat-footwork` and `combat-recovery` screenshot scenarios.


## Previous pass — Stalker archetype readability + combat impact (v0.88.0)

- Stalker temperament profiles now live in a shared organism module so combat timing, track-reading language, markers, and rendered silhouettes use the same inherited profile thresholds instead of duplicating the classification in separate layers.
- The three existing Stalker temperaments are now visually distinct in-world without adding fake enemy classes: rushers are front-heavy with taller dorsal blades, longer jaws, shorter tails, and a centered aggressive marker; flankers keep a low long-tailed silhouette with a hooked tail/ridge bias; wary hunters use a broader stance, smaller jaw axis, lower ridge and paired sensory cheek quills. Genetic color/size variation still layers on top.
- Successful player counterbites now create a short renderer-only recoil and impact spark on the actual struck Stalker, with a stronger stagger accent when an evolved strike repels it. The effect is derived from the resolved combat result and does not alter damage, hit chance, RNG, ecology, saves, or enemy AI.
- Close-range Stalker markers now echo each temperament's shape language, improving threat recognition in dense grass/rain without adding floating labels or permanent health bars.
- Added `tests/stalker-readability.mjs` to lock shared profile classification, silhouette separation, and combat-impact provenance.

## Previous pass — species behavior rhythm + readable wildlife roles (v0.87.0)

- Healthy autonomous wildlife in the live player runtime now follows species-specific, ID-staggered ambient rhythms instead of falling back to one generic explore loop whenever no urgent need is active. The system is isolated in `src/ecology/wildlife-rhythm.js`, consumes no simulation RNG, and remains disabled in `player:false` ecology benchmarks.
- Hoppers alternate between listening, browsing, resting and short herd hops; Diggers alternate between ground probing, low rest and compact root-roaming; idle Stalkers scent-watch, prowl their local area and rest; non-lineage GenVo8 bands alternate between watch, social pause and local wandering. Hunger, thirst, reproduction, alarms, predator combat, family behavior, territory, migration and shelter remain higher-priority authorities.
- Renderer body language now distinguishes listening, digging, scanning, non-combat prowling and resting. Digger probing animates the foreclaws and ground disturbance, Hopper listening raises the ear silhouette, and Stalker patrol stays low and deliberate without opening the attack jaws.
- The rhythms do not freeze off-screen ecology and do not add per-animal save state. Existing distance-based decision/movement LOD still owns performance budgeting.
- Added `tests/wildlife-rhythm.mjs` plus a repeatable real-runtime `wildlife` screenshot scenario for visual QA.

## Previous pass — runtime performance: cached terrain + background movement budget (v0.86.0)

- The renderer now caches the expensive 16×16 logical-pixel organic land contour for each visible world tile and nearest-scales that cached pixel tile at draw time. The cache is invalidated with the daily habitat field, so soil/habitat evolution still appears when its authoritative field changes. Dynamic vegetation, tracks, creature contact, foreground bending, weather and readability hierarchy remain live.
- Static river depth/topology and shoreline-rim work now uses the same daily tile-cache path while current flecks/reach marks continue animating each frame. This removes repeated per-frame raster work without turning the world into a pre-rendered screenshot.
- A real Chromium 1280×720 direct-render probe (`tools/runtime_perf_probe.py`) is now part of the toolkit. In the local before/after probe used for this pass, the same opening view fell from about 145 ms to about 31 ms per direct render; a staged 50-creature view fell from about 99 ms to about 36 ms. These are development wall-time comparisons in headless Chromium, **not FPS claims**.
- Far, non-urgent autonomous wildlife now uses a compensated movement cadence as well as the existing decision LOD: mid-distance ambient animals advance every 2 ecology beats and far ambient animals every 4, multiplying that movement step by the skipped simulated time. The visible/extended gameplay zone, founder family, player, and urgent threats remain full-cadence. Headless `player:false` ecology also remains on the canonical full movement cadence.
- Background movement scheduling is deterministic and ID-staggered, so distant animals do not all jump on the same update. Movement energy/history accounting scales with the compensated step instead of becoming artificially cheaper.
- Added `tests/background-movement-budget.mjs` to lock the cadence/compensation contract.

## Previous pass — community feedback: performance, threat clarity, UI contrast (v0.85.0)

- Autonomous decision work is now distance-tiered around the controlled lineage: nearby threats/urgent animals stay full-cadence, mid-distance wildlife uses a reduced decision cadence, and far wildlife keeps progressing at a still lower cadence instead of spending equal AI budget across the whole 128×128 world. Founder-family members remain full-cadence; off-screen urgent animals stay alive and active rather than being frozen.
- Ambient autonomous wandering gains deterministic, species-aware micro-pauses and per-animal gait phase offsets. Wildlife no longer reads as every creature beginning each step on the same simulation beat; group/flee/feed/hunt behavior remains immediate.
- Stalker response was corrected so attacking one during the protected opening **ends the safe start** and immediately provokes a telegraphed predator response. Walking directly into a Stalker’s combat range also ends tutorial safety, so the onboarding shield cannot make enemies harmless collision targets. Stalker stalk speeds/tells were tightened while retaining readable windup/charge/recovery phases.
- Stalkers received stronger predator identity in the actual sprite: darker crimson base, dorsal blade marks, hotter eye/jaw accents, and a restrained close-range hostile marker.
- The primary HUD, objective and interaction prompt now sit on low-opacity irregular field washes with another measured type-size increase. This follows playtest requests for larger text and background separation without returning to generic opaque cards.
- Jam compliance material now includes `submission/AI_DISCLOSURE.txt`, matching itch-page copy in `submission/ITCH_PAGE_NOTES.md`, and an in-game Help disclosure covering AI-assisted code, visuals, audio/music, and text/design work.
- `tools/perf_probe.mjs` provides a repeatable three-seed headless timing probe for future optimization work. On this pass, the same local 1,200-update probe reduced median wall-clock time by roughly 8% versus the v0.84 baseline; this is a development benchmark, not an FPS claim.

## Previous pass — player presence + motion feel (v0.84.0)

- The 32 Hz control authority from v0.83 remains unchanged, but the presentation bridge now uses linear interpolation for the controlled GenVo8 instead of restarting a smooth-step ease every control sample. This removes another layer of mushiness without changing travel distance, cost, simulation RNG, or ecology cadence.
- Camera follow is tightened from 18 Hz to 24 Hz so the view settles behind the controlled animal faster while remaining frame-rate independent.
- The controlled GenVo8 now has a restrained gold world anchor drawn after foreground/weather layers: a small ground ellipse and clearer pointer remain legible in dense vegetation and rain without becoming a permanent card or minimap icon.
- Primary play-state typography received a second measured size pass after runtime inspection: clock/lineage, needs, family/weather/injury lines, objective copy, context prompts, and toast copy are larger while secondary inspector panels stay unchanged.
- AI/ecology creatures keep the smoother 8 Hz presentation bridge; the sharper response is scoped only to the player-controlled animal.


## Previous pass — control response + play-state readability (v0.83.0)

- Live manual control now advances on a fixed 32 Hz substep while the ecology remains authoritative at 8 Hz. This removes the previous up-to-125 ms wait for the next ecology tick without changing background simulation pacing.
- Four control substeps preserve the same travel distance, movement energy cost, gait timing, and ground-traffic contribution as one former 8 Hz manual step. Ecology updates explicitly skip duplicate player movement when the live control path is active.
- The presentation motion bridge accepts authoritative player positions inside the same ecology tick and uses the shorter 32 Hz interpolation window. Camera follow is now frame-rate independent and substantially more responsive.
- The normal-play HUD and objective hierarchy are larger and higher-contrast without converting the screen back into opaque dashboard cards; critical needs, family/weather/injury lines, interaction prompts, and objective copy carry more visual weight against the map.
- Background/player:false ecology remains on the canonical 8 Hz path and consumes no additional simulation RNG.


## Current pass — predator injury + recuperation (v0.82.0)

- Surviving real player-facing damage can leave the active GenVo8 temporarily sore, wounded, or badly wounded.
- Injury severity is derived from damage already applied by canonical combat and remaining health; the injury system never rolls combat or consumes simulation RNG.
- Wounds modestly slow manual movement and make sprinting more expensive, preserving escape as an option rather than disabling it.
- Quiet family-shelter rest speeds recovery most; dense-cover rest helps; staying active heals more slowly and repeated sprinting strains recovery.
- Injury state is readable through the existing GenVo8 limp/body-language system and compact HUD/objective copy instead of a new medical inventory or wound meter.
- Background/player:false ecology never creates injury-recovery state.

## Previous pass — recovery immunity awareness + safe family support (v0.81.0)
- Temporary acquired immunity now changes live founder-family behavior instead of being only a HUD fact: recovered immune adults are preferred for close sick-young care before susceptible relatives.
- A recovered player can remain beside a sick dependent and use the existing E care interaction while the objective explicitly explains that temporary immunity makes close support safer; care still never cures Marsh fever directly.
- When an adult relative is sick, one recovered immune adult can remain nearby as support while susceptible relatives continue spacing out. No disease probability, pathogen, duration, or immunity equation was changed.
- Fever-break guidance now distinguishes brief convalescence from the longer canonical immunity window and encourages replenishing food/water before ranging far when recovery reserves are low.
- Family illness snapshots/HUD now surface temporary immune relatives, and runtime family membership caching correctly notices same-tick births instead of waiting for another simulation tick.
- The behavior consumes no simulation RNG and remains disabled entirely in player:false ecology. `tests/immunity-awareness.mjs` covers caregiver preference, player interaction, immune adult support, same-tick family-cache refresh, RNG isolation, and headless inactivity.

## Previous pass — family Marsh fever response (v0.80.0)
- Live founder-line relatives recognize Marsh fever in family members and reduce unnecessary close contact without changing the canonical disease/transmission equations.
- Healthy dependents can temporarily follow a healthy caregiver away from a sick relative; a sick dependent keeps one healthy caregiver close while other susceptible relatives make space.
- The active parent can use E to check/tend a nearby sick dependent; this uses existing family care resources and never cures the infection directly.
- After the final family infection recovers, relatives briefly regroup and normal family spacing resumes.
- These decisions consume no simulation RNG and are disabled entirely in player:false ecology.

## Hotfix — shoreline water teaching clarity (v0.79.1)
The juvenile water lesson never requires entering open water. Controlled GenVo8 remain land-bound and drink from canonical dry shoreline/drinkable tiles. The family-learning objective now explicitly says **walk with it to a drinkable bank, then E · drink** instead of the misleading generic phrase “follow you through water.” A regression now proves parent and juvenile can complete the water lesson while both remain on non-water tiles.

## Previous pass — Marsh fever recuperation choices (v0.79.1)

v0.79 keeps the existing ecological **Marsh fever** authority intact—contact/shelter/environment/carrion transmission, deterministic exposure rolls, multi-day courses, acquired immunity, and background epidemic behavior are unchanged—but gives the controlled founder-line animal a readable recuperation loop. No new rest key is introduced. An infected GenVo8 that stops moving under its family shelter receives the strongest support; resting alone in dense cover is slower but reduces close family contact; ordinary cover/exposed rest gives smaller relief; sprinting while feverish increases the existing energy/hydration/health cost.

Supported recovery requires real rest plus adequate food and water. Two well-supported illness days can shorten a long fever course by one day, with a hard cap of two shortened days and the canonical minimum disease duration preserved. Shelter rest therefore helps but does not erase disease. The existing shared-shelter transmission route remains active, creating a real choice between stronger shelter recovery and exposing susceptible family members to close contact. The dynamic objective explains that tradeoff instead of adding a new medical meter. The HUD disease line now reports whether the animal is resting under shelter, isolating in cover, pushing through, or straining while sick, and briefly notes the fever break alongside acquired immunity.

The recuperation authority is deterministic, consumes no simulation RNG, adds no genetic/stat bonus, and remains completely inert in `player:false`. `tests/illness-recovery.mjs` covers supported rest, disease-cost reduction, bounded course shortening, sprint strain, recovery/immunity continuity, family-contact risk, RNG isolation, and headless inactivity. `tools/runtime_screenshot.py` adds an `illness-recovery` scenario for real packaged-runtime proof.

## Previous pass — post-storm regroup + route recovery (v0.78.0)

v0.78 gives severe weather a short aftermath instead of letting the family snap instantly back to normal when rain stops. The founder-line weather authority remembers juvenile solo-practice routes that were genuinely aborted by a storm, opens a bounded post-storm regroup window, and can restore those same learned routes once conditions clear. The restored route still has to complete through the existing practice authority; no success credit is granted by the weather system itself.

Dependent young gathered at the shelter are queued for a simple **E · Check G# young after storm** interaction after higher-priority combat/drink/hunt/urgent-care actions. The check lowers ordinary care stress modestly and records an existing family/cognition history event; it consumes no food, grants no stat bonus, and does not create a new needs meter. The dynamic objective can briefly guide the player to the young, then report that interrupted family outings are reopening.

Recent heavy rain also changes only the *estimated* recovery of previously learned wet-food patches for a short window. Reeds and Mushrooms receive the strongest expectation, Berries/Moss a small one, and dry Seed Pods none. The system never queries current off-screen biomass: the Memory panel/route copy may say **recent rain may help**, but the player must physically revisit the patch to confirm its real condition. The entire aftermath authority is deterministic, expires after a bounded window, and remains inert in `player:false`. `tests/storm-aftermath.mjs` covers route restoration, young checks, post-rain expectations, expiry, RNG isolation, and headless inactivity. `tools/runtime_screenshot.py` adds a `storm-aftermath` scenario.


## Previous pass — family storm refuge behavior (v0.77.0)

v0.77 makes severe weather a family event instead of only a condition on the controlled animal. In live founder-line runs, dependent young, learning adolescents, parents with dependent offspring, and nearby adult descendants can interrupt low-priority roaming, practice, migration, provisioning, or social activity and return to the real family shelter during sufficiently harsh rain/cold/heat. Predator escape, critical thirst, and other immediate survival needs remain higher priority. An outbound solo-practice trip interrupted by rough weather is explicitly aborted and must be attempted again rather than receiving fake practice credit.

The behavior reads the same canonical climate and maintained shelter state introduced in v0.75–0.76. It consumes no simulation RNG, creates no background exposure meters, and is completely inert when `player:false`. Family members physically gathered under cover create a short refuge moment recorded through ordinary family/cognition history. The dynamic objective can report how many nearby family and young are under cover, while the existing Shelter panel can show refuge occupancy; no new permanent HUD meter or weather inventory is added. `tests/family-weather-refuge.mjs` covers outing interruption, family gathering, survival-priority ordering, RNG isolation, calm-weather inactivity, and headless inactivity. `tools/runtime_screenshot.py` adds a real Chromium `family-weather` scenario.

## Previous pass — shelter weatherproofing + storm maintenance (v0.76.0)


v0.76 makes the existing family shelter's condition matter during rough weather. Structural integrity still governs whether the shelter is physically sound, while the same structure now carries a simple weatherproofing state that can be reinforced with the existing **N** action and nearby plant material. Heavy rain gradually wears that seal; a weathered shelter protects less, can visibly leak, and may need reinforcement before it functions as a strong refuge again. There is no second building inventory or construction tree: repair and reinforcement stay inside the canonical shelter authority and consume real local biomass. The optional Shelter panel reports the condition qualitatively (`Reinforced`, `Holding`, `Weathered`, `Leaking`) rather than adding another permanent HUD meter.

v0.75 turns the simulation's existing rain and seasonal temperature into a readable player-facing survival pressure without adding a second weather RNG or changing background ecology. The controlled GenVo8 can become wet, chilled, or heat-stressed while exposed. Cold wet conditions add a modest energy cost; hot conditions add hydration pressure. Dense canonical vegetation reduces rain exposure somewhat, while an intact family shelter provides the strong protection and rapidly dries a soaked animal. Opening protection still prevents the new resource penalty while the basic tutorial is active.

The exposure controller is founder/player-facing only. It consumes no simulation RNG, creates no state in `player:false`, grants no hidden stat bonus, and does not alter global climate, soil, vegetation, migration, or wildlife metabolism. Rough weather can modestly reduce the attractiveness of long optional remembered-forage trips, while urgent young/predator/succession priorities remain authoritative.

Presentation stays qualitative: the HUD may show **Wet weather**, **Soaked**, **Soaked and chilled**, **Hot weather**, or **Drying under shelter** only when relevant. The dynamic objective can point to the real family shelter during significant exposure, and the canvas renderer draws deterministic rain from the same canonical climate values. There is no new exposure bar or map overlay. `tests/weather-exposure.mjs` covers cold rain, heat, shelter drying/protection, forage-route pressure, RNG isolation and headless inactivity. `tools/runtime_screenshot.py` adds a `weather-exposure` real Chromium scenario.

## Previous pass — seasonal forage reliability + observed competition (v0.74.0)

v0.74 makes learned forage patches change in value across seasons and local feeding pressure without turning memory into an omniscient resource map. Each physically revisited patch now retains season-specific condition samples plus the feeding pressure GenVo8 actually saw there. Plant types have broad seasonal tendencies aligned with their ecology — for example Seed Pods are strongest in summer, Berries improve in autumn, wet Reeds favor spring, and winter reduces most patch recovery — but repeated observations of a particular patch can refine that expectation.

Competition is observational. When GenVo8 is at a known patch it can remember nearby founder-line relatives using the same food separately from unrelated grazers/browsers. Heavy observed wildlife use can make a season-favored patch less attractive than a quieter alternative; family use is called out independently so the player can recognize when its own lineage is contributing to pressure. Once GenVo8 leaves, the controller never queries current off-screen animals for planning: remembered competition decays with age and only refreshes after a real revisit.

Season and competition now affect the estimated recovery rate and route value of known patches, while the Memory panel and hunger guide use qualitative language such as **strong this summer**, **contested**, **family using this patch**, **other grazers seen here**, and **quiet when last checked**. The controller still grants no hidden stat bonus, consumes no simulation RNG, and creates no patch state in `player:false` ecology. `tests/forage-season-competition.mjs` covers seasonal preference, observed wildlife pressure, family-use distinction, stale-pressure decay, real revisit refresh, cognition history, and headless isolation. `tools/runtime_screenshot.py` adds a `forage-season` scenario for real Chromium proof.

## Previous pass — playable succession + takeover bearings (v0.71.0)

v0.71 closes the family arc by making generation handoff continue into play instead of ending at the full-screen recap. The canonical handoff now snapshots the selected descendant's real preparation — lesson coverage, independence, solo-route count, and field-ready status — and shows that readiness in the generation reveal. This is descriptive family history, not a stat modifier.

After the handoff scene closes, the new active descendant receives one short deterministic bearing drawn only from knowledge that animal actually learned while growing up. A field-ready heir is pointed toward a fresh remembered food or water place and confirms its footing by actually eating/drinking there through the normal interaction authority. An underpracticed heir is first guided back to the family shelter (or surviving family anchor when no shelter exists). If no valid learned bearing exists, normal play resumes without creating an artificial blocker. The transition times out safely after a bounded period and never hard-gates the generation.

Manual handoff still leaves the prior generation alive in the world. The succession task consumes no simulation RNG, grants no health/energy/gene bonus, and records completion only in the new generation's ordinary cognition history plus the existing handoff record. `tests/handoff-transition.mjs` covers prepared and underpracticed takeovers, real resource confirmation, home reconnection, RNG isolation, handoff-history continuity, and survival of the prior generation. `tools/runtime_screenshot.py` adds a `handoff-transition` scenario for real Chromium proof.

## Previous pass — solo practice + field readiness (v0.70.0)

v0.70 extends the founder-line family loop from **learning** into **proof of independence**. An adolescent that has learned water, food, shelter and Stalker danger can begin deterministic solo practice outings when healthy, calm and not already under predator pressure. The youngster chooses a learned food or water destination, travels there using the ordinary movement/interaction authorities, must actually drink or consume real biomass, and then must physically return to the family shelter (or surviving caregiver when no shelter exists) before the route counts as completed.

Practice does not grant a hidden stat bonus and does not consume simulation RNG. A route can fail honestly: spent remembered food, an unusable water approach, newly learned Stalker pressure or an overlong trip aborts the outing. A real predator encountered during practice cancels the resource objective and turns the event into a recovery run; if the adolescent survives and finds its way home, that recovery is retained in family history without pretending the original route succeeded.

Field readiness is therefore descriptive, not magical. A well-taught adolescent becomes **field-ready** after completing both a solo water route and a solo food route and returning home from each. Manual generation handoff is still allowed at canonical maturity, so the system does not hard-lock a run, but the HUD/objective and handoff history expose whether the descendant actually practiced before adulthood.

## Previous pass — active offspring care + upbringing history (v0.68.0)


v0.68 turns the existing **raise young** phase into an active founder-line survival loop. Dependent descendants now expose deterministic care pressure from their real energy, hydration, caregiver distance, nearby Stalker danger, shelter proximity, and accumulated stress. The player receives no new global babysitting meter and no hidden random roll: the family authority classifies the most urgent direct child as hungry, thirsty, separated, frightened, unsettled, or steady from canonical state. Unknown/unrelated young do not consume the player interaction.

When an urgent direct descendant is within reach, the existing **E** interaction becomes **Tend G# young** after higher-priority combat, drinking, and prey-hunting actions. Tending can feed from real shelter stores first, then spend the active parent's own reserves, share water when the child is dry, and reduce accumulated distress. Autonomous baseline nursing remains so non-player caregivers still function, but sustained separation, unmet needs, or nearby predator pressure now raise lineage-child care stress; severe prolonged distress has a small health cost. This makes shelter stocking and staying close during danger matter during the juvenile phase without creating a parallel food or damage authority.

The HUD and dynamic objective surface the most urgent young and point back to that actual descendant. Care history is retained directly on the descendant: active tending count, danger-days, and average/high-stress exposure are summarized as **thriving / steady / strained upbringing** in the normal generation-handoff detail view. This upbringing summary is lineage history, not a hidden genetic/stat bonus. `tests/family-care.mjs` covers need classification, interaction priority, real shelter-resource consumption, parent reserve costs, stress/health consequences, regroup behavior, RNG isolation, and handoff continuity. `tools/runtime_screenshot.py` adds a `family-care` scenario for real Chromium proof.

## Previous pass — learned predator landscape + family routing (v0.67.0)

v0.67 turns the den knowledge from v0.65–0.66 into a real family/home decision input. The lineage still receives no omniscient territory map: unknown Stalker dens do not alter route planning. Once a scrape has actually been read, its active den radius contributes a learned risk field around that site. A takeover of a previously learned scrape keeps the location known but marks its ownership reading stale, adding uncertainty until the player rereads the new tracks. A learned den abandoned because its owner died or relocated after a takeover creates a short-lived predator-gap opening that decays over four simulation days. All of these calculations are deterministic and remain inert when `player:false`.

Founder-connected autonomous GenVo8 now use that learned landscape when roaming and feeding. Familiar roaming targets that would enter a learned active den are bent back toward the safe side of the learned home range; stale remembered food inside a newly dangerous learned range is no longer trusted; sampled food targets are scored down by learned den risk and modestly up by a recent learned opening. Migration/home-quality scoring now includes known-den risk, stale-sign uncertainty and territory openings, so a predator takeover can genuinely change whether home still looks viable without inventing a scripted migration quest. Unknown dens continue to affect the family only through ordinary nearby predator perception.

The objective strip can briefly surface **Stalker territory shifted near home** after a relevant learned takeover, and the migration/home inspectors report the three landscape components separately. Migration reasons prioritize **stalker territory changed** or **learned Stalker pressure** when those are the dominant new home pressure. Relevant shifts are also written into the existing cognition/field-note history. `tests/stalker-landscape.mjs` covers knowledge gating, migration scoring, family route avoidance, takeover uncertainty, temporary abandoned-range openings, rereading, RNG isolation and full headless inactivity. `tools/runtime_screenshot.py` adds a `territory-shift` scenario plus optional migration/territory panel capture for runtime proof.

## Previous pass — Stalker territorial competition + den takeover (v0.66.0)

v0.66 lets mature Stalkers contest overlapping live-run territories instead of behaving as isolated predator islands. The system remains entirely inside `StalkerTerritoryController` and is still inert when `player:false`, so the established benchmark ecology is not rebalanced. Competition uses existing inherited body/motion genes plus current health, energy, and age condition; it consumes no simulation RNG and adds no hidden personality/dominance stat.

When two active dens overlap substantially, near-even adults respect the contested boundary, while a clearly stronger adult may approach the rival scrape. The weaker resident yields as the challenger presses the core. Reaching the rival core transfers ownership of that persistent world site: the winner abandons its former scrape, the loser is displaced for a bounded recovery period and must move clear before establishing another den, and the captured site keeps its physical history instead of being deleted/recreated. Player-facing hunt phases and canonical `tryKill()` remain separate and retain priority over territorial competition.

Den literacy now has a reason to become stale. If a previously read scrape changes owner, its tactical reading is invalidated until the player rereads the fresh sign. The objective strip reports **Changed Stalker sign**, the E hint becomes **Reread changed Stalker signs**, and the renderer adds only restrained crossed fresh scuffs rather than a takeover icon or territory radius. Rereading records the new owner style in existing cognition history and notes that new tracks cross older sign. `tests/stalker-territory-competition.mjs` covers deterministic dominance, challenge/yield, takeover, knowledge invalidation, displacement/re-establishment, and headless isolation. `tools/runtime_screenshot.py` includes a `den-takeover` real-runtime scenario.

## Previous pass — readable Stalker sign + den literacy (v0.65.0)

v0.65 makes Stalker dens useful information instead of only danger. Standing on an unread active or abandoned scrape exposes **E · Read Stalker signs** after higher-priority combat/drink/prey interactions. Reading a den does not break camouflage, does not consume simulation RNG, and records the observation in the controlled GenVo8's existing cognition/field history. The learned site stays known through lineage handoffs because the knowledge belongs to the persistent world-site record rather than a new campaign resource.

The information is physical rather than a raw genetics label: deep straight gouges imply an early, fast commitment; broken stop-start tracks imply a more hesitant hunter that may retreat after a clean wound; side-scuffed drag marks imply a circling hunter that waits until close. Active sites also report whether use is fresh and whether the owner is close/near/away. Abandoned sites remain readable until the existing den fade removes them. Once read, tiny style-specific track details become legible on the scrape itself; no map radius, icon, or debug overlay is added.

`tests/stalker-den-reading.mjs` covers interaction priority, persistent site knowledge, cognition history, concealment preservation, RNG isolation, abandoned-den continuity, and headless inactivity. `tools/runtime_screenshot.py` now includes `den-read` and `den-abandoned` scenarios so both states can be verified in the real Chromium runtime.

## Previous pass — persistent Stalker dens + defended home ground (v0.64.0)

v0.64 gives mature Stalkers persistent player-run home sites without changing the benchmark ecology. `StalkerTerritoryController` is inert when `player:false`; in a live run it derives a den from an adult Stalker's existing position and inherited temperament without consuming simulation RNG. The den is a home anchor rather than a new resource/spawn system.

Well-fed Stalkers may return toward their den instead of wandering indefinitely, and very well-fed adults can rest at the scrape. Entering the owner's inner den core raises player-facing commitment pressure: a Stalker can defend its home ground even when it is too satiated for ordinary prey pursuit. Repelled predators may retreat toward their den when that route is safer than simply fleeing away from the player. Canonical `tryKill()` still owns all hit chance/damage.

The den itself is visible as a restrained ground scrape with dragged vegetation/scratch marks and, after successful predation, small remains. The objective strip warns when the player is physically inside an active den core. Abandoned sites fade from presentation after several simulation days. `tests/stalker-territory.mjs` covers RNG isolation, den pressure, satiated home defense, return behavior, feeding traces, and full headless inactivity. Runtime screenshot tooling now includes a den scenario so this world-readable change can be verified in real Chromium.

## Previous pass — Stalker temperament variation + restored runtime capture (v0.63.0)

v0.63 keeps the readable v0.62 hunt phases but stops every player-facing Stalker from using the same timing. The variation is derived from each Needlejaw's existing inherited `temperament` gene rather than a new hidden personality roll: low-temperament hunters are wary, high-temperament hunters rush, and the middle range uses an ambush style. Background predator/prey ecology is unchanged.

**Ambushers** close more slowly, stalk toward a lateral/flanking point and wait until they are closer before winding up. **Rushers** close faster, commit from farther away, expose a shorter wind-up and use the fastest charge with a shorter recovery. **Wary** Stalkers give a longer counter window and slower commitment; a successful player wound can drive them into the existing player-aversion/escape path for a brief retreat. All actual hits and damage remain owned by canonical `tryKill()`.

The objective strip now reads the actual encounter style without displaying raw genetics: a circling ambusher, bearing-down rusher, or distance-testing wary hunter receives different tactical guidance. `tests/predator-variation.mjs` covers profile derivation, flank targeting, commitment timing, charge speed, counter windows and wary retreat.

This pass also restores the earlier **real Chromium screenshot workflow**. `tools/runtime_screenshot.py` injects the canonical HTML/CSS into an in-memory page and fulfills the real ES-module/assets graph from a synthetic HTTPS origin, avoiding the environment's localhost/`file://` block. It can capture normal play or stage a real predator phase while still using the canonical runtime renderer/UI. Runtime screenshots are again mandatory for visible work; static renders are not accepted as proof.

## Previous pass — readable Stalker encounters (v0.62.0)

v0.62 turns player-facing Stalker pressure into a readable encounter instead of letting close pursuit collapse directly into contact RNG. Only Stalkers actively hunting the controlled GenVo8 use this layer: the background predator/prey ecology remains on the canonical hunt path used by headless simulation.

A player hunt now moves through **stalk → wind-up → charge → recovery**. Stalking closes more slowly, wind-up briefly plants the Stalker before commitment, charge is substantially faster, and every charge attempt ends in a short recovery window. Damage still resolves through the existing `tryKill()` authority, so the pass does not create a second combat model.

The phases create explicit player responses. Sprinting can reopen distance before commitment; evolved camouflage can break a stalk/wind-up when real cover conceals the player; a successful counterbite during wind-up interrupts the attack; family-rally abilities remain usable as the social-defense answer. The objective strip temporarily surfaces wind-up/charge danger over long-term family goals, and the existing Stalker audio cues now follow the real encounter phase rather than distance alone.

`tests/predator-encounter.mjs` covers stalk pacing, wind-up, charge speed, canonical damage, recovery, concealment break, and counterbite interruption. Existing gameplay-pressure, strategy, audio, renderer, and headless ecology tests remain authoritative around it.

## Previous pass — lineage theme + generational composition (v0.61.0)

v0.61 gives GenVo8 one canonical musical identity instead of letting adaptive state changes read like unrelated background patterns. `GENVO_THEME` is an eight-note contour shared by calm exploration, later-generation phrases, strategy variations, and generation handoff stingers. The Rule of 8 remains composition language rather than a content ceiling: the scheduler builds a four-phrase / 32-step form from those eight-note cells instead of endlessly repeating a single eight-step loop.

The form develops with the controlled lineage. Generations 1–2 hear sparse fragments, generations 3–4 reveal more of the response, generations 5–7 carry nearly complete phrases and added harmony, and Generation 8+ can open the cadence into a higher register. Evolutionary branches color the answer to the shared motif rather than replacing it, and handoff stingers resolve from the same lineage theme. Five authored music assets add the canonical theme and branch colors while preserving the earlier sound pack byte-for-byte.

The musical mix remains **unapproved until auditioned in the real packaged runtime**.

## Previous pass — event-specific sound design + transition mix (v0.60.0)

v0.60 deepens the hybrid audio system without changing gameplay authority. The authored pack now contains 27 source-owned PCM WAVs. Food interaction is no longer one generic bite: Moss, Berries, Reeds, Mushrooms, Seed Pods, and carrion each select a distinct authored texture from the canonical interaction result. Shelter construction, repair, and storage use separate plant/material sounds, while family alarm, rally, courtship, and newborn events have distinct GenVo8 vocal shapes instead of relying on pitch-shifted copies of one call. Manual prey hunting now correctly maps successful/missed bites into the combat sound vocabulary.

Wet habitat and actual water-edge presence are now separate perceptual states. The existing field/wetland beds still follow canonical moisture/seepage, while a third water-edge bed rises only from real shoreline/drink proximity using `waterDistance`/seepage. It creates no water state and does not change navigation or hydration.

Stalker warning now escalates through real threat state: normal proximity rattle, a stalking cue as derived danger enters the serious band, a sharper charge cue at high danger, then the existing canonical lunge cue only after a real damage event. Concealment still suppresses derived danger, so hiding can soften escalation without deleting the real predator. Warning stages never spawn, move, retarget, or predict attacks.

Mix transitions are also less abrupt. Danger texture attacks faster than it releases, shelter/ambience layers crossfade more slowly, and generation-handoff stingers briefly duck music and ambience before the adaptive score returns. The original v0.59 WAV files remain byte-identical; v0.60 only adds new assets/layers around them. `tests/audio.mjs`, `tests/audio-assets.mjs`, and `tests/audio-runtime.mjs` cover food routing, shoreline state, threat-stage derivation, authored decoding, mix ducking, and positional escalation. The mix remains **unapproved until auditioned in the real packaged runtime**.


## Previous pass — authored soundscape + spatial creature identity (v0.59.0)

v0.59 turns the v0.58 Web Audio foundation into a hybrid authored/procedural soundscape. Eleven project-owned PCM WAV assets now live under `assets/audio/`: field and wetland ambience beds, lineage/shelter/danger music textures, GenVo8 call/hurt voices, Hopper and Digger fauna calls, and separate Stalker proximity-rattle and lunge cues. The assets are deterministically generated by `tools/generate_audio_assets.py`; no third-party samples or licensed music are required. If authored files fail to load, the procedural v0.58 layer remains a valid fallback.

Authored loop stems stay inside the canonical music/ambience buses and crossfade from real local state. Wet terrain raises the wetland bed, shelter proximity raises the warm shelter texture, and real nearby Stalker pressure raises the danger texture. The procedural eight-position score remains above those beds; the active lineage's newest strategic branch now colors its phrase shape, so stealth, offense, social-defense, and provisioning families acquire subtly different musical fingerprints without granting gameplay effects.

Creature sound is positional. Nearby autonomous Hopper, Digger, and GenVo8 may emit sparse calls from their actual world coordinates. A nearby active Stalker uses a dedicated positional rattle whose cadence tightens with danger; an actual Stalker hit plays a sharper lunge from the attacker's position plus the controlled GenVo8's hurt vocal. Stereo panning is used when `StereoPannerNode` exists, with distance attenuation and a safe mono fallback. Wildlife timing uses AudioDirector's private deterministic audio PRNG and never consumes simulation RNG.

`tests/audio-assets.mjs` validates every authored WAV header, duration, level/headroom and total web payload; `tests/audio-runtime.mjs` now covers authored decoding/loop startup and positional panning in addition to the existing mixer and cue scheduler. This is still an **unapproved mix/art pass until auditioned in the real packaged runtime**.


## Previous pass — adaptive sound + music foundation (v0.58.0)

v0.58 introduces GenVo8's first canonical audio authority in `src/audio/`. Audio is presentation-only: it reads simulation/player state and explicit interaction results but never consumes simulation RNG, changes ecology, or owns gameplay state. `AudioDirector` lazily unlocks Web Audio after a player gesture, maintains separate master/music/SFX/ambience buses, persists the mute preference, and can be muted/unmuted with **U**. The implementation is deliberately centralized so later authored WAV/OGG assets can replace individual procedural cues without scattering sound calls across simulation modules.

The first sound vocabulary covers controlled movement rustle, eating, drinking, successful/missed bites, kills, damage, camouflage, family alarms/rallies, food carrying/storage, shelter construction/repair, courtship, founder-line births, and generation handoffs. Founder-line birth cues watch canonical lineage records rather than global ecosystem birth counts, preventing unrelated wildlife reproduction from flooding the mix.

The first score is adaptive rather than a single background loop. It uses a sparse eight-position musical grammar (the Rule of 8 as composition language, not a content cap), with calm exploration, shelter/family warmth, concealed/quiet texture, and Stalker-danger tension derived from real local state. Seasons shift the tonal root and later generations subtly alter register. Danger adds a restrained pulse and ducks ambience; hiding narrows the environmental bed. Generation handoffs receive an eight-note lineage stinger, with distinct shapes for death handoffs and the Generation 8 establishment milestone.

No external music/SFX files are required in this pass; the initial palette is synthesized through Web Audio so the architecture and gameplay mix can be judged before committing to final authored assets. `tests/audio.mjs` covers cue mapping, the eight-step score grammar, calm/danger scene derivation, semitone math, and the contract that audio presentation does not consume simulation RNG or require Web Audio in headless tests. This is a **foundation/mix pass, not final audio approval**.

## Previous pass — multi-generation strategy arcs (v0.57.0)

v0.57 makes repeated use of the same evolutionary strategy form a visible multi-generation practice arc. The arc is derived from the existing founder-line genealogy: when a controlled generation completes its real field encounter, that completion is written into that animal's canonical lineage record. A descendant only receives deeper branch practice when the immediately preceding ancestry path completed the same branch in consecutive generations. Switching to another strategic branch, skipping the encounter, or leaving a generation without a completed branch breaks that streak. There is no separate campaign ledger, scripted quest state, spawned resource, or permanent hidden stat bonus.

The field situation itself escalates with consecutive practice. Stealth families must complete more concealed feeds and later do so inside a tighter Stalker risk envelope; home-defense families cover a wider learned range and must hold it through more successful strikes unless they kill the intruder; social families can surface threats across a broader nursery area but later practice requires multiple mature relatives to answer the rally; provisioning families are sent progressively farther beyond the shelter core while still moving real biomass through the existing carry/deposit mechanics. Arc depth is capped for encounter scaling so long-running lineages do not turn optional strategy play into unbounded grind.

Completed handoff summaries now include how many consecutive generations actually practiced that strategy. `tests/strategy-arcs.mjs` covers genealogy-derived streaks, branch-switch resets, repeated stealth completion, branch-specific escalation profiles, and persistence through the canonical lineage record.

## Previous pass — generation-scale strategy encounters (v0.56.0)

v0.56 turns the four inherited strategy branches into distinct player-facing field situations inside an ordinary generation. The specialization controller does **not** spawn quest enemies, bonus food, scripted children, or parallel territory. Instead it recognizes useful situations already present in canonical simulation state and surfaces one current branch-specific opportunity through the existing field objective/guide system. Camouflage lineages can be guided toward real covered food inside a Stalker's risk envelope and complete the encounter only by actually feeding while concealment still defeats that nearby predator. Heavy/Crushing Jaw lineages can be called to defend an established learned home range from a real Stalker; a kill, recoil, or two successful home-range strikes clears the encounter. Mobbing/Coordinated Defense lineages surface a real Stalker threatening dependent kin and complete the encounter by rallying at least one other adult family member around the threatened nursery. Grasping/Provisioning lineages can be sent on a long supply run to real edible biomass beyond the home core and complete it only after physically carrying that load back into the family shelter.

The most recently inherited strategic branch is the generation's active field style when a lineage has accumulated several adaptations. Core survival/family progression still takes priority: home establishment and shelter construction are never replaced, while provisioning can become the preferred way to satisfy an understocked shelter. Completed strategy play is written into the individual's existing cognition history and appears in the next generation handoff recap, giving the lineage a record of what the previous generation actually practiced. Immediate interaction feedback also confirms when the branch encounter is completed. `tests/strategy-encounters.mjs` covers all four encounter types, real-resource conservation/integration, branch completion, and handoff-summary continuity.

## Previous pass — evolutionary strategy consequences (v0.55.0)

v0.55 makes the four multi-generation strategy branches alter the opportunities and risks a founder-line family can exploit across an ordinary generation, rather than only changing emergency reactions. Camouflage descendants can feed from real plant/carrion biomass while concealed in sufficiently dense cover under Stalker pressure; the active player may also eat quietly without dropping concealment, while drinking, hunting, attacking, sprinting, ordinary movement, sparse cover, or close detection still expose them. Heavy/Crushing Jaw adults now recognize a Stalker inside an established home core as a proactive defense target when they are healthy and well fed, with Crushing Jaw supporting the wider patrol radius. Mobbing/Coordinated Defense adults can rally for threatened dependent relatives beyond their own offspring, creating a family nursery-defense behavior instead of parent-only protection. A stocked shelter now gives Grasping/Provisioning descendants a bounded operating-range increase and a longer cached-food return radius; the benefit disappears when the shelter is empty, so expansion is paid for by actual stored food rather than a permanent free movement bonus.

All new strategy consequences remain founder-line scoped. They read canonical shelter, territory, plant/carrion, family and predator state rather than creating parallel resources or territory ownership. `tests/lineage-strategy.mjs` covers stealth feeding/resource use, home-core patrol, non-parent nursery defense, stocked-shelter range expansion, and the active player's quiet concealed feeding.


## Previous pass — lineage specialization behavior (v0.54.0)

v0.54 makes inherited strategy branches change how autonomous founder-line descendants survive, so a lineage keeps its evolutionary identity even when the player hands control to another generation. Camouflage descendants now choose concealment under Stalker pressure and Adaptive Chromatophores can withdraw through dense cover while staying hidden. Heavy/Crushing Jaw adults can counterattack when healthy instead of always fleeing. Mobbing/Coordinated Defense adults can initiate a cooldown-limited family rally without requiring the active player to press X. Grasping/Provisioning adults can physically gather real food biomass, carry it home, and stock an underfilled family shelter; no food is created by the behavior. These rules apply only to founder-line GenVo8 and do not grant the behavior to unrelated animals or other species.

## Previous pass — evolutionary branch depth (v0.53.0)

v0.53 turns four v0.52 strategies into real multi-generation branches instead of leaving the adaptation pool flat. Adaptive Chromatophores require Camouflage Mantle and let a concealed animal move cautiously through dense cover; Crushing Jaw requires Heavy Jaw and upgrades direct anti-Stalker combat; Coordinated Defense requires Mobbing Instinct and makes rallied adult family brace and strike together more effectively; Provisioning Pouches require Grasping Limbs and roughly double carried food loads. Second-stage mutations cannot appear before their prerequisite adaptation is already present in the lineage.

## Previous pass — evolutionary strategies (v0.52.0)

- Added Camouflage Mantle, Heavy Jaw, Mobbing Instinct, and Grasping Limbs as active strategy branches.
- Added V-key concealment, X-key family rally, Z-key food carrying, and stronger direct combat specialization.
- Mutation offers prefer different strategy branches when possible rather than presenting three near-identical answers to one pressure.

## Previous pass — evolutionary agency foundation (v0.51.0)

- Added pressure-driven major adaptation choices at lineage handoff.
- Added inherited major adaptations separately from the eight continuous gene families.
- Added basic desperate Stalker combat plus the first defensive, mobility, survival, and family-signal adaptations.

## Previous pass — shelter progression + renderer performance hotfix (v0.50.1)

- Fixed the pregnant-player shelter objective: after a successful build it now advances to stocking the shelter, then to preparing for birth once food is stored.
- N/F shelter actions now provide immediate success/failure feedback instead of silently relying on the next HUD refresh.
- Cached daily sub-tile habitat masks and static habitat composition/river topology data.
- Removed an accidental per-subcell habitat-identity recomputation from the land renderer (the same tile identity had been recalculated 64 times per tile per frame).
- Habitat scene summaries now refresh at simulation-second/camera-window cadence instead of rebuilding every animation frame.
- Simulation, ecology, resources, saves and gameplay balance are unchanged from v0.50.0.

## Previous pass — survival pressure + direct player agency (v0.50.0)

- Removed the active animal's hidden survival autopilot. When the player stops moving, the controlled GenVo8 now waits for input instead of autonomously seeking food, water, escape routes, migration, or other survival targets. Autonomous family members keep their existing AI.
- Opening protection now lasts through the basics but ends immediately when the first pairing succeeds (or when the tutorial is skipped); a long fail-safe cap remains only so an abandoned tutorial cannot grant permanent immunity.
- After protection ends, the actively controlled animal uses a faster player-session needs cadence so hunger and thirst create decisions on a human playtest timescale without changing autonomous ecosystem metabolism.
- A nearby Stalker can now commit to the actively controlled GenVo8 even when other prey is more globally abundant. This player-facing threat rule is isolated from headless ecology, preserving the established predator/prey balance.
- Stalker hits against the active player are severe but intentionally non-one-shot in ordinary cases, creating a real sprint/escape decision and recording immediate hit feedback. Autonomous predator damage remains unchanged.
- `E` can now hunt nearby edible Hopper/Digger prey. A bitten or missed-at prey temporarily recognizes the active GenVo8 as a threat and flees, so hunting is an actual pursuit rather than free repeated interaction.
- Adult family members now receive modest predation protection while physically inside their own intact shelter; dependents keep the stronger shelter protection already modeled.
- The post-courtship objective flow now surfaces existing gameplay systems in sequence: establish a home range, build a family shelter, store food, protect young, then hand off to a mature descendant. Immediate threats are handled by the in-world context warning so they do not replace the longer-term objective.
- Added `tests/gameplay-pressure.mjs` covering direct-control idle behavior, opening-grace release, player-time needs pressure, manual hunting/flee response, survivable Stalker damage, adult shelter protection, and close Stalker commitment to the active lineage.


## Previous pass — behavioral body language (v0.49.0)

- Added `src/render/behavior.js` as a renderer-only action interpreter shared by GenVo8 and the three other animal families.
- Searching for food/water, feeding, drinking, courting, guarding, fleeing, stalking/hunting, social rest, exhaustion and injury now produce distinct body-language parameters rather than collapsing into generic locomotion.
- GenVo8 uses stance width, body height/lean, feeler sweep/pinning, eye posture and an asymmetric limp/recoil to communicate current state without adding HUD text.
- Hopper lowers its head while searching and changes ear/flight posture; Digger works its foreclaws during forage and braces while guarding; Stalker keeps separate stalking/hunt/flight emphasis.
- Territorial `ward` and `avoid-intruder` intents now map to guard/flight presentation, while simulation intent and AI remain unchanged.
- Added `tests/behavior-readability.mjs` to prove deterministic action interpretation and no simulation RNG mutation.

## Previous pass — habitat transitions + visual wayfinding (v0.47.0)

- Added `src/render/wayfinding.js`, a renderer-only layer that detects real moisture, thicket, openness, and fertility gradients and stages sparse transition cues where habitat character actually changes. It creates no roads, pathfinding, traffic, resources, collision, or named biome state.
- Ecotones now taper visually instead of relying only on palette changes: wet edges can show damp/reed lead-ins, dense habitat breaks into leaf/shadow fragments, clearing edges use restrained dry-ground cues, and richer ground can show small growth transitions.
- Regional focal landmarks now receive a short visual approach chosen from the most open nearby canonical habitat. The approach consists only of diminishing habitat marks appropriate to the focal (mud/reeds, leaf/root fragments, stone chips, or young-growth traces); it is explicitly not a navigation route or simulation trail.
- Transition/focal approach placement is deterministic, sparse, season-aware, consumes no simulation RNG, and never writes back to ecology.
- Added `tests/wayfinding.mjs` covering deterministic transition selection, normalized gradients, multiple ecotone types, focal approaches, deterministic drawing, and no ecology/RNG mutation.
- Runtime review uses the exact canonical module graph in Chromium. Visual quality remains in progress and is not approved/final.

## Previous pass — regional focal landmarks (v0.46.0)

- Added `src/render/regional-focal.js`, a presentation-only regional composition layer that selects at most one strong focal landmark per broad map region from the existing canonical habitat scenes. It creates no resources, shelters, collision, navigation, or ecology state.
- Focal selection is intentionally sparse and deterministic. The canonical runtime seed currently resolves only six broad-region focals across the full 128×128 world after rejecting world-edge candidates, so landmarks remain navigation memory rather than another procedural scatter layer.
- Watering margins can become larger reed coves/shelves; strong berry habitat can become a grove; deep thickets can expose an old-root composition; fungal hollows, dry clearings, recovery meadows, and established trails have matching focal silhouettes when their underlying ecology is strong enough.
- Regional focals persist from the same scene/seed logic and participate in seasonal palette changes, reinforcing place identity without regenerating the map each season.
- Runtime review rejected edge-clipped landmarks, so regional candidates within ten tiles of the world boundary are now excluded from the limited focal budget.
- Added deterministic `tests/regional-focal.mjs` covering sparsity, one-focal-per-region authority, visual diversity, deterministic drawing, no simulation RNG consumption, and no ecology mutation.
- Fresh Chromium in-memory execution loaded 48 canonical modules as v0.46.0 with zero console/page errors during final visual review. Visual quality remains in progress and is not approved/final.


## Previous pass — habitat identity + seasonal field character (v0.45.0)

- Added `src/render/identity.js`, a renderer-only habitat identity layer that derives broad local character from existing moisture, fertility, composition, plant biomass, and water topology. It creates no named biome authority and never writes back to simulation state.
- Ground palette now receives a restrained large-scale regional bias, so river meadow, open meadow, dry grass, rich hollows, and deep thickets can remain visually recognizable without hard biome borders or repeated decoration stamps.
- River presentation now distinguishes pools, bends, narrows, and ordinary runs from real nearby water topology. These distinctions only affect surface tone/current marks and do not imply depth, current forces, or different drinkability.
- Seasonal presentation is now coherent across canonical flora, foreground vegetation, scene-scale reeds/young growth, landmarks, ground traces, and water tone. Spring emphasizes fresh growth/blossom cues; summer matures/drys seed structure; autumn warms/litters fruiting habitat; winter desaturates/dormants reeds, shrubs, moss, and wet ground.
- Seasonal differences preserve the same underlying place rather than regenerating scenery: habitat identity and landmark placement remain deterministic for the world seed while only presentation changes with season.
- Added deterministic `tests/identity.mjs` covering multiple habitat identities, river classifications, seasonal divergence, no RNG consumption, and no ecology mutation.
- Fresh Chromium in-memory execution loaded 47 canonical modules as v0.45.0 with no runtime/page errors during the final visual review. Visual quality remains in progress and is not approved/final.


## Previous pass — terrain identity and macro landmarks (v0.44.0)

- Added `src/render/terrain-motifs.js`, a presentation-only macro-landmark layer that turns strong existing habitat scenes into a restrained set of larger recognizable terrain forms.
- Watering margins can stage broad earth shelves and bend shelves derived from real nearby water topology; repeated real traffic can become worn lanes or water approaches; dense berry thickets can expose root-lined pockets; dry clearings, decomposition hollows, and recovery areas have their own inert terrain reads when the underlying ecology supports them.
- Terrain motifs never create drinkable water, bridges, caves, resources, shelters, collision, navigation, traffic, or ecology state. They only summarize canonical hydrology, biomass, history, and composition.
- Large motifs are intentionally gated so they remain memorable landmarks rather than another every-block procedural texture.
- Removed two older grid-revealing presentation shortcuts discovered during runtime review: per-tile thicket bars and bottom-edge wet/fertile relief bars. Dense-habitat shade is now sparse and irregular instead of forming repeated horizontal rows.
- Added deterministic `tests/terrain-motifs.mjs`; existing composition/depth tests were kept green. Visual quality remains in progress and is not approved/final.


## Previous pass — authored flora and habitat landmarks (v0.43.0)

- Added `src/render/flora.js` so the five canonical plant families use deliberate multi-part pixel silhouettes rather than generic stacked rectangles: moss rosettes, branching berry shrubs, fan-shaped reeds, irregular mushroom clusters, and branching seed-pod stems.
- Seedlings now have an authored two-leaf silhouette and remain tied to the existing seed-bank/plant authority.
- Added `src/render/landmarks.js`, a sparse presentation-only landmark layer driven by the real habitat scenes already produced from moisture, biomass, traffic, grazing, recovery and decomposition.
- Strong ecology can now stage signature reed fans, mushroom rings, mature berry thickets, pod stands, moss hummocks, young-growth patches, trail roots, or inert clearing stones. Resource-like landmarks are gated by the matching real plant biomass; they never create food, collision, navigation state, or simulation objects.
- Landmark silhouettes can cross the animal plane only in restrained foreground fragments, building recognizable places without returning to uniform procedural decoration.
- `renderer.js` delegates plant and landmark art to dedicated modules and remains an orchestration layer.
- Added deterministic `tests/flora-landmarks.mjs`. Visual quality remains in progress and is not approved/final.


## Previous pass — habitat depth and lighting hierarchy (v0.42.0)

- Added `src/render/depth.js`, a presentation-only interpreter for localized habitat shade, open-ground light, bank undercuts and directional creature grounding shadows.
- Dense real vegetation/thicket structure now casts broken southeast canopy shade while open glades retain brighter ground flecks; there is no global vignette or simulation-facing light state.
- Water margins gain a restrained dark undercut and light soil lip so river water reads lower than adjacent land without changing hydrology or collision.
- Creature shadows now respond to body scale, movement, moisture and local habitat shade and are offset consistently from the north-west light direction instead of using a centered rectangle.
- Dense thicket scenes can place a few overhanging foreground fragments across the animal plane, strengthening foreground/background separation without hiding whole creatures.
- Added deterministic `tests/depth-render.mjs`; all depth interpretation is read-only and consumes no simulation RNG.
- Visual quality remains in progress and is not approved/final.

## Previous pass — family field journal (v0.40.0)

- Replaced the old plaintext L-key family inspector with an authored field-journal leaf laid over the living world. It is intentionally not a card/dashboard and keeps normal play HUD-free while open.
- The journal browses every recorded founder-line animal with Q / E, renders each animal through the same GenVo8 portrait authority used by gameplay/handoffs, traces its ancestry, and shows parents, children, life/death record, visible founder drift, remembered food/water, home-range history, migration/refuge history, and recent field notes.
- H can still hand control to the selected living grown descendant when valid; internal lineage IDs and simulation authority are unchanged.
- Added `src/ui/journal.js` as a read-only presentation/controller layer and `assets/ui/journal-edge.png` as a bespoke irregular pixel edge.

## Previous pass — authored UI reset (v0.39.0)
- Replaced the modern dashboard/card visual language in normal play with a sparse world-overlay interface. The HUD no longer uses a branded slab, rounded cards, gradients, or generic progress-bar chrome.
- Added a small authored pixel-asset vocabulary under `assets/ui/`: body condition, seed/energy, water, family, lineage, handoff, mark, stitched rule, and an irregular field-frame asset. Primary HUD status and lineage progress now use those assets rather than CSS-only symbols.
- Tutorial goals are unboxed field annotations; world interactions remain attached to the creature; temporary notices are narrow marks rather than floating web-style cards.
- Rebuilt the opening screen as title typography laid directly over the dimmed running world with a single stitched rule and restrained controls.
- Rebuilt generation handoff as a full-screen scene: transparent parent/descendant portraits, an authored handoff arrow, plain visual-change callouts, an eight-organism lineage mark, and optional inheritance details. There is no centered modal card.
- Secondary inspectors retain a deliberate chunky field frame because they are intentional information views, but now use one shared pixel frame asset rather than generic panel gradients.
- Added `tests/ui-art-direction.mjs` to guard against the old rounded-card/gradient vocabulary returning to the primary interface and to verify the authored UI assets exist.
- This pass changes presentation only. Simulation authority, inheritance math, ecology, saves, and RNG remain unchanged. Visuals remain **not final/approved**.

## Previous pass — generation reveal (v0.38.0)
- Rebuilt lineage handoff around a **visual parent → descendant reveal** instead of a statistics-first text report. The previous controlled animal and the new descendant are drawn side-by-side from their canonical recorded genes using the same shared GenVo8 body renderer used in gameplay.
- The first glance now shows only the most visible inherited differences (for example longer legs, larger frame, altered eyes/feelers, color, or family markings). Detailed inherited shifts, founder drift, lived pressures, and death cause remain behind an optional **See inherited details** disclosure.
- Added `src/render/genvo-draw.js` so gameplay and lineage portraits share one GenVo8 drawing authority rather than maintaining separate sprite implementations. This refactor reduces `renderer.js` while keeping presentation modular.
- Added `src/render/lineage-portrait.js` for deterministic recorded-gene portraits and `src/ui/generation-reveal.js` for plain-language reveal models. Neither module writes simulation state or consumes simulation RNG.
- Generation 8 receives the same visual comparison with an establishment message rather than a larger wall of text; later generations continue normally. Death handoffs emphasize that the family survived before exposing technical detail.
- Keyboard interaction preserves access to the optional details disclosure instead of treating Space/Enter inside it as an automatic transition confirmation.
- This pass changes presentation only. Gene values, inheritance math, ecology, lineage authority, save data, and simulation RNG are unchanged. Visuals remain **not final/approved**.

## Previous pass — visible inheritance + authored vocabulary (v0.37.0)
- Reworked the **player-facing vocabulary** to remove the compound-word / system-generated tone while preserving every internal simulation identifier for save, test, and ecology compatibility. Player labels now use plain common names: **Moss, Berries, Reeds, Mushrooms, Seed Pods; Hopper, Digger, Stalker; Marsh fever**. Internal keys such as `bramble`, `mosskip`, `rootling`, `needlejaw`, and `mirefever` are unchanged.
- Rewrote tutorial, interaction, inspector, migration, shelter, disease, mating, selection-pressure, and generation copy toward shorter natural game language. Technical phrases such as raw biomass/selection terminology remain available internally but no longer dominate player-facing prose.
- Strengthened **visible inheritance** without changing gene simulation values. Existing body, motion, metabolism, digestion, senses, climate, immunity, and temperament genes now map more visibly to frame size, leg reach, eye/feeler scale, mantle tone, organic markings, and stance. Descendants remain recognizably GenVo8 while family differences become readable at normal play scale.
- Generation handoff text now calls out both inherited trait changes and visible appearance changes, with detailed values remaining optional rather than becoming the primary reward.
- Added `tests/inheritance-visual.mjs` for deterministic phenotype-to-morphology mapping and `tests/vocabulary.mjs` to prevent stale generated-style player labels from returning.
- This pass changes presentation/readability only. It does **not** change gene inheritance math, ecology authority, animal decisions, save structure, or the simulation RNG stream.
- Visuals remain **not final/approved**; this pass makes the existing simulation easier to recognize and care about rather than declaring the art complete.

## Previous pass — ecological scene composition (v0.36.0)
- Added `src/render/scene.js`, a deterministic renderer-only interpreter that scores recognizable local scenes from canonical moisture/fertility, standing biomass, water adjacency, and real environmental-history fields. It creates no ecology state and consumes no simulation RNG.
- Added `src/render/scene-detail.js` for multi-tile backdrop/foreground staging. Watering margins, feeding grounds, dense pockets, open clearings, fungal/decomposition pockets, recovery areas, and mature game trails can gain distinct visual structure while remaining truthful to existing simulation data.
- Scene anchors are deliberately sparse: each visible 8×8 area evaluates several candidate locations and only stages a strong ecological read, preserving negative space instead of filling every block with decoration.
- Reworked environmental-history trail presentation so traffic segments orient from neighboring **real traffic values**. Repeated animal routes can therefore visually connect across cells rather than appearing as unrelated horizontal/vertical soil marks. Traffic authority and decay remain unchanged.
- Multi-tile scene art is split from `renderer.js`; backdrop and foreground layers let vegetation/river margins frame creatures without turning the core renderer into another art god-script.
- Added `tests/scene.mjs` for deterministic anchors, normalized scene scoring, initial scene diversity, traffic-to-trail readability, and no-RNG behavior.
- This pass addresses world composition/readability from the post-foundation audit. It remains **not final visual approval**.


## Previous pass — field-interface hierarchy (v0.35.0)
- Rebuilt the normal HUD around the Rule of 8 instead of generic RPG bars. Health, energy, water, and lineage milestone progress now use compact eight-step indicators with low/critical emphasis only when needed.
- Removed the permanent GenVo8 brand slab from normal play. The top-left interface is now a smaller lineage/field readout: generation sigil, life stage, mood, family state, world clock, and survival needs.
- Tutorial objectives now use a compact GUIDE card during the four onboarding steps and collapse to a quieter FIELD NOTE once the player understands movement, water, food, and courtship.
- Context prompts no longer occupy a permanent bottom bar. They appear near the controlled creature only for immediate interactions, real danger, or critical needs. Routine simulation advice remains in the world cues and optional inspectors.
- Notifications now share one neutral field-note visual language with explicit safe/success/warn tones; opening protection no longer looks like an error warning.
- Added `src/ui/presentation.js` as a pure presentation helper for eight-segment levels, need severity, family labels, and context tone. It owns no simulation state.
- Deep ecology/lineage/memory/territory/shelter/migration information remains available in the existing secondary inspectors; this pass intentionally reduces normal-play information density without deleting simulation visibility.
- This is a professional UI/readability pass based on the post-foundation design audit and remains **not final visual approval**.


## Previous pass — motion bridging + organic fauna anatomy (v0.34.0)
- Added `src/render/motion.js`, a renderer-only bridge between the canonical 8 Hz simulation ticks. It interpolates visual world position and wrapped 8-frame pose phase without changing animal coordinates, movement speed, intent, targets, ecology, saves, or RNG.
- Frame 7 → frame 0 now interpolates across the short wrapped path rather than visibly snapping backward. GenVo8 radial limbs and non-player fauna accept fractional presentation phases, producing real in-between poses while retaining the Rule-of-8 animation beats.
- Reworked Mosskip, Rootling, and Needlejaw construction around oriented rounded pixel masses and articulated joints instead of large rectangular blocks/straight body bars. Their previous species identities remain: Mosskip spring/ear/haunch emphasis, Rootling low shovel-and-claw body, and Needlejaw long predatory axis.
- Added `src/render/activity-detail.js` for tiny deterministic ground-contact cues derived from existing action state: Mosskip landing disturbance, Rootling digging/soil drag, Needlejaw stalking vegetation displacement, and restrained GenVo8 contact marks. These effects write no tracks or world history.
- Added `tests/motion-render.mjs` covering wrapped phase interpolation, position bridging, no simulation-state mutation, and fractional fauna/GenVo8 pose geometry.
- Fresh Chromium execution used the canonical HTML/CSS plus the canonical ES modules through the in-memory module injection route. Active movement completed with no console/page errors.
- This is another presentation/game-feel pass and remains **not visually approved/final**.


## Previous pass — species personality + habitat depth (v0.33.0)
- Added `src/render/fauna.js`, a deterministic presentation-only pose + pixel-construction module for Mosskip, Rootling, and Needlejaw. It consumes existing direction/action/life state but cannot change simulation behavior or RNG.
- Mosskip now reads as a spring animal: an oversized haunch, tall paired ears, visible compression/leap phases, and extending spring feet create a vertical hop rhythm instead of generic quadruped motion.
- Rootling now stays low to the soil with an arched rear body, dragging tail, projecting shovel snout, and broad alternating digging claws. Feeding visibly works the ground.
- Needlejaw is rebuilt around a long rigid predator axis with a spear-tail, four low bracing feet, paired projecting needle mandibles, and a lower stalking posture.
- Added `src/render/habitat-detail.js` for local renderer-only depth accents. Riparian land now has a layered dark bank foot, damp mud shelf, wet edge, deterministic stones/roots, and moisture-supported reed fringe so rivers sit down into the landscape rather than reading as flat blue cutouts.
- Dense real vegetation can form small renderer-only local clusters around a shared center. These accents remain gated by canonical biomass plus the existing composition field and never create food or habitat authority.
- Added `tests/fauna-visual.mjs` for deterministic species geometry and silhouette/motion distinctions.
- The pass was refactored before release so `renderer.js` remains orchestration-focused instead of absorbing the new species/habitat art; final renderer size is about 628 lines rather than the ~750-line intermediate.
- Fresh Chromium execution of the canonical modules completed with no console/page errors; live runtime inspection covered the normal player view plus Mosskip, Rootling, and Needlejaw camera views.
- This remains a presentation/readability pass and is **not visually approved/final**.

## Previous pass — soft-body GenVo8 locomotion (v0.32.0)
- Added `src/render/genvo.js`, a deterministic GenVo8-specific presentation geometry module. It derives the soft mantle proportions, body offset, face geometry and all eight articulated leg poses without touching simulation state or consuming RNG.
- GenVo8 feet now remain visually planted while the mantle shifts over them, reducing the rigid unit-piece read. Eight radial limbs have longer visible reach, alternating lift phases, bent knees and one-pixel contact toes so they read as limbs rather than square spokes.
- The mantle is rebuilt from rounded pixel rows with directional front mass, breathing/wobble offsets and restrained wet highlights. Movement can deform the body independently of the grounded feet.
- Large embedded eyes, feelers and a persistent mouth seam now belong to the mantle itself. Alarm/fatigue/injury/blink/feed/drink states reshape those features instead of layering detached icons over the sprite.
- The inherited digestion marking remains visible but is now broken into organic side bars rather than a full straight band that read like a mechanical visor.
- Added `tests/genvo-visual.mjs` to verify deterministic geometry, eight independent limb poses, frame-to-frame articulation, alarm expression and rounded mantle construction.
- Fresh actual-browser verification completed through the canonical in-memory module-injection route because localhost navigation is blocked in the test environment. The runtime loaded without console/page errors.
- This remains an incremental creature-art pass and is **not visually approved/final**.

## Previous pass — creature-life + player-facing presentation (v0.31.0)
- Added `src/render/life.js`, a deterministic read-only presentation layer that derives visible breathing, blinking, depletion, injury, alertness and action posture from existing simulation state. It never consumes ecology RNG or writes animal state.
- GenVo8 now uses articulated two-segment radial legs with alternating eight-frame step phases instead of nearly identical straight spokes. The mantle has clipped/softened pixel corners, tactile feelers, reactive eyes, a real mouth seam/open state, and stronger flee/court/feed/drink posture.
- Mosskip, Rootling and Needlejaw gain blink/eye reactions while preserving their existing species silhouettes. Feeding, drinking, courtship, injury and thirst can produce small contact effects tied to the existing action state.
- The default HUD is quieter: lineage progress plus the three survival vitals remain persistent, while routine trait, social-group and selection-pressure diagnostics stay in the deeper inspectors/context system instead of occupying the main play view.
- The player marker is reduced to a simple gold pointer; onboarding copy now points to that marker and asks the player to read the creature animation instead of describing a nonexistent white outline.
- Added `tests/life-render.mjs` to verify visible low-water/low-energy/injury states and confirm presentation derivation does not consume simulation RNG.
- Fresh actual-browser runtime verification completed through the in-memory module-injection path with no console/page errors; `tests/headless-short.mjs` also passes all five canonical Year-11 seeds.
- Art remains incremental and **not visually approved**. This pass improves liveliness/readability but does not mark the creature/world presentation finished.

## Previous pass — world-scale habitat composition (v0.30.0)
- Added `src/render/composition.js`, a deterministic renderer-only composition field for broad glades, loose habitat corridors, wet/dry pockets, and landmark-rich thickets.
- Composition is sampled from smooth low-frequency seeded fields plus the real visual moisture/fertility field; it never writes to ecology state or advances simulation RNG.
- Open glades/corridors reduce decorative ground-cover density while high real biomass remains visible; thicket regions concentrate existing vegetation rather than creating resources.
- Large habitat landmarks now use wider, composition-weighted anchors instead of a rigid 8-tile cadence, producing fewer and more recognizable landmark clusters.
- Foreground fringe density also respects open-space composition so clearings stay visually open around creatures and interaction cues.
- Added `tests/composition.mjs` for determinism, normalized fields, region diversity, smooth variation, and no-RNG behavior.
- River contours and moisture/fertility contours remain canonical presentation inputs; this pass only organizes their world-scale visual composition.

## Previous pass — silhouette + landscape composition polish
- Renderer-only presentation pass; no simulation authority, RNG use, target selection, movement intent, or ecology values were changed.
- Mosskip now has a tall-ear / heavy-haunch / oversized spring-foot silhouette that remains recognizable without relying on its palette.
- Rootling now reads as a low burrower with a raised back, narrow shovel snout, and permanently visible broad foreclaws.
- Needlejaw now uses a long narrow wedge body, extra-long rigid tail, and always-visible needle jaw, making the predator identifiable before color is considered.
- GenVo8 pushes the radial eight-leg silhouette harder with longer planted limbs, a compact mantle-like body, and stronger forward eye placement.
- Vegetation rendering now uses deterministic 8×8 macro regions plus 4×4 subregions to create clearings, mixed ground, and thickets instead of near-uniform coverage.
- Seedlings and true plant biomass remain the ecological authority; the new clustering only changes how existing biomass is presented.
- Runtime verification uses the actual canonical modules through the browser-injection path because localhost navigation is blocked by the environment.

## Prior pass — action-readable sprite polish
- Renderer-only presentation pass; no simulation authority, RNG use, target selection, movement intent, or ecology values were changed.
- Existing animal intent now drives distinct visual pose families for feeding, drinking, courtship, fleeing, hunting/stalking, guarding and ordinary locomotion.
- Mosskip now lowers its head to feed/drink, pins or raises its ears by context, stretches harder while fleeing, and gains a small courtship tail/ear display.
- Rootling now visibly works food with its claws, lowers its snout to drink, straightens during flight, and has a small nose/tail courtship display.
- Needlejaw now stalks lower, opens the needle-jaw during close hunting frames, carries a straighter tail during committed pursuit, and has separate feeding/drinking contact poses.
- GenVo8 now braces/lower its front body to feed or drink, waves paired forelimbs during courtship, trails rear limbs while fleeing, and exposes a more predatory forward posture if hunting behavior is ever inherited/used.
- Ground presentation gains deterministic 4×4-tile wet, dry and fertile composition patches, leaf litter and muted soil detail so biome texture reads in larger clusters rather than uniform per-tile noise.
- All action presentation remains a read-only interpretation of existing state; long-horizon ecology endpoints remain unchanged from v0.23.0.




## Previous pass — spatial disease + immunity
- `DiseaseController` replaces the old inert infected boolean with an actual contact/environment disease model inside the existing Metabolism & disease phase.
- Mirefever can spread through close daily contact, mating, shared family shelter space, contaminated ground and scavenged carrion.
- Carcasses carry a small background pathogen load; infected deaths contaminate death sites much more strongly, allowing outbreaks to emerge from ecology rather than a scripted plague event.
- Infection duration and severity are shaped by the existing immunity gene plus species susceptibility. Active disease increases energy/water demand, suppresses mating and can contribute directly to mortality.
- Survivors receive temporary acquired immunity; newborns can receive a brief maternal-immunity window from an immune mother.
- Disease exposure uses a deterministic seed/day/individual roll rather than consuming the main ecology RNG stream.
- The player HUD shows an active Mirefever course or short-lived recovered immunity, while the existing selection-pressure system interprets immunity as a live evolutionary pressure.

## Prior pass — persistent environmental history
- `EnvironmentalHistoryController` records consequences already produced by the simulation; it does not add RNG, population rules, or a ninth phase.
- Repeated animal travel leaves faint compacted paths that fade when routes stop being used.
- Plant consumption and shelter-material harvesting leave temporary grazing/harvest scars and cut-stubble traces.
- Regrowth after a disturbed patch produces fresh-shoot recovery marks, so depleted ground can visibly heal.
- Death and carrion decomposition leave longer-lived nutrient/fungal soil hotspots after the carcass itself is gone.
- Current plant biomass remains the authority for visible plant-range shifts; the history layer only preserves the story of how a patch got there.
- History updates are sparse: only cells that have accumulated use/death/grazing state are maintained.
- A dedicated regression verifies that disabling history tracking leaves RNG state and population outcomes unchanged.

## Prior pass — visible selection pressure
- The normal HUD now surfaces the strongest current selection pressure only when it is meaningful, rather than adding another always-open diagnostics panel.
- Temperature, nearby predators, local food scarcity, low-water conditions, active disease, and low-density mate scarcity are derived from the actual running simulation.
- Pressure text names which existing inherited traits are currently helping, hurting, or remaining neutral; it does not invent gene effects that the simulation does not model.
- Sustained pressures are recorded once per in-game day for the actively controlled lineage member without consuming RNG or modifying survival rules.
- Generation/death handoff cards now summarize the strongest pressures the previous controlled generation actually lived through, connecting inherited change to lived ecological conditions.
- Severe pressure can also take over the bottom context line when no more urgent survival interaction is present.
- This pass is descriptive/tracking only: it does not change mutation, inheritance, predation, metabolism, or ecology balance.

## Prior pass — lineage adaptation readability
- The normal HUD now shows an eight-step Generation-8 lineage path instead of hiding milestone progress in an inspector.
- Active descendants receive plain-language inherited trait labels derived from the same genes that drive movement, metabolism, digestion, senses, climate preference, immunity, body phenotype and temperament.
- Manual and death-driven handoffs now pause on a generation transition card that explains the strongest inherited shifts from the previous controlled creature and from the original founder.
- Reaching Generation 8 gets a dedicated lineage-established transition while allowing play to continue beyond the first milestone.
- Mate Sense now emphasizes readable parent traits and likely offspring direction instead of presenting the player with a raw gene table.
- The lineage inspector shows founder-to-current adaptation and the likely trait shift of the selected heir.
- These changes are presentation/tracking only and do not alter mutation, inheritance, survival, or ecology RNG.

## Prior ecology pass — carrying pressure and population-performance stability
- The 640-animal hard ceiling is no longer used as normal carrying capacity; the emergency ceiling is now 900 with a separate 560-animal performance target.
- `CarryingPressureController` adds deterministic local breeding pressure from conspecific crowding and actual forage/prey availability.
- Reproductive readiness accumulates as a deterministic drive instead of consuming extra RNG every decision tick.
- Mosskip, Rootling, GenVo8 and Needlejaw density radii/soft pressures are species data rather than global population rules.
- Sparse populations search farther for compatible mates instead of becoming reproductively isolated solely by map spread.
- Needlejaw prey switching now strongly prefers globally abundant prey when that prey is locally available, reducing pressure on rare families without granting immunity.
- Critically thirsty animals can temporarily prioritize reachable water over repeated flee decisions; normal thirst still yields to immediate danger.
- Non-lineage animals far from the active player reuse decisions at a lower cadence while movement/metabolism continue; urgent hunger/thirst always restores full decision cadence.
- Canonical Year-21 runs remain below the 560-animal performance target without relying on the 900-animal emergency cap.

## Existing simulation foundation
- Seasonal habitat pressure and physical migration routes.
- Family shelters backed by local biomass, food caching, thermal protection, and dependent safety.
- Learned home ranges and non-lethal territorial pressure.
- Individual memory, social identity and temperament-driven cognition.
- Offspring development, caregiver dependency and family protection behavior.
- Deliberate mate sensing/courtship and inherited phenotype expression.
- Persistent founder lineage, ancestry and descendant handoff.
- Generation 8 is the first lineage-established milestone, not an end state.
- 128×128 deterministic seeded world.
- 8 ordered simulation phases and 8 ecology/lifecycle steps per simulated day.
- Registry-driven ecology with 9 organism families and no eight-species cap.
- Eight top-level genetic families, eight-direction locomotion, and eight-frame animation convention.

## Controls
- WASD / arrows — move
- Target icon or R, then click/tap dry ground: open icon-based local family guidance wheel. Right-click / touch-hold remain shortcuts
- Shift — sprint
- V — hide / leave cover when camouflage has evolved
- X — family alarm / rally when signaling has evolved
- Z — pick up / store / drop food when grasping limbs have evolved
- E — contextual survival interaction (drink/eat/bite/read an unread Stalker scrape); concealed camouflage can eat quietly or read sign without emerging; cycles selection only while Mate Sense or Lineage is open
- Q — cycle nearby edible food when several kinds overlap; while Mate Sense or Lineage is open, Q/E keep cycling that panel instead
- M — Mate Sense
- C — court selected mate
- L — lineage inspector
- Q / E — cycle selected mate/heir while the corresponding panel is open
- H — hand control to selected mature descendant
- I — individual memory / social inspector
- T — learned home range / territory inspector
- B — family shelter inspector
- N — build/repair shelter
- F — cache nearby food at shelter
- K — migration / habitat-pressure inspector
- G — commit/cancel migration route
- O — ecology/population panel
- ? — help
- P — pause
- Escape — close inspectors
- R — new deterministic seed

## Validation
- `node tests/core.mjs`
- `node tests/onboarding.mjs`
- `node tests/readability.mjs`
- `node tests/cognition.mjs`
- `node tests/territory.mjs`
- `node tests/shelter.mjs`
- `node tests/migration.mjs`
- `node tests/lineage.mjs`
- `node tests/strategy-encounters.mjs`
- `node tests/adaptation.mjs`
- `node tests/reproduction.mjs`
- `node tests/family.mjs`
- `node tests/hydrology.mjs`
- `node tests/carrying.mjs`
- `node tests/recovery.mjs`
- `node tests/dispersal.mjs`
- `node tests/history.mjs`
- `node tests/pressure.mjs`
- `node tests/disease.mjs`
- `node tests/ecology-stability.mjs`
- `node tests/headless-short.mjs`
- `node tests/headless.mjs`

All five deterministic 10-year ecology seeds remain alive across all four animal families. The Year-21 disease regression also requires natural Mirefever emergence, substantial recovery, non-catastrophic direct mortality, and peak prevalence below 55% of peak animal population. The strengthened Year-21 stability suite keeps every starter animal family extant in all three canonical long seeds, keeps systemic dehydration below the regression threshold, and requires peak population to remain below the 560-animal performance target.

## Visual status
v0.43.0 keeps the authored UI reset, field journal, physicality and depth work while making flora and habitat signatures more deliberately authored. Full plant sprites now form readable stands instead of carpeting every tile, but overall art remains unapproved and should still be treated as in-progress until explicitly accepted.


## v0.11.0 readability pass

- Nearby low-need water/food gets in-world cyan/green cues instead of requiring a diagnostic panel.
- Predators that can threaten the controlled lineage get a readable danger marker and nearby name label.
- The opening player marker is more explicit.
- Context text now prioritizes immediate predator danger and points toward survival actions.
- Eating/drinking interactions give short direct feedback.
- A controlled-generation death pauses the game on a clear lineage-transition card before play resumes.
- Detail panels use the normal UI typeface instead of a debugger-style monospace presentation.

These changes are a readability/onboarding pass. World and creature art remain prototype quality and are not visually approved.


## v0.13.0 presentation pass

- Reworked terrain/water/shore breakup and all five plant-family silhouettes.
- Rebuilt four animal-family procedural sprites around directional anatomy and eight-frame gait motion.
- GenVo8 now visually reads as an eight-limbed organism instead of a simple rectangular placeholder.
- Reduced intrusive selection rectangles and upgraded shelter/HUD presentation.
- This is still an incremental art pass, not visual approval.

## v0.14.0 ecology stability pass

v0.14.0 addresses the long-run Needlejaw/Rootling collapse at its systemic causes rather than adding population floors. Shore seepage now persists in soil moisture, all terrestrial animals use reachable bank drinking routes, connected land regions prevent across-river prey/mate/resource targeting, and local water-edge steering reduces repeated blocked movement. Predator foraging now uses frequency-dependent prey switching so locally/globally rare prey are less attractive than abundant prey, while Needlejaws use slower low-density reproduction and species data now supports predation vulnerability (including Rootling burrow protection). Dehydration deaths fall from hundreds in the old 20-year stress seeds to single digits/low teens, and all four animal families remain present through Year 21 in the canonical long-run seeds. The simulation can still approach the current 640-animal performance ceiling in productive seeds; that remains a separate carrying-capacity/performance tuning item rather than being hidden.


## v0.15.0 carrying-capacity / performance pass

v0.15.0 separates ecological carrying pressure from engine safety limits. Local conspecific density and actual food/prey conditions now control a deterministic reproductive-drive meter, while the hard animal cap is raised to an emergency-only 900 and canonical long runs must stay below a 560-animal performance target. Sparse populations gain wider mate search, Needlejaw switching gives strong preference to abundant prey when available, and critical thirst can override repeated flee loops. Player-enabled runtime also staggers expensive decision refreshes for distant non-lineage animals without slowing their movement/metabolism or urgent survival responses.


## v0.16.0 low-density recovery pass

v0.16.0 addresses the remaining fragile Year-21 populations without population floors or replacement spawning. A new `RecoveryController` strengthens deterministic reproductive drive as conspecific density falls, expands mate search for sparse populations, and creates a rare-prey refuge: adequately fed predators switch away from prey families below their low-density threshold while common alternatives remain available. Truly starving predators may still take rare prey.

Unrelated mates remain preferred. Direct parent/child mating is always forbidden. If a population falls below its configured critical ratio and no unrelated mate can be found, autonomous animals may relax sibling avoidance as a last-resort recovery behavior. Such offspring receive an explicit inbreeding load that reduces starting health and inherited immunity/metabolic quality, so the recovery route carries a fitness cost rather than acting as free population rescue. Canonical Year-21 tests now require configured recovery species to remain above their critical recovery cohort as well as remaining extant.


## v0.17.0 lineage adaptation readability pass

v0.17.0 does not change the underlying inheritance or ecological model. It makes the generational simulation readable during normal play: the HUD carries an eight-step lineage path and plain-language trait identity, Mate Sense communicates likely offspring direction without a raw gene matrix, and every control handoff pauses on a generation card that summarizes inherited change relative to the previous controlled organism and the founder. Generation 8 now receives a dedicated establishment card before the open-ended lineage continues.

## v0.18.0 visible selection-pressure pass

v0.18.0 connects the inherited trait system to the conditions the player is actually experiencing. The active HUD can identify meaningful thermal, predation, food, water, disease, or mate-scarcity pressure and explain whether current inherited traits are helping or hurting under that condition. Pressure exposure is tracked once per in-game day for the controlled lineage member and summarized at generational handoff, without consuming RNG or changing ecological rules.


## v0.19.0 persistent environmental-history pass

v0.19.0 gives the landscape visible memory without changing the ecological model. Animal travel, grazing/harvest, regrowth and carcass decomposition accumulate in sparse per-cell history fields used only by presentation. Repeated routes can wear faint paths, overused feeding patches expose soil/stubble, recovering patches show new shoots, and old death sites remain temporarily visible as rich soil/fungal hotspots after carrion disappears. The controller is read-only with respect to survival/reproduction and consumes no RNG.

## v0.20.0 plant reproduction + dispersal pass

v0.20.0 converts Bramblefruit, Marshroot and Thistlepod from implicit everywhere-regrowth into explicit seed-limited populations. Empty suitable cells stay empty until a propagule arrives. Bramblefruit and Thistlepod seeds can be ingested with food, carried inside a moving animal for one to three in-game days, and deposited later with a small dung-fertility contribution. Mature seed-limited plants also release sparse deterministic short-range propagules; Marshroot spreads locally while animal gut passage provides long-range transport for fruit/seed plants. Carried seeds are deposited if the carrier dies. Seed banks decay gradually, germinate only when moisture/temperature/fertility are suitable, and do not consume the simulation RNG stream. Low-biomass establishments render as seedlings before becoming full plant silhouettes.

This means local plant extinction and recolonization are now real spatial events. Animal movement can shift Bramblefruit/Thistlepod ranges across generations, while the Rule-of-8 simulation schedule remains unchanged: dispersal belongs to the existing vegetation/decomposition phase rather than adding a ninth phase.


## v0.23.0 social groups
Mosskips form temporary herds, Rootlings loose colonies, and GenVo8s local bands. Group membership is proximity/temperament/kinship driven rather than a permanent faction. Nearby group members can relay predator alarm, non-player animals maintain loose cohesion and spacing, and the active lineage HUD reports local group size/alarm state. Needlejaws remain intentionally solitary. Full social steering is simulated around the active lineage (and for lineage members themselves); distant background populations use the cheaper ecological decision model so grouping does not become a world-scale CPU or balance tax.


## v0.23.0 social presentation
Nearby groups now communicate their state through species-specific motion: Mosskip alert ears/stance and herd hop rhythm, Rootling crouch/claw alarm posture, and GenVo8 splayed-limb/wide-eye alarm behavior. Idle social animals visually acknowledge nearby companions or caregivers without changing simulation-facing movement or consuming RNG.

## v0.27.0 — habitat landmarks and stronger plant silhouettes
- Renderer now derives large habitat landmarks from real local plant biomass, moisture, fertility and decomposition history rather than placing decorative props independent of ecology.
- Bramblefruit can read as broad hedges/thickets, Marshroot as taller reed beds, Rotcap as fungal rings, Thistlepod as dry seed stands, and dense Sunmoss as low hummocks.
- Multi-tile landmark silhouettes are a presentation layer only; plant fields, seed banks and dispersal remain authoritative.
- Moisture/fertility ecotones now receive subtle broken habitat-edge treatment, helping wet/dry/rich patches read at a glance without a biome overlay.
- Rule-of-8 simulation scheduling is unchanged; this is renderer-only presentation work.

## v0.27.0 — habitat landmarks and stronger plant silhouettes
- Renderer now derives large habitat landmarks from real local plant biomass, moisture, fertility and decomposition history rather than placing decorative props independent of ecology.
- Bramblefruit can read as broad hedges/thickets, Marshroot as taller reed beds, Rotcap as fungal rings, Thistlepod as dry seed stands, and dense Sunmoss as low hummocks.
- Multi-tile landmark silhouettes are a presentation layer only; plant fields, seed banks and dispersal remain authoritative.
- Moisture/fertility ecotones now receive subtle broken habitat-edge treatment, helping wet/dry/rich patches read at a glance without a biome overlay.
- Rule-of-8 simulation scheduling is unchanged; this is renderer-only presentation work.


## v0.27.0 — habitat depth and layered fringe
- Added renderer-only wet/dry/rich low-relief cues and stronger riparian bank feet.
- Added a restrained foreground vegetation fringe sourced from real Marshroot/Bramblefruit/Sunmoss biomass.
- Foreground plants are short/sparse and do not affect collision, ecology, RNG, or interaction targeting.
- Habitat depth remains presentation-only; world moisture/fertility/plant state stays authoritative.


## v0.28.0 — organic macro-landform rendering

- Added a dedicated `src/render/landform.js` presentation module.
- River/water edges are reconstructed from the canonical tile water grid into a deterministic 16×16 sub-tile contour.
- Seeded low-frequency threshold variation produces gentle bank widening/narrowing and smoother bends without changing collision, drinkability, hydrology, saves, or ecology state.
- Visual water is kept close to the canonical grid edge; inland tiles remain visually land and deep-water tiles remain predominantly water.
- Organic bank accents and occasional earth-toned flood-channel scars replace the old square-edge emphasis.
- Current flecks and shallow highlights are clipped to the reconstructed water mask rather than painted across entire edge tiles.
- Added `tests/landform.mjs` to prove deterministic masks, mixed shoreline contours, preserved deep water, and preserved inland land.
- This remains a presentation pass: all canonical 10-year and Year-21 ecology outcomes remain unchanged.

## v0.62 predator encounter pass
- Stalker encounters against the controlled GenVo8 now use readable stalk → wind-up → charge → recovery phases.
- The telegraph creates active responses: sprint away, break line with evolved camouflage, rally family, or counterbite during wind-up.
- Background predator/prey ecology remains on the canonical hunt path; these phases are player-facing only.



## v0.73.0 — learned forage patches + local recovery memory
- Repeated plant feeding now teaches the controlled GenVo8 a place-level forage patch rather than remembering only a single food coordinate.
- Patch knowledge is based on what the lineage physically observed: current local biomass, best-seen abundance, last visit, depletion state and recovery history.
- Repeated harvesting can mark a learned patch thin or exhausted. Returning later can confirm that the real plants have recovered and records that observation in ordinary cognition history.
- While away, recovery is only estimated from the plant family's known growth tendency and elapsed time; the controller does not inspect off-screen biomass. Old memories lose confidence rather than becoming omniscient resource telemetry.
- Hungry players with no food immediately nearby can receive a guide toward a learned patch that is expected to be usable again. Unknown patches never influence that route.
- The Memory panel lists up to five known forage patches with distance, last-observed age and expected condition. No new always-on meter or map layer is added.
- Plant growth, carrying capacity, dispersal and autonomous ecology remain authoritative and unchanged. This memory layer consumes no simulation RNG and remains inactive in player:false benchmarks.

## v0.72.0 — forage choice + food physiology
- Nearby edible plant/carrion types are now distinct player choices rather than one automatic best-food interaction. Q cycles overlapping foods and E eats the selected type.
- The default choice remains need-aware until manually overridden: low hydration favors water-rich Reeds, while low energy favors denser food.
- Food roles are explicit in the context prompt: Moss is steady bulk, Berries are rich/juicy, Reeds are water-rich, Mushrooms are soft/damp, Seed Pods are dense, and Carrion is dense but carries disease risk.
- Recent diet breadth gives a small positive assimilation bonus (up to +7.5% across four different food groups) with no penalty for repetition.
- The optional Memory panel reports recent meals and diet breadth; no new permanent HUD meter is added.
- This controller is player-facing only and consumes no simulation RNG; background ecology feeding remains unchanged.


## Development checkpoint EI (after v1.60.2; NOT a stable release)

Real excavation now has a small live earth mark, recovered disturbance is pruned from saved records, and two paired-world experiments show seed-funded Thistlepod establishment increasing by about 1.55% after three successful digs. No new simulation phase or random draw. See `reports/PASS-EI-SOIL-ENGINEERING-VISUAL-RECOVERY.md` for limitations, evidence, and remaining acceptance gates. The game version stays at the last accepted baseline until complete ecological and browser regression; development ZIPs are previews only.

## Pass EK — Soil engineer activity loss and restoration (development only)

Regional ecology records **successful** anatomy-based digging by actual region, species and generation, along with bounded four-day snapshots of disturbance strength, seed bank and Thistlepod biomass. Tests distinguish a live-world temporary digging interruption (not extinction) from a controlled physical relocation and return of a naturally born generation-2 digger; recovered soil can be prepared again and newly deposited finite seeds establish more efficiently. Neither population rescue nor natural extinction/recolonization has been proven. See `reports/PASS-EK-ENGINEER-LOSS-RETURN.md`. No extra simulation phase, plant generation, or unreviewed balance buff is introduced.

## Pass EL — Natural regional engineer reoccupation (development only)

Real player-free wildlife worlds now demonstrate local digging-anatomy occupant vacancy and later multi-day reoccupation **without** study-imposed translocation. A passive controller tracks bounded regional vacancy/return receipts with identified individuals, origin evidence where recorded, and post-return **successful** soil work. Across two 130-day worlds: 40 vacancy events, 19 reoccupations (18 witnessed region crossings, one origin unresolved), and six reoccupations followed by new local digging. This is **not** taxonomic extinction or an established breeding colony; no claim of causally improved plant populations is supported by these observations. Details, limitations and test evidence: `reports/PASS-EL-NATURAL-ENGINEER-SUCCESSION.md`. This remains development-only; no new stable-release manifest.

## Pass EM — Identified breeding colony evidence (development only)

The passive regional engineer succession study now links a *specific* confirmed returner to real successful **same-region** mating, actual offspring with inherited functional digging anatomy, five consecutive days of juvenile residence, and eventual offspring-of-offspring recruitment. A bounded event records evidence of historical two-generation recruitment without changing fertility, organism goals, survival, plant stocks, population counts, or the RNG sequence. In a controlled reproduction test, two children and two grandchildren were successfully recruited; however, **two normal 130-day natural worlds produced zero qualifying local births and zero natural established colonies** (19 return episodes, one post-return lineage mating). The system records biological evidence but natural colony establishment is not proven. See `reports/PASS-EM-LOCAL-BREEDING-COLONY-EVIDENCE.md` for strict thresholds, negative tests and caveats. Stable-release manifest remains unchanged.

## Pass EN — autonomous engineer mating-opportunity diagnosis (development only)

A passive saved observer now counts actual time a confirmed returning engineer remains in its reclaimed 16×16 region, physically qualifies to reproduce, has unrelated opposite-sex mature/ready partners co-resident, and pursues mating. It does not produce, protect or attract creatures, nor change RNG, reproduction or habitat supplies. A controlled test verifies defensive copies, daily idempotence, existing save-state compatibility, and neutral world resources. Two unmodified 130-day simulations confirmed only two observed days across 19 return episodes with both returnee and co-resident physiologically ready. Rootling gestation can also extend past the observation cutoff, and movement across 16×16 borders excludes otherwise valid out-of-region births from *local* colony proof. This does **not** prove a successful natural engineer breeding colony. See `reports/PASS-EN-ENGINEER-MATING-OPPORTUNITY-DIAGNOSIS.md`; full long-horizon acceptance remains open.

## Pass ES — bounded engineer life-history evidence (development only)

The regional ecology now saves authentic conception-to-offspring receipts for anatomy-qualified ecological engineers, including the conception region, actual birth region, surviving juvenile milestones, adulthood and recorded deaths. In two unchanged 130-day worlds, 25 real engineer conceptions led to 36 observed offspring, 11 outside their conception regions. At day 130 neither sampled world had a fully physiologically ready colony engineer, despite living adult populations. Proactive drinking experiments were **rejected** because they reduced local births; delivered behavior and ecology remain the ER baseline. See `reports/PASS-ES-ENGINEER-REPRODUCTIVE-LIFE-HISTORY.md`. Natural sustainable colonies and full long-horizon acceptance remain open; this is not a new stable release.

## Pass EU — breeding habitat quality (development only)

A passive, saved conception-to-birth observer now distinguishes **actual drinkable bank distance** from the migration system's moisture-based habitat quality. Across two unmodified 130-day worlds, 23 qualifying engineer conceptions produced 34 observed offspring (11 outside conception regions); only four conception sites were within three hydrology steps of a drinkable bank. In this small sample, near-bank sites did **not** show better local birthplace retention, so no water-seeking or breeding-site behavior was changed. See `reports/PASS-EU-BREEDING-HABITAT-QUALITY.md`. Long-horizon colony and stable-release acceptance remain open.

## Pass EV — family settlement versus region boundaries (development only)

A separate passive, saved engineer-family-settlement observer traces **actual newborn positions and seven-day mother–offspring proximity** rather than assuming 16×16 region boundaries equal family-home boundaries. In two unchanged 130-day natural worlds, 34 qualifying engineer offspring were born; 11 births crossed the conception region, but only three of those occurred within six tiles of conception. Conversely, 15 births remained in the same region while occurring over six tiles away. Only three offspring met the pilot seven-day paired-site retention criterion. The observer changes no movement, fertility or ecological stocks, and the old strict multigenerational colony evidence is not redefined. See `reports/PASS-EV-FAMILY-SETTLEMENT-BOUNDARIES.md`. Stable-release and long-horizon colony acceptance remain outstanding.


### Multi-partner mate-choice expansion (development checkpoint)

Wildlife can now choose among multiple reachable, reciprocally acceptable partners using its *individual heritable preference profile* rather than always defaulting to the nearest. Player mate-list ordering exposes comparative suitability with neutral/declining alternatives still selectable using Q/E. Core biological gates, resource limits, taxon priority, and mutual choice stay unchanged. Source of truth: `src/reproduction/mate-preferences.js`; focused contract: `node tests/multi-partner-sexual-selection.mjs`. This change **does not** guarantee mating success, colony formation, or any seed-specific endpoint. Historical ecological outcome reports remain observational.


### Selective breeding guidance (development checkpoint, 2026-10-12)

Use `M` for actual anatomical mate comparison and `L` for descendant part origins from birth-time parent snapshots. Supports matching-body editor opportunities without a second anatomy system or automatic convergence. See `docs/SELECTIVE_BREEDING_FIELD_GUIDE.md`. Egg/live/dual reproduction remains planned.

### GenVo v1.72.0 art development checkpoint

Eye and mouth candidate pass: 16 existing native 32×32 face parts revised with distinct idle/expression frames; the live renderer now selects anatomy-owned blink/mouth articulation without overdrawing native mouths. Biological inheritance and all part IDs remain unchanged. See `docs/GenVo-v1.72-Face-Art-Expression-Pass.md` for verification and open issues. **Creator art approval pending.**
