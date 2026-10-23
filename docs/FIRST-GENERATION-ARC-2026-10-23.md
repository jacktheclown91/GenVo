# First-generation arc (October 23, 2026)

**Creator direction:** protect and sharpen the first-generation arc, so a new player quickly feels inheritance, stakes, and the power of body plus knowledge. This was chosen first from the creator's pre-jam priorities.

## What the player sees

**Your First Young** card (`src/ui/young-summary.js`):
- Appears when the creature the player controls has its first litter in a world, once per world (`sim.uiFirstYoungShown`, kept in saves).
- Pauses play like the other milestone cards. It waits while the menu, Creature Lab, heir chooser, generation reveal or legacy summary is open.
- "Raise them", Enter or Escape resumes.
- Later litters get a short notice with the same facts instead of a card.

For each newborn (up to four), with a portrait drawn by the game's renderer:
- **From you / From its other parent / Both of you carried:** read from the birth's recombination receipt (`bodyInheritance`).
- **New in this body:** parts neither parent's layout supplied, such as a mutation.
- **Developed from inherited traits:** socket-by-socket changes between the inherited layout and the final body, from trait reconciliation during development. Labelled **Shaped by your guided design** when a guided design applied.
- **Lost in development / Not inherited from you.**
- **Compared with you:** inherited trait differences (`compareGenes`), for example "sharper senses", "smaller body".
- **Born with:** adaptations neither parent had (`bornWith`).

The card also states, in line with the real teaching model (`family.js`), "Bodies are inherited. Knowledge is not": young near you learn water, food, shelter and danger from what they see you do. The stakes line says they depend on you, and after about 30 days of growth one can carry the line on with H, linking to The First Legacy.

Nothing is inferred from species names, and building the card changes no simulation state (tested).

## Evidence

- **`tests/young-summary.mjs`** (gate), on a natural litter:
  - every part of every young is attributed exactly once;
  - "from you" parts are on the player and "from the other parent" parts are on the mate;
  - the text is present;
  - the full snapshot is unchanged by building the card;
  - the shown-once flag survives saves.
- **`tools/verify-first-young-browser.mjs`** (exported build, Spring jumper, PLANET-OBS-3, days accelerated under AUTO):
  - the card appeared at the first birth and paused play;
  - two young were shown with portraits. One developed a digging forelimb; the other a storage sac and was born with Water Sacs. Both turned their walking legs into spring legs from inherited traits;
  - "Raise them" resumed play;
  - the card did not reappear after save, reload and Continue;
  - no page errors.
  - [Screenshot](first-generation-arc-2026-10-23/first-young-card.png).
- **Previews on other seeds** showed sibling differences: one young born with a new webbed leg, others differing in speed, digestion or senses.

## Related checks in the same pass

- **Browser saves along the journey** (`tools/verify-journey-saves-browser.mjs`, [report](first-generation-arc-2026-10-23/journey-saves-report.json)): a pregnancy, first birth, real H succession and a border crossing each survive Save World, reload and Continue exactly.
- **Ungated test audit:** see [UNGATED-TEST-AUDIT-2026-10-23.md](UNGATED-TEST-AUDIT-2026-10-23.md).

## Not done

- Manual play by the creator.
- The remaining pre-jam priorities (early ecological drama, anatomy as verbs, visible temperament, exploration, performance) are recorded in the full-game plan and not yet started.
