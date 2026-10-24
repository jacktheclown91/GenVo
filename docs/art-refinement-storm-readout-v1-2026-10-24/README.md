# Storm readout candidate

The existing thunderstorm warning was fixed below the player, separate from the protected weather plaque. Candidate moves only its readout into weather-readout.js using unchanged THUNDERSTORMS.policy, thunderstormAt(actual player cell).intensity > .4 and underground/deep-water guards. Original lightning effects remain in thunderstorms.js. The warning text remains Avoid exposed high ground. Thermal/atmospheric conditions remain in the combined detail; existing warm/cold-only readouts are unchanged. No storm, visibility, exposure, timing, RNG or save rules changed.

Focused storm-readout, thermal-label-placement and public-export checks pass. Authored climate fixtures verify exact canonical warning eligibility and full saved-state parity; they do not establish natural storms. Browser storm observation, viewport/UI clearances, standalone and integration gate remain pending. Candidate remains isolated from main and all concurrent gameplay edits.
