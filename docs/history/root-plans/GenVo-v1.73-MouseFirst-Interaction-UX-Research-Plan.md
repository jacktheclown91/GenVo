> Historical checkpoint / branch-local proposal. See the repository README, design/CURRENT-DESIGN.md and docs/CURRENT-IMPLEMENTATION.md for current authorities. Original text below is preserved; its pending-work statements are not current instructions.

# GenVo — Mouse-First Interaction & Gameplay UI Research / Implementation Plan

**Design checkpoint:** October 12, 2026  
**Code baseline inspected:** GenVo v1.73.0 development source  
**Status:** Proposed design, not implemented or visually approved

## Creator's direction

Make ordinary gameplay easy to understand and operate primarily through mouse clicks. Present actions as authored, clear, fluid, attractive game interactions, in the spirit of Spore's approachable biology and The Sims' contextual interactions. Do not remove advanced biological information, hotkey panels, or expert workflows. Mouse is a primary requirement; no need to treat controller parity as a release gate. Gameplay itself, not the title screen, should explain systems. The UI must reflect the real ecology and inherited anatomy, not invent fixed biological classes or outcomes.

## Comparative research — lessons, not templates to copy

| Reference | Relevant documented interaction | Apply to GenVo | Avoid |
|---|---|---|---|
| Spore creature stage | Distinct combat/social abilities granted by creature parts; social and attack action strips, social encounter feedback | Anatomically gated, visually recognizable actions, feedback near target | Fixed Simon-Says matching, guaranteed relationship via bars, repetitive four-button ritual |
| Niche — A Genetics Survival Game | Mouse click selects creatures and reveals available contextual actions; separate gene, ancestry, ability information | Primary context actions plus optional deep phenotype and lineage panels | Presenting dozens of gene icons or raw numbers as the default view |
| The Sims pie menus / Don Hopkins | Context-dependent, nearby large directional mouse targets for object and social interactions | Compact context blooms close to the selected creature or resource | Many nested radial layers; small unlabeled icon-only targets; conflicting right-click conventions |

Research sources:
- https://spore.fandom.com/wiki/Creature_Stage
- https://strategywiki.org/wiki/Spore/Creature_Stage
- https://www.gamespot.com/articles/spore-walkthrough/1100-6198224/
- https://www.christcenteredgamer.com/reviews/pc-mac/niche-a-genetics-survival-game-pc
- https://steamcommunity.com/app/440650/discussions/1/1842367319517498003/
- https://www.donhopkins.com/home/PieMenu/index.html
- https://www.donhopkins.com/home/TheSimsDesignDocuments/TheSimsPieMenus.pdf
- https://www.pcworld.com/article/536660/spore_review.html

## What current v1.73.0 actually has

- `src/ui/inspector.js`: creature needs, opponent/mate data, verbose selected-mate ritual text and queue.
- `src/reproduction/courtship-performance.js`: anatomy-gated dance, call, flare, scent, and gesture; learned sequence, target preference and real acceptance behavior.
- `src/main.js`: mate view `M`, add courtship actions with `1`-`5`, initiate with `C`; world input includes `Space` attack, `Shift+Space` pounce, `J` brace; `Escape`/`P` pause.
- `src/gameplay/player-combat.js`: windup, recovery, targeted strikes, pounce, exertion and bracing.
- `src/ui/leadership-wheel.js`: existing **right-click** local family command wheel with gather/forage/scout/avoid/nest; `R` activates leadership targeting.
- `index.html`: `#quickMenu` utility controls; `#commandWheel`; `#mate` currently a text-heavy detail panel.
- `src/ui/journal.js`: actual family history, inherited part and related data.
- Present controller and simulation systems remain authoritative. This plan does not claim new UI has been built.

## Architecture — progressive disclosure with one true action path

### Level 0: World and unobtrusive HUD

World dominates. Show small active-creature portrait/name and three immediate vitals (health, water, energy/exertion). Show an important nearby context cue only when something warrants attention. Utility icons for journal and deeper views sit at an edge, not in the central playfield. No compulsory opening lecture.

### Level 1: Mouse-selected context actions

Left-click a creature, resource, egg, shelter, or meaningful habitat feature to reveal a **near-target context strip/bloom** with approximately three to five relevant labeled choices. Example animal: Observe, Approach, Court (when plausible), Attack (if physically possible), Back Away. Example nest: Inspect, Tend, Defend, Relocate (only if implemented). Example plant: Gather/Eat/Inspect depending on mouth and reach.

Clicking one action should enter or execute the existing gameplay controller. No parallel UI-only simulation rules. If a move is blocked, explain *why* in plain language ("Need gripping forelimbs", "Out of reach", "Too exhausted", "Not receptive") rather than hiding all evidence of it. Never expose a false selectable action.

**Existing conflict:** Right-click already opens Family Guidance. Preserve that workflow initially. Use left-click selection and an anchored context strip for individual targets. Do not steal right-click or replace WASD movement in this pass.

### Level 2: Focused encounter panel

During courtship/combat, expand the bottom-center strip into a compact, **encounter-specific** bar. Dim irrelevant utilities rather than opening modal walls. Use labels and small original pixel-art icons rather than just abstract glyphs. Hover shows cost, biological source, and current validity. Keep target/actor portraits and qualitative state labels visible.

### Level 3: Expert investigation

Journal, Anatomy, Genetics, Habitat, Relationships, Food Web and Family panels are reachable by clicking an info/book icon or through existing hotkeys. Advanced panels should read from the same underlying data and preserve existing shortcuts. Detail level preference can be Normal / Expanded, but access to actual data must remain intact.

## Courtship encounter — specific flow

