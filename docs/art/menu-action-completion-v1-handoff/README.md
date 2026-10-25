# Async menu completion ownership handoff

Native public New World startup exposes gameplay before its initial save returns. Opening pause during that interval changes FrontEnd.screen to pause; the old create click then unconditionally calls close(), hiding the new pause screen while simulation remains paused. Diagnostic screenshot/receipt in reports/saved-worlds-ui-diagnostic-20261024.

Bounded UI fix: capture originating screen before an asynchronous continue/create/load action, and allow its completion to close only that same screen. Preserve save scheduling, state, callbacks, errors and busy guard. Claude owns shared controllers; this checked-in heads-up and patch document the presentation/navigation change. No main/simulation edits.
