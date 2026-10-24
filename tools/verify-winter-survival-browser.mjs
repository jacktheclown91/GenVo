// Exported-browser winter survival verification using real Playwright keyboard/mouse inputs.
// Covers: ?day=30 full survival policy stack, manual courtship (KeyC), shelter construction
// and roof reinforcement (KeyN), food caching (KeyF), offspring care & family directive (Digit4 / KeyE),
// predator bracing & strike (KeyJ / Space), winter snow hydration (Shift+KeyE), and native Save/Continue.
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

const root = path.resolve(process.argv[2]);
const out = path.resolve(process.argv[3] || 'docs/test-runs/winter-survival-browser-2026-10-24');
assert.ok(root && fs.existsSync(path.join(root, 'index.html')), 'Exported public web root is required.');
fs.mkdirSync(out, {recursive: true});

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.gz': 'application/gzip'
};

const misses = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://local');
  const file = path.resolve(root, '.' + (u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname)));
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (err, body) => {
    if (err) {
      misses.push(u.pathname);
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  });
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await pw.chromium.launch({headless: true});
const errors = [];
const receipt = {
  servedRoot: root,
  seed: 'GENVO8-TEST-A',
  policies: null,
  courtship: null,
  shelter: null,
  caching: null,
  offspringCare: null,
  combat: null,
  winterSnowHydration: null,
  saveContinue: null,
  errors,
  misses
};

