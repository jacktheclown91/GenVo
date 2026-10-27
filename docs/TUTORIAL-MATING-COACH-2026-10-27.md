# Mating tutorial: guidance through the actual controls

The creator prioritized an external usability problem: passing tutorial tests had not made the mating interface clear to a new player. This pass replaces the simultaneous Court/Approach/Play paragraph with a single current action and a visible cue on the actual usable control. Creature and environmental artwork are unchanged.

## Behavior

1. Mark a currently eligible, reachable mate using the existing reproduction authority. Prefer the starting companion when eligible; respect another eligible partner the player selects.
2. After clicking that creature, highlight Court in the live wheel (or dock fallback).
3. Once the courtship tray opens, highlight Approach. If a sequence is already queued, guide directly to Play; other valid anatomical displays remain usable.
4. Highlight Play, then show a short watch-for-the-response instruction during actual movement/performance.
5. Explain refusal, interruption or acceptance without promising a pregnancy. The existing completion card explicitly explains mutual acceptance after actual mating. An accepted display without pregnancy retains the authoritative recovery explanation.

If no eligible mate is nearby, remove the Mate marker and action glow and explain the current canonical reason. Suggest food, recovery, adulthood or another partner as appropriate. An unusable open encounter points to Back Off; paused worlds explain resuming. No new mating gate, selector, input interception, resource grant, consent modifier or biological RNG draw is introduced. A separate UI defect found by the extended real-click check is also corrected: changing a partner reaction updates text without rebuilding live controls. Unchanged status text is not repeatedly reassigned to live regions. The actual Play node remains connected and enabled through a one-second browser observation and the same 1,000 ms click budget. Old saved tutorial stages derive their next cue from their current state; queued and active performances continue normally.

`mating-tutorial-guide.js` is a UI reader borrowed by TutorialController. Existing controls expose action/target data attributes. Exactly one visible enabled control receives the gold inset outline, fill and star; the inset survives clipped trays. Reduced-motion users retain the static cue. Accessibility descriptions are preserved and associated with the existing polite tutorial region. Unchanged cue text is not rebuilt every frame; changing world, actor, stage or control clears stale cues. The guide never steals focus or clicks a control.

Shared-UI handoff: `index.html` changes only completion copy; `styles.css` adds scoped coach presentation. Context/courtship controls add descriptive data attributes. Biological owners remain untouched. This is the checked-in integration handoff; the commit diff is the reviewable patch.

## Evidence and limits

The complete local gate passes 125 checks (63 + 62 in the existing partition and budgets). After the final retention and duplicate-announcement guards, focused mouse/live courtship, refusal, mandatory tutorial and coach contracts pass again; final exact-head remote CI must cover the complete frozen commit. New controller tests separately pass on Node 22/24; the original mandatory tutorial, historical birth-containing snapshots, reproduction and integration checks remain in the gate. Architecture, source audit after sprite-reference generation, and public export pass.

The native browser run enters a real New World, eats and drinks through controls, clicks the marked mate, Court, Approach and Play, then observes actual mating and completion. Each coach cue is asserted and captured. The second controlled-input browser fixture pays for seven real displays and cancels them through Back Off, then observes an actual deterministic refusal and a successful retry. No creature stats, ancestry, preferences, resources or acceptance rule are edited to obtain that refusal. This deliberately selected UI input sequence is not a natural population or acceptance-rate experiment.

A separate explicitly labelled post-lesson presentation probe replays the lesson with an unwell actor, checks the authoritative current recovery reason, no Mate marker and zero highlighted controls, then restores the actor. This staged probe is not counted as native mating evidence. Rendering 24 guide directions preserves the entire saved graph, including cycles, through the existing scenario codec. The final current source/CSS ordinary run and retained-button refusal/retry run are excerpted in `browser-observations.json`; raw originals remain in the verified archives. Real desktop, narrow portrait and small landscape frames were inspected; the first outer-glow implementation was clipped inside the tray and was corrected to an inset before these retained final frames.

The browser harness now reobserves a moving target by stable organism ID and current screen projection, rather than requiring two asynchronous positions to remain within 0.05 tiles. Its original 60-second mating budget remains. Earlier harness failures are preserved in ignored reports: stale coordinate lookup, a cyclic-JSON parity serialization failure (replaced by the existing full graph codec), transient click projection, and an alternate seed that timed out at food before reaching mating. The later detached-button click failure is preserved separately and led to the live-text/control separation, rather than a higher timeout. The alternate seed is not claimed as a passing tutorial trial; the fixed food-routing script does not establish general new-player usability. Curated receipts and frames are in [the evidence directory](tutorial-mating-coach-2026-10-27/verification.json).

Automated control and pixel observations establish implementation, not novice comprehension. A fresh player still needs to retry without coaching from a developer. Observe where they hesitate, whether the next highlighted control is apparent, and whether refusal is understood as a creature response. No new external user acceptance is claimed.

Reproduce from the source or an extracted public export:

- `node tests/mating-tutorial-guide.mjs`
- `node tests/mandatory-tutorial.mjs`
- `node tools/review-tutorial-direction.cjs reports/mating-coach-review --coach`
- Add `--rehearse-refusal` for the separate paid/cancelled-display refusal/retry input fixture.
- `node tools/check-playable.mjs`

Stable itch ZIP and published build are unchanged. This UI priority does not close the active autonomous recognition, regional continuity or performance objectives. The preceding population checkpoint c4be59e4 passed exact-head CI 40450087429; this tutorial checkpoint needs its own remote CI.

The existing manual Chromium workflow now runs the real `--coach` click-through and preserves its receipts. Both raw evidence archives retain successful and failed prototypes unchanged; CRC and every entry SHA were verified. The stable-control follow-up archive SHA256 is `6ba8b0359e045ee68f5f822657dd2ab39b7092f32a023c554e3cc64cd5fa9de3`. The archives are evidence, not new web releases.
