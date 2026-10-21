# Gameplay overlay visibility — October 21, 2026

Notifications and target context menus now share `src/ui/overlay-placement.js`. Placement prioritizes avoiding the controlled creature and selected target, then other HUD obstacles, while keeping the measured overlay inside the available viewport above the action dock. Context menus reconsider placement after movement or resizing; explanations participate in the measured footprint. Existing mouse actions, availability explanations, focus restoration and held Brace input remain in place.

The renderer supplies actual transformed sprite-surface bounds for the player and selected creature. This follows render transforms rather than duplicating biological movement rules in the UI. Resource selection uses the existing selection ring as a fallback. The shared placement helper chooses minimum overlap if a viewport has no feasible clear position; arbitrarily small windows are not guaranteed.

## Verification

- `tests/overlay-placement.mjs`: protected player/target rectangles, HUD obstacles and viewport bounds at 1920×1080, 1366×768, 1024×768 and 800×600.
- `tests/notification-lane.mjs`, syntax checks and canonical source audit passed.
- `tools/check-playable.mjs`: all 60 focused checks passed.
- `tests/public-export.mjs`: exact reachable modules and runtime assets passed.
- `tools/verify-overlay-visibility-browser.mjs`: exported game in native Chromium, real guided starter and nearby creature selection, representative three-message burst and action explanation at all four sizes, resizing an open menu, and held keyboard movement. No page errors or measured player/target obstruction, offscreen overlays, notification/menu overlap or unsolicited detail panels.

Receipt and screenshots: `C:\Users\jackt\.codex\visualizations\2026\10\20\01a1583e-f787-7bb3-a369-b0b62a443366\overlay-visibility-browser\`. The four viewport frames and movement frame were directly inspected: the controlled creature and selected creature remain clear, the dock stays compact, and the menu relocates after movement. Notification text and prolonged durations in this harness are explicit review fixtures, not natural event-frequency evidence.

## Remaining acceptance

This proves the notification/context-menu subset of `design/UI-READABILITY.md`, not complete HUD or full-game acceptance. Full information views, editor/family/history usability and creator review remain open. Flight/climb render bounds use the same actual transform, but their moving layouts were not separately observed in this pass. No simulation, biology, costs, ecology or save policy changed.

Pointer-away follow-up: the radial closes when a mouse/pen leaves its padded visible footprint. Empty space between choices stays usable; an initial narrow corridor from the clicked target to the displaced wheel allows reaching it. Touch input is unaffected. Closing uses the existing cleanup, including releasing held Brace. Native Chromium checks now assert both travel between choices and pointer-away dismissal at all four sizes; receipt: `radial-dismiss-browser/receipt.json` under the same external evidence root.
