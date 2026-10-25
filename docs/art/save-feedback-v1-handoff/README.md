# Save feedback placement

Presentation heads-up: reparent the existing #saveStatus into NotificationCenter and include its existing hidden flag in persistent feedback liveness. Preserve showSaveStatus, SaveManager, messages, error class, timers and status role. Use stack layout instead of independent top-right fixed placement. Avoid legacy panel/menu suppression within the stack while retaining front-end visibility inheritance. Verify actual public manual saves, phone/desktop bounds and no overlap with the task objective.

Error-style follow-up: native computed style confirms the survival skin overrides legacy .save-status.error color/border. Add a scoped #notificationStack #saveStatus.error warning treatment, retaining the original error class, message and status role. Authored UI error fixtures must be labelled and must not claim storage failure or recovery.
