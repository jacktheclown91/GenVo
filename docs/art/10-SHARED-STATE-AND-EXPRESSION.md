# 10 — Shared state coordinates part-owned expression

**Status:** creator design rule, recorded 2026-10-11; runtime implementation and visual acceptance pending. The creator explicitly identifies anatomy-dependent expression as a feature of particular interest. Detailed contracts below are agent-authored proposals.

## Core rule

**Parts contribute expressive responses, but the creature's emotional and physical state coordinates them.**

Each part may define responses to shared `fear`, `curiosity`, `aggression`, `pain`, `fatigue`, `comfort`, `courtship` and `alertness` signals. The creature animation coordinator combines these with current actions, functional anatomy, world contacts and movement constraints. The part owns its legal local response; it does not invent an independent emotional state.

Different anatomies can communicate the same experience differently. An organism without movable eyes may express fear through a supported posture. Eye stalks may retract when their rig supports retraction. A frill may flare. A missing part or degree of freedom never produces an imaginary replacement.

## Authority and signal flow

`Observed simulation state → shared expression signals → action/expression arbitration → per-part response → constrained joint/pose solve → authored rendering`.

Signals describe an organism's experience or physical condition. Derive them from existing perception, cognition, threats, injury, exertion, thermal condition and reproduction authorities. Do not grant omniscient knowledge or assign emotion by starting species, palette or appearance. Expression does not create movement, stamina, damage, mating success or ecological effects.

| Signal | Proposed evidence source | Interpretation boundary |
| --- | --- | --- |
| `fear` | Perceived danger, threat memory, escape pressure | No response to an unseen predator solely because it exists |
| `curiosity` | Sensed novelty and investigative attention | Looking is not proof of curiosity; dormant creatures need not scan |
| `aggression` | Current attack/defense motivation | A hunting mouth or Stalker ancestry does not imply constant aggression |
| `pain` | Authoritative injury/recent damage | Distinguish pain response from merely low health |
| `fatigue` | Exertion, stamina and relevant reserve state | Stillness alone is not exhaustion |
| `comfort` | Satisfied physiological needs and sensed safe conditions | Shelter proximity does not guarantee safety or warmth |
| `courtship` | Actual reproductive motivation and validated courtship | Expression grants no fertility or mating bypass |
| `alertness` | Current attention, sensed contacts and vigilance | May coexist with fear, curiosity or aggression |

Represent each signal as a bounded intensity from0 to1, with an explicit provenance/source and simulation tick. Multiple signals may coexist. Define attack/release smoothing, decay and conflict weights in versioned data. Missing evidence produces neutral intensity, not a fabricated experience. Keep optional internal diagnostics separate from the normal player view.

## Part response contract

Proposed `expressiveResponses` entries identify:

- shared signal and response curve;
- required functional joint/feature and allowed degrees of freedom;
- local pose target or authored image variant;
- gain, attack/release timing, bounded amplitude and maximum joint speed;
- action compatibility and blend/override policy;
- priority and fallback to neutral when the local response is unavailable.

Example conceptual response:

```json
{
  "signal": "fear",
  "response": "stalk-retract",
  "requires": ["declared-retraction-dof"],
  "channel": "stalk-extension",
  "curve": "fear-retraction-v1",
  "compatibleActions": ["idle", "look", "escape"],
  "unavailableResponse": "neutral"
}
```

This is a proposed contract, not a runtime schema or approved rig. The current illustrative eye-stalk hinge limits alone do not establish retraction support. If a stalk only bends, express a supported bend or use another available part; do not stretch, detach or erase the eye to simulate retraction.

## Coordinator arbitration

1. Resolve authoritative action, injury/death state, contacts and movement constraints.
2. Obtain shared signal intensities once for the creature at the simulation boundary.
3. Discover compatible responses from its actual functional parts. Fixed eyes stay fixed; injured or absent appendages lose unsupported responses.
4. Negotiate channels across parts. Compatible signals blend within declared limits; competing targets use a deterministic priority/weight policy rather than independent full-strength commands.
5. Maintain gait support and action-critical channels. Fearful posture cannot break planted feet; courtship cannot overwrite a bite window; pain cannot visually rotate a constrained joint through its limit.
6. Solve each part locally, then compose attachments, material masks and palette-preserving authored frames.

Distinguish urgent physical reactions from slower sustained expressions. Blend on deterministic simulation time, preserve continuity across action changes, and avoid resetting every part's animation whenever one signal changes. Interpolation may improve rendering but cannot change simulation results.

Posture uses actual supported body/joint geometry. Secondary soft-tissue motion stays subordinate to the existing joint-driven animation contract; expression does not authorize a universal whole-body bounce or a species-specific substitute renderer.

## Anatomy-specific examples

| Shared experience | Possible supported responses |
| --- | --- |
| Fear | Lowered/braced posture, folded appendages, retractable stalks, raised or flared defensive frill |
| Curiosity | Eye tracking, stalk orientation, head tilt, cautious body orientation |
| Aggression | Jaw tension, crest display, braced forelimbs, tail positioning |
| Pain/fatigue | Guarding an injured region, reduced expressive range, drooping supported features, slower recovery |
| Comfort | Relaxed posture, softened gaze variants, settled tail or frill |
| Courtship/alertness | Compatible displays, focused orientation and coordinated attention |

These are authorable examples, not mandatory poses. A frill's fear response and courtship response can differ. Similar bodies can inherit different supported response gains/timing through a later accepted variation system. Keep anatomical inheritance and animation-definition versioning consistent; expressive variation cannot silently modify biological traits.

## First development slice and acceptance

Prioritize this rule in the first accepted authored-animation slice: one shared fear/alertness signal source expressed by a fixed-eye posture build, a stalk-eye build and a frill build. Reuse the same coordinator and part interfaces. The earlier small GIF studies are a starting reference, not proof of a working coordinated system.

Require actual editor/gameplay footage and deterministic checks for:

1. The same signal episode producing different supported anatomical responses.
2. No imaginary eyes/limbs, invalid retraction, joint-limit violation or contact skating.
3. Mixed fear/curiosity, pain during locomotion, courtship interrupted by danger, and neutral recovery without pose snaps.
4. No changes to hit registration, locomotion authority, reserves, reproduction success or simulation RNG from visual expression.
5. Identity and contrasting palette substitutions preserving original pixel shading, detail, alpha, every frame, facing and timing, including changes mid-expression.
6. Pause/resume, save/load, inherited body plans, damaged/missing parts and definition-version compatibility.
7. Measured frame pacing and memory with many distinct creatures, including near/far LOD. Reduced distant detail must retain useful action/state readability.

The long-term target is hundreds of independently evolving creatures that visibly communicate their different experiences through their own anatomy. Broad production acceptance requires performance and real visual evidence at that scale; prototype GIFs or isolated pose tests do not establish it.
