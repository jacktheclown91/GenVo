import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {FrameStepper} from '../src/sim/frame-stepper.js';
import {DAY_CLOCK, applyDayClock, dayTicksFor} from '../src/sim/day-clock.js';
import {createSimulationSnapshot, restoreSimulationSnapshot, restoreDetachedSimulationSnapshot} from '../src/persistence/save-manager.js';
import {withCanonicalSeedTables} from '../tools/canonical-seed-tables.mjs';
import {planetaryTravelAvailability, crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {stageRemoteBiology, highId} from '../src/world/planetary-offscreen-biology.js';

const fixturePath = new URL('./fixtures/interleaved-day-clock-original.json', import.meta.url);
const originalFingerprint = '7a0aa4649f3ccfd471da8294e956f4fef4f63d3022e781947f3ed73991597369';
const originalCommit = '01458fe9ddb82e27dd91615b56cd7e5c0b11eb9b';
const major = Number(process.versions.node.split('.')[0]);
assert.ok([22, 24].includes(major), 'Use a supported original-source engine variant');
const record = process.argv.includes('--record-original-controls');
assert.ok(process.argv.slice(2).every(arg => arg === '--record-original-controls'));
function runtimeFingerprint() {
  const root = fileURLToPath(new URL('../src/', import.meta.url)), files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else files.push(file);
    }
  }
  walk(root);
  const ordered = files.map(file => ({file, key: 'src/' + path.relative(root, file).replaceAll('\\', '/')})).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const hash = createHash('sha256');
  for (const {file, key} of ordered) hash.update(key).update(fs.readFileSync(file));
  return hash.digest('hex');
}
if (record) assert.equal(runtimeFingerprint(), originalFingerprint, 'Never record isolated expectations from corrected/refactored runtime; use the exact original checkout');
const snapshot = sim => withCanonicalSeedTables(structuredClone(createSimulationSnapshot(sim, {savedAt: 'fixed', reason: 'interleaved-day-clock'})));
// Same complete graph encoding as the protected modernization baseline, including
// aliases, cycles, maps, sets and typed-array types. No numeric tolerance.
function digest(value) {
  const seen = new Map();
  function encode(item) {
    if (!item || typeof item !== 'object') return item;
    if (seen.has(item)) return {$ref: seen.get(item)};
    seen.set(item, seen.size);
    if (ArrayBuffer.isView(item)) return {$type: item.constructor.name, data: Array.from(item)};
    if (item instanceof Map) return {$map: [...item].map(([key, val]) => [encode(key), encode(val)])};
    if (item instanceof Set) return {$set: [...item].map(encode)};
    if (Array.isArray(item)) return item.map(encode);
    return Object.fromEntries(Object.keys(item).sort().map(key => [key, encode(item[key])]));
  }
  return createHash('sha256').update(JSON.stringify(encode(value))).digest('hex');
}
const label = (modern, populated, tick) => `${populated ? 'animals' : 'empty'}/${modern ? 'modern' : 'legacy'}/${tick}`;
function make(modern, populated = false) {
  const sim = new Simulation(`CLOCK-ISOLATED-${modern ? 'MODERN' : 'LEGACY'}-${populated ? 'ANIMALS' : 'EMPTY'}`, {bootstrap: populated, player: populated, dayClock: modern, worldGenerator: 'freshwater/1'});
  if (populated) sim.setPlayerAutonomy(true);
  return sim;
}
const observations = [];
for (const populated of [false, true]) for (const modern of [false, true]) {
  const sim = make(modern, populated), limit = populated ? 48 : 240;
  for (let tick = 0; tick <= limit; tick++) {
    if ([0, 6, 48, 120, 240].includes(tick)) observations.push({label: label(modern, populated, tick), tick: sim.tickCount, day: sim.day, rng: sim.rng.state, sha256: digest(snapshot(sim))});
    if (tick < limit) sim.update(null);
  }
}
if (record) {
  const fixture = fs.existsSync(fixturePath) ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : {schema: 1, originalCommit, originalFingerprint, scope: 'Independent original-source controls before any clock correction; exact per-engine graphs, never corrected interleaving outcomes.', engines: {}};
  assert.equal(fixture.originalFingerprint, originalFingerprint);
  fixture.engines[major] = {node: process.version, observations};
  fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n');
  console.log(`Original isolated clock controls captured from ${originalCommit} on Node ${major}.`);
  process.exit(0);
}
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
assert.deepEqual(observations, fixture.engines[major].observations, 'Isolated historical and modern outcomes must remain exactly original');
const expected = new Map(observations.map(row => [row.label, row]));
function matches(sim, modern, populated, tick, context) {
  const row = expected.get(label(modern, populated, tick));
  assert.equal(sim.tickCount, row.tick, context + ': tick');
  assert.equal(sim.day, row.day, context + ': calendar');
  assert.equal(sim.rng.state, row.rng, context + ': RNG');
  assert.equal(digest(snapshot(sim)), row.sha256, context + ': complete original state');
}

