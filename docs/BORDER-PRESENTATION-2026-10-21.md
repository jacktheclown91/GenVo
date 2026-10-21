# Centred camera and neighbouring terrain at region borders — October 21, 2026

Presentation only. In planetary worlds the camera now follows the controlled creature without clamping to the 128-cell region, so it stays centred at borders and after crossing. The ground beyond the border is the neighbouring region's real terrain instead of a dark void. Finite (freshwater) worlds keep their clamped camera.

## How it works

- **Camera:** `clampCameraToWorld(…,{open:true})` returns the followed position unchanged for planetary worlds.
- **Neighbour Worlds:** `src/render/border-terrain.js` keeps presentation Worlds for the neighbouring regions the creature is within 48 cells of, nearest first. The idle driver in `main.js` builds at most one per idle callback. Each comes from:
  - a resident archived region: an independent copy of its saved World (`restorePresentationWorld`), refreshed every 4 game days;
  - a region nobody has entered: its deterministic generated World, the genuine initial state of that region;
  - an unloaded region: none. Regions beyond two steps are never adjacent to the player.
  - Nothing is created beyond the finite projection edge.
- **Drawing:** each neighbour is drawn by a terrain-only `Renderer` bound to a facade of that World, so ground, water banks and plants use the same native chunk art as the active region. Chunks are built within a 3 ms per-frame budget with the existing land/water placeholder meanwhile. Ground draws with the main ground pass and vegetation with the main vegetation pass.
- **Fog:** sensory fog reveals a border cell only where neighbour terrain is drawn and `viewReachesBeyond` holds: a surface observer, within its anatomical range and facing limits. Underground and eyeless creatures see nothing across a border.

## What is not shown

- **Creatures:** neighbouring wildlife is not drawn. Its archived organisms are not live in the active scene, and showing them would reveal or invent information.
- **Flora detail:** a neighbour has no live flora controller in memory, so its plants draw with default trait appearance (seed/coat allocation, botanical flowering) and no leaf-litter fungus cue; stocks, species and water are the real saved or generated values.
- **Live-plant window:** the active region's per-frame live-plant window does not extend across the border.
- **Untouched simulation:** the presentation copies never write back, and building them changes no simulation state (tested).

## Verification

- **Node tests:**
  - `tests/camera-bounds.mjs`: open centring.
  - `tests/border-terrain.mjs`: proximity-limited neighbours, the projection edge, generated versus resident sources, independent copies with exactly the saved water and plant stocks, no write-back, border visibility rules, and an unchanged simulation snapshot.
- **`tools/verify-border-presentation-browser.mjs`** (exported build, native New World):
  - placement 3.5 cells from the east border facing it;
  - canvas pixels across the border show terrain, not fog, and the camera equals the creature's position;
  - a real held-key crossing, after which the creature is centred and the region just left draws from its saved World;
  - the same checks at 800×600, 1024×768 and 1920×1080;
  - no page errors;
  - frame gaps per phase.
- **Measured frame gaps** (headless Chromium):
  - 83 ms while building neighbour views;
  - 167 ms during the crossing;
  - about 300–317 ms just after crossing, when the region left behind is restored and its renderer prepared in one idle callback;
  - viewport resizes about 1.8 s, the same with border drawing disabled, so resizing was already that slow.
- **Other checks:** overlay visibility and planetary preparation Chromium checks pass.

## Limits

- The crossing still replaces the active simulation and prepares the new scene. Cells of the new region show placeholders for a few seconds while native chunks build.
- The about 300 ms post-crossing restore could be split further.
- Creator visual acceptance is open.
