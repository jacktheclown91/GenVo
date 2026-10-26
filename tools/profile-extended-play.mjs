// tools/profile-extended-play.mjs
// Real-browser extended play performance profiling across four core scenarios:
// Scenario A: Fresh primitive planetary world (genuine gameplay & movement)
// Scenario B: Mature Day 30+ planetary world (high populations, winter ecology)
// Scenario C: Planetary traversal (controlled diagnostic fixture: position set to boundary seam to measure crossing cost & return continuity)
// Scenario D: Continued lineage (controlled diagnostic fixture: accelerated maturation fixture to measure Gen 2 successor gameplay & diagnostics audit)

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
let pw;
try {
  pw = require('playwright');
} catch {
  pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}

const root = path.resolve('.');
const reportPath = path.resolve('reports/extended-play-profile.json');

const mime = {
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.gz': 'application/gzip',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
  fs.readFile(target, (error, bytes) => {
    if (error) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    res.end(bytes);
  });
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + server.address().port + '/';
console.log('Test HTTP server listening at', origin);

const browser = await pw.chromium.launch({
  headless: true,
  args: ['--autoplay-policy=user-gesture-required']
});

const report = {
  timestamp: new Date().toISOString(),
  environment: {
    browser: 'Chromium headless',
    origin
  },
  scenarios: {}
};

try {
  const context = await browser.newContext({viewport: {width: 1280, height: 720}});
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error') console.error('Browser console error:', m.text());
  });

  console.log('Navigating to', origin);
  await page.goto(origin);
  await page.waitForFunction(() => !!window.__GENVO8__?.saveManager, {}, {timeout: 60000});

  // --- SCENARIO A: Fresh Primitive World ---
  console.log('\n--- PROFILING SCENARIO A: Fresh Primitive World ---');
  await page.locator('.menu-view[data-screen="home"] [data-screen-target="new"]').click();
  await page.locator('#newWorldSeed').fill('PLANET-PROFILE-A');
  await page.locator('#newWorldName').fill('Profiling World A');
  await page.locator('#newWorldCreature').selectOption('starter-jump');
  await page.locator('.menu-view[data-screen="new"] [data-action="create"]').click();

  await page.waitForFunction(() => document.querySelector('#frontEnd')?.hidden && !!window.__GENVO8__.sim.climate, {}, {timeout: 90000});
  await page.evaluate(() => window.__GENVO8__.renderer.sceneReady());
  await page.waitForTimeout(1000);

  // Setup frame recording hook
  await page.evaluate(() => {
    window.__frameTimes = [];
    window.__simTimes = [];
    let prev = performance.now();
    window.__recordFrame = (now) => {
      window.__frameTimes.push(now - prev);
      prev = now;
      if (window.__recordFrameActive) requestAnimationFrame(window.__recordFrame);
    };
  });

  // Start recording Scenario A frames for 10s while moving
  await page.evaluate(() => {
    window.__frameTimes = [];
    window.__recordFrameActive = true;
    requestAnimationFrame(window.__recordFrame);
  });

  const keys = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
  const startA = Date.now();
  let kIdx = 0;
  while (Date.now() - startA < 10000) {
    const key = keys[kIdx++ % 4];
    await page.keyboard.down(key);
    await page.waitForTimeout(1000);
    await page.keyboard.up(key);
  }

  await page.evaluate(() => { window.__recordFrameActive = false; });
  const framesA = await page.evaluate(() => {
    const f = window.__frameTimes.slice(5); // drop warm-up
    f.sort((a, b) => a - b);
    const q = p => +(f[Math.floor(p * (f.length - 1))] || 0).toFixed(2);
    return {
      count: f.length,
      medianMs: q(0.5),
      p95Ms: q(0.95),
      p99Ms: q(0.99),
      maxMs: +(f.at(-1) || 0).toFixed(2),
      over50ms: f.filter(x => x > 50).length,
      over100ms: f.filter(x => x > 100).length
    };
  });

  const diagA = await page.evaluate(() => window.__GENVO8__.diagnostics?.getSummary() || null);
  report.scenarios.scenarioA_freshPrimitive = {
    ...framesA,
    fps: +(framesA.count / 10).toFixed(1),
    diagnostics: diagA
  };
  console.log('Scenario A Results:', JSON.stringify(report.scenarios.scenarioA_freshPrimitive, null, 2));

  // --- SCENARIO D: Continued Lineage & Succession (Controlled Diagnostic Fixture) ---
  console.log('\n--- PROFILING SCENARIO D: Continued Lineage & Gen 2 Succession (Controlled Diagnostic Fixture) ---');
  const successionResult = await page.evaluate(async () => {
    const s = window.__GENVO8__.sim;
    const founder = s.player();
    founder.age = 30;
    founder.energy = 100;
    founder.hydration = 100;

    // Find starter companion
    const mate = s.animals.find(a => a.id === s.starterMateId && a.alive) ||
                 s.animals.find(a => a.alive && a.species === founder.species && a.id !== founder.id && a.sex !== founder.sex);
    if (!mate) return {ok: false, reason: 'no companion'};
    mate.age = 30;
    mate.energy = 100;
    mate.hydration = 100;
    mate.x = founder.x + 0.8;
    mate.y = founder.y + 0.5;
    s.rebuildSpatial();

    let mated = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      s.reproduction.selectMate(mate.id);
      s.reproduction.courtSelected();
      founder.reproCooldown = 0;
      mate.reproCooldown = 0;
      mated = s.tryMate(founder, mate);
      if (mated) break;
    }
    const mother = founder.sex === 'F' ? founder : mate;
    if (!mother.pregnant) return {ok: false, reason: 'conception roll missed'};

    // Gestate offspring and incubate eggs until born
    const ticksPerDay = window.__GENVO8__.CFG.dayTicks || 240;
    let daysRun = 0;
    while ((mother.pregnant || (s.eggs && s.eggs.length > 0)) && daysRun < 35) {
      founder.energy = 100; founder.hydration = 100;
      mate.energy = 100; mate.hydration = 100;
      if (s.eggs) s.eggs.forEach(e => { e.condition = 1; e.hydration = 50; e.energy = 50; });
      for (let t = 0; t < ticksPerDay; t++) s.update(null);
      daysRun++;
    }

    // Find born Gen 2 offspring
    const gen2 = s.animals.find(a => a.alive && a.generation === 2);
    if (!gen2) return {
      ok: false,
      reason: 'offspring not born',
      day: s.day,
      daysRun,
      eggs: s.eggs?.length,
      motherPregnant: mother.pregnant,
      motherAlive: mother.alive,
      founderAlive: founder.alive,
      animals: s.animals.filter(a => a.species === 'genvo').map(a => ({id: a.id, gen: a.generation, alive: a.alive, age: a.age}))
    };

    // Mature Gen 2 to age 30
    gen2.age = 30;
    gen2.energy = 100;
    gen2.hydration = 100;
    s.rebuildSpatial();
    s.lineage.refreshSelection();

    // Execute succession handoff
    const handoffOk = s.lineage.handoffTo(gen2.id, {manual: true});
    const newPlayer = s.player();

    // Record in diagnostics
    window.__GENVO8__.diagnostics?.recordBirth(gen2, [founder, mate]);
    window.__GENVO8__.diagnostics?.recordHandoff({generation: gen2.generation, to: gen2.id});

    return {
      ok: true,
      handoffOk,
      newPlayerId: newPlayer?.id,
      generation: newPlayer?.generation,
      ancestry: s.lineage.ancestryPath(newPlayer?.id)
    };
  });
  console.log('Succession result:', successionResult);
  assert.equal(successionResult.ok, true, 'Gen 2 succession succeeded in browser');
  assert.equal(successionResult.generation, 2, 'Player is now Generation 2');

  // Record 10s of Gen 2 active gameplay
  await page.evaluate(() => {
    window.__frameTimes = [];
    window.__recordFrameActive = true;
    requestAnimationFrame(window.__recordFrame);
  });

  const startD = Date.now();
  let kIdxD = 0;
  while (Date.now() - startD < 10000) {
    const key = keys[kIdxD++ % 4];
    await page.keyboard.down(key);
    await page.waitForTimeout(1000);
    await page.keyboard.up(key);
  }

  await page.evaluate(() => { window.__recordFrameActive = false; });
  const framesD = await page.evaluate(() => {
    const f = window.__frameTimes.slice(5);
    f.sort((a, b) => a - b);
    const q = p => +(f[Math.floor(p * (f.length - 1))] || 0).toFixed(2);
    return {
      count: f.length,
      medianMs: q(0.5),
      p95Ms: q(0.95),
      p99Ms: q(0.99),
      maxMs: +(f.at(-1) || 0).toFixed(2),
      over50ms: f.filter(x => x > 50).length,
      over100ms: f.filter(x => x > 100).length
    };
  });

  report.scenarios.scenarioD_continuedLineage = {
    ...framesD,
    fps: +(framesD.count / 10).toFixed(1),
    succession: successionResult
  };
  console.log('Scenario D Results:', JSON.stringify(report.scenarios.scenarioD_continuedLineage, null, 2));

  // --- SCENARIO B: Mature Day 30+ World ---
  console.log('\n--- PROFILING SCENARIO B: Mature Day 30+ World ---');
  // Fast forward simulation to Day 30 (winter, mature wildlife)
  console.log('Advancing simulation to Day 30...');
  const matureMeta = await page.evaluate(() => {
    const sim = window.__GENVO8__.sim;
    const targetDay = 30;
    while (sim.day < targetDay) {
      sim.advanceDay();
      const p = sim.player();
      if (p) {
        p.energy = Math.max(p.energy, 80);
        p.hydration = Math.max(p.hydration, 80);
      }
    }
    sim.phaseClimate();
    return {
      day: sim.day,
      year: sim.year,
      season: sim.season,
      temp: +sim.climate.temp.toFixed(2),
      livingAnimals: sim.animals.filter(a => a.alive).length,
      populations: sim.population()
    };
  });
  console.log('Advanced to Day 30:', matureMeta);

  // Profile 10 seconds of mature world active play under autonomy
  await page.evaluate(() => {
    window.__GENVO8__.sim.setPlayerAutonomy(true);
    window.__frameTimes = [];
    window.__recordFrameActive = true;
    requestAnimationFrame(window.__recordFrame);
  });
  await page.waitForTimeout(10000);
  await page.evaluate(() => {
    window.__recordFrameActive = false;
    window.__GENVO8__.sim.setPlayerAutonomy(false);
  });

  const framesB = await page.evaluate(() => {
    const f = window.__frameTimes.slice(5);
    f.sort((a, b) => a - b);
    const q = p => +(f[Math.floor(p * (f.length - 1))] || 0).toFixed(2);
    return {
      count: f.length,
      medianMs: q(0.5),
      p95Ms: q(0.95),
      p99Ms: q(0.99),
      maxMs: +(f.at(-1) || 0).toFixed(2),
      over50ms: f.filter(x => x > 50).length,
      over100ms: f.filter(x => x > 100).length
    };
  });

  report.scenarios.scenarioB_matureDay30 = {
    ...framesB,
    fps: +(framesB.count / 10).toFixed(1),
    worldMeta: matureMeta
  };
  console.log('Scenario B Results:', JSON.stringify(report.scenarios.scenarioB_matureDay30, null, 2));

  // --- SCENARIO C: Planetary Traversal (Controlled Diagnostic Fixture) ---
  console.log('\n--- PROFILING SCENARIO C: Planetary Traversal & Seam Crossing (Controlled Diagnostic Fixture) ---');
  // Cross to region 128, 0 using planetaryTravel
  const traversalResult = await page.evaluate(async () => {
    const g = window.__GENVO8__;
    const s = g.sim;
    const p = s.player();
    if (!p) return {ok: false, reason: 'no player'};
    p.energy = 100;
    p.hydration = 100;
    p.torpor = false;
    p.aerialMode = null;
    p.diveDepth = 0;
    p.underground = false;
    p.caveTransit = false;
    p.burrowWork = false;
    p.perched = false;
    s.paused = false;
    s.playerAutonomy = false;
    const {planetaryTravelAvailability, crossPlanetaryBorder} = await import('/src/world/planetary-travel.js');

    const debugReasons = [];
    // Place at east frontier seam (x = 128 under physicalFrontier)
    for (const x of [128, 127.5, 127, 126.5, 126]) {
      for (let y = 10; y < 118; y += 1) {
        if (s.canOccupy(p, x, y)) {
          p.x = x;
          p.y = y;
          const av = planetaryTravelAvailability(s);
          if (av.enabled && av.direction === 'east') {
            const beforeOrigin = {...s.world.regionOrigin};
            const t0 = performance.now();
            const res = crossPlanetaryBorder(s);
            const crossMs = performance.now() - t0;
            if (res.ok) {
              g.installSimulation(res.simulation, {resume: true, regionalCrossing: true});
              g.diagnostics?.recordRegion('128,0');
              return {
                ok: true,
                crossMs: +crossMs.toFixed(2),
                beforeOrigin,
                afterOrigin: {...res.simulation.world.regionOrigin},
                playerId: res.simulation.player().id,
                storedSessions: res.simulation.planetaryTravel.sessions.map(sess => sess.key)
              };
            } else {
              debugReasons.push('crossFailed: ' + res.message);
            }
          } else {
            if (debugReasons.length < 5) debugReasons.push(av.reason);
          }
        }
      }
    }
    return {ok: false, reason: 'frontier not reached', debugReasons, playerState: {alive: p.alive, x: p.x, y: p.y, energy: p.energy, hydration: p.hydration, torpor: p.torpor, aerial: p.aerialMode}};
  });
  console.log('Traversal result:', traversalResult);
  assert.equal(traversalResult.ok, true, 'Frontier crossing succeeded in browser');

  // Record 5s frame pacing in the newly entered region
  await page.evaluate(() => {
    window.__frameTimes = [];
    window.__recordFrameActive = true;
    requestAnimationFrame(window.__recordFrame);
  });
  await page.waitForTimeout(5000);
  await page.evaluate(() => { window.__recordFrameActive = false; });

  const framesC = await page.evaluate(() => {
    const f = window.__frameTimes.slice(5);
    f.sort((a, b) => a - b);
    const q = p => +(f[Math.floor(p * (f.length - 1))] || 0).toFixed(2);
    return {
      count: f.length,
      medianMs: q(0.5),
      p95Ms: q(0.95),
      p99Ms: q(0.99),
      maxMs: +(f.at(-1) || 0).toFixed(2),
      over50ms: f.filter(x => x > 50).length,
      over100ms: f.filter(x => x > 100).length
    };
  });

  report.scenarios.scenarioC_planetaryTraversal = {
    ...framesC,
    fps: +(framesC.count / 5).toFixed(1),
    traversal: traversalResult
  };
  console.log('Scenario C Results:', JSON.stringify(report.scenarios.scenarioC_planetaryTraversal, null, 2));

  // Return crossing back to 0,0 to restore home territory
  console.log('Returning back to home region 0,0...');
  const returnResult = await page.evaluate(async () => {
    const g = window.__GENVO8__;
    const s = g.sim;
    const p = s.player();
    p.energy = 100;
    p.hydration = 100;
    p.torpor = false;
    p.aerialMode = null;
    p.diveDepth = 0;
    p.underground = false;
    p.caveTransit = false;
    p.burrowWork = false;
    p.perched = false;
    s.paused = false;
    s.playerAutonomy = false;
    const {planetaryTravelAvailability, crossPlanetaryBorder} = await import('/src/world/planetary-travel.js');

    for (const x of [0, 0.5, 1, 1.5, 2]) {
      for (let y = 10; y < 118; y += 1) {
        if (s.canOccupy(p, x, y)) {
          p.x = x;
          p.y = y;
          const av = planetaryTravelAvailability(s);
          if (av.enabled && av.direction === 'west') {
            const res = crossPlanetaryBorder(s);
            if (res.ok) {
              g.installSimulation(res.simulation, {resume: true, regionalCrossing: true});
              return {ok: true, afterOrigin: {...res.simulation.world.regionOrigin}};
            }
          }
        }
      }
    }
    return {ok: false, reason: 'return frontier not reached'};
  });
  console.log('Return result:', returnResult);
  assert.equal(returnResult.ok, true, 'Return frontier crossing succeeded');

  const finalDiag = await page.evaluate(() => window.__GENVO8__.diagnostics?.getSummary() || null);
  report.finalDiagnostics = finalDiag;
  console.log('\nFinal Playtest Diagnostics Summary:', JSON.stringify(finalDiag, null, 2));

  report.pageErrors = pageErrors;
  assert.deepEqual(pageErrors, [], 'No uncaught browser page errors during extended play profiling');

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n=== EXTENDED PLAY PROFILING COMPLETE ===`);
  console.log(`Report successfully written to ${reportPath}`);
} finally {
  await browser.close();
  server.close();
}
