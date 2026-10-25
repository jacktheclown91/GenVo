# Save error styling

Native computed style at 4b5e9ba3 showed the same rgb(216,223,191) text for successful and error statuses: the survival skin overrode the legacy error class. A scoped error rule now gives the existing error class a warm warning border, three-pixel left edge, background and text color. Messages, role=status, SaveManager, storage, timers and handlers remain unchanged.

Final authored fixture uses production Help/save markup extracted from index.html, production stylesheets and NotificationCenter in an isolated document with no simulation or SaveManager. Two viewport checks (1024x768 and 390x844) verify visible error text distinct from normal text, preserved status role, shared-stack ownership and phone panel clearance. Phone and desktop captures inspected. This is styling/layout evidence, not an actual storage failure or recovery, screen-reader session or creator acceptance.

The first live-page fixture failed the color distinction assertion; its receipt is preserved. After the CSS fix, that fixture passed DOM assertions but the phone screenshot no longer contained the injected error; that frame was rejected. An outstanding real save timer is a plausible cause, not proven. The final isolated fixture removes such competing producers without changing production timers or weakening assertions. No failure-path claim is made from that earlier page.

UI art-direction, notification-lane and exact public-export checks passed. Successful real manual saves and persistence were verified in the preceding save-placement pass. Broader failure/recovery scenarios and full v1 acceptance remain open.

Reproduce: node tools/review-save-error-layout.cjs reports/ui-save-error-new.
