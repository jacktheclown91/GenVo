# Group-travel control clarity

The ordinary HUD previously said Family: solo or Family: together. This is the planetary group-passage preference, not family AI direction. It now says Group travel with explicit Off/On text, a distinct active border/background and aria-pressed reflecting the same sim.travelFamilyGroup value. The existing handler, possession/availability, exact tooltip/description, movement and family crossing rules remain unchanged. No new button, cohort eligibility rule or duplicate travel state was added. Ownership note: docs/art/group-travel-ui-v1-handoff/README.md.

Actual public New World native-browser input toggled Off to On to Off at 1024x768 and 390x844. Six observations compare rendered text and pressed state with the canonical preference. Button bounds fit each viewport. Desktop off and phone on captures inspected. This proves the preference control, not physical family passage, gathered relatives, safe dependent travel or creator acceptance. Gameplay-action contracts, UI art direction, canonical audit and public export passed.

The preceding combined Help/Population/Home range/Tasks/Journal/Map browser review on committed 1bf2f306 also passed after processing-notice integration; its separate receipt is retained. It does not prove every notification/processing state. An early syntax error in the new capture script was corrected before browser execution; no runtime failure or test assertion was hidden.

OPEN: the phone on-state capture shows a Saved indicator near the task objective. Broader top-of-screen feedback spacing still merits review. Full UI/v1 acceptance remains open.

Reproduce: node tools/review-group-travel-ui.cjs reports/group-travel-ui-new.
