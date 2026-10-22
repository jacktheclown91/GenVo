# Settled-direction anatomy evidence supplement

Earlier capture helpers assigned the logical direction while the renderer's 70 ms turn easing remained active. Those historical receipts established state equality, but the requested direction alone did not prove a settled rendered heading. They are retained unchanged.

The new [maternal helper](../../tools/review-maternal-directions.cjs) and [aquatic helper](../../tools/review-aquatic-directions.cjs) clear only renderer-owned turn interpolation for explicit facing fixtures, then assert its actual rendered heading equals the requested direction. This is an art inspection fixture, not natural turning behavior or a new biological action. Sources and simulations are otherwise the same before/after comparison method, now refreshed on canonical seed-policy merge `86495a9`.

| Group | Before, all directions at native screen pixels | After |
|---|---|---|
| Maternal tissue, three organs and both idle frames | [Unscaled gameplay crops](maternal-before-normal-pixel-contact-sheet.png) | [Unscaled gameplay crops](maternal-after-normal-pixel-contact-sheet.png) |
| Aquatic components, both feeding apparatus variants | [Unscaled gameplay crops](aquatic-before-normal-pixel-contact-sheet.png) | [Unscaled gameplay crops](aquatic-after-normal-pixel-contact-sheet.png) |

Whole normal-zoom gameplay examples: [egg chamber before](before-egg-chamber-2-0.png) / [after](after-egg-chamber-2-0.png); [live-bearing tissue before](before-live-womb-2-0.png) / [after](after-live-womb-2-0.png); [empty pouch before](before-brood-pouch-2-0.png) / [after](after-brood-pouch-2-0.png); [reed sieve before](before-reed-sieve-mouth-2.png) / [after](after-reed-sieve-mouth-2.png); [filter mouth before](before-filter-mouth-2.png) / [after](after-filter-mouth-2.png). Original full local sets retain 96 maternal and 32 aquatic captures; the atlases never enlarge their body pixels.

[Maternal receipt](maternal-receipt.json) and [aquatic receipt](aquatic-receipt.json) pass asserted headings, zero page errors and complete canonical saved-state equality with fixed envelope timestamps. No saved field is excluded. Fixtures explicitly control legal anatomy, adult age, facing and observation placement; organisms and natural terrain remain. Maternal idle frames are directly selected; aquatic direction coverage does not claim natural feeding/swimming or every action phase. Existing source/compiled tests independently cover all directional frame payloads and timing metadata.

Current-code CPU command samples remain narrow, concurrent-machine observations: maternal means 10.65 to 10.06 ms (60 draws), aquatic 8.23 to 8.37 ms (40 draws). They exclude GPU completion and establish no broad performance guarantee. These are evidence corrections, not new artwork, creator acceptance or retrospective edits to prior receipts. The comprehensive art and behavior mission remains active.
