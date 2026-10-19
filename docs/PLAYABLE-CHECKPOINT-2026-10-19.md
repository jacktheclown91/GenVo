# October 19 playable checkpoint, not yet release acceptance

Source branch: `codex/repository-consolidation`. This checkpoint prioritizes the existing default freshwater game, not opt-in planetary-scale maturity. There is no published stable release claim.

## Code changes after the Codex handoff

- Manual saves arriving during an in-progress autosave wait and then make a fresh snapshot. They are no longer returned as failed solely because `SaveManager.busy` is true.
- Loading, allocating, deleting and clearing save slots wait for an existing write to settle. The intent is to prevent stale reads, unexpected slot changes and deletion races.
- `tests/save-concurrent-requests.mjs` models IndexedDB capture/commit barriers and asserts that a later manual save contains actual intervening simulation ticks.
- `node tools/check-playable.mjs` runs focused syntax, save/load/menu/world-switch and interaction checks. The matching GitHub workflow is `.github/workflows/playable-checkpoint.yml`.

## Evidence boundary

The prior Codex checkpoint reported **454 passing fast checks, four known failures and 12 deferred**. This is historical evidence from the pre-handoff tree; the current changes require a fresh test run. GitHub commit publication confirms file custody, not test execution. No authenticated Chromium/manual gameplay acceptance has been observed for this exact checkpoint.

The current default freshwater generator is the candidate for a short playable session. Opt-in planetary travel/offscreen regions still have documented multi-hundred-millisecond main-thread stalls and mature memory/restore costs. Do not label that mode stable or hide those issues through population clipping or simplified fake regional ecology.

## Reproducible local check

```sh
git switch codex/repository-consolidation
git pull --ff-only origin codex/repository-consolidation
node tools/check-playable.mjs
python -m http.server 8000
```

Open http://localhost:8000/ in Chromium or Edge. Start a **new freshwater world**. Test movement, mouse approach, food, water, held brace, combat, ordinary courtship, save now, pause/return, Continue, and switching between two world slots. Play at normal speed for ten minutes and revisit a save. Record any frozen frame, console exception, stuck control, incorrect resource action, lost state or inconsistent UI, using the exact seed and browser details. These are practical creator checks, not a scripted promise of forced births or survival.

## Acceptance for a short playable candidate

- No uncaught page errors, softlocks or corrupted saves in a ten-minute first-session trial.
- Clear movement, food/water feedback, working contextual action and a visible survival option.
- Save/Continue and world switching preserve the actual state; failures are surfaced rather than silently claiming success.
- The player can engage with food, threats and exploration before reproduction.
- Any failing or deferred check remains disclosed. Passing this short-session gate does not close Living Planet acceptance, mature-world/browser performance, human UX evaluation or 100-day environmental conservation.

Work on emergent social groups, advanced anatomy and planetary scale can continue after this baseline is measured. Do not merge to main or publish a stable release based solely on this file.
