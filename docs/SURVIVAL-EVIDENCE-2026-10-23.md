# Why survival feels passive: evidence (October 23, 2026)

**Creator feedback:** "I feel like I do nothing and the character wanders in circles, but I never lose. I should be able to move and explore more each day."

This is Phase 1 of `design/GENVO-V1-PLAN-2026-10-23.md`: measurement before any change. Nothing in the game was changed for this report.

## Findings

### 1. Not eating or drinking almost never kills

`tools/probe-idle-budget.mjs`, GENVO8-TEST-A: an adult that stands still with no input, never eating or drinking:

| Per day | Energy (store 124) | Water (store 114) |
|---|---|---|
| Spring and autumn | -0.42 (0.34%) | -0.40 (0.35%) |
| Summer | -0.42 | -1.20 (1.05%) |

- **Starvation:** about 290 days for a resting adult, equal to its whole lifespan (290 days).
- **Thirst:** roughly 95 to 285 days, depending on season.

Over 128 days with no input (`tools/probe-survival.mjs idle`) the idle creature died on all three seeds, after 12, 40 and 78 days, each time to a predator. Its energy never fell below 0.6 and its water never below 0.54.

### 2. Player and wildlife share this physiology

Since 2026-10-16 (`PHYSIOLOGY_PARITY`), the player has had no protection:
- **Removed:** the player's 6× energy and 8× water multipliers, the cheaper manual movement, and the opening immunity.
- **Calibrated on lenient rates:** wildlife populations were calibrated on these low resting rates. Removing the player multipliers made the player exactly as safe as wildlife.
- **So nothing protects the player specifically.** The shared resting costs are simply very low.

### 3. AUTO keeps the creature topped up

`tools/probe-survival.mjs auto`: three seeds, 128 days on AUTO ([data](survival-evidence-2026-10-23/passive-auto-128d.json)):
- **Energy:** usually stayed around the 0.72 feeding threshold (median daily minimum 0.58–0.72). The only deep dips (0.16–0.28) came in autumn and winter on two seeds, when reproduction took its share.
- **Water:** never below about 0.5.
- **Health:** stayed at 100 except for rare predator contact.
- **Deaths:** one, to predation, in three runs.
- **Seasons:** winter showed no general extra pressure (median winter energy minimum 0.28–0.47, similar to other seasons).
- **Distance:** about 11 tiles per day.

### 4. A day is too short to go anywhere

`tools/probe-walk-budget.mjs`: walking non-stop for a whole in-game day covers 9.9 tiles (sprinting 13.8), because a day lasts 6 seconds. The world is 128 tiles across per region.

| Activity | Cost per day |
|---|---|
| Rest | 0.42 energy |
| Walking all day | 1.63 energy |
| Sprinting all day | 2.04 energy |

Walking costs about 0.12 energy per tile beyond resting, so a full store covers roughly 1,000 tiles. Travel never threatens survival, and a day is over before a journey can begin.

### 5. What "wanders in circles" is

- **On AUTO, not yet traced.** With food and water never pressing, the AUTO creature's day is filled by non-survival routines: family, social, territory and exploration targets. Wildlife ambient rhythms pick 2–5 tile local targets, but they do not apply to lineage members. Which routines produce the circling, and how often they re-target, is the next trace.
- **The probe artifact:** the first idle probe passed no input at all, and the game treats that as AUTO. It was discarded; the browser always passes input. The idle run above uses an empty input object, as the browser does.

## What this means

The "never lose" feeling has a measurable cause: daily needs are tiny relative to body reserves. Food, water and seasons cannot create pressure when a resting animal could fast for its whole life. Making the world harder with damage multipliers would not fix this, and the brief rules that out. The physiology itself needs real daily needs, shared by every organism, and the ecology has to be re-checked so wildlife can still meet them.

## Proposed next steps (need creator decisions)

1. **Day-length policy** (versioned, old saves unchanged).
   - Movement stays real-time, and daily biology keeps its daily totals.
   - **Walking range per day:**

     | Day length | Tiles per day |
     |---|---|
     | 6 s (now) | 10 |
     | 12 s | 20 |
     | 16 s | 26 |
     | 30 s | 50 |

     With travel costs per tile unchanged, a longer day makes a day's journey cost more of the day's budget.
2. **A metabolism policy with real daily needs**, versioned, for every organism. Its targets are biological timescales, not multipliers. For example:
   - a resting adult of this size starves in about 2–3 weeks without food;
   - it dehydrates in about 3–5 days without water, faster in heat;
   - cold raises needs through the existing thermal demand.

   Then measure wildlife over 360-day runs. If populations collapse, check food production and feeding behaviour, without tuning populations toward a wanted outcome.
3. **Re-measure with the new day and metabolism:** passive AUTO, idle, reckless travel, prepared play and winter strategies, on the same seeds, so player choices visibly change outcomes.

## Reproduce

```
node tools/probe-idle-budget.mjs
node tools/probe-walk-budget.mjs
node tools/probe-survival.mjs auto 128
node tools/probe-survival.mjs idle 128
```
