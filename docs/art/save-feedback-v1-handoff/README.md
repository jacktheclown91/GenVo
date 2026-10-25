# Save feedback placement

Presentation heads-up: reparent the existing #saveStatus into NotificationCenter and include its existing hidden flag in persistent feedback liveness. Preserve showSaveStatus, SaveManager, messages, error class, timers and status role. Use stack layout instead of independent top-right fixed placement. Avoid legacy panel/menu suppression within the stack while retaining front-end visibility inheritance. Verify actual public manual saves, phone/desktop bounds and no overlap with the task objective.
