# Short-landscape gameplay HUD

Actual 568x320 gameplay at 9d7dc8b0 showed the dock beginning at y153 while the renderer player envelope ended at y206; the HUD covered the body. A layout scoped to height<=420 and width>=480 now places portrait, name, four vitals and Location in a compact row, with one horizontally scrollable action strip. No command or vital is removed. Visual keycap badges are omitted only in this constrained layout; bindings, Help, command text and handlers remain. Long names retain their full DOM text while their short-layout visual caption is limited to two lines.

Native checks at 320x568, 568x320, 800x360 and 1024x768 assert dock/body-envelope separation and no page horizontal overflow. The 568x320 dock is 93px tall and begins at219, clear of the normal 92px creature envelope. Real Shore swimmer water entry/dive provides a longer actual roster: all 19 command nodes remain, strip scrollWidth644/clientWidth536, native wheel scrollLeft108, and native Tab reaches the last enabled Group travel command. Desktop portrait behavior remains covered by the before/after viewport bounds. This does not prove all anatomical sizes/zooms, target trays or arbitrarily narrow+short windows.

The existing UI event classifier now exempts command Tab/Enter/Space at the earlier keyboard capture, matching the main handler's existing native-control intent. Actual click events retain their tick barrier; arrow/WASD world control remains unchanged. Boundary tests and input-responsiveness integration passed.

A separate short-window capture exposed the 250px weather plaque competing with Menu. Its existing 120px candidate is now available for short heights as well as narrow widths. The regression fixture preserves full Cold spell/Mist/Snowfall/Rain wording and asserts zero overlap with player, dock, notices, Menu and task objective. Public seed THERMAL-REVIEW-3 also produced a genuine cold/snow/mist readout that clears all measured actor/UI bounds. No climate or season was authored. Native compact and diving captures inspected; source snapshots come from separate worlds, not a frozen-state pixel comparison.

UI art-direction/presentation, canonical action contracts, information input, input responsiveness, storm/thermal readout, canonical source audit and exact public export passed. Ownership note: docs/art/short-hud-v1-handoff/README.md. Creator and full v1 acceptance remain open.

Reproduce: node tools/review-short-hud.cjs reports/short-hud-new --thermal; node tools/review-dive-label-ui.cjs reports/short-hud-dive-new.
