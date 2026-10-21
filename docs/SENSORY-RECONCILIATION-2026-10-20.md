# Shared sensory and remote-branch reconciliation

The sole active source remains `C:\Users\jackt\Desktop\Games\game jam october\genvo-toolkit`.

## Preserved history

The original unfinished cave/underwater changes were preserved unchanged in commit `830afde` on pushed recovery branch `codex/recovery-stratum-senses-2026-10-20`. An exact-byte ZIP and SHA256 manifest, including the two unrelated untracked terminal-help files, remain under `C:\Users\jackt\.codex\visualizations\2026\10\20\01a1583e-f787-7bb3-a369-b0b62a443366\stratum-wip-recovery-2026-10-20`. No reset, forced checkout or published-history rewrite was used.

The reviewed remote histories were integrated in dependency order: PR #32 at `0ee940c63a6e22f488dec828812f072fe763ffa9`, PR #33 at `c077f3cfaeb4c130bd7aec87cdb482d1491d62da`, then PR #35 at `bbf7f91fd71beafb2c0b0c4f39ca37db4494005c`. Git ancestry establishes source integration; it does not establish GitHub draft-PR UI status or creator acceptance.

## One composed perception authority

- `atmospheric-visibility.js` retains anatomical view, field of view, atmosphere and actor visibility. Player rendering, target selection and modern threat sight compose this authority.
- `world/cave-optics.js` owns the shared physical rock ray, including solid corners and disconnected floor elevations. Both medium optics and native view call it.
- `stratum-senses.js` supplies physical medium constraints, rather than a competing observer or memory system. Daylight derives from actual open entrances and revision-cached connected passages; darkness limits vision. Underwater extinction derives from existing algae/litter stocks, liquid clearance and ice interfaces. These are clarity proxies, not new sediment, light-energy or water inventories. Sound follows connected cave/water cells within a finite routed distance.
- `sensory-world.js` retains individual bounded survey memory and uncertain bearings without hidden source coordinates. Water surveys now have a separate region key. Existing connected cave scent is retained; unsupported airborne plant odors do not appear while submerged. Full aquatic chemoreception is still unfinished.
- `stratum-sense-rules.js` versions the new medium physics. Newly generated worlds enable it. Ordinary historical restore preserves missing rule/fog fields; explicit backed-up continuation records policy adoption across visited regions and rolls back exactly if storage fails. `planetary-travel.js` transfers those same policies.
- Danger audio consults the shared sensing policy. Hidden ecosystems continue advancing independently of rendering.

The merge conflicts in atmospheric visibility and Simulation were resolved by preserving the remote anatomical view/memory implementation and composing recovered physical-medium constraints into it. Neither branch's independent sight ray was retained as a second authority.

## Evidence and limits

The final 39-check playable gate passed, including anatomy-aware action controls, ice, caves, traversal, audio/performance contracts and persistence. The added `tests/stratum-senses.mjs` checks connected daylight, floor occlusion, bent/disconnected acoustic paths, stock-derived water clarity, blocked liquid rays, separate survey layers, read-only material queries and explicit historical policy adoption/rollback. The migration test verifies the precise new sensory backup provenance while retaining full-state equality. Source audit and public-export parity pass.

The browser harness `tools/verify-stratum-senses-browser.mjs` exports no alternative source. It inspects the actual renderer at 1920×1080 on generated terrain, with explicitly staged observation positions; this is not a natural dive-entry or cave-entry gameplay trial. Evidence is under the sibling `reconciled-sensory-browser` directory in the visualization root. An initial Continue timeout came from the fixture omitting native `burrowSince` entry metadata; save validation correctly refused that invalid staged actor. After correcting the fixture, mouse Save/Continue preserves tick, RNG, actor position/layer, individual memory and all passage records exactly, with no browser errors; the restored frame was inspected. Underwater browser observation remains NOT YET PROVEN in this run because the generated region has no liquid column deeper than 0.3; no resources or depth were invented to obtain a screenshot. Controlled underwater optical contracts pass.

The inspected cave frame still shows narrow, cell-based passages. The natural-cave branch improves conserved fracture growth and procedural rock presentation, but does not complete broad variable-width caverns, multiple connected elevations, coupled cave drainage/ventilation, cave food webs or final art acceptance. Daylight is an explicit bounded attenuation model, not full light transport. Hearing uses connected cells, not frequency-dependent acoustics. Current underwater clarity is not a suspended-sediment model.

Terrain/audio scheduling and diagnostics from PR #32 are retained. Late-session atomic simulation stalls remain unresolved; no population, biological progression or diversity budget was reduced. Next work is measured phase profiling and physical cave geometry/environment integration. Full Creature-stage completion and creator acceptance remain open in the completion matrix.
