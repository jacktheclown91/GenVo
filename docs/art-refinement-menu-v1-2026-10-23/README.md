# Main menu and New World presentation candidate — October 23

A cohesive natural-history candidate now has original vector navigation icons and a botanical emblem, warm cream/gold type on the existing green palette, a wider creature-first New World sheet, native founder-body illustrations and clear selected/focus states. The living-world background remains the actual game. This is working artwork and styling with a reproducible review build, not just a mockup.

## Integration status

Candidate assets/tools are committed in the original maintained repository. Canonical `index.html`, `styles.css` and `src/ui/front-end.js` were not independently edited. The creator selected checked-in handoffs. `docs/art/menu-v1-handoff/README.md` has exact commands and two narrow patches for Claude: stylesheet activation and read-only labels for recorded lineages/catalog days. Shared integration and creator acceptance remain open. Do not claim the live canonical menu already uses this theme.

Claude's latest source through `d9c2e97` is merged, including his application of the earlier terrain renderer patch. The new GenVo-v1 repository migration remains Claude's responsibility; this pass does not migrate or publish anything.

## Runtime evidence

The selected images and `receipt.json` come from real Chromium application screens at 1920x1080, 1366x768, 1024x768, 800x600 and 390x844. The inspection server applies only the proposed CSS link and read-only label patch. All five creature buttons and all available simple world starts were exercised through existing public controls; selection values and aria states remain linked to the original selects. Assets load with no page errors. At desktop/laptop sizes the primary action fits in the first New World frame. Smaller windows scroll to every control. Advanced controls and Options were inspected. Bounds checks supported, but did not replace, visual inspection.

Recorded starts show the catalog's actual Day 31 / Day 101. A recorded lineage uses a conceptual lineage symbol instead of falsely illustrating it as a generic founder. All other authored starter illustrations use the exact current guided starting plans. Representative deterministic pigment is illustrative; the new world's actual genes/colors remain untouched.

`exported-build/` records the real public-export candidate. Space selected the existing card; Begin World created the requested real seeded world; the probe awaited the native scene-readiness promise, used public Enter onboarding and held WASD for one second. The actual creature moved, ticks advanced, the stylesheet was loaded, and the menu correctly disappeared from gameplay. No RAF replacement, clock freeze or actor/world/action rewriting occurred in that live run. This is a targeted UI/start/input proof, not full biological, performance or player-experience acceptance.

## Checks and retained diagnostics

Five portrait PNGs match the exact canonical plan for each starting body, have distinct hashes and transparent edge bounds, and regenerate byte-identically on this environment. Existing sprite sources and provenance are retained. Native art remains 32px; 112px selection canvases fit the normal authored assembly rather than replacing organisms with new whole-body game sprites. Icons are original Codex-assisted vectors; no new external art, font, paid service or runtime dependency was added.

The menu usability, world-slot/legacy-compatibility and public-export tests passed. Canonical source audit passed after the standard ignored reference-sheet export. The complete Git-backed source inventory is retained locally, with its digest summarized here.

Exploratory versions remain in the raw archive. The first harness incorrectly addressed Back; the first live probe sent input during Preparing ecosystem. Both were corrected using the real UI/readiness authority. An authoring-tool UTF-8 issue was caught by its strict source guard and fixed before canonical delivery. Existing test criteria, biological budgets and gameplay outcomes were not weakened. No old receipts were rewritten to hide failures.

No whole-v1 completion claim is made. Creature Lab, other UI surfaces, broader animation/audio work, shared integration and creator acceptance remain open.
