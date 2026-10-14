# GenVo — player-facing title/menu redesign · v1.65.0 development checkpoint

## Creator direction
The GenVo public identity must feel like an authored ecological evolution game, not a developer dashboard. Gameplay, discoveries, in-world prompts and the journal should teach systems, rather than presenting an instructional wall before play.

## Implemented in v1.65.0
- A deliberately sparse GenVo title composition with natural typography and a real rendered world behind it. The backdrop uses the existing game renderer; simulation time, survival pressure, mating, AI and ecology stay paused in menus. Decorative CSS motes animate without advancing the simulated world; reduced-motion setting disables them.
- Primary navigation: Continue (only enabled when saved data exists), New World, Load World, Options, Credits. No misleading browser Exit button.
- Main menu, in-game Escape/P pause, Save World, load-world navigation, and a three-choice Return confirmation (Save & Return, Return Without Saving, Cancel).
- New world name and optional seed; independent IndexedDB world slots with old `autosave` slot still visible and loadable. World rename/delete supported. New worlds must not overwrite old worlds.
- Audio mute/master volume, reduced menu motion and fullscreen request; user-visible message when fullscreen is blocked. Credits accurately list SevenFoldStories [QUIλ] and Pentagram Star (without inventing links or a programming role).
- Compulsory welcome text and multi-card opening briefing no longer appear on New World. The existing context-sensitive first tasks operate inside gameplay. Older save tutorial stages continue through the existing normalization.
- Basic keyboard navigation with native focus, Escape back/resume and sizeable menu targets.

## Deliberately not claimed as complete
- This menu pass does **not** deliver a fully designed static diorama, bespoke title animation, redesigned creature art, gamepad navigation, full control rebinding, or accessibility audit beyond keyboard/focus/reduced-motion basics.
- Separate manual and autosave checkpoint histories, import/export saves, corruption preview, cross-tab locks and quota recovery are not yet built. Each world currently has one latest snapshot, not two independent recovery tracks. Browser-site storage remains vulnerable to user clearing it.
- The old opening briefing markup/code exists behind the new flow for compatibility and future removal. Other dense in-game HUD and journal surfaces have not been overhauled.
- Browser screenshots run through intercepted real game assets and a deterministic mock IndexedDB because local navigation is disallowed in the container. Node tests exercise the save/storage contract; actual browser-site persistence should still be creator-tested after deploying the build.

## Verification performed
- Canonical source graph audit, source/public export parity, drawing coverage; roundtrip/save contract and multi-world tests.
- Chromium screenshots: desktop title, game entry, paused game, world browser, 900×650 embedded title/options. Browser reported no page errors or failed requested assets under the virtual-asset test setup.
- Test flows: title must not advance world tick; create first world, Escape pause, Save & Return, Continue, create second world, both worlds remain separate, load earlier world, change reduced-motion settings.

## Next review
Creator should judge visual quality at actual display sizes. Prioritize actual in-game onboarding clarity and save export/recovery next, not restarting reproductive/ecology balancing as part of a menu polish pass.