1. Left-click a creature. Compact card displays name, visible posture/condition and actions: Observe / Approach / Court / Leave. Ineligible targets provide readable explanation, without overriding biological compatibility rules.
2. Select **Court**. Focused courtship tray displays the real performer's available action repertoire. Dance, Call, Flare, Scent and Gesture appear as clickable cards only if granted by the actual mounted body parts; simple Approach stays available. Hover shows organ source and energy/time costs.
3. Clicking a performance action appends to a short visible editable sequence (first implementation retains the existing three-action queue). Show `Play`, `Undo`, `Clear`, `Observe`, `Back Off`. The old `1`–`5`, `Backspace`, and `C` remain functional.
4. During execution, show the two creatures' actual face/body reactions and small readable cues such as "watching", "uncertain", "pulling away", or "interested" *only when observable and derivable*. A natural-language event line reports what happened. Do not display a fake deterministic acceptance progress bar or promise of success.
5. Afterward report explanation if detectable: "It watched your flare, but backed away" or "Too tired to perform a full dance". Keep hidden preferences appropriately hidden unless actually learned/observed; advanced inspector may show richer data once discovered.
6. No forced sex roles, guaranteed matching-ritual win, compulsory ritual, automatic reproduction, universal courtship pattern, or fixed-species behavior. The underlying reciprocal-choice, kinship, environmental and finite-cost tests remain binding.

## Combat encounter — specific flow

1. Left-click a threatening creature or receive a nearby threat cue. Context tray surfaces options supported *right now*: Attack, Brace, Pounce when anatomically possible, Retreat, Observe. Future sting, toxin spit, ram and other moves appear only after actual simulation mechanics exist.
2. The selected target gets a visible but restrained ring and facing/range cue. Clearly distinguish target selected vs attack available, recovery and windup.
3. Click Attack to call `playerCombat.startAttack`; click Pounce to use its existing pounce route. Brace is a held/control state, not a fake one-click permanent shield: design pointerdown/hold behavior or a clear press-to-hold button that releases safely. Retain Space, Shift+Space, J.
4. Show short windup/recovery arcs on the action icon and reaction at the target. Report hit/miss/block/escape via actual simulation results. Do not pause the ecological simulation by default just to use the tray.
5. Allow switching to Observe, Retreat or world movement without panel hunting. Protect against repeat clicks during recovery and make invalid reasons explicit.

## Additional interaction families

- **Forage:** click resource -> Eat / Gather / Inspect only when physically supported; display finite quantity and whether reachable.
- **Family:** reuse existing right-click guidance wheel and improve labels/targets; local group behavior is not a universal personal action.
- **Nests/eggs:** tending, defense, incubation, egg movement shown only if existing biological mechanisms support them.
- **Evolution:** offspring and parent previews stay in the genetics/journal view, with readable visual trait comparisons; do not offer unrestricted editor overrides after mixed mating.
- **Discovery:** small one-time contextual introductions appear when the player first meets an action; no compulsory menu lectures.

## Authored visual system

Original 32x32 icon language using the game's palettes and anatomy visual motifs. Two scales: real 32px art and larger crisp nearest-neighbor display (avoid blur). Use readable short text below icons; don't depend on color alone. Physical, organic frames and subtle motion (~120–200ms, optional reduced motion) rather than standard web dashboard cards. Favor 48px-or-larger interactive hit areas on desktop and embedded layout; minimum legible label and adequate contrast. Keep hover, pressed, disabled and cooldown states visibly different. Avoid giant fixed panel that obscures creatures. Provide pointer-over affordances, quick cancel, outside click to close, and stable positions to prevent accidental presses.

## Technical plan (one canonical system, no god scripts)

1. Inventory current UI events and handlers; preserve keyboard semantics and save migration.
2. Add an action **descriptor/adaptor** layer that reads actual capability/status from existing simulation controllers: `{id,label,icon,context,enabled,reason,cost,hotkey,invoke}`. Descriptors do not compute new biological truth.
3. Build a reusable contextual selection tray, target anchor and hit regions, with mouse hover help and real disabled reasons.
4. Integrate courtship panel by translating clicks to existing selection/ritual queue and `courtSelected()`; retain keys and current three-action limit until engine changes.
5. Integrate combat tray by delegating to existing player combat controller, including safe brace press/release behavior.
6. Add small resource, shelter and egg affordances **only for already implemented actions**.
7. Maintain deep inspector and journal as drill-down destinations; do not delete any expert information.
8. Test menu, embedded web layout, mouse precision, hover, hitboxes, keyboard parity, save/load and actual browser-play capture. Record the UI design in provenance. Ship source and matching web ZIP only after verified.

## Acceptance scenarios

- New player discovers and performs an anatomy-supported interaction in 1–2 clicks after selecting a target, without reading a control sheet.
- Clicking a mate brings up only physically available displays. Trial works, costs resources/time, may be refused, and refusal explanations remain faithful.
- Selected enemy is clear, mouse attack resolves through windup/recovery, and combat hotkeys yield identical game state changes.
- A creature without the required organ cannot use that action via either mouse or keyboard; tooltip explains why.
- The Family Guidance right-click wheel remains accessible, with no input collision.
- Advanced genetics, lineage, ecology, and mate-choice information remains reachable and readable.
- No unnecessary overlays obscure more than needed during regular world exploration.
- Real Chromium captures show functioning hit targets at typical desktop and embedded sizes; images are real, not concept replacements.
- Automated tests establish that UI and existing hotkeys both call the canonical controller paths; save formats preserved.

## Proposed implementation milestone

**Next targeted milestone:** Courtship + Combat mouse-first UI vertical slice (UI implementation, not biological redesign). This is more useful than changing every menu at once and gives a meaningful playtest of the new interaction grammar. Roll out the same system to forage, shelter, family guidance and exploration afterward.
