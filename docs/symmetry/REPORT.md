# Bilateral developmental symmetry (October 16, 2026)

Nothing is committed. Rules are tested; the visual judgement is yours.

## What I found first

**GenVo's genetics were already mostly bilateral.** Limb sockets mirror n ↔ (8 − n) mod 8: pairs are 1/7, 2/6 and 3/5, while 0 and 4 lie on the midline.
- Every wild starting body uses mirrored pairs, with front and hind pairs free to differ. Mosskip has walking forelegs and spring hind legs, exactly your example.
- Mutations already mirrored leg, eye and flank changes.
- Recombination already inherits mirrored pairs as a unit.
- Creature Lab already places parts in mirrored pairs by default (the M key toggles independent editing), charging for both sides.

Audit of a 300-day world (`tools/symmetry-audit.mjs`, seed SYM-A, `docs/symmetry/audit-before-SYM-A.json`):

| Species | Asymmetric bodies | What differed |
| --- | --- | --- |
| Rillsifter | all | its wild starting body has gill slits on the left flank only |
| Mosskip, rootling, GenVo | 1–4 animals per species | a spur (claw, barb, bristle) on one foreleg only |
| All species | none | mismatched legs |

**The irregular look in the screenshot comes from presentation, not anatomy.** I cropped creatures from a running world (`docs/symmetry/look-crowd.png`, `look-singles.png`). Every mosskip there has the same symmetric body, yet the legs look irregular because of three animation effects in `src/render/genvo.js`, not because of differing parts:
1. **Gait phase.** Left and right legs are drawn half a stride apart (a trot, line 42), so they are never mirrored while walking.
2. **Resting settle.** At rest, one leg chosen by `settleIndex` is lifted (line 46).
3. **Reach.** Reach varies by leg type and posture (alert, fleeing, eating, courting; lines 49–53).

Front and hind pairs of different leg types also project differently in the top-down view.

## What changed (genetics; `?developmentalSymmetry=0` restores the previous rules)

`src/lineage/developmental-symmetry.js` (new), `src/lineage/body-inheritance.js`, `src/main.js`:
- **Paired mutations are all-or-nothing.** Previously, if the first side developed a change and the mirror could not, the first side stood alone silently. Now the mutation fails and the body is unchanged.
- **Spur mutations develop on both legs of a mirrored pair.**
- **A deliberate route to asymmetry.** With probability `ASYMMETRIC_SHARE` (0.05, a proposal), a mutation event expresses on one side only: one leg of a pair becomes a variant its lineage can reach, or one leg of a pair gains a spur. The change is inherited like any anatomy. Recombination keeps a parent's asymmetric pair together, so it can spread or be lost by selection and drift. There is no asymmetry penalty: any cost comes from the parts' real function.
- **Existing bodies, saved bodies and Creature Lab edits are never rewritten.**

The world audit afterwards (same seed, `audit-after-SYM-A.json`) still shows asymmetric bodies at 1–2% per species. They now come from the deliberate route, for example 3 mosskip with one runner foreleg, one rootling with a spring leg facing a grasper. The one-sided rillsifter gill slits remain, since starting anatomy is unchanged.

## Verification

- `tests/developmental-symmetry.mjs` (new):
  - over 1,800 mutation steps across five lineages, no ordinary mutation leaves a pair half-changed;
  - the one-sided route occurs (91 of 1,800);
  - spurs come in pairs, and distinct front and hind pairs count as bilateral;
  - an asymmetric parent's pair is inherited as a unit, and identical parents pass the body on unchanged;
  - with the switch off, the old one-sided spurs return.
- The 13 existing inheritance and anatomy tests pass.
- Fast tier: 372 pass, 5 known failures. `observer-play` (a timing budget) exceeded its limit while another session was benchmarking in parallel. Alternating runs with symmetry on and off under the same load gave the same 500–634 ms, so it is load, not this change.

## Decisions for you

1. **The leg-pose look.** Options for the renderer, none implemented:
   - (a) mirror the resting pose exactly, with no single settled leg;
   - (b) keep the trot while walking but reduce how far a pair's phases diverge in the top-down view;
   - (c) leave the animation and judge it after the rendering work.

   Each is a visual change you would need to see.
2. **Rillsifter's single left gill slit.** Make it a pair for newly created worlds, or keep it as the species' (already inherited) asymmetry?
3. **`ASYMMETRIC_SHARE` = 0.05** of mutation events.
4. **Radial, legless and other body organisations** don't exist in the part registry yet. When they are added, they will need their own developmental grouping.
