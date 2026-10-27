# Initial delivery measurement

Three fresh headless Chromium contexts loaded the actual front end and created a normal new world through the real menu controls. Native artwork reached its existing ready state. The server used uncompressed loopback HTTP; these are local cold-context observations, not itch.io, internet bandwidth or representative device benchmarks. The source was the uncommitted regional-history candidate based on `aea8ba3d`.

| Sample | Menu observed | Gameplay/art ready | Resource requests at readiness | Resource transfer |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1.90 s | 3.74 s | 582 | 11,129,633 bytes |
| 2 | 1.91 s | 3.85 s | 583 | 11,196,640 bytes |
| 3 | 1.73 s | 3.56 s | 582 | 11,129,633 bytes |

Resource transfer sums exclude the main HTML navigation. Each new-world run fetched the 1,295-byte scenario catalog body; none fetched an advanced `.json.gz` checkpoint. No page errors were observed. The resource-timing buffer was expanded to 10,000 before navigation. An initial 250-entry run hit the browser default limit and is retained only as an incomplete tooling diagnostic, not evidence for these totals.

The Git-backed asset inventory includes two advanced compressed checkpoints totaling 57,523,479 bytes. Their contribution to an offline ZIP does not imply that ordinary initial play downloads them. `loadBundledScenario` already fetches the selected catalog entry on demand. Separating those files from the ZIP alone would not improve the observed ordinary initial network path and would need an explicit availability/offline design. They remain available and unchanged.

The repository's largest original art intermediates reside under `assets/art/production-review`; `tools/export-public.mjs` already excludes that directory. It also omits `assets/audio-source` and derived reference sheets, while retaining native runtime art, browser audio formats and the optional Creature Lab with its actual dependencies. Source size is not playable-package size. This bounded audit does not prove every exported art file is used; deeper reachability work must include dynamic catalog/frame references before omitting anything. No original artwork, sound, compatibility format or scenario was deleted.

[Summarized evidence and Git-backed asset sizes](ecological-motivation-2026-10-27/initial-delivery-audit.json) and [complete raw resource timings](ecological-motivation-2026-10-27/initial-network-raw.json) retain the observations. Actual hosted loading, mature-world stalls, an evidence-supported performance correction and final independently extracted release verification remain open. No published itch ZIP was replaced.
