# Save feedback placement

Follow-up to the Saved/task overlap seen during the group-travel review at 88a9fea3. The existing #saveStatus node now lives in NotificationCenter. Its existing hidden flag participates in feedback-stack liveness, alongside the persistent processing notice. Scoped CSS removes independent fixed positioning and legacy panel/menu suppression inside this stack, while visibility inherits from the stack so the front-end menu still hides gameplay feedback. No new notice timer or message copy was created. SaveManager, showSaveStatus, storage and all save text/error classes remain unchanged. Ownership note: docs/art/save-feedback-v1-handoff/README.md.

Actual public New World: Help > Save now completed successfully at 1024x768 and 390x844. After closing Help, the Saved node retained role=status and its original identity/ID under the stack. Browser assertions verify visible bounds and zero overlap with the task objective and utility-menu toggle, then wait for its existing expiry. Desktop and phone screenshots inspected; utilities happen to remain expanded, and feedback remains clear of that menu in both captures. No save result or simulation state was authored.

Save-persistence round trip, notification-lane, overlay-placement, canonical source audit, UI art direction and exact public-export checks passed. This is placement and ordinary save feedback evidence, not every save failure/migration/restore path, GPU or creator acceptance. The earlier group-travel screenshot remains preserved as before evidence; the broader full-v1 goal remains incomplete.

Reproduce: node tools/review-save-feedback.cjs reports/ui-save-feedback-new.