// Whole atomic ticks already reactivate their policy. Save each world while the
// other policy is current, then restore and continue in alternating order.
let legacy = make(false), modern = make(true);
assert.equal(dayTicksFor(legacy), 48); assert.equal(dayTicksFor(modern), 240);
for (let tick = 1; tick <= 120; tick++) {
  legacy.update(null); assert.equal(CFG.dayTicks, 48);
  modern.update(null); assert.equal(CFG.dayTicks, 240);
}
matches(legacy, false, false, 120, 'Alternating legacy');
matches(modern, true, false, 120, 'Alternating modern');
const legacySave = snapshot(legacy), modernSave = snapshot(modern);
assert.equal(Object.hasOwn(legacySave.core, 'dayClockRules'), false);
assert.equal(modernSave.core.dayClockRules, DAY_CLOCK.policy);
legacy = restoreSimulationSnapshot(legacySave); modern = restoreSimulationSnapshot(modernSave);
for (let tick = 121; tick <= 240; tick++) {
  if (tick % 2) { modern.update(null); legacy.update(null); }
  else { legacy.update(null); modern.update(null); }
}
matches(legacy, false, false, 240, 'Restored alternating legacy');
matches(modern, true, false, 240, 'Restored alternating modern');

// The real frame-facing slicing API: interleave two live iterators at every
// possible yield, keeping their real ticks and biological work unchanged.
for (const populated of [false, true]) {
  const worlds = [make(false, populated), make(true, populated)];
  for (let tick = 1; tick <= 48; tick++) {
    for (const sim of worlds) sim.beginTick(null, {}, -Infinity);
    while (worlds.some(sim => sim.tickInProgress)) for (const sim of worlds) if (sim.tickInProgress) sim.continueTick(-Infinity);
  }
  matches(worlds[0], false, populated, 48, 'Interleaved sliced legacy');
  matches(worlds[1], true, populated, 48, 'Interleaved sliced modern');
}
// Snapshot flushing and direct iterators must obey the same boundary, rather
// than fixing only the browser's continueTick convenience method.
for (const modernPolicy of [false, true]) for (const completion of ['save', 'direct']) {
  const sim = make(modernPolicy);
  for (let tick = 0; tick < 47; tick++) sim.update(null);
  let steps;
  if (completion === 'save') assert.equal(sim.beginTick(null, {}, -Infinity), false);
  else { steps = sim.updateSteps(null); assert.equal(steps.next().done, false); }
  const other = make(!modernPolicy); other.update(null);
  if (completion === 'save') snapshot(sim);
  else while (!steps.next().done) {}
  assert.equal(sim.tickInProgress, false);
  matches(sim, modernPolicy, false, 48, 'Interleaved ' + completion);
}

// A controlled real frontier crossing supplies genuine archived regions. Only
// border placement is staged; no animals, births, food or water are edited.
for (const modernPolicy of [false, true]) {
  const planet = new Simulation('PLANET-B0-A', {player: true, worldGenerator: 'planetary/1', dayClock: modernPolicy, regionalReplayPolicy: 'bounded-strides/1'});
  let found = false;
  for (let y = 8.5; y < 118.5 && !found; y++) {
    planet.player().x = 125.2; planet.player().y = y;
    found = planetaryTravelAvailability(planet).enabled;
  }
  assert.ok(found);
  const trip = crossPlanetaryBorder(planet); assert.equal(trip.ok, true, trip.message);
  const active = trip.simulation, region = active.planetaryTravel.sessions[0], ticks = dayTicksFor(region.snapshot.core), watermark = highId(active);
  assert.equal(ticks, modernPolicy ? 240 : 48);
  const other = make(!modernPolicy); other.update(null);
  assert.doesNotThrow(() => stageRemoteBiology(region, {tickCount: region.snapshot.core.tickCount, reservedNextId: watermark, maxTicks: ticks}), 'Archive policy owns the permitted background budget, regardless of the last constructed/advanced world');
  applyDayClock(other);
  assert.throws(() => stageRemoteBiology(region, {tickCount: region.snapshot.core.tickCount, reservedNextId: watermark, maxTicks: ticks + 1}), /Unbounded remote biological work/, 'Legacy background budget cannot borrow a modern world day');
  const reference = restoreDetachedSimulationSnapshot(structuredClone(region.snapshot));
  reference.nextId = Math.max(reference.nextId, watermark);
  for (let tick = 0; tick < CFG.lifeStride; tick++) reference.update(null, {externalPlayerControl: true});
  const targetTick = reference.tickCount;
  const unchanged = digest(region.snapshot);
  other.update(null);
  const staged = stageRemoteBiology(region, {tickCount: targetTick, reservedNextId: watermark, maxTicks: CFG.lifeStride});
  assert.equal(staged.result.ticks, CFG.lifeStride);
  assert.equal(staged.result.remaining, 0);
  assert.equal(digest(region.snapshot), unchanged, 'Staging cannot mutate the published archive');
  const expectedSnapshot = createSimulationSnapshot(reference, {reason: region.snapshot.reason, savedAt: region.snapshot.savedAt, ownedRegionalSeedMetadata: true});
  expectedSnapshot.meta = region.snapshot.meta; delete expectedSnapshot.regionalWorlds;
  assert.equal(digest(staged.candidate.snapshot), digest(expectedSnapshot), 'Actual background biology preserves complete canonical foreground state under either saved clock');
}

