# GenVo Permanent Governance & Developer Directives

## 1. Authority and Project Identity
- **Project**: GenVo (Living Planet evolutionary survival game)
- **Primary Agent**: Antigravity is now the primary development agent and environment. Do not initiate competing AI agents without explicit human authorization.
- **Human Authority**: The human creator (SevenFoldStories) has final authority over creative direction, gameplay, aesthetics, scope, and release acceptance.
- **Canonical Repository**: The existing local repository (`main` branch) is the sole development authority. Remote: `https://github.com/jacktheclown91/GenVo`.
- **Public Reference**: https://sevenfoldstories.itch.io/genvo | Game Gauntlet SIM Jam deadline: Nov 4, 2026.

## 2. Authoritative Architecture & Documents
Always consult these canonical references before modifying mechanisms:
- `README.md` — Project entry, setup, controls, and commands.
- `design/CURRENT-DESIGN.md` — Governing design intent, biological rules, and milestones.
- `design/UI-READABILITY.md` — Player visibility, compact essentials, contextual menus, responsive layouts.
- `design/governance/implementation-authorities.json` — Owning module contracts for every subsystem.
- `docs/ARCHITECTURE.md` — Module map, simulation phases, dependency graph.
- `docs/CURRENT-IMPLEMENTATION.md` — Verified runtime systems, evidence, and active policies.
- `docs/FULL-GAME-COMPLETION-MATRIX.md` — Capability-level completion tracking.
- `docs/GIT-CONTINUATION-HANDOFF.md` — Verified checkpoints, CI, and architecture handoff history.
- `docs/REPOSITORY-CLEANUP.md` — Archive boundaries and retained evidence.
- `submission/AI_DISCLOSURE.txt` & `submission/ITCH_PAGE_NOTES.md` — Jam disclosures and release notes.

## 3. Non-Negotiable Biological Rules
- **One Authoritative World**: `Simulation` (`src/sim/`) and `World` (`src/world/`) own all biological and physical truth. Rendering, UI, audio, and telemetry read state; they must never duplicate or override simulation facts.
- **Neutral Inherited Variation**: Mutations are undirected by environmental need. Natural selection operates strictly through differential survival and reproduction.
- **Physical Structure & Mass**: Body size (up to 3×) scales mass ($M \propto s^3$), metabolic costs (Kleiber $M^{0.75}$), tissue stress ($\sigma \propto s$), and bite reach. Visual scaling must reflect physical authority.
- **Resource Conservation**: Energy, water, food, seed stock, and tissue growth are finite and conserved. No spawning resources or artificial population floors to satisfy tests. Extinction is a legitimate outcome.
- **Reproduction & Speciation**: Reciprocal mate choice, heritable preferences, and legitimate compatibility rules. No universal arbitrary body replacements at mating.
- **Historical Saves**: Versioned biological rules must replay and continue deterministically. No silent reinterpretation of legacy anatomy, genes, or policies.

## 4. UI & Interaction Doctrine
- **The World is the Primary Interface**: Prioritize direct manipulation, contextual targeting, and readable affordances over menus and dashboards.
- **Player Visibility**: The controlled creature must never be obscured by menus, notifications, or context panels.
- **Progressive Disclosure**: Surface immediate survival feedback first; reserve deep genetics and phylogenetic trees for requested panels. Do not overwhelm early gameplay with empty fields.
- **Aesthetic Integrity**: Distinctive, handmade pixel art (32px native part artwork, 8 directions) with natural-history presentation. Avoid generic AI icons, sci-fi glows, or unnecessary button clutter.

## 5. Git Safety & Provenance
- Maintain one clean Git history on `main`. Never force-push or rewrite published history.
- Work in bounded, test-backed commits. Do not delete test receipts, historical goldens, or diagnostic captures.
- Maintain provenance records in `provenance/ledger.jsonl`, `provenance/decision-map.json`, and `provenance/authorship-manifest.json`.

## 6. Verification & Release Gates
- **Playable Gate**: Run `node tools/check-playable.mjs` (248+ tests on Node 22 & 24) before integrating substantive changes.
- **Visual Acceptance**: Verify in real browser (Chromium) across target viewports: 1920×1080, 1366×768, 1280×720, 1024×768, 800×600, and mobile portrait/landscape.
- **Release Verification**: Build via verified commit, package with `node tools/export-public.mjs`, and verify the extracted zip using `node tools/verify-public-build.cjs`. Never deploy without explicit creator approval.
