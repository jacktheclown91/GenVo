# Gameplay visibility and interface rules

Authority: the creator's interface steering in the continuing full-game task. These requirements govern future HUD, notification, panel and context-menu changes. Existing UI remains subject to review; recording the rules does not establish layout compliance.

1. **Keep the player visible.** The controlled creature must remain clearly visible during normal gameplay. Keep its silhouette and immediate action area free of obstructing interface elements during movement, feeding, combat and other ordinary actions.
2. **Keep essentials compact.** Present essential condition and actions at a glance. Detailed creature, family, ecology, history and other information panels open only through an explicit player request and remain easy to dismiss.
3. **Keep notifications clear of action.** Temporary messages must avoid the character, important targets and ongoing action. Position and stack messages with the current gameplay view in mind; fitting inside the viewport alone is insufficient.
4. **Reposition context menus intelligently.** Choose a position that keeps the character, relevant action and menu controls visible. Reposition or constrain menus when their initial anchor would block play or put controls outside the window. Recheck placement after relevant viewport or camera changes.
5. **Check smaller windows.** Review layouts across desktop, laptop and smaller browser viewports, including window resizing. Use 1920x1080, 1366x768, 1024x768 and 800x600 as review cases; these are checks, not a newly imposed minimum supported resolution.
6. **Preserve approachable mouse-first play.** Keep common actions easy to discover and click. Detailed diagnostics and developer statistics stay behind explicit optional tools rather than occupying the normal gameplay screen. Retain the shared anatomy/availability authority for action visibility and disabled explanations.

## Acceptance checks for UI changes

Inspect real rendered gameplay at the review sizes with the default HUD, a notification burst, context menus near each screen edge and a requested detailed panel. Include ordinary action in progress and resizing an already-open menu or panel. Check that the character stays legible, important action stays unobstructed, essential controls remain usable, and details close back to the compact view.

Use inspected runtime screenshots or direct browser observation for placement and readability claims. DOM bounds and automated checks can support the review but do not establish visibility or visual acceptance on their own. Distinguish implementation, automated evidence, browser observation and creator acceptance. Record uncovered cases and failures in the completion matrix; do not mark the interface complete from one desktop frame.
