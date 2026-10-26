// Incremental architecture inventory. Uses the export/audit graph, not a second parser.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceGraph} from './source-graph.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {all, graph, missing} = sourceGraph(root);
// Tarjan strongly connected components; existing cycles are explicit debt.
let next = 0;
const indexes = new Map(), low = new Map(), stack = [], active = new Set(), cycles = [];
function visit(file) {
  indexes.set(file, next); low.set(file, next++); stack.push(file); active.add(file);
  for (const dependency of graph.get(file) || []) {
    if (!graph.has(dependency)) continue;
    if (!indexes.has(dependency)) { visit(dependency); low.set(file, Math.min(low.get(file), low.get(dependency))); }
    else if (active.has(dependency)) low.set(file, Math.min(low.get(file), indexes.get(dependency)));
  }
  if (low.get(file) !== indexes.get(file)) return;
  const component = []; let member;
  do { member = stack.pop(); active.delete(member); component.push(member); } while (member !== file);
  if (component.length > 1 || (graph.get(file) || []).includes(file)) cycles.push(component.sort());
}
for (const file of all) if (!indexes.has(file)) visit(file);
cycles.sort((a, b) => a[0].localeCompare(b[0]));
const presentationImports = all.flatMap(file => {
  if (!/^src\/(sim|ecology|lineage|reproduction|world|family|cognition|habitat|organisms)\//.test(file)) return [];
  return (graph.get(file) || []).filter(dep => /^src\/(render|ui)\//.test(dep)).map(dep => `${file} -> ${dep}`);
}).sort();
const largest = all.map(file => {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return {file, bytes: Buffer.byteLength(text), dependencies: new Set(graph.get(file)).size, longestLine: Math.max(...text.split(/\r?\n/).map(line => line.length))};
}).sort((a, b) => b.bytes - a.bytes).slice(0, 12);
const baselinePath = path.join(root, 'design/governance/architecture-baseline.json');
const observed = {cycles, presentationImports};
if (process.argv.includes('--record')) fs.writeFileSync(baselinePath, JSON.stringify(observed, null, 2) + '\n');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const allowed = new Set(baseline.cycles.map(c => JSON.stringify(c)));
const errors = [...missing.map(item => `Missing: ${item}`), ...cycles.filter(c => !allowed.has(JSON.stringify(c))).map(c => `New or expanded cycle: ${c.join(', ')}`), ...presentationImports.filter(item => !baseline.presentationImports.includes(item)).map(item => `New biological presentation dependency: ${item}`)];
console.log(JSON.stringify({status: errors.length ? 'FAIL' : 'PASS', sourceModules: all.length, cycles, presentationImports, largest, errors}, null, 2));
if (errors.length) process.exitCode = 1;
