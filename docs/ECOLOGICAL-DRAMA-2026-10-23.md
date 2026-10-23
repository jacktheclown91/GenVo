# Early ecological drama (October 23, 2026)

**Creator direction:** stage more visible ecological drama early. Surface real seasonal pressure, territory shifts and resource scars as short story beats in the first half hour.

## What the player sees

Short notices in the progress lane (seven seconds each) describe real changes in the player's home range. The home range is the established territory home (`territory.state(p).home`), or the player's position before one exists.

`src/gameplay/world-story.js` (`WorldStory`) samples a 12-tile radius around that centre once per in-game day. It compares the sample with the previous day and with three days earlier. At most one beat is shown per day, chosen in this order:

| Beat | Rule (constants in `WORLD_STORY`) |
|---|---|
| Fire | Burning cells within 12 + 8 tiles, with direction |
| Season | The first arrival of each season is always told, with a first-time hint. Later turns are told only when local plant cover changed at least 15% since the previous turn, giving the measured percentage |
| Water shrinking | Local water volume fell at least 20% in a few days |
| Ice closing | At least half of at least 4 water cells frozen (`surfaceIceCovered`), from under 30% the day before |
| Ground eaten bare | At least 6 cells that held 0.3+ plant cover dropped to 35% or less of it, excluding burning cells, with direction |
| Worn trails | At least 8 cells newly reached traffic 0.6 (`history.traffic`), with direction |
| Hunters | At least 2 hunters (`canHunt`) seen where none were seen before |
| Herd moved in | At least 4 of one species seen, at least double the earlier count plus 2 |
| Herd left | A group of 4+ is no longer seen |
| Births | At least 2 newborns (age under 2 days) of one species seen |
| Carcass | Carrion above 0.3 visible where none was before |

**Spacing:**
- The minimum gap between beats is 1.5 days up to day 60, 2.5 days up to day 300 and 5 days after that.
- The same kind does not repeat within 6 days.

**Knowledge limit:** creatures and carcasses are counted only when the player's creature actually sees them (`creatureView` / `viewCanSee`, up to 24 tiles from home). So a beat never reveals hidden predators or herds.

**Read-only:** the observer consumes no RNG and changes no simulation state. It is not saved; after a reload it starts sampling afresh.

## Evidence

- **`tests/world-story.mjs`** (added to the gate). It runs two identical PLANET-OBS-3 worlds for 32 days, observing only one of them.
  - The full save snapshots of both worlds are identical, so observing changed nothing and consumed no RNG.
  - Seen-creature counts match an independent visibility count.
  - At least 3 beats of at least 3 kinds appear.
  - Every beat respects the spacing and per-kind cooldowns.
  - Last run: 6 beats in 32 days (herd, season, trail, births).
- **Node runs on three quick starts** gave about 4 to 7 beats per 60 days.
- **Browser** (`tools/verify-world-story-browser.mjs`): exported build, shore swimmer, PLANET-OBS-2, real time at 1x under AUTO for 5 minutes. 7 beats appeared by day 48, with no page errors ([report](ecological-drama-2026-10-23/report.json)):
  - day 2: ice closing (during the game's own "Cold snap" weather notice, visible in the first screenshot);
  - day 9: Summer;
  - day 17: Autumn;
  - day 24: a group of 4 mirelicks moved in;
  - day 27: ice closing;
  - day 30: 2 young rillsifters born;
  - day 33: Spring.
  - Screenshots: [first](ecological-drama-2026-10-23/beat-1.png), [second](ecological-drama-2026-10-23/beat-2.png), [third](ecological-drama-2026-10-23/beat-3.png) (the Autumn beat).

## Honest limits

- **"Eaten bare" is rare.** Early grazing in these worlds does not strip ground (the grazing scar reaches at most 0.4 and plants stay abundant), so this beat only fires where pressure is truly heavy. It was not tuned to fire more often.
- **Quiet homes stay quiet.** The PLANET-OBS-3 jumper home produced only season beats in some runs. That is truthful for that place.
- **Beat text is fixed per kind.** Herd and birth beats name the species from its label; other beats use place and direction only.
- **Not yet observed:** manual play by the creator, and whether seven-second notices are noticed during play.