// Real 64-Hz control / 8-Hz ecology admission through the browser scheduler.
// Fixed diagnostic frames admit one tick; zero-time resumes finish its slices.
function scheduledWorld(modernPolicy) {
  const sim = make(modernPolicy, true); sim.setPlayerAutonomy(false);
  const stepper = new FrameStepper({controlHz: CFG.controlHz, simHz: CFG.simHz, budgetMs: 1e9, clock: () => 0});
  let controls = 0, distance = 0;
  return {
    sim, stepper,
    advance(seconds) {
      return stepper.advance(seconds, 1, () => {
        const player = sim.player(), x = player.x, y = player.y;
        const right = controls++ % (CFG.controlHz * 2) < CFG.controlHz;
        sim.playerControlStep({right, left: !right}, CFG.controlHz);
        distance += Math.hypot(player.x - x, player.y - y);
      }, () => sim.beginTick(null, {externalPlayerControl: true}, -Infinity), {resume: () => sim.continueTick(-Infinity)});
    },
    controls: () => controls,
    distance: () => distance
  };
}
const scheduledExpected = [];
for (const modernPolicy of [false, true]) {
  const world = scheduledWorld(modernPolicy);
  for (let tick = 0; tick < 48; tick++) {
    world.advance(1 / CFG.simHz);
    while (world.stepper.tickPending) world.advance(0);
  }
  scheduledExpected.push(digest(snapshot(world.sim)));
  assert.equal(world.controls(), 48 * CFG.controlHz / CFG.simHz);
  assert.ok(world.distance() > 0, 'The scheduler fixture must exercise real paid movement');
}
const scheduled = [scheduledWorld(false), scheduledWorld(true)];
for (let tick = 0; tick < 48; tick++) {
  for (const world of scheduled) world.advance(1 / CFG.simHz);
  while (scheduled.some(world => world.stepper.tickPending)) for (const world of scheduled) if (world.stepper.tickPending) world.advance(0);
}
scheduled.forEach((world, index) => {
  assert.equal(digest(snapshot(world.sim)), scheduledExpected[index], 'Interleaved FrameStepper keeps complete isolated control/biology state');
  assert.equal(world.controls(), 48 * CFG.controlHz / CFG.simHz);
  assert.ok(world.distance() > 0);
});

// Iterator cancellation/throw must reactivate the owner too, preserving native
// generator input, error and cleanup semantics. The original capture exits above.
const {clockScopedSteps} = await import('../src/sim/day-clock.js');
for (const modernPolicy of [false, true]) {
  const owner = modernPolicy ? {dayClockRules: DAY_CLOCK.policy} : {};
  const foreign = modernPolicy ? {} : {dayClockRules: DAY_CLOCK.policy};
  const ticks = dayTicksFor(owner), cleanup = [];
  function* body() {
    try {
      const input = yield CFG.dayTicks;
      yield {input, ticks: CFG.dayTicks};
    } catch (error) {
      yield {error, ticks: CFG.dayTicks};
    } finally {
      cleanup.push(CFG.dayTicks);
    }
  }
  const steps = clockScopedSteps(owner, body());
  assert.equal(steps[Symbol.iterator](), steps);
  applyDayClock(foreign); assert.deepEqual(steps.next(), {value: ticks, done: false});
  applyDayClock(foreign); assert.deepEqual(steps.next('input'), {value: {input: 'input', ticks}, done: false});
  const failure = Error('clock iterator throw');
  applyDayClock(foreign); assert.deepEqual(steps.throw(failure), {value: {error: failure, ticks}, done: false});
  applyDayClock(foreign); assert.deepEqual(steps.return('closed'), {value: 'closed', done: true});
  assert.deepEqual(cleanup, [ticks]);
}
assert.equal(CFG.simHz, 8); assert.equal(CFG.lifeStride, 6);
console.log('Interleaved clocks PASS: exact original isolated controls, alternating worlds, save/restore, sliced/direct resumes, snapshot flush, policy-owned regional biology, FrameStepper controls and iterator cleanup.');
