# Anatomy as verbs (October 23, 2026)

**Creator direction:** keep making anatomy change what you can do (verbs), not only numbers.

Many verbs already depended on the body before this pass: Jump, Pounce, Swim and dive, Burrow, Glide, Fly, Climb and perch, Winter torpor and Attack (`src/lineage/action-capabilities.js`). This pass adds one new verb, puts three hidden ones on screen, and shows the Creature Lab's verbs as the body is designed.

## New verb: Threat display

`src/gameplay/threat-display.js`, policy `threat-display/1`. This follows the "Threat display" row of the Biological Capability Expansion design (Wave B): real risk assessment and possible retreat, never guaranteed intimidation.

**Who can use it**
- Only bodies with display anatomy: display frill, flight wing, heat frill, horn crest, signal crest, proto-wing, flag tail, luminous tail, silt fin or display eye.
- Each part enlarges the outline by a set amount (5% to 25%), capped at 50%.

**What it costs**
- 18 breath and a little energy.
- A 6-second recovery before the next display.
- It ends any hiding or bracing.
- The creature must stand still: moving off the spot ends the display, which otherwise lasts 2.4 seconds.
- Hunters can see a displaying creature through cover.

**How hunters judge it**
Each Stalker engaged with the creature that can see the display judges it once. A hunter already committed to a charge does not stop to judge.
- **What the display adds up to:**
  - the creature's real body mass, enlarged by the display, relative to the hunter's mass;
  - the creature's real bite (the same attack ability that drives bite-back);
  - wounds this creature has already dealt the hunter.
- **The hunter's resolve:**
  - its inherited boldness;
  - its hunger (a starving hunter needs twice the threat a fed one does);
  - habituation: each time this creature's display has already turned it away, its resolve rises by 35%.
- If the threat reaches the resolve, the hunter breaks off. It retreats for 8 seconds with the existing cowed-retreat reaction, and the outcome is recorded as 'deterred'.
- Otherwise it keeps hunting, and the display cost breath and a standing pause.

The rule is deterministic: it consumes no RNG. Only the controlled creature displays for now. Wild bodies with the same anatomy (rillsifters carry flare parts) do not display yet.

**What the player sees**
- The flare parts spread fully and the body stands tall and wide (the existing courtship flare art, driven by the display).
- Each hunter's verdict is told in a short notice, with the reason it weighed most, for example "The stalker is too hungry to be bluffed: it keeps coming."

**Controls:** the Display button in the action tray, Display in the creature tray for a selected creature, or `;` (every letter key was taken).

## Hidden verbs now on screen

Carry food (Z), Hide in cover (V) and Warn family (X) already existed as keyboard-only actions. They now appear in the action tray for bodies that have the inherited trait each one needs, and only for those bodies:

| Verb | Inherited trait |
|---|---|
| Carry | Grasping Limbs |
| Hide | Camouflage Mantle |
| Warn family | Alarm Pulse or Mobbing Instinct |

The button labels follow the creature's state: "Drop / Store" while carrying, "Leave cover" while hidden.

## Creature Lab: "What this body can do"

`src/ui/body-verbs.js` lists the verbs of the body being designed. They are read from the same capability authorities the game checks when an action is attempted. Each verb is marked:
- **new** (+), for a verb the parent did not have;
- **kept**;
- **lost** (struck through), for a verb the parent had and this body does not.

Example: attaching a signal crest in the Lab showed "+ Threat display" and "+ Warn family". A signal crest gives the Alarm Pulse adaptation through the existing body-inheritance rules.

## Evidence

- **`tests/threat-display.mjs`** (added to the gate) checks that:
  - a body without display anatomy has no verb, and trying it changes nothing;
  - a frill grants the verb; it costs breath and energy; moving or time ends it; it then recovers;
  - with the same display, a fed needlejaw backs off (threat 1.59 against resolve 0.75) while a starving one keeps coming (1.07 against 1.46);
  - each hunter judges a display once, and the deterred hunter remembers it;
  - boldness, hunger and habituation raise resolve; a larger display and wounds raise the threat;
  - judging consumes no RNG;
  - a charging hunter does not judge;
  - the Lab's verb list marks gained and lost verbs.
- **Gate:** 95 of 95 checks pass on the final code. One run in between failed only by a timeout in `tests/aquatic.mjs` while a browser capture ran alongside it. Timed alone, `aquatic` takes 117–121 s with this change and 124 s on the previous commit, against the gate's 120 s per-test limit. So it is near the limit independent of this work. The limit was not raised.
- **Neighbouring tests pass:** action capabilities, encounter reactions, habits, combat pressure and footwork, the editor, funded display expression, live courtship and player copy style. `evolution-contract.mjs` fails on a missing fixture, as recorded in the ungated audit before this change.
- **Browser** (`tools/verify-threat-display-browser.mjs`): exported build, Spring jumper, PLANET-OBS-3 ([report](anatomy-verbs-2026-10-23/report.json)).
  - The Creature Lab opened after a natural mating on day 4 under AUTO. A signal crest was attached through the Lab's own attach path, and the list showed "+ Threat display" and "+ Warn family" ([screenshot](anatomy-verbs-2026-10-23/lab-verbs.png)).
  - **Test setup:** a display frill on the active body, and two needlejaws stalking it, one fed and one starving. Clicking the tray's Display button spread the frill ([before and during](anatomy-verbs-2026-10-23/player-compare.png)).
  - The fed hunter broke off ("sees a bigger creature than it hoped for, and backs off"). The starving one kept stalking ("too hungry to be bluffed") ([screenshot](anatomy-verbs-2026-10-23/display-verdicts.png)).
  - No page errors.

## Limits

- **The spread is modest at normal zoom.** The frill visibly opens, but the change is a few pixels.
- **Wild creatures don't display.** Wild prey and family members with flare anatomy do not use the display against hunters yet. That would extend the same rule to the background ecology and needs its own population check.
- **Habituation never fades.** It persists with the hunter, in saves too.
- **Not yet observed:** manual play by the creator, including whether `;` and the tray button are easy to find under pressure.
