# First-time player experience (October 23, 2026)

**Creator direction:** simplify the starting menus, introduce abilities through understandable actions, and reduce technical notifications during early gameplay. Keep the advanced information in optional panels.

## New World screen

[Before](first-session-2026-10-23/new-world-before.png) · [after](first-session-2026-10-23/new-world-after.png).

- **Your first creature**, as five cards:
  - **Walker:** a plain founder, learn the land and evolve it your way;
  - **Spring jumper**, **Shore swimmer**, **Ground burrower** and **Winged flier:** each with one plain line saying what its body can do.
- **Where to begin**, as cards built from the real starting points:
  - **A new world · Day 1**;
  - for creatures that can join them, the evolved **Established Valley · Day 30** and **Mature Valley · Day 100**.
- **Seed** stays visible as a compact optional field.
- **Advanced options** (collapsed) hold everything else, unchanged in function: world name, geography, starting point (including forks and file import), rules for continued worlds, and the full starting-creature list (recorded lineage, living resident, guided and sandbox design). The engine-language notes were rewritten in plain words. For example, "finite archive/projection limits… not yet infinite or seamless" is now "Planet: walk past the edge of a region into new neighbouring land."

The cards set the same selects as before, so world creation, saves and every start type are unchanged. The default stays Walker on a new Day 1 world.

Advanced options start expanded only under browser automation (`navigator.webdriver`). About 40 existing browser tools set those fields directly.

## Abilities introduced by action

- **Quick-start opening hints** now name the key, when it helps and what it costs. For example: "Spring legs: press Enter (or Jump) on firm ground to leap. Leap clear when a hunter charges. Each jump costs breath."
- **Danger prompts** (a hunter close, winding up or charging) add the body's own escape verbs when they can be used right then: ENTER JUMP CLEAR, 6 FLY, PGDN DIVE, BURROW or ; DISPLAY. They use the same capability and status checks as the action buttons.

## Fewer technical notices early

- **Field-guide sightings** used to post a notice every few seconds, for example "spotted a stout torso, eyespot, digging forelimb… each now costs 1 point less to evolve". Now:
  - the first sighting shows one plain explanation ("Field guide (Y): your creature notes the bodies of wild creatures. Parts it has seen are cheaper when your line evolves.");
  - later sightings are summarised at most once a minute.
- **"Trial complete" notices** wait until the line has evolved once.
- **Nothing is lost:** sightings, discounts and trials are recorded exactly as before and shown in the field guide (Y).

## Evidence

- **Browser** (`tools/capture-first-minutes.mjs`, exported build, Spring jumper card chosen, two minutes): [log](first-session-2026-10-23/first-minutes-log.txt), [first frame](first-session-2026-10-23/jumper-first-frame.png).
  - The first frame shows the movement hint and the new jumper hint.
  - The field-guide explanation appeared once at about 5 seconds; no per-sighting notices followed.
- **Gate:** 98 of 98 checks pass.
- **Tests:** the menu, tutorial and inspector tests pass. `ai-disclosure.mjs` fails on a missing submission file, as already recorded in the ungated audit.

## Not done

- **Other early notices** keep their wording: "Family control unlocked", "Marks nearby… Tracking organs can follow a trail", and the energy-balance notice.
- **The HUD** still shows planet and region coordinates; they help with exploration, so they were kept.
- **Observation:** these changes still need testing with real first-time players (creator plan, Oct 31–Nov 1).
