# Living Creature Pass, slice 1 (October 23, 2026)

**Creator direction:** make creatures feel like individuals. "Watching five creatures for two minutes should reveal differences in how they behave, without needing to open their statistics." The differences must come from real inherited temperament, experience, anatomy and conditions, not scripted personalities. The creator approved both parts of slice 1: visible reactions first, then responses to strangers.

## Part 1: each animal's own reaction is visible

Staged threat perception already decided, per animal, whether a nearby predator is:
- only **watched** (vigilance);
- **backed away from** (the 'wary' retreat at the alarm stage);
- **fled**.

Each animal's own senses, inherited boldness (`genes.temperament`) and current need set those thresholds. Before this pass the renderer drew a wary retreat as a plain walk and never showed vigilance at all.

`src/render/reaction-expression.js` now shows the stage (presentation only):
- **Watching:** the animal stops facing where it was going, turns its body and head to the predator it tracks, and widens its eyes. A cautious animal crouches and pins its feelers; a bold one stands tall and square-on.
- **Backing away:** low and tense, glancing back at the threat. Cautious animals glance back more often.
- **Fleeing:** the existing flight pose.

The reaction stage and head angle are part of the sprite cache key, so cached creatures stay correct.

## Part 2: responses to a stranger

`src/ecology/stranger-response.js`, policy `stranger-responses/1`.

The stranger is the player's creature when it is not a predator to the animal; before this, wildlife ignored it. A healthy, unhungry wild adult that actually perceives it within about 4.5 tiles (its own senses, the same detection as for threats) answers from its own state:
- **Parents with dependent young nearby** stand their ground between the young and the stranger. They posture and step toward it (no attack), with any display anatomy spread.
- **Witnessed a strike:** an animal that saw the stranger strike someone nearby keeps away for a while, whatever its temperament.
- **Otherwise, a weighed disposition** decides. It adds inherited boldness, its own bite and its condition, and subtracts the stranger's size relative to its own and a predator it watched recently.
  - Low: it **keeps its distance**.
  - High: it **investigates once**. It approaches to about two tiles, stops and watches, then loses interest for 45 seconds. If the stranger comes within about a tile, it backs off. So curiosity cannot turn into following.
  - In between, it carries on with what it was doing.
- **Exclusions:** hungry or thirsty animals, young, lineage members, and hunters that could prey on the stranger.
- **No randomness:** it consumes no RNG.
- **Saves:** each animal's state (`a.stranger`) is saved. Recorded worlds without the rule keep their recorded behaviour, and the rule is carried across region crossings.

Each response has its own body language:
- investigating: leaning in with feelers forward;
- watching the stranger: raised, feelers sweeping, facing it;
- keeping away: low, with glances back;
- posturing: tall and wide, display spread.

## Evidence

**Gate:** 97 of 97 checks pass with both new tests added.

**`tests/reaction-expression.mjs`** (gate):
- Stages come from real perception state, and boldness changes the body language of the same stage.
- In a natural world, 21 groups of one species near the same predator showed mixed stages within 3 days.
- Reading reactions leaves the world identical to an unread twin.

**`tests/stranger-response.mjs`** (gate) checks that:
- a cautious animal keeps away, a bold fed one investigates, and a balanced one carries on;
- disposition rises with boldness;
- curiosity stops at a short distance, watches, ends after a few seconds, and does not restart at once;
- a witnessed strike turns even a bold animal away, it is remembered, and it fades;
- hunger ends curiosity;
- a cautious parent still stands its ground for its young;
- turning the rule off stops all responses;
- saves keep the rule and the state, and old saves keep the rule off;
- in 12 natural days both curiosity and caution occur. Investigators averaged temperament 1.064 against 0.947 for avoiders.
- The population after 12 days was 184 with the rule and 187 in a rule-off twin.

**Browser** (`tools/verify-living-creatures-browser.mjs`): exported build, PLANET-OBS-3, two minutes at 1x with the player's creature on AUTO, no setup and nothing forced ([report](living-creature-pass-2026-10-23/report.json)).
- 61 creatures came within 9 tiles. 19 that the player's creature could see visibly reacted, in six ways: watch, flee, investigate, curious, wary and keep away.
- Same-species neighbours near the same predator reacted differently, for example three mirelicks fleeing while two only watched.
- The investigators were bold (1.075, 1.078); the one that kept away was cautious (0.963).
- [Labelled frames](living-creature-pass-2026-10-23/stages-grid.png). The labels and rings come from a temporary overlay drawn for the screenshot only, and appear briefly in the video.
- [Video, 2× speed](living-creature-pass-2026-10-23/living-creatures-2x.webm).
- No page errors.

## Limits

- **Only the player's creature counts as a stranger.** Wildlife-to-wildlife curiosity would change the whole ecology and needs its own population study.
- **No posture in the natural runs.** It requires young and the stranger close together, so it is tested directly but was not observed naturally.
- **Single-run population check.** The comparison covers 12 days on one seed, not a long-run review.
- **Subtle at normal zoom.** Body language differences are a few pixels; the clearest signals are where an animal faces and whether it moves toward or away.
- **Not yet observed:** creator or outside play.
