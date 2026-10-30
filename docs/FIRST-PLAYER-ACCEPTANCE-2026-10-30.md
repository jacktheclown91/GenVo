# First-player acceptance (October 30)

`tools/capture-first-player-acceptance.cjs` (new) drives the real game in headless Chromium through what a new player meets after the basics. Screenshots and `receipt.json` are in `first-player-acceptance-2026-10-30/`. Result: **no page errors and no gaps.**

## Courtship to birth (desktop, 800 × 600)

- The harness follows the tutorial's own highlighted controls:
  - it walks toward the partner the "To Mate" cue points at;
  - it clicks the creature marked **Mate**, then **Court**, **Approach** and **Play**, then watches.
- **Conception.** The partner (#113) conceived with the player (#109), with a 16-day gestation.
- **Creature Lab.** It opened for generation 2 and paused the world. The player chose **Keep the old body**, the designed exit without changes (Evolve asks for a second confirmation).
- **Birth.** The world then ran on the game's own Auto mode. Two young (#197 and #198) were born on day 17, exactly 16 days after conception. The player was alive, and the "Your First Young" inheritance screen showed both recorded parents' anatomy.

## Touch-only play (phone portrait, 390 × 844, touch input)

Every input is a tap:
- the welcome screen;
- **Drink** from a tapped freshwater target's menu, which raised hydration;
- **Eat**, which raised energy;
- tapping a creature, which opened its context menu;
- the Menu and the Population panel.

There is no horizontal overflow. An earlier miss turned out to be the harness passing canvas pixels as page coordinates; the game converts them correctly.

## Giant body (diagnostic staging)

Natural giants need many generations of selection: founders start at 0.95–1.05× and size mutates about 3% per generation. No short run can show one in natural play. A wild adult bankjaw was therefore staged at 2.6× through its inherited size alleles, clearly labelled as diagnostic. It renders at giant scale beside ordinary bodies, stays alive, moves in the world, and the HUD shows its predator warning.

## Not covered

- **Unfamiliar-player usability** needs people who have not seen the game; automation cannot judge comprehension.
- **Giants arising naturally** need a long evolutionary run.
- **Real touch hardware**: Chromium's touch emulation stands in for it.
