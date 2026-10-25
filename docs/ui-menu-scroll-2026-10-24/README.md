# Reachable short-window main menu

At568x320, centered flex overflow put the brand top at-50.86px while the scroll frame began at25.61px and scrollTop0. The logo could not be reached by scrolling upward. CSS safe-center now retains centering where content fits and starts oversized content at the scrollable top. Menu content, options, handlers and original artwork remain unchanged.

Native Chromium four viewport checks (1366x768,800x600,568x320,320x568) confirm brand top within its frame at scroll start. Baseline and corrected short frames inspected. Native scroll to Credits, click, Back, New World, Space card selection, scroll to Begin World and public creation pass at568x320. Lower menu entries require scrolling in short windows; this is not a claim that every entry is simultaneously visible.

UI-art-direction and canonical-source-audit pass on the current shared tree (423 source modules,415runtime reachable,428dependency files,97parts). Export succeeds (854copy entries,429modules), and the exported public menu test passes keyboard selection, actual New World, normal onboarding and held native movement. Export includes the current shared worktree, including concurrent telemetry edits; it is not claimed as an immutable clean-commit package. Concurrent telemetry/reachability work is excluded from this commit.

Creator acceptance, all browser engines, every menu/viewport and full v1 remain open. Existing review ZIP predates this CSS fix.
