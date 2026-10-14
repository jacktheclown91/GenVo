# GenVo mouse-first creature context tray — development slice

Implemented left-click selection of actual rendered creatures and a nearby labeled tray with Observe, Court, Attack, Pounce and Back. The dashed mint target ring is distinct from the active player's gold ring. Selection reads rendered screen positions, follows its target, clamps to the viewport and closes on outside clicks, Escape, right-click, world replacement, modal entry, death or disappearance from view.

Observe records the real body and opens the Field Guide. Court uses the existing eligible-mate selection and opens the current mate panel; it does not guarantee acceptance, perform a ritual or reproduce automatically. Disabled actions show plain reasons. This is still a partial courtship flow, not the planned focused editable encounter tray.

Combat descriptors read PlayerCombat.attackAvailability and recheck at invocation. The canonical controller now accepts an explicit target ID. Mouse attacks retain it through windup and revalidate at impact. A dead/escaped/ineligible selected target cannot be replaced by a closer creature. Pounce selection passes the same range, orientation and physiological controller checks; a rejected explicit pounce does not silently become an ordinary attack. The established untargeted attack hotkey path and its pounce fallback remain. Pounce resolution now retains its already committed target rather than choosing another animal on landing.

No second damage, predation, mate-compatibility or resource simulation was introduced. WASD, Space/Shift+Space, J, expert panels and the existing right-click Family Guidance handler remain. The tray does not claim mouse-held Brace, click-to-move/Approach, targeted foraging, nests/eggs, editable courtship cards, rich encounter feedback or authored action icons are finished.

Passed tests: gameplay-actions, selected-combat-actions, combat-footwork, combat-pressure, species-leadership and canonical-source-audit. Source encoding was repaired after the audit found an invalid byte in the new selection label; the final audit passes.

Actual Chromium evidence: runtime-mouse-context-desktop.png, runtime-mouse-context-windup.png, runtime-mouse-context-embedded.png, runtime-mouse-context.webm and runtime-mouse-context-proof.json. Desktop (1440x900) and embedded (800x600) captures were inspected. The recorded mouse attack binds the selected animal ID during windup. The harness stages a real anatomical hunter within attack range as a controlled interaction fixture; it does not certify unconstrained play balance.

Right-click dispatches once to the original Family Guidance controller and closes the creature tray. This starter world has no grown relative, so the original availability gate keeps the wheel closed. The test proves preserved dispatch and gating, not a visually opened eligible-family wheel. The existing species-leadership suite also passed. The final browser page-error list is empty.

Visual status: functional development foundation. The compact frame and labels work at the two inspected sizes, but anatomy icons, actor/target portraits, held Brace, explicit cooldown animation, fully mouse-operated courtship and resource context still need implementation and runtime review. The broader goal remains active.
