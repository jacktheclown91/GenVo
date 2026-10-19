# E12: cold wildlife torpor and habitat search

This milestone extends E11's food web and E10's mammalian warmth into organism decisions.

### Cold-season torpor
- **Mounted fat-pad or fat-tail**, not a hardcoded named species, enables entering torpor on cold, safe, dry ground. The animal must be grown, healthy, adequately hydrated and well fed, not pregnant or caring for dependent young, and not next to a detected predator.
- Creature **energy and water remain the only reserves**. While dormant, existing metabolism charges less of both, but does not stop; basal temperature exposure is worse, internal heat output scales down, and real predator capture chance rises. Long starvation or thirst, sickness, warming and predator disturbance force wake-up. Normal prey damage and predator rules still apply.
- Autonomous animals with appropriate anatomy and ample reserves elect torpor in sufficiently cold ground cells after higher-priority threats. Manual players can use **8** or the mouse action dock to enter/wake, and movement automatically wakes. Torpor persists as normal actor state through the existing save and load path.
- Resting does **not** grant a hidden new fat bank, blanket invulnerability, accelerated healing, food income, or extra reproductive access. It is a calculated response to winter and risks predation.

### Cold-season habitat seeking
- Non-torpid, adult, cold-exposed wild creatures without fat stores may search a **short, finite local radius** for warmer land that already contains edible plants. Candidate cells must pass the existing occupancy and reachable path constraints.
- Route selection integrates the canonical `MigrationController`, using its existing mutable state, rather than teleporting actors or creating a second migration engine. For these cold routes the acceptance condition is food and temperature, not breeding carrying capacity. When the animal arrives or the local ground becomes warm, its cold route closes.
- Other breeding/territorial migrations remain governed by their previous rules. This is **not** yet large-distance, biome-wide or across-continent seasonal migration; the physical World is still 128×128 playable tiles.

### Known work
Fine art for sleeping postures, den excavation, snowpack and true large-scale wildlife corridors are not provided here. Torpor thresholds are deliberately provisional until real playtesting. The interactive smoke runs small cold-phenotype and route fixtures plus live metabolism, wild decision, movement, status and save checks, not all major suites.