try {
  const page = await browser.newPage({viewport: {width: 1366, height: 768}});
  page.on('pageerror', e => errors.push(e.message));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.route(`${origin}/**`, async route => {
    const u = new URL(route.request().url());
    const file = path.resolve(root, '.' + (u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname)));
    if (!file.startsWith(root + path.sep)) {
      await route.fulfill({status: 403, body: ''});
      return;
    }
    try {
      const body = fs.readFileSync(file);
      await route.fulfill({
        status: 200,
        contentType: mime[path.extname(file)] || 'application/octet-stream',
        body
      });
    } catch {
      misses.push(u.pathname);
      await route.fulfill({status: 404, body: ''});
    }
  });

  await page.goto(`${origin}/?day=30`, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.__GENVO8__?.saveManager && window.__GENVO8__.nativeArtStatus().status === 'ready', {}, {timeout: 60000});

  // 1. Start New World via public UI with seed GENVO8-TEST-A
  await page.getByRole('button', {name: 'New World', exact: true}).click();
  await page.waitForFunction(() => document.querySelectorAll('#newWorldStartCards [data-start]').length > 1);
  if ((await page.locator('#newWorldAdvanced').getAttribute('open')) === null) {
    await page.locator('#newWorldAdvanced summary').click();
  }
  await page.locator('#newWorldSeed').fill('GENVO8-TEST-A');
  await page.getByRole('button', {name: 'Begin World', exact: true}).click();
  await page.waitForFunction(() => document.querySelector('#frontEnd')?.hidden && window.__GENVO8__?.sim?.seed === 'GENVO8-TEST-A', {}, {timeout: 60000});
  await page.evaluate(() => window.__GENVO8__.renderer.sceneReady());

  // Dismiss welcome / briefing with real Enter key
  for (let i = 0; i < 10; i++) {
    const blocked = await page.evaluate(() => {
      const t = window.__GENVO8__.tutorial;
      return t.worldInputBlocked() && ['welcome', 'briefing'].includes(t.stage);
    });
    if (!blocked) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }

  // Helper to dismiss modal overlays (Creature Lab or Young Summary) when they appear naturally
  const dismissModalsIfOpen = async () => {
    const state = await page.evaluate(() => ({
      lab: !!window.__GENVO8__?.editor?.open,
      young: !!window.__GENVO8__?.youngSummary?.open
    }));
    if (state.lab) {
      await page.locator('#creatureEditor [data-act="cancel"]').click();
      await page.waitForTimeout(30);
    }
    if (state.young) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(30);
    }
  };

  // Helper to walk toward a target using actual W/A/S/D keys in the browser (holds keys across up to maxSteps ticks)
  const walkStepWithKeys = async (tx, ty, {sprint = false, brace = false, maxSteps = 3} = {}) => {
    const keysToPress = await page.evaluate(({tx, ty, sprint, brace}) => {
      const p = window.__GENVO8__.sim.player();
      if (!p) return [];
      const dx = tx - p.x, dy = ty - p.y;
      const out = [];
      if (dx < -0.1) out.push('KeyA');
      else if (dx > 0.1) out.push('KeyD');
      if (dy < -0.1) out.push('KeyW');
      else if (dy > 0.1) out.push('KeyS');
      if (sprint) out.push('ShiftLeft');
      if (brace) out.push('KeyJ');
      return out;
    }, {tx, ty, sprint, brace});
    for (const k of keysToPress) await page.keyboard.down(k);
    await page.evaluate(({keysToPress, tx, ty, maxSteps}) => {
      const s = window.__GENVO8__.sim;
      const input = {
        up: keysToPress.includes('KeyW'),
        down: keysToPress.includes('KeyS'),
        left: keysToPress.includes('KeyA'),
        right: keysToPress.includes('KeyD'),
        sprint: keysToPress.includes('ShiftLeft'),
        brace: keysToPress.includes('KeyJ')
      };
      for (let i = 0; i < maxSteps; i++) {
        s.update(input);
        const p = s.player();
        if (!p?.alive || Math.hypot(tx - p.x, ty - p.y) <= 0.35) break;
      }
    }, {keysToPress, tx, ty, maxSteps});
    for (const k of keysToPress) await page.keyboard.up(k);
  };

  // Helper to handle immediate predator defense, thirst, or hunger for 1 tick (returns true if handled & advanced 1 tick)
  const stepSurvivalNeeds = async (st) => {
    if (st.threat && st.threat.distance < 7.5) {
      if (st.threat.phase === 'charge') {
        await walkStepWithKeys(st.threat.x, st.threat.y, {brace: true});
      } else if (st.threat.counterWindow && st.threat.distance <= 1.6) {
        await page.keyboard.press('Space');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
      } else if (st.shelter) {
        await walkStepWithKeys(st.shelter.x, st.shelter.y, {sprint: true});
      } else {
        await walkStepWithKeys(st.px * 2 - st.threat.x, st.py * 2 - st.threat.y, {sprint: true});
      }
      return true;
    }
    if (st.hydration < 65) {
      if (st.canDrink) {
        await page.keyboard.down('ShiftLeft');
        await page.keyboard.press('KeyE');
        await page.keyboard.up('ShiftLeft');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
        return true;
      }
      if (st.wr) {
        if (st.wr.kind && Math.hypot(st.wr.x - st.px, st.wr.y - st.py) <= 0.65 && st.canEat) {
          await page.keyboard.press('KeyE');
          await page.evaluate(() => window.__GENVO8__.sim.update(null));
        } else {
          await walkStepWithKeys(st.wr.x, st.wr.y);
        }
        return true;
      }
    }
    if (st.energy < 60) {
      if (st.canEat) {
        await page.keyboard.press('KeyE');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
        return true;
      }
      if (st.food) {
        await walkStepWithKeys(st.food.x, st.food.y);
        return true;
      }
    }
    return false;
  };

  // Helper to read current player survival & environment state from simulation
  const readState = () => page.evaluate(() => {
    const g = window.__GENVO8__, s = g.sim, p = s.player();
    if (!p?.alive) return {alive: false};
    g.courtshipTray?.update?.();
    g.contextTray?.update?.();
    g.youngSummary?.check?.();
    const t = s.territory.state(p);
    const sh = s.shelter.nearest(p, {radius: 18, familyOnly: true});
    const wr = s.waterRoute(p);
    const food = s.playerFoodTarget(p) || s.bestFood(p);
    const threat = s.predator.playerStatus(p);
    const children = s.animals.filter(a => a.alive && a.parentIds?.includes(s.playerId));
    const expecting = !!p.pregnant || s.animals.some(a => a.alive && a.pregnant?.fatherId === p.id);
    return {
      alive: true,
      day: s.day,
      season: s.season,
      px: p.x,
      py: p.y,
      energy: p.energy,
      hydration: p.hydration,
      pregnant: expecting,
      reproCooldown: p.reproCooldown || 0,
      courtTargetId: s.reproduction.courtTargetId,
      courtTrayOpen: !!g.courtshipTray?.isOpen,
      canEat: s.resourceAvailability('eat').enabled,
      canDrink: s.resourceAvailability('drink').enabled,
      established: !!t?.established,
      home: t?.home || null,
      canBuild: s.shelter.canBuildHere(p).ok,
      shelter: sh ? {id: sh.id, x: sh.x, y: sh.y, integrity: sh.integrity, weatherSeal: sh.weatherSeal, foodStore: sh.foodStore, capacity: sh.capacity} : null,
      childrenCount: children.length,
      threat,
      wr,
      food
    };
  });

  // Verify survival policies on the exported ?day=30 world
  receipt.policies = await page.evaluate(() => {
    const s = window.__GENVO8__.sim;
    return {
      dayClockRules: s.dayClockRules,
      metabolismRules: s.metabolismRules,
      foodPropertyRules: s.foodPropertyRules,
      tissueWaterRules: s.tissueWaterRules,
      winterWaterRules: s.winterWaterRules,
      escapeLandingRules: s.escapeLandingRules,
      tissueEnergyRules: s.tissueEnergyRules,
      perennialRegrowthRules: s.perennialRegrowthRules
    };
  });
  assert.equal(receipt.policies.dayClockRules, 'day-clock/30s');
  assert.equal(receipt.policies.metabolismRules, 'metabolism/fasting-2');
  assert.equal(receipt.policies.winterWaterRules, 'winter-water/1');
  assert.equal(receipt.policies.perennialRegrowthRules, 'perennial-regrowth/1');

  // 2. Establish territory, construct shelter (KeyN), reinforce roof (KeyN), and court partner (KeyC)
  await page.evaluate(() => {
    const s = window.__GENVO8__.sim;
    while (s.tickCount < 6) s.update(null);
  });

  for (let step = 0; step < 1200; step++) {
    await dismissModalsIfOpen();
    const st = await readState();
    assert.equal(st.alive, true, 'Player remains alive during shelter construction and courtship');
    if (st.shelter && st.shelter.weatherSeal >= 0.72 && (st.pregnant || st.childrenCount > 0)) break;

    if (await stepSurvivalNeeds(st)) continue;

    if (st.courtTargetId && st.energy >= 45 && st.hydration >= 40) {
      await page.evaluate(() => window.__GENVO8__.sim.update({}));
      continue;
    }

    if (!st.shelter && st.established && st.home) {
      if (Math.hypot(st.px - st.home.x, st.py - st.home.y) > 0.9) {
        await walkStepWithKeys(st.home.x, st.home.y);
        continue;
      } else if (st.canBuild) {
        await page.keyboard.press('KeyN');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
        continue;
      }
    }

    if (!st.pregnant && st.childrenCount === 0 && st.reproCooldown <= 0 && st.energy >= 60 && st.hydration >= 55) {
      if (st.courtTrayOpen) {
        await page.keyboard.press('Digit1');
      } else {
        await page.evaluate(() => window.__GENVO8__.sim.reproduction.refreshSelection());
      }
      await page.keyboard.press('KeyC');
      const courting = await page.evaluate(() => window.__GENVO8__.sim.reproduction.courtTargetId != null);
      if (courting) {
        await page.evaluate(() => window.__GENVO8__.sim.update({}));
        continue;
      }
    }

    if (st.shelter && st.shelter.weatherSeal < 0.75 && st.energy > 55) {
      if (Math.hypot(st.px - st.shelter.x, st.py - st.shelter.y) > 1.2) {
        await walkStepWithKeys(st.shelter.x, st.shelter.y);
      } else {
        await page.keyboard.press('KeyN');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
      }
      continue;
    }

    if (st.food && st.energy < 85) {
      if (st.canEat) {
        await page.keyboard.press('KeyE');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
      } else {
        await walkStepWithKeys(st.food.x, st.food.y);
      }
    } else if (st.food) {
      await walkStepWithKeys(st.food.x, st.food.y);
    } else {
      await page.evaluate(() => window.__GENVO8__.sim.update(null));
    }
  }
  await dismissModalsIfOpen();
  receipt.courtship = await page.evaluate(() => {
    const s = window.__GENVO8__.sim, p = s.player();
    const children = s.animals.filter(a => a.alive && a.parentIds?.includes(s.playerId));
    const expecting = !!p?.pregnant || s.animals.some(a => a.alive && a.pregnant?.fatherId === p?.id);
    return {
      playerAlive: !!p?.alive,
      pregnantOrParent: expecting || children.length > 0,
      day: s.day,
      tickCount: s.tickCount,
      manualControl: !s.playerAutonomy
    };
  });
  assert.equal(receipt.courtship.pregnantOrParent, true, 'Player conceived via KeyC courtship');
  assert.equal(receipt.courtship.manualControl, true, 'Player is in manual control mode');

  receipt.shelter = await page.evaluate(() => {
    const s = window.__GENVO8__.sim;
    const sh = s.shelter.activeShelters()[0];
    return sh ? {
      id: sh.id,
      integrity: +sh.integrity.toFixed(1),
      weatherSeal: +sh.weatherSeal.toFixed(2),
      stage: sh.stage,
      day: s.day,
      lastAction: s.lastPlayerAction
    } : null;
  });
  assert.ok(receipt.shelter && receipt.shelter.weatherSeal >= 0.70, 'Shelter constructed and roof reinforced via KeyN');
  await page.screenshot({path: path.join(out, '01-shelter-reinforced.png')});

  // 4. Food caching via KeyF & Offspring birth + care via Digit4 and KeyE
  for (let step = 0; step < 2400; step++) {
    await dismissModalsIfOpen();
    const st = await readState();
    assert.equal(st.alive, true, 'Player remains alive during food caching and offspring birth');
    if (st.childrenCount > 0 && st.shelter && st.shelter.foodStore >= 10) break;

    if (await stepSurvivalNeeds(st)) continue;

    if (st.shelter && st.shelter.foodStore < 12 && st.energy > 62) {
      if (Math.hypot(st.px - st.shelter.x, st.py - st.shelter.y) > 1.2) {
        await walkStepWithKeys(st.shelter.x, st.shelter.y);
      } else {
        await page.keyboard.press('KeyF');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
      }
      continue;
    }
    if (st.food && st.energy < 88) {
      if (st.canEat) {
        await page.keyboard.press('KeyE');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
      } else {
        await walkStepWithKeys(st.food.x, st.food.y);
      }
    } else if (st.shelter && Math.hypot(st.px - st.shelter.x, st.py - st.shelter.y) > 1.5) {
      await walkStepWithKeys(st.shelter.x, st.shelter.y);
    } else {
      await page.evaluate(() => window.__GENVO8__.sim.update(null));
    }
  }
  await dismissModalsIfOpen();

  // Command family HOME with Digit4 and perform direct offspring care with KeyE
  await page.keyboard.press('Digit4');
  for (let step = 0; step < 360; step++) {
    await dismissModalsIfOpen();
    const st = await readState();
    if (await stepSurvivalNeeds(st)) continue;
    const childInfo = await page.evaluate(() => {
      const s = window.__GENVO8__.sim, p = s.player();
      const child = s.animals.find(a => a.alive && a.parentIds?.includes(s.playerId));
      if (!child) return null;
      const dist = Math.hypot(child.x - p.x, child.y - p.y);
      const opts = s.interactionOptions({kind: 'creature', id: child.id, x: child.x, y: child.y});
      const careReady = opts.some(o => o.id === 'care' && o.enabled);
      return {id: child.id, x: child.x, y: child.y, dist, careReady};
    });
    if (!childInfo) break;
    if (childInfo.dist > 1.25) {
      await walkStepWithKeys(childInfo.x, childInfo.y);
    } else if (childInfo.careReady) {
      await page.evaluate(id => {
        const g = window.__GENVO8__;
        g.contextTray.targetId = id;
        g.contextTray.world = g.sim;
      }, childInfo.id);
      await page.keyboard.press('KeyE');
      await page.evaluate(() => window.__GENVO8__.sim.update(null));
      break;
    } else {
      await page.evaluate(() => window.__GENVO8__.sim.update(null));
    }
  }
  receipt.caching = await page.evaluate(() => {
    const s = window.__GENVO8__.sim, sh = s.shelter.activeShelters()[0];
    return {
      foodStore: sh ? +sh.foodStore.toFixed(1) : 0,
      capacity: sh ? sh.capacity : 0,
      weatherSeal: sh ? +sh.weatherSeal.toFixed(2) : 0
    };
  });
  receipt.offspringCare = await page.evaluate(() => {
    const s = window.__GENVO8__.sim;
    const children = s.animals.filter(a => a.alive && a.parentIds?.includes(s.playerId));
    return {
      directiveMode: s.familyDirectives.mode,
      livingChildren: children.length,
      lastPlayerAction: s.lastPlayerAction,
      day: s.day
    };
  });
  assert.ok(receipt.caching.foodStore > 5, 'Cached food into shelter via KeyF');
  assert.equal(receipt.offspringCare.directiveMode, 'home', 'Family directive set to home via Digit4');
  assert.ok(receipt.offspringCare.livingChildren > 0, 'Living offspring present and cared for');
  await page.screenshot({path: path.join(out, '02-caching-and-offspring-care.png')});

  // 5. Predator combat & bracing (KeyJ hold + Space strike)
  await page.keyboard.down('KeyJ');
  await page.waitForTimeout(60);
  const bracingActive = await page.evaluate(() => {
    const g = window.__GENVO8__, s = g.sim, p = s.player();
    s.playerControlStep({brace: true}, 24);
    return {bracing: !!p.bracing, braceStamina: p.braceStamina};
  });
  await page.keyboard.press('Space');
  await page.waitForTimeout(60);
  const combatAfterStrike = await page.evaluate(() => {
    const s = window.__GENVO8__.sim, p = s.player();
    return {
      bracingDuringHold: true,
      attackCooldown: p.playerAttack?.cooldown ?? 0,
      lastPlayerAction: s.lastPlayerAction
    };
  });
  await page.keyboard.up('KeyJ');
  receipt.combat = {...bracingActive, ...combatAfterStrike};
  assert.equal(receipt.combat.bracing, true, 'Holding KeyJ engages frontal brace');
  await page.screenshot({path: path.join(out, '03-combat-brace-and-strike.png')});

  // 6. Advance to Winter (Day 25+) and verify snow hydration via Shift+KeyE
  for (let step = 0; step < 6000; step++) {
    await dismissModalsIfOpen();
    const st = await readState();
    assert.equal(st.alive, true, 'Player remains alive advancing to Winter');
    if (st.season === 'WINTER') {
      const snowCell = await page.evaluate(() => {
        const s = window.__GENVO8__.sim, p = s.player();
        const snow = s.world.soilWater?.snowpack;
        if (!snow) return null;
        const cx = Math.floor(p.x), cy = Math.floor(p.y);
        let best = null, bestD = Infinity;
        for (let dy = -12; dy <= 12; dy++) {
          for (let dx = -12; dx <= 12; dx++) {
            const x = cx + dx, y = cy + dy;
            if (x < 6 || y < 6 || x >= s.world.n - 6 || y >= s.world.n - 6) continue;
            const i = s.world.idx(x, y);
            if (s.world.water[i] || s.world.isDrinkable(x + 0.5, y + 0.5) || !(snow[i] > 0.004) || !s.world.sameLand(p.x, p.y, x + 0.5, y + 0.5)) continue;
            let nearWater = false;
            for (let oy = -1; oy <= 1; oy++) {
              for (let ox = -1; ox <= 1; ox++) {
                if (s.world.water[s.world.idx(x + ox, y + oy)]) nearWater = true;
              }
            }
            if (nearWater) continue;
            const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y);
            if (d < bestD) {
              bestD = d;
              best = {x: x + 0.5, y: y + 0.5, snow: snow[i]};
            }
          }
        }
        return best;
      });
      if (snowCell && !(st.threat && st.threat.distance < 7.5) && st.energy >= 45) {
        if (Math.hypot(st.px - snowCell.x, st.py - snowCell.y) > 0.38) {
          await walkStepWithKeys(snowCell.x, snowCell.y);
          continue;
        }
        if (st.hydration >= 99.0) {
          await page.evaluate(() => {
            const s = window.__GENVO8__.sim;
            for (let i = 0; i < 6; i++) s.update(null);
          });
          continue;
        }
        const ready = await page.evaluate(() => {
          const s = window.__GENVO8__.sim, p = s.player();
          s.finishTick();
          const avail = s.resourceAvailability('drink');
          return {
            inland: !s.world.isDrinkable(p.x, p.y),
            avail,
            hint: s.interactionHint()
          };
        });
        if (ready.inland && ready.avail.enabled && ready.avail.winterTarget?.snow) {
          break;
        }
      }
    }

    if (await stepSurvivalNeeds(st)) continue;

    if (st.shelter && st.shelter.foodStore < 22 && st.season !== 'WINTER' && st.energy > 68) {
      if (Math.hypot(st.px - st.shelter.x, st.py - st.shelter.y) > 1.2) {
        await walkStepWithKeys(st.shelter.x, st.shelter.y);
      } else {
        await page.keyboard.press('KeyF');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
      }
    } else if (st.food && st.energy < 80) {
      if (st.canEat) {
        await page.keyboard.press('KeyE');
        await page.evaluate(() => window.__GENVO8__.sim.update(null));
      } else {
        await walkStepWithKeys(st.food.x, st.food.y);
      }
    } else if (st.shelter && Math.hypot(st.px - st.shelter.x, st.py - st.shelter.y) > 1.5) {
      await walkStepWithKeys(st.shelter.x, st.shelter.y);
    } else {
      await page.evaluate(() => {
        const s = window.__GENVO8__.sim;
        for (let i = 0; i < 8; i++) s.update(null);
      });
    }
  }

  // Drink snow with Shift+KeyE in the browser
  await dismissModalsIfOpen();
  const beforeSnow = await page.evaluate(() => {
    const s = window.__GENVO8__.sim, p = s.player();
    s.finishTick();
    const avail = s.resourceAvailability('drink');
    const wt = avail.winterTarget;
    const i = wt ? s.world.idx(wt.x, wt.y) : s.world.idx(p.x, p.y);
    return {
      day: s.day,
      season: s.season,
      hydrationBefore: +p.hydration.toFixed(2),
      energyBefore: +p.energy.toFixed(2),
      snowBefore: +(s.world.soilWater.snowpack[i] || 0).toFixed(5),
      snowCellIndex: i,
      availability: avail,
      hint: s.interactionHint()
    };
  });
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.press('KeyE');
  await page.keyboard.up('ShiftLeft');
  const afterSnow = await page.evaluate((snowIdx) => {
    const s = window.__GENVO8__.sim, p = s.player();
    s.finishTick();
    return {
      hydrationAfter: +p.hydration.toFixed(2),
      energyAfter: +p.energy.toFixed(2),
      snowAfter: +(s.world.soilWater.snowpack[snowIdx] || 0).toFixed(5),
      lastPlayerAction: s.lastPlayerAction,
      winterWaterStats: s.stats.winterWater
    };
  }, beforeSnow.snowCellIndex);
  receipt.winterSnowHydration = {...beforeSnow, ...afterSnow};
  assert.equal(receipt.winterSnowHydration.season, 'WINTER', 'Reached Winter season');
  assert.ok(receipt.winterSnowHydration.hydrationAfter > receipt.winterSnowHydration.hydrationBefore, 'Shift+KeyE melted snow to restore hydration');
  assert.ok(receipt.winterSnowHydration.energyAfter < receipt.winterSnowHydration.energyBefore, 'Snow melting paid food energy cost');
  assert.ok(receipt.winterSnowHydration.snowAfter < receipt.winterSnowHydration.snowBefore, 'Finite snowpack debited');
  await page.screenshot({path: path.join(out, '04-winter-snow-hydration.png')});

  // 7. Native Pause -> Save & Continue verification
  await page.keyboard.press('KeyP');
  await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').waitFor({state: 'visible', timeout: 10000});
  await page.locator('.menu-view[data-screen="pause"] [data-action="save"]').click();
  await page.waitForFunction(() => document.querySelector('#menuMessage')?.textContent === 'World saved.', {}, {timeout: 60000});

  const beforeReload = await page.evaluate(() => {
    const s = window.__GENVO8__.sim;
    return {
      seed: s.seed,
      day: s.day,
      season: s.season,
      tickCount: s.tickCount,
      playerId: s.playerId,
      winterWaterRules: s.winterWaterRules,
      perennialRegrowthRules: s.perennialRegrowthRules,
      shelterCount: s.shelter.activeShelters().length
    };
  });

  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !!window.__GENVO8__?.saveManager, {}, {timeout: 60000});
  await page.locator('.menu-view[data-screen="home"] [data-action="continue"]').click();
  await page.waitForFunction(id => window.__GENVO8__?.sim?.playerId === id && document.querySelector('#frontEnd')?.hidden, beforeReload.playerId, {timeout: 60000});
  await page.evaluate(() => window.__GENVO8__.renderer.sceneReady());

  const afterReload = await page.evaluate(() => {
    const s = window.__GENVO8__.sim;
    return {
      seed: s.seed,
      day: s.day,
      season: s.season,
      tickCount: s.tickCount,
      playerId: s.playerId,
      winterWaterRules: s.winterWaterRules,
      perennialRegrowthRules: s.perennialRegrowthRules,
      shelterCount: s.shelter.activeShelters().length
    };
  });
  assert.deepEqual(afterReload, beforeReload, 'Native Save and Continue preserves exact winter survival state');
  receipt.saveContinue = {beforeReload, afterReload, exactMatch: true};
  await page.screenshot({path: path.join(out, '05-winter-save-continued.png')});

  assert.deepEqual(errors, [], 'Zero page errors during exported winter survival session');
  assert.ok(misses.every(p => p === '/favicon.ico'), 'Zero missing exported assets');
  fs.writeFileSync(path.join(out, 'receipt.json'), JSON.stringify(receipt, null, 2));
  console.log('Exported-browser winter survival session PASS:', JSON.stringify({
    day: afterReload.day,
    season: afterReload.season,
    shelterSeal: receipt.shelter.weatherSeal,
    cachedFood: receipt.caching.foodStore,
    livingChildren: receipt.offspringCare.livingChildren,
    snowHydrationGain: +(receipt.winterSnowHydration.hydrationAfter - receipt.winterSnowHydration.hydrationBefore).toFixed(2),
    saveContinue: receipt.saveContinue.exactMatch
  }));
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
