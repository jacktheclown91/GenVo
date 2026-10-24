# Survival HUD presentation coordination

Codex presentation pass based on 52e5645. The creator-selected coordination channel is this checked-in handoff. Planned shared integration: one scoped stylesheet link in index.html and presentation-only DOM layout in interaction-dock.js. No simulation, controller action, physiology, notification queue/channel or save policy changes.

Actual baseline exported gameplay confirms native season/day markup is hidden, ordinary HUD shows raw planet/region coordinates, and condition labels are visually clipped to icon-only pips. Restore the existing clock, show the existing labels, and move the existing coordinate element into a native Location disclosure. Retain the same DOM IDs and original update authorities. Preserve actual statuses, failure explanations, urgency channels and action availability. Reuse the numeric native-art revision getter instead of allocating status snapshots in the display loop.

Use the established natural-history palette, restrained borders and typography for HUD, task cue, utilities, feedback and contextual controls. Preserve current protected-action overlay placement. The baseline's ten default/burst/actual-target cases at five sizes have no protected-action overlap. UI-only burst fixtures are labeled explicitly and are never represented as ecological events. The original failed pause-menu capture remains diagnostic evidence, not gameplay approval.

Verification must include actual public gameplay, movement, five sizes, native contextual targets, a requested/dismissed detail panel, resize, state parity for styling and original placement/notification regression checks. Broad HUD, mature-world performance, all-body portraits and creator acceptance remain separate requirements.
