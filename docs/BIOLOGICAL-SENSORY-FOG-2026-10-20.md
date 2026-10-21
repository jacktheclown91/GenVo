# Biological sensory awareness: first integrated pass (2026-10-20)

## Authority and boundaries

GenVo remains a single controllable organism in an autonomous Living Planet. Sight uses the existing atmospheric visibility authority plus `bodyPlan`, inherited `genes.senses` and canonical `partEffectFactors`. Scent and hearing cues derive from real creature states and edible plant stocks. The world and offscreen ecology continue to simulate normally when they are not perceived.

This feature branch builds on the isolated performance/audio candidate `fix/itch-preview-frame-audio-2026-10-20`. It does not include or overwrite Codex's paused local cave/underwater perception work; PR #33 is draft and intentionally targets the performance candidate branch rather than `main`.

## Connected behavior

- `creatureView` and `viewCanSee` describe sight range, facing, eye count, inherited sensitivity and local fog. This is shared by the native fog renderer and visually observable actor/interaction targeting.
- `src/render/sensory-fog.js` draws obscured ground, coarse physically observed remembered terrain, and uncertain bearing-only sensing clues. The veil is cached and shifted between recomputations, rather than recalculating per pixel per animation frame.
- `src/ecology/sensory-world.js` records a living creature's exploration on canonical simulation ticks. Each selected body owns its own remembered locations. Water/land and underground passage classifications are snapshots taken at observation time, **not remote live lookups**. Region and underground/surface history remain separate; memory is bounded. These records are part of the normal animal save snapshot.
- Hearing can report nearby actual active organisms, with strength modified by `echo-crest` and `sensory-bristle`. Scent can report actual organisms and currently edible nearby flora, with sensitivity modified by genes and existing relevant sensory structures, plus wind and rain. Only uncertain bearings are shown, not identities or coordinates.
- Mouse hit testing no longer provides precise unseen plant/egg/resource identity. Clicking unknown ground can still lead to exploration.
- Existing creature selection, prey visibility and resource readability use the same shared ocular rule; unrestricted/non-creature views are not shaded.

## Performance and biological safety

- The observation log is bounded to 800 coarse cells per region, four active regions per creature, and updates at most once every two in-game seconds for the currently selected creature.
- Fog masks are re-rendered only when the actor/camera/conditions meaningfully change or after ~240 ms, then composited from a single cached canvas.
- No world stocks, reproduction, ecology, RNG, atmospheric fluid quantities, aging rates, time compression or geographic persistence rules were changed.
- Neither a fog mask nor hiding a sprite pauses or deletes an organism.

## Known limits and next integration

This pass does **not** claim complete biological sensory realism. Audit these together with Codex's existing cave/underwater sensing work **before merging**:
1. Real occlusion by trees, rock, closed cave walls and aquatic turbidity beyond current near-body medium restrictions.
2. More detailed auditory activity propagation, sound occlusion and anatomy-specific sensing with native spatial audio.
3. Scent propagation and persistence through actual rain, water and regional wind rather than simple current-radius/bearing hints.
4. Learning and socially transmitted knowledge distinct from automatic offspring inheritance.
5. Sight/hearing/scent confidence and current-vs-remembered distinctions throughout all UI notifications, map inspectors and AI pursuit decisions.
6. Creator-approved readability and behavior under performance mode, at 1920×1080, Day 30/100 loads, successor switching, Save/Continue and long-game frame pacing. Issue #31 remains open for late-session simulation spikes.

## Creator acceptance checks

1. Confirm a basic-eyed founder sees ahead but not omnisciently behind; turn and observe the newly revealed habitat.
2. Evolve/inherit different eye and auditory anatomy; confirm view and evidence change **without changing camera zoom**.
3. Walk into unknown areas, leave and return; the faint memory should show last observed terrain classification, not current undiscovered creatures or resources.
4. Enter/exit caves and water. Surface exploration cannot automatically reveal underground cells.
5. Change controlled body; remembered terrain belongs to that individual. Save/Continue preserves that record.
6. Verify a hidden source can produce a vague sound/scent indication without becoming an exact clickable target.
7. Compare performance with the previously approved preview. Record the FPS overlay and source of any frame stalls.

Do not call the design fully implemented or ready for public itch until creator gameplay and browser-based validation accept it.
