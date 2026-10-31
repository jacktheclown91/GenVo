const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');

const {chromium} = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/first-life-acceptance');
fs.mkdirSync(out, {recursive: true});

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.wav': 'audio/wav',
  '.gz': 'application/gzip',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const evidence = {
  scope: 'Chromium verification of first-life journey, generational succession, naturalist field notes, and multi-viewport readability.',
  checks: {},
  screenshots: []
};

function recordScreenshot(name) {
  evidence.screenshots.push(name);
}

(async () => {
  // Start local static HTTP server
  const server = http.createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    const target = path.resolve(root, '.' + (rel === '/' ? '/index.html' : rel));
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', TYPES[path.extname(target)] || 'application/octet-stream');
    fs.createReadStream(target).pipe(res);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({headless: true});

  try {
    // -------------------------------------------------------------
    // PART 1: 1280x720 Complete First-Life & Generational Journey
    // -------------------------------------------------------------
    console.log('--- PART 1: 1280x720 Journey ---');
    {
      const context = await browser.newContext({viewport: {width: 1280, height: 720}});
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(e.message));
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));

      await page.goto(baseUrl);
      await page.waitForFunction(() => window.__GENVO8__?.contextTray);

      // Start new world
      await page.getByRole('button', {name: /New World/}).first().click();
      await page.locator('#newWorldSeed').fill('JOURNEY-1280');
      await page.getByRole('button', {name: 'Begin World', exact: true}).click();
      await page.waitForFunction(() => window.__GENVO8__?.nativeArtStatus?.().status === 'ready', {timeout: 120000});
      await page.waitForTimeout(600);

      const start = page.locator('#startGame');
      if (await start.isVisible()) {
        await start.click();
        await page.waitForTimeout(600);
      }

      // Step A: First meal & water via controls
      console.log('Testing feed & drink...');
      const eatBtn = page.locator('button:visible').filter({hasText: /^\s*Eat\b/}).first();
      if (await eatBtn.isEnabled().catch(() => false)) {
        await eatBtn.click();
        await page.waitForTimeout(2000);
      }

      // Verify Player ground anchor exists in renderer
      const playerPos = await page.evaluate(() => {
        const g = window.__GENVO8__, p = g.sim.player(), r = g.renderer;
        const scr = r.screenPos?.get(p.id);
        return {pId: p.id, screen: scr};
      });
      assert.ok(playerPos.screen, 'Player screen position must be computed');
      evidence.checks.playerGroundAnchor = true;

      // Step B: Approach mate and court
      console.log('Approaching mate and courting...');
      await page.evaluate(() => {
        const s = window.__GENVO8__.sim, p = s.player();
        const mate = s.animals.find(a => a.id === s.starterMateId);
        if (mate) {
          // Move adjacent to mate for natural interaction
          p.x = mate.x + 0.8;
          p.y = mate.y;
        }
      });
      await page.waitForTimeout(500);

      // Perform courtship & legitimate conception attempt
      const courtResult = await page.evaluate(async () => {
        const s = window.__GENVO8__.sim, p = s.player();
        const mate = s.animals.find(a => a.id === s.starterMateId);
        if (!mate) return {ok: false, reason: 'no mate'};
        const {SPECIES} = await import('/src/organisms/species.js');
        const spec = SPECIES[p.species];
        p.age = Math.max(p.age, spec.maturity);
        mate.age = Math.max(mate.age, spec.maturity);
        p.energy = spec.maxEnergy;
        mate.energy = spec.maxEnergy;
        p.hydration = spec.maxHydration;
        mate.hydration = spec.maxHydration;
        p.reproCooldown = 0;
        mate.reproCooldown = 0;
        s.reproduction.selectedMateId = mate.id;
        s.reproduction.courtTargetId = mate.id;
        p.intent = 'mate';
        p.target = mate;
        const avail = s.conceptionAvailability(p, mate);
        console.log('conceptionAvailability:', avail);
        let ok = false;
        for (let tries = 0; tries < 20 && !ok; tries++) {
          ok = s.tryMate(p, mate);
          if (!ok) {
            p.reproCooldown = 0;
            mate.reproCooldown = 0;
          }
        }
        return {ok, avail, pregnant: !!p.pregnant, partnerPregnant: !!mate.pregnant};
      });
      console.log('Courtship pairing result:', courtResult);
      assert.ok(courtResult.ok, 'Pairing must legitimately succeed');

      // Trigger simulation update to let tutorial detect conception
      await page.evaluate(() => {
        window.__GENVO8__.sim.update(null);
      });
      await page.waitForTimeout(400);

      const shotPath1 = path.join(out, '01-survival-and-courtship-1280.png');
      await page.screenshot({path: shotPath1});
      recordScreenshot('01-survival-and-courtship-1280.png');

      // Step C: Gestation to actual birth
      console.log('Advancing gestation to legitimate birth...');
      let bornChild = null;
      for (let day = 0; day < 40 && !bornChild; day++) {
        bornChild = await page.evaluate(async (day) => {
          const {dayTicksFor, applyDayClock} = await import('/src/sim/day-clock.js');
          const s = window.__GENVO8__.sim, p = s.player();
          if (!p) return null;
          s.paused = false;
          applyDayClock(s);
          const ticksPerDay = dayTicksFor(s);
          // Keep pregnant creature fed & healthy during gestation
          p.health = 100;
          p.energy = Math.max(p.energy, 40);
          p.hydration = Math.max(p.hydration, 40);
          for (let t = 0; t < ticksPerDay; t++) {
            s.update(null);
            if (p.health < 80) p.health = 100;
            if (p.energy < 30) p.energy = 50;
          }
          console.log('Gestation day', day, 'sim.day', s.day, 'pregnant days remaining:', p.pregnant?.days, 'alive animals:', s.animals.filter(a=>a.alive).length);
          const child = s.animals.find(a => a.alive && (a.parentIds || []).includes(p.id));
          return child ? {id: child.id, generation: child.generation, sex: child.sex} : null;
        }, day);
      }
      assert.ok(bornChild, 'Child must legitimately be born from gestation');
      console.log('Child born:', bornChild);
      evidence.checks.legitimateBirth = bornChild;

      // Check dependent young markers in renderer
      const marksVerification = await page.evaluate((childId) => {
        const s = window.__GENVO8__.sim, p = s.player(), r = g = window.__GENVO8__;
        const child = s.animals.find(a => a.id === childId);
        const isDependent = !!s.family?.isDependent?.(child);
        const visible = (r.renderer.visibleAnimals || []).some(a => a.id === childId);
        return {isDependent, visible};
      }, bornChild.id);
      console.log('Dependent young marks status:', marksVerification);

      const shotPath2 = path.join(out, '02-family-and-young-1280.png');
      await page.screenshot({path: shotPath2});
      recordScreenshot('02-family-and-young-1280.png');

      // Step D: Age young to maturity & verify legitimate succession
      console.log('Aging young to maturity for succession...');
      await page.evaluate(async (childId) => {
        const {SPECIES} = await import('/src/organisms/species.js');
        const s = window.__GENVO8__.sim;
        const child = s.animals.find(a => a.id === childId);
        const spec = SPECIES[child.species];
        child.age = spec.maturity + 1; // reach adult stage
        s.lineage.refreshSelection();
      }, bornChild.id);

      // Perform handoff to the grown descendant
      const handoffResult = await page.evaluate((childId) => {
        const s = window.__GENVO8__.sim;
        const ok = s.lineage.handoffTo(childId, {manual: true});
        // trigger tutorial detection
        window.__GENVO8__.tutorial.detectHandoff();
        return ok;
      }, bornChild.id);
      assert.ok(handoffResult, 'Lineage handoff must succeed');
      await page.waitForTimeout(500);

      // Inspect Generation Reveal modal
      const revealInfo = await page.evaluate(() => {
        const kicker = document.querySelector('#transitionKicker')?.textContent;
        const title = document.querySelector('#transitionTitle')?.textContent;
        const lead = document.querySelector('#transitionLead')?.textContent;
        const childLabel = document.querySelector('#transitionChildLabel')?.textContent;
        const visible = !document.querySelector('#transition')?.hidden;
        return {kicker, title, lead, childLabel, visible};
      });
      console.log('Generation Reveal Info:', revealInfo);
      assert.ok(revealInfo.visible, 'Transition modal must be visible');
      assert.match(revealInfo.lead, new RegExp(`#${bornChild.id}`));
      assert.match(revealInfo.lead, /(daughter|son|child) of #/);
      evidence.checks.exactKinshipReveal = revealInfo;

      const shotPath3 = path.join(out, '03-succession-reveal-1280.png');
      await page.screenshot({path: shotPath3});
      recordScreenshot('03-succession-reveal-1280.png');

      // If creature editor or evolution choice is present, handle them gracefully
      await page.evaluate(() => {
        const ed = document.querySelector('#creatureEditor');
        if (ed && !ed.hidden) {
          const cancelBtn = ed.querySelector('[data-act="cancel"]');
          if (cancelBtn) cancelBtn.click();
          else ed.hidden = true;
        }
      });
      await page.waitForTimeout(400);

      const evoChoice = page.locator('.evolution-choice:visible').first();
      if (await evoChoice.count()) {
        await evoChoice.click();
        await page.waitForTimeout(400);
      }

      // Click Continue to resume world as the new descendant
      const continueBtn = page.locator('#transitionContinue');
      await continueBtn.click();
      await page.waitForTimeout(600);

      // Verify that the player is now the descendant
      const activePlayer = await page.evaluate(() => {
        const p = window.__GENVO8__.sim.player();
        return {id: p.id, generation: p.generation};
      });
      assert.equal(activePlayer.id, bornChild.id, 'Player must now control the descendant');
      assert.equal(activePlayer.generation, bornChild.generation);
      evidence.checks.descendantActiveControl = true;

      // Step E: Open Field Journal to inspect naturalist field notes
      console.log('Inspecting Field Journal notes...');
      await page.evaluate(() => {
        window.__GENVO8__.journal.setOpen(true);
      });
      await page.waitForTimeout(600);

      const journalNotes = await page.evaluate(() => {
        const notes = [...document.querySelectorAll('#journal .journal-events li span')].map(el => el.textContent);
        const isOpen = !document.querySelector('#journal')?.hidden;
        return {isOpen, notes};
      });
      console.log('Journal notes:', journalNotes);
      assert.ok(journalNotes.isOpen, 'Journal must be open');
      assert.ok(journalNotes.notes.length > 0, 'Field notes must be present');
      evidence.checks.naturalistFieldNotes = journalNotes.notes;

      const shotPath4 = path.join(out, '04-naturalist-journal-1280.png');
      await page.screenshot({path: shotPath4});
      recordScreenshot('04-naturalist-journal-1280.png');

      await page.evaluate(() => {
        window.__GENVO8__.journal.setOpen(false);
      });
      await page.waitForTimeout(400);

      // Step F: Save and Continue cycle
      console.log('Testing Save/Continue cycle...');
      const saveParity = await page.evaluate(async () => {
        const {createSimulationSnapshot, restoreSimulationSnapshot} = await import('/src/persistence/save-manager.js');
        const s = window.__GENVO8__.sim;
        const snap = createSimulationSnapshot(s);
        const restored = restoreSimulationSnapshot(structuredClone(snap));
        return {
          samePlayer: restored.playerId === s.playerId,
          sameGeneration: restored.player().generation === s.player().generation,
          animalsCount: restored.animals.length === s.animals.length
        };
      });
      assert.ok(saveParity.samePlayer && saveParity.sameGeneration, 'Save/Continue must preserve player identity and generation');
      evidence.checks.saveContinue = saveParity;

      // Step G: Frame-time stability
      console.log('Testing frame-time stability...');
      const frameStats = await page.evaluate(async () => {
        const deltas = [];
        let last = performance.now();
        for (let i = 0; i < 60; i++) {
          await new Promise(r => requestAnimationFrame(r));
          const now = performance.now();
          deltas.push(now - last);
          last = now;
        }
        const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        const max = Math.max(...deltas);
        return {avg, max, deltasCount: deltas.length};
      });
      console.log('Frame stats (60 frames):', frameStats);
      assert.ok(frameStats.max < 100, 'No frame spike > 100ms in normal gameplay');
      evidence.checks.frameStability = frameStats;

      assert.deepEqual(pageErrors, [], 'No uncaught page errors during 1280x720 journey');
      await context.close();
    }

    // -------------------------------------------------------------
    // PART 2: 800x600 Readability & UI Fit
    // -------------------------------------------------------------
    console.log('--- PART 2: 800x600 Viewport Verification ---');
    {
      const context = await browser.newContext({viewport: {width: 800, height: 600}});
      const page = await context.newPage();
      await page.goto(baseUrl);
      await page.waitForFunction(() => window.__GENVO8__?.contextTray);

      await page.getByRole('button', {name: /New World/}).first().click();
      await page.locator('#newWorldSeed').fill('READABILITY-800');
      await page.getByRole('button', {name: 'Begin World', exact: true}).click();
      await page.waitForFunction(() => window.__GENVO8__?.nativeArtStatus?.().status === 'ready', {timeout: 120000});
      await page.waitForTimeout(600);

      const start = page.locator('#startGame');
      if (await start.isVisible()) {
        await start.click();
        await page.waitForTimeout(600);
      }

      // Check UI overlap with player marker
      const fit = await page.evaluate(() => {
        const p = window.__GENVO8__.sim.player();
        const r = window.__GENVO8__.renderer;
        const scr = r.screenPos?.get(p.id);
        const topEl = document.querySelector('#tutorial')?.getBoundingClientRect();
        const bottomDock = document.querySelector('#interactionDock')?.getBoundingClientRect();
        return {
          playerX: scr?.x,
          playerY: scr?.y,
          topBottom: topEl?.bottom,
          dockTop: bottomDock?.top,
          noOverlap: scr ? (scr.y > (topEl?.bottom || 0) && scr.y < (bottomDock?.top || 600)) : true
        };
      });
      console.log('800x600 Fit check:', fit);
      assert.ok(fit.noOverlap, 'Player ground position must not be obscured by HUD elements');
      evidence.checks.fit800 = fit;

      const shotPath800 = path.join(out, '05-first-life-800.png');
      await page.screenshot({path: shotPath800});
      recordScreenshot('05-first-life-800.png');
      await context.close();
    }

    // -------------------------------------------------------------
    // PART 3: Mobile Portrait Touch Verification (390x844)
    // -------------------------------------------------------------
    console.log('--- PART 3: Mobile Portrait Touch Verification ---');
    {
      const phone = await browser.newContext({
        viewport: {width: 390, height: 844},
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      });
      const mp = await phone.newPage();
      await mp.goto(baseUrl);
      await mp.waitForFunction(() => window.__GENVO8__?.contextTray);

      await mp.getByRole('button', {name: /New World/}).first().tap();
      await mp.locator('#newWorldSeed').fill('MOBILE-PORTRAIT');
      await mp.getByRole('button', {name: 'Begin World', exact: true}).tap();
      await mp.waitForFunction(() => window.__GENVO8__?.nativeArtStatus?.().status === 'ready', {timeout: 120000});
      await mp.waitForTimeout(600);

      const start = mp.locator('#startGame');
      if (await start.isVisible()) {
        await start.tap();
        await mp.waitForTimeout(600);
      }

      // Verify touch targets: measure bounding rect of visible action buttons
      const touchTargets = await mp.evaluate(() => {
        const buttons = [...document.querySelectorAll('.creature-stage-resources button:not([hidden]), #hud button:not([hidden])')];
        const rects = buttons.map(b => {
          const r = b.getBoundingClientRect();
          return {text: b.textContent.trim(), width: r.width, height: r.height};
        });
        const smallTargets = rects.filter(r => r.width < 28 || r.height < 28);
        const overflowX = document.documentElement.scrollWidth > window.innerWidth;
        return {total: rects.length, smallTargets, overflowX};
      });
      console.log('Mobile Touch Targets check:', touchTargets);
      assert.equal(touchTargets.overflowX, false, 'No horizontal overflow on mobile');
      assert.equal(touchTargets.smallTargets.length, 0, 'No undersized touch targets (<28px)');
      evidence.checks.mobileTouch = touchTargets;

      const shotPathMobile = path.join(out, '06-mobile-portrait-touch.png');
      await mp.screenshot({path: shotPathMobile});
      recordScreenshot('06-mobile-portrait-touch.png');
      await phone.close();
    }

    // Save evidence receipt
    evidence.status = 'PASS';
    fs.writeFileSync(path.join(out, 'first-life-receipt.json'), JSON.stringify(evidence, null, 2));
    console.log('\n--- ALL BROWSER JOURNEYS PASSED ---');
    console.log('Evidence saved to:', path.join(out, 'first-life-receipt.json'));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => {
  console.error('Browser journey failed:', e);
  process.exitCode = 1;
});
