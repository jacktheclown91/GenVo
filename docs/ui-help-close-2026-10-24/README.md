# Help exit clarity and UI input boundary

Against 5a4bfc8c, actual Help had only a ? · close hint and no pointer Close control. The header now includes a 56x44px minimum Close button using the existing data-knowledge-close delegation. Close flags and all panel controller semantics remain with the existing handler.

The same established selector is exempted from heldInput queuing and included in the native Tab/Enter/Space UI keyboard guard. This applies to information-window Close controls only; movement buffering, biological tick slicing, world actions and costs remain unchanged. The pre-integration checked-in ownership note is docs/art/help-close-v1-handoff/README.md.

Public native Chromium observations at 1024x768 and 390x844: Help closed with mouse, Enter and Space. Recorded native keydown events are trusted and not default-prevented by world action handlers. All four observed keyboard events occurred between ticks; genuine pending-tick activation is NOT YET PROVEN. The source selector establishes the intended capture exemption, not that stronger browser claim. Desktop and phone captures inspected. The broader capture includes Population, Home range, Tasks, Journal and Map, but those are observation evidence rather than full usability acceptance.

Input-responsiveness integration passed its 100ms, 350ms, sliced-tick, reversal, pause/modal and save/continue cases; movement-input-buffer and frame-stepper parity passed. UI art direction, UI presentation, canonical audit and exact public export passed. These checks do not reproduce every reported intermittent startup miss or establish creator acceptance. No test thresholds, budgets, known-failure ledgers or biology were edited.

OPEN: a transient world notice overlaps Help content on the phone capture. It remains explicitly visible in the retained evidence. Fixing the requested-panel/notification priority and placement needs further work; this change does not claim whole-interface acceptance.

Reproduce: node tools/review-ui-panels-current.cjs reports/ui-panels-new. This opens actual public panels and uses trusted native controls without authoring simulation state.
