// Unprofiled canonical tick timing, memory/GC and snapshot costs on an immutable
// catalogued ecosystem. Optional allocation sampling is a separate instrumented
// run, never used as the unprofiled throughput result. No biology intervention.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import inspector from 'node:inspector';
import {createHash} from 'node:crypto';
import {serialize} from 'node:v8';
import {PerformanceObserver} from 'node:perf_hooks';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {sourceGraph} from '../source-graph.mjs';
import {snapshotSignature} from '../snapshot-signature.mjs';

const args = process.argv.slice(2), allocations = args.includes('--allocations');
const positional = args.filter(arg => arg !== '--allocations');
const [input, output, sourceArg = 'src', stepsArg = '96', snapshotOutput] = positional;
const steps = Number(stepsArg);
if (!input || !output || positional.length > 5 || !Number.isSafeInteger(steps) || steps < 1 || steps > 4800) throw Error('Use scenario.gz output.json source/src 1..4800 [snapshot.v8] [--allocations]');
if (typeof global.gc !== 'function') throw Error('Use node --expose-gc for comparable retained-memory measurements.');
if (fs.existsSync(output) || snapshotOutput && fs.existsSync(snapshotOutput)) throw Error('Preserve existing receipts; use new output paths.');
const root = fileURLToPath(new URL('../../', import.meta.url));
const source = path.resolve(sourceArg), runtimeRoot = path.dirname(source);
const {reachable, missing} = sourceGraph(runtimeRoot);
if (missing.length) throw Error('Measurement source has missing runtime dependencies.');
const hash = createHash('sha256');
const runtimeFiles = [...reachable].filter(file => file.startsWith('src/')).sort();
for (const file of runtimeFiles) hash.update(file).update(fs.readFileSync(path.join(runtimeRoot, file)));
const sourceFingerprint = hash.digest('hex');
const {openScenarioSnapshot} = await import(pathToFileURL(path.join(source, 'persistence/scenario-library.js')).href);
const {restoreSimulationSnapshot, createSimulationSnapshot} = await import(pathToFileURL(path.join(source, 'persistence/save-manager.js')).href);
let compressed = fs.readFileSync(input);
const inputSha256 = createHash('sha256').update(compressed).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/scenarios/catalog.json'), 'utf8'));
const entry = catalog.scenarios.find(row => row.sha256 === inputSha256);
if (!entry) throw Error('Use an exact immutable catalogued checkpoint.');
const decodeStart = performance.now();
let checkpoint = openScenarioSnapshot(JSON.parse(zlib.gunzipSync(compressed)));
const decodeMs = performance.now() - decodeStart;
const restoreStart = performance.now(), sim = restoreSimulationSnapshot(checkpoint);
const restoreMs = performance.now() - restoreStart;
checkpoint = null; compressed = null;
global.gc();
const afterRestore = process.memoryUsage();
const start = {tick: sim.tickCount, day: sim.day, live: sim.animals.filter(animal => animal.alive).length, clock: sim.dayClockRules ?? 'legacy/6s', regions: sim.planetaryTravel?.sessions?.length ?? 0};
const pauses = [];
const observer = new PerformanceObserver(list => {
  for (const event of list.getEntries()) pauses.push({start: event.startTime, duration: event.duration, kind: event.detail.kind});
});
observer.observe({entryTypes: ['gc']});
let session, allocationProfile;
const post = (method, params = {}) => new Promise((resolve, reject) => session.post(method, params, (error, result) => error ? reject(error) : resolve(result)));
if (allocations) {
  session = new inspector.Session(); session.connect();
  await post('HeapProfiler.enable');
  await post('HeapProfiler.startSampling', {samplingInterval: 32768, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true});
}
const times = [], tickStart = performance.now();
let peakHeapUsed = afterRestore.heapUsed, peakRss = afterRestore.rss, stopped = null;
for (let index = 0; index < steps; index++) {
  const beforeTick = sim.tickCount, before = performance.now();
  sim.update(null);
  const duration = performance.now() - before;
  if (sim.tickCount !== beforeTick + 1) { stopped = {index, beforeTick, afterTick: sim.tickCount, paused: sim.paused, playerAlive: sim.player()?.alive ?? null}; break; }
  times.push(duration);
  const memory = process.memoryUsage();
  peakHeapUsed = Math.max(peakHeapUsed, memory.heapUsed); peakRss = Math.max(peakRss, memory.rss);
}
const tickEnd = performance.now();
if (allocations) {
  allocationProfile = (await post('HeapProfiler.stopSampling')).profile;
  session.disconnect();
}
await new Promise(resolve => setImmediate(resolve));
const afterTicks = process.memoryUsage();
global.gc();
const retainedAfterTicks = process.memoryUsage();
const saveStart = performance.now();
let saved = createSimulationSnapshot(sim, {savedAt: 'fixed', reason: 'mature-workload'});
const captureMs = performance.now() - saveStart, encodeStart = performance.now();
let encoded = serialize(saved);
const encodeMs = performance.now() - encodeStart, snapshotBytes = encoded.length;
const v8EncodingSha256 = createHash('sha256').update(encoded).digest('hex');
const signatureStart = performance.now(), completeStateSha256 = snapshotSignature(saved), signatureMs = performance.now() - signatureStart;
if (snapshotOutput) fs.writeFileSync(snapshotOutput, encoded);
saved = null; encoded = null;
global.gc();
const retainedAfterSave = process.memoryUsage();
await new Promise(resolve => setImmediate(resolve));
observer.disconnect();
const tickGc = pauses.filter(row => row.start >= tickStart && row.start <= tickEnd);
const sorted = [...times].sort((a, b) => a - b), percentile = fraction => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] : null;
let allocationSummary = null;
if (allocationProfile) {
  const sites = new Map(); let estimatedBytes = 0;
  function visit(node) {
    estimatedBytes += node.selfSize;
    if (node.selfSize) {
      const key = `${node.callFrame.functionName || '(anonymous)'}@${node.callFrame.url}:${node.callFrame.lineNumber + 1}`;
      sites.set(key, (sites.get(key) || 0) + node.selfSize);
    }
    for (const child of node.children) visit(child);
  }
  visit(allocationProfile.head);
  allocationSummary = {scope: 'V8 sampled allocation estimates including collected objects; not an exact byte ledger. Instrumented run, separate from unprofiled timing.', interval: 32768, estimatedBytes, sites: [...sites].sort((a, b) => b[1] - a[1]).slice(0, 25)};
}
const report = {
  schema: 'genvo.mature-workload/2', node: process.version, scenario: entry.id, inputSha256, source, sourceFingerprint, runtimeFiles: runtimeFiles.length,
  instrumentation: allocations ? 'allocation-sampling' : 'unprofiled', requestedTicks: steps, measuredTicks: times.length, stopped, start,
  end: {tick: sim.tickCount, day: sim.day, live: sim.animals.filter(animal => animal.alive).length, rng: sim.rng.state, regions: sim.planetaryTravel?.sessions?.length ?? 0},
  decodeMs, restoreMs, totalTickMs: times.reduce((sum, value) => sum + value, 0), medianMs: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), worstTickMs: sorted.at(-1) ?? null,
  captureMs, v8EncodeMs: encodeMs, snapshotBytes, v8EncodingSha256, completeStateSha256, signatureMs,
  signatureScope: 'Canonical ordered snapshot data graph with exact scalar values and typed visible data; raw V8 storage bytes are reported separately and are not a deterministic-state proof.',
  memory: {afterRestore, afterTicks, retainedAfterTicks, retainedAfterSave, peakHeapUsed, peakRss, scope: 'Forced-GC retained heap/RSS around the real active simulation; fixture decode copies released. Legitimate ecology/cache growth is not automatically a leak.'},
  gcDuringTicks: {count: tickGc.length, pauseMs: tickGc.reduce((sum, row) => sum + row.duration, 0)}, allocationSummary, times,
  scope: 'Actual catalogued ecosystem and canonical update order, no organism/resource/clock edits. Snapshot capture and diagnostic V8 encoding timed separately; this is not IndexedDB latency or browser frame acceptance. Empirical tails depend on sample count.'
};
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({...report, times: undefined, allocationSummary: allocationSummary ? {...allocationSummary, sites: undefined} : null}, null, 2));
