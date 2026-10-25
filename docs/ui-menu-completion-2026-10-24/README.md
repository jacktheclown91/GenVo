# Preserve newer menus when world-entry work finishes

Public New World reveals gameplay before its initial save finishes. An immediate Pause could open successfully, then be hidden by the older create callback completion, leaving the simulation paused without its menu. Two initial harness attempts failed acquiring Return; the diagnostic run recorded hidden frontEnd, internally selected pause and paused HUD. No rendered failure was accepted as successful evidence.

Continue, Create and Load callbacks now close only their originating menu screen. They cannot dismiss a newer Pause screen. Save scheduling, simulation state, callbacks, failure handling and busy guard remain unchanged. Regression tests cover all three callbacks with original screen, newer pause and unsuccessful results.

Native guarded public New World, immediate P pause, Save & Return, populated Load World at1366x768,800x600,568x320,320x568 and native Play passed. Long unbroken world name wraps; all four saved-entry actions fit horizontally; phone frame inspected. Seed and player identity retained after Play. Only one saved world was reviewed; many-entry scrolling, rename/delete/export and migration are not established by this test.

Menu-action-completion, UI-art-direction and canonical-source-audit pass. Current shared-worktree export (854copy entries,429modules) passed native selection, New World, onboarding and held movement. It includes concurrent telemetry work and is not an immutable committed package. Concurrent telemetry/reachability edits excluded from this commit. Creator acceptance, full v1 and new canonical migration remain open.
