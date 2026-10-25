# Compact utilities and visible toggle state

The expanded utility palette at 9b080264 overlapped the short-landscape vital row. Its compact variant uses the same nine controls in three 64px columns, with 44px targets and smaller icon/spacing treatment, for height<=420 with width>=480 or widths<=360. The task banner that would sit under this requested palette is temporarily hidden; Tasks remains available and closure restores the banner. Ordinary desktop/phone sizing remains unchanged outside those cases.

Baseline native styles also proved Auto's aria-pressed changed from false to true while background, border and text colors stayed identical: the survival skin overrode its active state. A scoped pressed/active treatment now restores warm gold feedback for the real existing state. No automation, speed, guidance or panel-controller semantics changed.

Actual public menu opening and resize through 1024x768, 568x320, 800x360 and 320x568 passed zero menu/body-envelope and menu/dock overlap, nine in-bounds controls and >=44px target height. Native Auto off/on/off changes the real controller flag and restores its prior background; Escape closes the palette, updates aria-expanded and restores the task banner. Compact and active-state screenshots inspected. This is bounded default-zoom evidence, not every body/zoom, full button-function walkthrough, GPU or creator acceptance.

The requested compact palette is opaque and above ordinary informational notices so those notices cannot paint over its controls. Existing critical-channel/save-error feedback retains higher visual priority; message nodes, queues and timers are unchanged. A separately labelled authored critical UI fixture verifies stacking above the menu both open and closed; this is not a real danger or save-failure event. Ordinary notices can be temporarily occluded by the requested palette.

Canonical gameplay-action contracts, UI art direction and exact public export passed. Concurrent untracked anatomy-diagnostic work was preserved and excluded from this commit; no broader working-tree audit or release certification is claimed. Ownership note: docs/art/compact-utilities-v1-handoff/README.md.

Reproduce: node tools/review-short-utilities.cjs reports/ui-compact-utilities-new.
