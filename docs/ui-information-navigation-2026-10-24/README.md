# Native information-window keyboard navigation

A public fresh-world check against 021bea77 reproduced PageDown failing to scroll focused Help: the trusted PageDown was default-prevented by the world handler. A later Home key was replayed untrusted by heldInput and left the panel at scrollTop 711. The original failing receipt is retained.

One read-only informationNavigationEvent classifier now separates native navigation within .detail-panel, .journal-page and #fieldGuide from world input. Arrow/Page/Home/End/Tab/Enter/Space keys and typing in panel form fields bypass held keyboard replay and the main world keyboard handler. Escape and existing letter shortcuts retain their existing handlers; pointer/click events retain the biological tick barrier. No movement buffer, time policy, world action, resource or persistence semantics changed. Ownership heads-up: docs/art/information-navigation-v1-handoff/README.md.

Native public Help at phone width now scrolls on PageDown and End and returns to zero on Home. Events remain trusted and are not default-prevented by world hotkeys. Space/Enter toggle the actual native disclosure and restore its original state. Escape closes Help; a subsequent held D moves the real player. Screenshot inspected. This demonstrates Help navigation, not every information window or all pending-tick timing combinations, and does not establish creator acceptance.

Boundary checks additionally preserve non-information world keys, existing letter shortcuts/Escape and pointer barriers while accepting panel navigation and native field typing. Input-responsiveness integration, frame-stepper parity, canonical source audit and exact public export passed. No test/budget/known-failure ledger was weakened.

Reproduce: node tools/review-information-navigation.cjs reports/ui-information-navigation-new; node tests/information-input.mjs.
