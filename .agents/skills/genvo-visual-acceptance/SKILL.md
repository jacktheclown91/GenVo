---
name: genvo-visual-acceptance
description: Launch the game in Chromium, capture screenshots and frame recordings, compare before/after, and verify UI readability across target resolutions.
---

# GenVo Visual Acceptance Skill

Use this skill to visually verify UI readability, camera smoothness, animation, visual contrast, and creature visibility in actual browser gameplay.

## Activation Criteria
- Evaluating camera, motion, rendering, or shader changes.
- Reviewing UI layouts, context menus, HUD elements, or tutorial cards.
- Ensuring compliance with `design/UI-READABILITY.md`.

## Visual Acceptance Workflow

1. **Host Local Server**:
   ```powershell
   # Start local dev server (default port 8000)
   python -m http.server 8000
   ```

2. **Automated Browser Capture**:
   - Utilize existing acceptance capture harnesses:
     ```powershell
     node tools/capture-first-player-acceptance.cjs
     node tools/capture-integrated-acceptance.cjs
     node tools/capture-itch-screenshots.mjs
     ```

3. **Multi-Resolution Inspection**:
   - Evaluate real rendered gameplay at:
     - 1920×1080 (Desktop standard)
     - 1366×768 (Laptop typical)
     - 1280×720 (720p stream/video baseline)
     - 1024×768 / 800×600 (Compact desktop)
     - 390×844 (Mobile portrait)
     - 844×390 (Mobile landscape)

4. **Visual Checklist**:
   - [ ] Player creature is visible and unobstructed during movement, eating, and interacting.
   - [ ] Context menus position cleanly away from player and important targets.
   - [ ] Camera motion is smooth with no discrete coordinate jitter or stutter.
   - [ ] Contrast is clear between ground, water, vegetation, and creatures.
   - [ ] No generic AI glows, synthetic visual noise, or out-of-place dashboard elements.
