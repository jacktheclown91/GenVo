# GenVo mouse-held Brace — development increment

The creature context tray now offers Hold Brace. Pointer-down records input owned by the current actor and world; it does not enter a defensive stance directly. The existing PlayerCombat control step activates bracing, slows movement, spends breath, applies protection and breaks exhausted guards. Mouse and J input are combined while preserving keyboard controls.

Canonical braceAvailability provides paused/dead, attack-windup, recovery-lock and breath reasons. An already active guard can continue below its starting breath threshold until the established controller breaks it. The UI does not invent a one-click shield or a separate exertion rule.

HeldBraceInput tracks one primary pointer. Release clears input, canonical brace stance, aria-pressed state and pointer capture. Lifecycle cleanup covers pointer-up (including outside the button), pointer-cancel, capture loss, window blur, document hiding, tray closure, modal blocking, pause/input reset, actor replacement and world replacement. A different pointer cannot release the owner's hold. DOM action rebuilding is deferred while held so it cannot accidentally remove the captured button. Fatigue/lock changes invalidate the hold and update disabled reasons afterward.

The active button has visible pressed feedback. The existing world brace hint now says to release the hold to move freely, covering mouse and keyboard truthfully. Input reset also clears canonical bracing, including a previously held keyboard stance when control is paused or reset.

Passed: held-brace-input, gameplay-actions, selected-combat-actions, combat-footwork, combat-pressure and canonical-source-audit. The head/art and broader goal work remains intact.

Real Chromium evidence: runtime-mouse-held-brace.png, runtime-mouse-held-brace.webm, runtime-mouse-held-brace-proof.json. The fixture pauses only while locating a real anatomical hunter, then resumes before interactions. This prevents moving-target hit-test timing from making the harness flaky; the actual brace and attack checks run in the live world. The recorded hold has input=true, bracing=true and expenditure of breath. Pointer-up outside the button records input=false and bracing=false. The same run verifies subsequent selected-target attack, right-click dispatch to the genuine unavailable-family gate, and an 800x600 layout capture. The final page-error array is empty.

Scope limits: browser evidence directly proves primary-pointer hold and outside release; unit checks establish lifecycle/ownership cases. It is not a full touchscreen/multi-device acceptance study. Authored icons/portraits, the focused mouse courtship queue, foraging/resource selection, exploration and implemented shelter/egg affordances remain open. No full mouse-UI or roadmap completion is claimed.

Reproduce: node tests/held-brace-input.mjs; node tools/capture-mouse-brace.cjs.
