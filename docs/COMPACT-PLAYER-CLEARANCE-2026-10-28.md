# Keep the creature visible beside reference windows

Compact Help, Population and Home Range covered the actual player position at
both 800x600 and 1024x768. Their medium-width layouts now leave room beside the
creature, without changing the camera, commands or any simulation state.

The scoped CSS applies only from 760 through 1120 pixels and excludes explicit
expanded windows. It preserves the existing scroll owner, sticky controls,
phone sheets and wider layouts. The population total uses a full-width card;
redundant header shortcut hints no longer collide with Close and Expand. The
shortcuts themselves remain available.

Native before/after cases use ordinary `GENVO8-TEST-A` worlds. Reference CSS is
served read-only from the prior Git source; no source is reverted. All six
affected size/panel cases change from covering the player to clearing a 28px
radius. Expand and Restore retain the full viewport and original compact
bounds at both sizes, with no horizontal information clipping. The full panel
review also covers 1920x1080, 1366x768 and 390x844; these are outside the new
media query. Native Close activation with Enter/Space remains verified.

The inspected comparisons and [curated receipt](compact-player-clearance-2026-10-28/receipt.json)
are checked in:

- [Before at 800x600](compact-player-clearance-2026-10-28/before-population-800.png)
- [After at 800x600](compact-player-clearance-2026-10-28/after-population-800.png)
- [Home Range at 800x600](compact-player-clearance-2026-10-28/after-home-800.png)

`tests/knowledge.mjs`, `tests/menu-task-usability.mjs`, public export and scoped
diff checks pass. Comprehensive integration remains Claude's responsibility.
The branch carries the shared-file heads-up and a source patch.

This is a compact reference-window improvement. It does not certify every
contextual target, zoom, historical world edge, full-screen sheet or other
interface in the assignment. Some nearby targets can still sit beside a panel
edge; broader adaptive placement remains open. Creature Lab, Field Guide and
the remaining interface review are not declared complete here.
