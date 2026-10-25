# Canvas readout placement coordination

Presentation-only frame-local reservations: weather, refuge and flight wind share already painted logical-canvas rectangles through the existing readout constraints. Reset each render before readouts, reserve only after a readout actually paints. Preserve canonical visibility, wording, state and placement priorities. No changes to biology, simulation scheduling or persistent state.

Baseline geometry: 390x844, actor at80,680 with 100x100 body, bottom110 HUD, top-right Menu; Thunderstorm/cold/mist weather and seeking refuge independently overlap 5320 square pixels. This is a layout fixture, not a naturally observed storm/refuge event. Native fixture review follows separately.
