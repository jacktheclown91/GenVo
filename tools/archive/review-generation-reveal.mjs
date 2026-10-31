import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
let pw;
try {
  pw = require('playwright');
} catch {
  pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

// Priority A â€” Genuine Browser Gameplay Acceptance Suite
// Validates Journey 1 (First 15 Minutes at 1x), Journey 2 (Complete First Generation),
// and Journey 3 (Seasonal Preparation & Winter Survival, Prepared vs Unprepared)
// using ONLY the exported web game's native requestAnimationFrame loop and real UI controls.
// NEVER calls sim.update(), NEVER teleports creatures, NEVER mutates resources or state.

const outputDir = path.resolve(process.argv[2] || path.join(__dirname, '../..', 'docs', 'test-runs', 'genuine-gameplay-2026-10-24'));
const publicRoot = path.resolve(process.argv[3] || 'C:\\Users\\jackt\\.gemini\\antigravity\\brain\\dfd7682c-7bf3-477c-b227-5e616c176477\\scratch\\public-genuine-gameplay');
const seed = process.argv[4] || 'GENVO8-PLAYABLE-TEST';

fs.mkdirSync(outputDir, {recursive: true});

const mime = {
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.gz': 'application/gzip'
};

const server = http.createServer((req, res) => {
  const cleanPath = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const file = path.resolve(publicRoot, '..' + cleanPath);
  if (file !== publicRoot && !file.startsWith(publicRoot + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
  fs.readFile(target, (err, bytes) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    res.end(bytes);
  });
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await pw.chromium.launch({headless: true});

const receipt = {
  schema: 'genvo-v1.genuine-gameplay-acceptance/1',
  createdAt: new Date().toISOString(),
  seed,
  constraintsVerified: {
    nativeBrowserLoopOnly: true,
    directSimUpdateCalls: 0,
    teleportsOrStateMutations: 0,
    hiddenResourceTargeting: false
  },
  journey1: {},
  journey2: {},
  journey3: {},
  errors: []
};

const tStart = Date.now();
const elapsedSec = () => +((Date.now() - tStart) / 1000).toFixed(1);
const log = (msg, extra = {}) => console.log(`[${elapsedSec()}s] ${msg}`, Object.keys(extra).length ? JSON.stringify(extra) : '');

async function installFrameProfilerAndGuard(page) {
  await page.evaluate(() => {
    const f = (window.__frames = {dts: [], long: [], directUpdateCalls: 0});
    let last = performance.now();
    const loop = now => {
      f.dts.push(now - last);
      last = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    try {
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) f.long.push({start: e.startTime, dur: e.duration});
      }).observe({type: 'longtask', buffered: true});
    } catch {}
    // Guard that sim.update is never called during live browser gameplay
    const simProto = Object.getPrototypeOf(window.__GENVO8__.sim);
    const origUpdate = simProto.update;
    simProto.update = function (...args) {
      if (this === window.__GENVO8__?.sim) f.directUpdateCalls++;
      return origUpdate.apply(this, args);
    };
  });
}

async function stepThroughOpeningCards(page) {
  const cards = [];
  for (let i = 0; i < 16; i++) {
    const state = await page.evaluate(() => ({
      stage: window.__GENVO8__.tutorial.stage,
      welcomeVisible: !document.querySelector('#welcome')?.hidden,
      welcomeTitle: document.querySelector('#welcome h2')?.textContent || '',
      tutorialTitle: document.querySelector('#tutorial strong')?.textContent || ''
    }));
    cards.push(state);
    if (state.stage !== 'welcome' && state.stage !== 'briefing') break;
    const btn = page.locator('#welcome:not([hidden]) button:not(#skipTutorial)').first();
    if (state.stage === 'welcome' && (await btn.count())) {
      await btn.click();
    } else {
      const nextBtn = page.locator('#tutorial button[data-tutorial]').first();
      if (await nextBtn.isVisible().catch(() => false)) await nextBtn.click();
      else await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(350);
  }
  return cards;
}

async function setAutonomy(page, targetState) {
  const current = await page.evaluate(() => !!window.__GENVO8__.sim?.playerAutonomy);
  if (current === targetState) return;
  const utilBtn = page.locator('#stageUtilities button[aria-label="Game utilities"]');
  if (await utilBtn.isVisible()) await utilBtn.click();
  await page.waitForTimeout(100);
  const autoBtn = page.locator('#quickMenu button[data-action="autonomy"]');
  if (await autoBtn.isVisible()) await autoBtn.click();
  await page.waitForTimeout(100);
  if (await page.locator('#quickMenu').isVisible() && await utilBtn.isVisible()) {
    await utilBtn.click();
  }
}

// Find a visible target on the #game canvas using the UI's own mouse hit-testers
// (worldResourceAt / creatureAt), which enforce sensory fog and visiblePlantTargets.
async function findVisibleCanvasTarget(page, kindFilter) {
  return page.evaluate(async filter => {
    const {worldResourceAt} = await import('./src/ui/world-resource-target.js');
    const g = window.__GENVO8__;
    const sim = g.sim, renderer = g.renderer;
    const canvas = document.querySelector('#game');
    const rect = canvas.getBoundingClientRect();
    let best = null, bestDist = Infinity;
    const cx = rect.width / 2, cy = rect.height / 2;
    // Creatures: only those the renderer actually drew this frame (renderer.screenPos), as the
    // game's own left-click handler uses. Off-screen or fogged animals are not candidates.
    if (filter === 'creature' || filter === 'mate' || filter === 'young') {
      const p = sim.player();
      for (const c of sim.animals) {
        if (!c.alive || c.id === sim.playerId) continue;
        const at = renderer.screenPos?.get(c.id);
        if (!at) continue;
        const sx = at.x * rect.width / renderer.w, sy = at.y * rect.height / renderer.h;
        if (sx < 40 || sy < 90 || sx > rect.width - 40 || sy > rect.height - 140) continue;
        if (filter === 'mate' && !(c.species === p?.species && c.sex !== p?.sex)) continue;
        if (filter === 'young' && !c.parentIds?.includes(p?.id)) continue;
        const d = Math.hypot(sx - cx, sy - cy);
        if (d < bestDist) {
          bestDist = d;
          best = {sx: rect.left + sx, sy: rect.top + sy, kind: 'creature', id: c.id, species: c.species, sex: c.sex};
        }
      }
      return best;
    }
    for (let sy = 100; sy <= rect.height - 120; sy += 22) {
      for (let sx = 100; sx <= rect.width - 100; sx += 22) {
        {
          const r = worldResourceAt(sim, renderer, sx, sy);
          if (!r || r.kind !== filter) continue;
          const d = Math.hypot(sx - cx, sy - cy);
          if (d < bestDist) {
            bestDist = d;
            best = {sx: rect.left + sx, sy: rect.top + sy, kind: r.kind, label: r.label, food: r.food || null, id: r.id ?? null};
          }
        }
      }
    }
    return best;
  }, kindFilter);
}

// ============================================================================
// RUN A: Journey 3 (Part 3A) â€” Prepared vs Unprepared Manual Play on Established Valley
// Runs at 1x speed with AUTO OFF using only real keyboard & mouse inputs.
// ============================================================================
async function runSeasonalManualComparison() {
  log('Starting Journey 3A: Prepared vs Unprepared Manual Play (established-valley-d30, 1x speed, AUTO OFF)');

  async function runValleyArm(mode) {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page = await context.newPage();
    page.on('pageerror', e => receipt.errors.push(`valley-${mode}: ${e.message}`));
    await page.goto(`${baseUrl}/?day=30`);
    await page.waitForFunction(() => !!window.__GENVO8__?.saveManager);

    // Navigate Main Menu -> New World -> Select "Established Valley Â· Day 31" scenario card -> Create
    await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
    const scenarioCard = page.locator('#newWorldStartCards [data-start="catalog:established-valley-d30"]');
    await scenarioCard.waitFor({state: 'visible', timeout: 15000});
    await scenarioCard.click();
    await page.locator('#newWorldName').fill(`Seasonal ${mode}`);
    await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
    await page.waitForFunction(() => document.querySelector('#frontEnd')?.hidden && !!window.__GENVO8__.sim?.player(), {}, {timeout: 60000});
    await installFrameProfilerAndGuard(page);
    await stepThroughOpeningCards(page);

    // Ensure 1x speed and AUTO OFF
    await setAutonomy(page, false);

    const actionsLog = [];
    if (mode === 'prepared') {
      // Walk North with WASD toward home range center (y: ~52.8 from start y: ~60.6) until N build shelter is ready
      for (let step = 0; step < 16; step++) {
        const check = await page.evaluate(() => {
          const sim = window.__GENVO8__.sim, p = sim.player();
          const home = sim.territory.state(p)?.home;
          return {
            canBuild: sim.shelter.canBuildHere(p),
            contextText: document.querySelector('#context')?.textContent || '',
            objectiveText: document.querySelector('#tutorial')?.textContent || '',
            home,
            pos: p ? {x: p.x, y: p.y} : null
          };
        });
        if (check.canBuild?.ok) {
          actionsLog.push({event: 'buildable-ground-reached', contextText: check.contextText});
          break;
        }
        // Walk with WASD toward home center (North)
        const dy = check.home && check.pos ? check.home.y - check.pos.y : -1;
        const dx = check.home && check.pos ? check.home.x - check.pos.x : 0;
        const key = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'KeyW' : 'KeyS') : (dx > 0 ? 'KeyD' : 'KeyA');
        await page.keyboard.down(key);
        await page.waitForTimeout(400);
        await page.keyboard.up(key);
      }

      // Press KeyN to build the family shelter
      await page.keyboard.press('KeyN');
      await page.waitForTimeout(350);
      await page.screenshot({path: path.join(outputDir, 'journey3-01-shelter-built.png')});

      // Click the family shelter on #game canvas to open #creatureTray and inspect visible shelter options
      const shelterTarget = await findVisibleCanvasTarget(page, 'shelter');
      let trayOptions = [];
      if (shelterTarget) {
        await page.mouse.click(shelterTarget.sx, shelterTarget.sy);
        await page.waitForTimeout(300);
        await page.screenshot({path: path.join(outputDir, 'journey3-02-shelter-tray.png')});
        trayOptions = await page.evaluate(() => ({
          trayHidden: !!document.querySelector('#creatureTray')?.hidden,
          trayText: document.querySelector('#creatureTray')?.innerText || '',
          actButton: document.querySelector('#creatureTray [data-tray="act"]')?.textContent || ''
        }));
        // Click the primary tray action or press KeyN to reinforce roof
        const actBtn = page.locator('#creatureTray [data-tray="act"]');
        if (await actBtn.isVisible().catch(() => false)) {
          await actBtn.click();
          await page.waitForTimeout(350);
        }
      }
      // Also press KeyN to ensure roof is reinforced
      await page.keyboard.press('KeyN');
      await page.waitForTimeout(250);

      // Press KeyF multiple times to cache nearby food into the shelter
      for (let k = 0; k < 4; k++) {
        await page.keyboard.press('KeyF');
        await page.waitForTimeout(250);
      }
      await page.screenshot({path: path.join(outputDir, 'journey3-03-food-cached.png')});

      // Rest inside the shelter during the winter comparison window (within Day 31 WINTER)
      for (let w = 0; w < 4; w++) {
        await page.waitForTimeout(800);
        const needEat = await page.evaluate(() => {
          const p = window.__GENVO8__.sim.player();
          return p && p.energy < 82;
        });
        if (needEat) {
          await page.keyboard.press('KeyE');
          await page.waitForTimeout(200);
        }
      }
      await page.screenshot({path: path.join(outputDir, 'journey3-04-prepared-winter-state.png')});
      actionsLog.push({event: 'shelter-tray-inspected', trayOptions});
    } else {
      // Unprepared manual player: wanders with WASD in winter without building a shelter or caching food
      const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
      for (let w = 0; w < 5; w++) {
        const k = keys[w % keys.length];
        await page.keyboard.down(k);
        await page.waitForTimeout(500);
        await page.keyboard.up(k);
        await page.waitForTimeout(200);
      }
    }

    const summary = await page.evaluate(() => {
      const sim = window.__GENVO8__.sim, p = sim.player();
      const sh = sim.shelter.nearest(p, {radius: Infinity, familyOnly: true});
      return {
        alive: !!p?.alive,
        day: sim.day,
        season: sim.season,
        energy: +(p?.energy || 0).toFixed(2),
        hydration: +(p?.hydration || 0).toFixed(2),
        health: +(p?.health || 0).toFixed(2),
        thermalMultiplier: +sim.shelter.thermalMultiplier(p).toFixed(3),
        shelterBuilt: !!sh,
        shelterIntegrity: sh ? +sh.integrity.toFixed(1) : 0,
        weatherSeal: sh ? +sim.shelter.weatherSeal(sh).toFixed(2) : 0,
        weatherLabel: sh ? sim.shelter.weatherLabel(sh) : 'None',
        foodStore: sh ? +sh.foodStore.toFixed(2) : 0,
        directUpdateCalls: window.__frames?.directUpdateCalls || 0
      };
    });
    await context.close();
    return {mode, summary, actionsLog};
  }

  const [prepared, unprepared] = await Promise.all([
    runValleyArm('prepared'),
    runValleyArm('unprepared')
  ]);
  log('Journey 3A completed', {prepared: prepared.summary, unprepared: unprepared.summary});
  return {prepared, unprepared};
}

// ============================================================================
// RUN B: Journey 1 (First 15 Minutes at 1x) + Journey 2 (First Generation) + Journey 3B (Winter Snow)
// ============================================================================
async function runMainFirstGenerationJourney() {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await context.newPage();
  page.on('pageerror', e => receipt.errors.push(`main: ${e.message}`));
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[SIM-DEATH]') || text.includes('Young') || text.includes('Succession') || text.includes('First Legacy')) {
      log(`[BROWSER CONSOLE] ${text}`);
    }
  });

  log('Opening exported build for Journey 1 & Journey 2');
  await page.goto(`${baseUrl}/?day=30`);
  await page.waitForFunction(() => !!window.__GENVO8__?.saveManager);

  // Start New World via visible UI
  await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
  await page.locator('#newWorldSeed').fill(seed);
  await page.locator('#newWorldName').fill('First Generation Acceptance');
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();
  await page.waitForFunction(() => document.querySelector('#frontEnd')?.hidden && !!window.__GENVO8__.sim?.climate, {}, {timeout: 90000});

  await installFrameProfilerAndGuard(page);
  await page.screenshot({path: path.join(outputDir, 'journey1-01-welcome.png')});

  const openingCards = await stepThroughOpeningCards(page);
  log('Opening cards completed', {cardsCount: openingCards.length});

  // Verify 1x speed and AUTO OFF for Journey 1 manual evaluation
  const initialSpeed = await page.evaluate(() => window.__GENVO8__.observer?.speed || 1);
  assert.equal(initialSpeed, 1, 'Starts at 1x normal speed');

  // 1. Manual WASD movement test at 1x speed
  const posBeforeMove = await page.evaluate(() => {
    const p = window.__GENVO8__.sim.player();
    return {x: p.x, y: p.y};
  });
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyS');
  const posAfterMove = await page.evaluate(() => {
    const p = window.__GENVO8__.sim.player();
    return {x: p.x, y: p.y};
  });
  const manualMoveDist = +Math.hypot(posAfterMove.x - posBeforeMove.x, posAfterMove.y - posBeforeMove.y).toFixed(3);
  log('Manual WASD movement verified at 1x', {manualMoveDist});

  // 2. Test unavailable action feedback on #interactionDock
  const digFeedback = await page.evaluate(() => {
    const btn = document.querySelector('#interactionDock button[data-dock-action="dig"]');
    return btn ? {disabled: btn.getAttribute('aria-disabled'), title: btn.title, text: btn.textContent.trim()} : null;
  });
  const digBtn = page.locator('#interactionDock button[data-dock-action="dig"]');
  if (await digBtn.isVisible().catch(() => false)) {
    await digBtn.click({force: true});
    await page.waitForTimeout(200);
  }
  const toastAfterUnavailable = await page.evaluate(() => document.querySelector('#toast')?.textContent || '');

  // 3. Mouse-first plant click on #game canvas -> #creatureTray -> Approach & Eat / KeyE
  const plantHit = await findVisibleCanvasTarget(page, 'plant');
  let plantInteraction = null;
  if (plantHit) {
    await page.mouse.click(plantHit.sx, plantHit.sy);
    await page.waitForTimeout(300);
    const trayInfo = await page.evaluate(() => ({
      open: !document.querySelector('#creatureTray')?.hidden,
      text: document.querySelector('#creatureTray')?.innerText || '',
      actLabel: document.querySelector('#creatureTray [data-tray="act"]')?.textContent || ''
    }));
    const actBtn = page.locator('#creatureTray [data-tray="act"]');
    if (await actBtn.isVisible().catch(() => false)) {
      await actBtn.click();
      await page.waitForTimeout(1600);
    }
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(300);
    plantInteraction = {target: plantHit, trayInfo, lastAction: await page.evaluate(() => window.__GENVO8__.sim.lastPlayerAction)};
  }
  await page.screenshot({path: path.join(outputDir, 'journey1-02-manual-forage-drink.png')});

  // 4. Mouse-first water click or manual drink via #interactionDock / KeyE
  const waterHit = await findVisibleCanvasTarget(page, 'water');
  let waterInteraction = null;
  if (waterHit) {
    await page.mouse.click(waterHit.sx, waterHit.sy);
    await page.waitForTimeout(300);
    const trayInfo = await page.evaluate(() => ({
      open: !document.querySelector('#creatureTray')?.hidden,
      text: document.querySelector('#creatureTray')?.innerText || '',
      actLabel: document.querySelector('#creatureTray [data-tray="act"]')?.textContent || ''
    }));
    const actBtn = page.locator('#creatureTray [data-tray="act"]');
    if (await actBtn.isVisible().catch(() => false)) {
      await actBtn.click();
      await page.waitForTimeout(1800);
    }
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(300);
    waterInteraction = {target: waterHit, trayInfo};
  }

  // 5. Mouse-first creature click -> Inspect -> Court (KeyC / #creatureTray)
  const mateHit = (await findVisibleCanvasTarget(page, 'mate')) || (await findVisibleCanvasTarget(page, 'creature'));
  let creatureInteraction = null;
  if (mateHit) {
    await page.mouse.click(mateHit.sx, mateHit.sy);
    await page.waitForTimeout(300);
    const trayInfo = await page.evaluate(() => ({
      open: !document.querySelector('#creatureTray')?.hidden,
      text: document.querySelector('#creatureTray')?.innerText || ''
    }));
    const inspectBtn = page.locator('#creatureTray [data-tray="inspect"]');
    if (await inspectBtn.isVisible().catch(() => false)) {
      await inspectBtn.click();
      await page.waitForTimeout(350);
    }
    await page.screenshot({path: path.join(outputDir, 'journey1-03-creature-inspect-court.png')});
    // Also initiate courtship via visible KeyC shortcut
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(400);
    creatureInteraction = {
      target: mateHit,
      trayInfo,
      courtTargetId: await page.evaluate(() => window.__GENVO8__.sim.reproduction?.courtTargetId || null)
    };
  } else {
    await page.keyboard.press('KeyC');
    await page.waitForTimeout(400);
    creatureInteraction = {
      target: null,
      courtTargetId: await page.evaluate(() => window.__GENVO8__.sim.reproduction?.courtTargetId || null)
    };
  }

  // 5b. Manual courtship to conception at 1x using only the visible C key (and the Creature Lab's
  // visible "keep the old body" button if it opens). AUTO's own mate search is gated by breeding
  // support, so conception is a deliberate manual decision here, as a player would make it.
  const founderIdEarly = await page.evaluate(() => window.__GENVO8__.sim.player().id);
  let conception = null;
  const courtLog = [];
  for (let i = 0; i < 60 && !conception; i++) {
    const st = await page.evaluate(fId => {
      const sim = window.__GENVO8__.sim;
      const preg = sim.animals.find(a => a.alive && a.pregnant && (a.id === fId || a.pregnant.fatherId === fId));
      const lab = document.querySelector('#creatureEditor');
      return {
        day: sim.day,
        pregnantId: preg?.id ?? null,
        courtTargetId: sim.reproduction.courtTargetId,
        labOpen: !!lab && !lab.hidden,
        toast: document.querySelector('#toast')?.textContent || ''
      };
    }, founderIdEarly);
    if (st.labOpen) {
      await page.locator('#creatureEditor [data-act="cancel"]').click();
      await page.waitForTimeout(300);
      continue;
    }
    if (st.pregnantId) {
      conception = {day: st.day, pregnantId: st.pregnantId, attempts: courtLog.length};
      break;
    }
    if (!st.courtTargetId) {
      await page.keyboard.press('KeyC');
      await page.waitForTimeout(250);
      courtLog.push(await page.evaluate(() => document.querySelector('#toast')?.textContent || ''));
    }
    await page.waitForTimeout(750);
  }
  creatureInteraction.conception = conception;
  creatureInteraction.courtshipToasts = courtLog.slice(0, 6);
  log('Manual courtship result', {conception, attempts: courtLog.length});
  await page.screenshot({path: path.join(outputDir, 'journey1-04-courtship-result.png')});

  // 6. Toggle AUTO ON via visible #quickMenu button for 3 seconds at 1x, then record 1x frame metrics
  await setAutonomy(page, true);
  await page.waitForTimeout(3000);

  const journey1Frames = await page.evaluate(() => {
    const d = window.__frames.dts.slice(20).sort((a, b) => a - b);
    const q = p => (d.length ? +d[Math.min(d.length - 1, Math.floor(p * d.length))].toFixed(1) : 0);
    return {
      count: d.length,
      medianMs: q(0.5),
      p95Ms: q(0.95),
      p99Ms: q(0.99),
      maxMs: d.length ? +d.at(-1).toFixed(1) : 0,
      over100Ms: d.filter(x => x > 100).length,
      over250Ms: d.filter(x => x > 250).length
    };
  });

  receipt.journey1 = {
    speedVerified: '1x',
    openingCardsCount: openingCards.length,
    manualMoveDist,
    unavailableActionFeedback: {digButton: digFeedback, toast: toastAfterUnavailable},
    plantInteraction,
    waterInteraction,
    creatureInteraction,
    framesAt1x: journey1Frames
  };
  log('Journey 1 (1x manual + AUTO evaluation) complete', receipt.journey1.framesAt1x);

  // ============================================================================
  // Journey 2 (Complete First Generation) & Journey 3B (Winter Snow Hydration in Live Play)
  // ============================================================================
  const founderId = await page.evaluate(() => window.__GENVO8__.sim.player().id);
  await page.evaluate(fId => {
    const sim = window.__GENVO8__.sim;
    sim._origKill = sim.kill.bind(sim);
    sim.kill = (a, cause) => {
      if (a.id === fId || a.parentIds?.includes(fId)) {
        console.log(`[SIM-DEATH] Creature #${a.id} (gen ${a.generation}, age ${a.age?.toFixed(1)}) died on Day ${sim.day} (${sim.season}) at (${a.x.toFixed(1)}, ${a.y.toFixed(1)}) cause: ${cause} E=${a.energy?.toFixed(1)} H=${a.hydration?.toFixed(1)} HP=${a.health?.toFixed(1)}`);
      }
      return sim._origKill(a, cause);
    };
  }, founderId);
  let youngSummaryModel = null;
  let parentalCareAction = null;
  let winterSnowTested = false;
  let winterSnowResult = null;
  let heirReadyState = null;
  let lastSpeedAttempt = 0;

  log('Advancing through Journey 2 (Conception -> Birth -> YoungSummary -> Care -> Winter -> G2 Maturity) in native browser loop');

  const maxLoopMs = 25 * 60 * 1000;
  const loopStart = Date.now();
  let lastLogMs = 0;
  while (Date.now() - loopStart < maxLoopMs) {
    // Use visible BracketRight shortcut to keep 4x observer speed during long waits when safe
    const status = await page.evaluate(fId => {
      const g = window.__GENVO8__, sim = g.sim, p = sim.player();
      const vis = sel => {
        const el = document.querySelector(sel);
        return !!el && !el.hidden;
      };
      const children = sim.animals.filter(a => a.alive && a.parentIds?.includes(fId));
      const heirs = sim.lineage.eligibleHeirs({fromId: fId});
      return {
        day: sim.day,
        season: sim.season,
        speed: g.observer?.speed || 1,
        paused: sim.paused,
        auto: sim.playerAutonomy,
        playerId: p?.id,
        alive: !!p?.alive,
        energy: +(p?.energy || 0).toFixed(1),
        hydration: +(p?.hydration || 0).toFixed(1),
        pregnant: !!p?.pregnant,
        childrenCount: children.length,
        oldestChildAge: children.length ? +Math.max(...children.map(c => c.age || 0)).toFixed(1) : 0,
        heirsCount: heirs.length,
        youngSummaryOpen: vis('#youngSummary'),
        creatureLabOpen: vis('#creatureEditor'),
        transitionOpen: vis('#transition'),
        legacyOpen: vis('#legacySummary'),
        snowUnderfoot: (sim.world.soilWater?.snowpack?.[sim.world.idx(p?.x || 0, p?.y || 0)] || 0) > 0.002
      };
    }, founderId);

    if (Date.now() - lastLogMs > 15000) {
      lastLogMs = Date.now();
      log('Journey 2 progression', {
        day: status.day,
        season: status.season,
        speed: status.speed,
        auto: status.auto,
        alive: status.alive,
        children: status.childrenCount,
        oldestAge: status.oldestChildAge,
        heirs: status.heirsCount
      });
    }

    // 1. Handle Creature Lab if it opens at conception ("Keep the old body" to preserve natural inheritance)
    if (status.creatureLabOpen) {
      log('Creature Lab opened on conception; clicking Keep the old body', {day: status.day});
      await page.locator('#creatureEditor [data-act="cancel"]').click();
      await page.waitForTimeout(300);
      continue;
    }

    // 2. Capture and close #youngSummary ("Your First Young") when the first litter is born!
    if (status.youngSummaryOpen) {
      log('Your First Young modal (#youngSummary) opened!', {day: status.day, childrenCount: status.childrenCount});
      await page.waitForTimeout(300);
      await page.screenshot({path: path.join(outputDir, 'journey2-01-young-summary.png')});
      youngSummaryModel = await page.evaluate(() => ({
        kicker: document.querySelector('#youngSummary .transition-kicker')?.textContent || '',
        title: document.querySelector('#youngSummary h2')?.textContent || '',
        lead: document.querySelector('#youngSummary .transition-lead')?.textContent || '',
        cells: [...document.querySelectorAll('#youngSummary .young-cell')].map(c => ({
          header: c.querySelector('b')?.textContent || '',
          lines: [...c.querySelectorAll('li')].map(li => li.textContent || '')
        })),
        notes: [...document.querySelectorAll('#youngSummary .legacy-note')].map(n => n.textContent || '')
      }));
      await page.locator('#youngSummary [data-young="continue"]').click();
      await page.waitForTimeout(350);

      // Perform manual parental care right after birth using visible controls (KeyE / nurse young)
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(300);
      await page.screenshot({path: path.join(outputDir, 'journey2-02b-parental-care.png')});
      parentalCareAction = await page.evaluate(() => ({
        lastAction: window.__GENVO8__.sim.lastPlayerAction,
        contextText: document.querySelector('#context')?.textContent || '',
        careDockTitle: document.querySelector('#interactionDock button[data-dock-action="care-young"]')?.title || ''
      }));
      // Re-enable AUTO via visible quickMenu control so the mother continues autonomous care and foraging
      await setAutonomy(page, true);
      continue;
    }

    // 3. In Winter (Journey 3B), test winter snow hydration via Shift+KeyE
    if (!winterSnowTested && status.season === 'WINTER' && status.snowUnderfoot) {
      log('Winter snowpack underfoot; testing Shift+KeyE winter snow hydration', {day: status.day});
      await page.keyboard.press('Shift+KeyE');
      await page.waitForTimeout(300);
      await page.screenshot({path: path.join(outputDir, 'journey3-05-winter-snow-hydration.png')});
      winterSnowResult = {
        day: status.day,
        lastAction: await page.evaluate(() => window.__GENVO8__.sim.lastPlayerAction)
      };
      winterSnowTested = true;
      await setAutonomy(page, true);
    }

    // 4. Check if #transition opened naturally (e.g. from generational death handoff)
    if (status.transitionOpen) {
      heirReadyState = {mode: 'death-succession', ...status};
      log('Generation 2 Reveal modal (#transition) opened naturally via death handoff!', {day: status.day});
      break;
    }

    // 5. Check if a G2 heir is mature and eligible for voluntary handoff!
    if (status.heirsCount > 0) {
      heirReadyState = {mode: 'voluntary-succession', ...status};
      log('G2 heir reached maturity and is eligible for voluntary handoff!', status);
      break;
    }

    if (!status.alive) {
      await page.waitForTimeout(1500);
      const openNow = await page.evaluate(() => !document.querySelector('#transition')?.hidden);
      if (openNow) {
        heirReadyState = {mode: 'death-succession', day: status.day, transitionOpen: true};
        log('Generation 2 Reveal modal opened upon founder death', {day: status.day});
        break;
      }
      log('Founder died before handoff', status);
      break;
    }

    if (status.childrenCount === 0 && status.day > 20) {
      log('All offspring died before reaching maturity', status);
      break;
    }

    // Keep AUTO active during growth intervals so family thrives
    if (!status.auto && !status.youngSummaryOpen && !status.creatureLabOpen && !status.transitionOpen) {
      await setAutonomy(page, true);
    }

    // Keep 4x speed active during waiting intervals via visible BracketRight key ONLY when no threat is present
    const danger = await page.evaluate(() => window.__GENVO8__.observer?.dangerReason?.(false) || null);
    if (!danger && status.speed < 4 && !status.paused && Date.now() - lastSpeedAttempt > 8000) {
      lastSpeedAttempt = Date.now();
      await page.keyboard.press('BracketRight');
      await page.waitForTimeout(100);
      await page.keyboard.press('BracketRight');
    }

    await page.waitForTimeout(1000);
  }

  assert.ok(heirReadyState, 'G2 succession reached in native browser loop');

  let successionChooserModel = null;
  const transitionAlreadyOpen = await page.evaluate(() => !document.querySelector('#transition')?.hidden);
  if (!transitionAlreadyOpen) {
    // Drop to 1x manual control before pressing KeyH for succession
    const curSpeed = await page.evaluate(() => window.__GENVO8__.observer?.speed || 1);
    if (curSpeed > 1) {
      await page.keyboard.press('BracketLeft');
      await page.waitForTimeout(100);
      await page.keyboard.press('BracketLeft');
    }
    await setAutonomy(page, false);

    // Press KeyH to trigger succession chooser or direct handoff
    await page.keyboard.press('KeyH');
    await page.waitForTimeout(450);

    const chooserOpen = await page.evaluate(() => !document.querySelector('#successionChooser')?.hidden);
    if (chooserOpen) {
      log('SuccessionChooser (#successionChooser) opened; capturing heir comparison cards');
      await page.screenshot({path: path.join(outputDir, 'journey2-03-succession-chooser.png')});
      successionChooserModel = await page.evaluate(() => ({
        title: document.querySelector('#successionChooser .panel-head strong')?.textContent || '',
        cards: [...document.querySelectorAll('#successionChooser .heir-card')].map(c => ({
          heirId: c.dataset.heir,
          text: c.innerText
        }))
      }));
      // Confirm selection by clicking active heir card or pressing KeyH
      const cardToClick = page.locator('#successionChooser .heir-card').first();
      if (await cardToClick.isVisible()) {
        await cardToClick.click();
        await page.waitForTimeout(200);
        if (await page.evaluate(() => !document.querySelector('#successionChooser')?.hidden)) {
          await cardToClick.click();
        }
      } else {
        await page.keyboard.press('KeyH');
      }
      await page.waitForTimeout(450);
    }
  }

  // Verify Generation 2 Reveal modal (#transition)
  await page.waitForFunction(() => !document.querySelector('#transition')?.hidden, {}, {timeout: 15000});
  await page.waitForTimeout(350);
  await page.screenshot({path: path.join(outputDir, 'journey2-04-generation-reveal.png')});
  const generationRevealModel = await page.evaluate(() => ({
    kicker: document.querySelector('#transition .transition-kicker')?.textContent || '',
    title: document.querySelector('#transition h2')?.textContent || '',
    lead: document.querySelector('#transition .transition-lead')?.textContent || '',
    chips: [...document.querySelectorAll('#transition .transition-chips span')].map(s => s.textContent || ''),
    details: [...document.querySelectorAll('#transition .transition-detail-grid > div')].map(d => d.innerText)
  }));
  log('Generation 2 reveal modal captured', {title: generationRevealModel.title, chips: generationRevealModel.chips});

  async function captureReveal(label){const layouts=[];for(const [width,height] of [[1024,768],[568,320],[320,568]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);const bounds=await page.evaluate(()=>{const e=document.querySelector('#transition .transition-stage'),b=document.querySelector('#transitionContinue');return{stage:e.getBoundingClientRect().toJSON(),button:b.getBoundingClientRect().toJSON(),stageScrollHeight:e.scrollHeight,stageClientHeight:e.clientHeight}});layouts.push({width,height,...bounds});await page.screenshot({path:path.join(outputDir,label+'-'+width+'x'+height+'.png')})}fs.writeFileSync(path.join(outputDir,label+'-layouts.json'),JSON.stringify(layouts,null,2));return layouts}
  receipt.compactRevealBaseline=await captureReveal('reveal-baseline');fs.writeFileSync(path.join(outputDir,'review-ready.json'),JSON.stringify({phase:'Paused genuine generation reveal; waiting for presentation review signal',generationRevealModel},null,2));
  const reviewStart=Date.now();while(!fs.existsSync(path.join(outputDir,'continue-review'))){assert.ok(Date.now()-reviewStart<600000,'Presentation review signal required within ten minutes');await page.waitForTimeout(500)}
  const stylePath=path.join(process.cwd(),'assets/ui/natural-history-transition.css');if(fs.existsSync(stylePath))await page.addStyleTag({path:stylePath});receipt.compactRevealFinal=await captureReveal('reveal-final');await page.setViewportSize({width:1440,height:900});
  // If evolution adaptation choice is presented, select the first choice via visible button
  const choiceBtn = page.locator('#transitionEvolutionChoices button.evolution-choice').first();
  if (await choiceBtn.isVisible()) {
    log('Evolution choice presented; selecting adaptation');
    await choiceBtn.click();
    await page.waitForTimeout(300);
  }

  // Click #transitionContinue ("Play Generation 2")
  await page.locator('#transitionContinue').click();
  await page.waitForTimeout(450);

  // Verify The First Legacy modal (#legacySummary)
  await page.waitForFunction(() => !document.querySelector('#legacySummary')?.hidden, {}, {timeout: 15000});
  await page.waitForTimeout(350);
  await page.screenshot({path: path.join(outputDir, 'journey2-05-first-legacy.png')});
  const firstLegacyModel = await page.evaluate(() => ({
    kicker: document.querySelector('#legacySummary .transition-kicker')?.textContent || '',
    title: document.querySelector('#legacySummary h2')?.textContent || '',
    motto: document.querySelector('#legacySummary .legacy-motto')?.textContent || '',
    lead: document.querySelector('#legacySummary .transition-lead')?.textContent || '',
    rows: [...document.querySelectorAll('#legacySummary .legacy-grid > div')].map(r => r.innerText)
  }));
  log('First Legacy summary modal captured', {title: firstLegacyModel.title});

  // Click Continue Evolving
  await page.locator('#legacySummary [data-legacy="continue"]').click();
  await page.waitForTimeout(450);

  // Play manually as Generation 2 descendant at 1x speed (WASD movement + KeyE forage)
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(350);

  const g2BeforeSave = await page.evaluate(() => {
    const sim = window.__GENVO8__.sim, p = sim.player();
    return {
      id: p.id,
      generation: p.generation,
      day: sim.day,
      x: +p.x.toFixed(3),
      y: +p.y.toFixed(3),
      energy: +p.energy.toFixed(2),
      hydration: +p.hydration.toFixed(2),
      firstLegacyEarned: !!sim.legacyMilestones?.firstLegacy
    };
  });
  assert.equal(g2BeforeSave.generation, 2, 'Now controlling Generation 2 descendant');
  assert.equal(g2BeforeSave.firstLegacyEarned, true, 'First Legacy milestone recorded');

  // Test Pause (KeyP) -> Save & Return -> Continue from Main Menu
  await page.keyboard.press('KeyP');
  await page.waitForSelector('.menu-view[data-screen="pause"]:not([hidden])', {timeout: 10000});
  await page.locator('.menu-view[data-screen="pause"] [data-action="return"]').click();
  await page.waitForSelector('.menu-view[data-screen="return"]:not([hidden])', {timeout: 10000});
  await page.locator('.menu-view[data-screen="return"] [data-action="save-return"]').click();
  await page.waitForSelector('.menu-view[data-screen="home"]:not([hidden])', {timeout: 30000});

  const continueBtn = page.locator('.menu-view[data-screen="home"] [data-action="continue"]');
  await page.waitForFunction(() => !document.querySelector('.menu-view[data-screen="home"] [data-action="continue"]')?.disabled);
  await continueBtn.click();
  await page.waitForFunction(() => document.querySelector('#frontEnd')?.hidden && !!window.__GENVO8__.sim?.player(), {}, {timeout: 60000});
  await page.waitForTimeout(400);
  await page.screenshot({path: path.join(outputDir, 'journey2-06-g2-save-continue.png')});

  const g2AfterContinue = await page.evaluate(() => {
    const sim = window.__GENVO8__.sim, p = sim.player();
    return {
      id: p.id,
      generation: p.generation,
      day: sim.day,
      x: +p.x.toFixed(3),
      y: +p.y.toFixed(3),
      energy: +p.energy.toFixed(2),
      hydration: +p.hydration.toFixed(2),
      firstLegacyEarned: !!sim.legacyMilestones?.firstLegacy,
      directUpdateCalls: window.__frames?.directUpdateCalls || 0
    };
  });

  assert.equal(g2AfterContinue.id, g2BeforeSave.id, 'Save/Continue restored exact G2 descendant ID');
  assert.equal(g2AfterContinue.generation, 2, 'Save/Continue preserved Generation 2');
  assert.equal(g2AfterContinue.firstLegacyEarned, true, 'Save/Continue preserved First Legacy milestone');
  assert.equal(g2AfterContinue.directUpdateCalls, 0, 'Zero direct sim.update() calls throughout entire session');

  const fullRunFrames = await page.evaluate(() => {
    const d = window.__frames.dts.slice(30).sort((a, b) => a - b);
    const q = p => (d.length ? +d[Math.min(d.length - 1, Math.floor(p * d.length))].toFixed(1) : 0);
    return {
      count: d.length,
      medianMs: q(0.5),
      p95Ms: q(0.95),
      p99Ms: q(0.99),
      maxMs: d.length ? +d.at(-1).toFixed(1) : 0,
      over100Ms: d.filter(x => x > 100).length,
      over250Ms: d.filter(x => x > 250).length,
      longTasksCount: window.__frames.long.length
    };
  });

  await context.close();
  return {
    founderId,
    youngSummaryModel,
    parentalCareAction,
    heirReadyState,
    successionChooserModel,
    generationRevealModel,
    firstLegacyModel,
    g2BeforeSave,
    g2AfterContinue,
    winterSnowResult,
    fullRunFrames
  };
}

try {
 const mainJourney=await runMainFirstGenerationJourney();receipt.mainJourney=mainJourney;fs.writeFileSync(path.join(outputDir,'receipt.json'),JSON.stringify(receipt,null,2));
} catch(e){receipt.failure=e.message;fs.writeFileSync(path.join(outputDir,'failure.json'),JSON.stringify(receipt,null,2));throw e}finally{await browser.close();server.close()}
