# Information-panel keyboard boundary

Presentation integration heads-up: native Page/arrow/Home/End/Tab/Enter/Space navigation inside requested information panels must not execute world commands. Use one read-only event classifier in heldInput and the main keyboard handler. Keep pointer/click world-action queuing unchanged; Escape and existing letter shortcuts retain their handlers. Form fields within those panels retain native typing. Verify native scrolling, closure and normal world movement; do not alter tick/input buffer or simulation policies.
