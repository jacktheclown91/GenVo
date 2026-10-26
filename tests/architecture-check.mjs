import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'genvo-architecture-'));
function write(file, text) {
  const target = path.join(temporary, file);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, text);
}
function check(expected) {
  const result = spawnSync(process.execPath, ['tools/architecture-check.mjs'], {cwd: temporary, encoding: 'utf8'});
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
try {
  for (const file of ['tools/architecture-check.mjs', 'tools/source-graph.mjs']) write(file, fs.readFileSync(path.join(root, file)));
  write('design/governance/architecture-baseline.json', JSON.stringify({cycles: [], presentationImports: []}));
  write('src/main.js', "import './sim/a.js';");
  write('src/sim/a.js', 'export const a = 1;');
  assert.equal(check(0).status, 'PASS');
  write('src/sim/a.js', "import './b.js'; export const a = 1;");
  write('src/sim/b.js', "import './a.js'; export const b = 2;");
  assert.ok(check(1).errors.some(error => error.startsWith('New or expanded cycle:')));
  write('design/governance/architecture-baseline.json', JSON.stringify({cycles: [['src/sim/a.js', 'src/sim/b.js']], presentationImports: []}));
  check(0);
  write('src/sim/b.js', "import './a.js'; import '../ui/view.js';");
  write('src/ui/view.js', 'export const view = 1;');
  assert.ok(check(1).errors.some(error => error.startsWith('New biological presentation dependency:')));
  write('src/sim/b.js', "import './a.js'; import './missing.js';");
  assert.ok(check(1).errors.some(error => error.startsWith('Missing:')));
  write('src/sim/b.js', "import('./missing.js');");
  assert.ok(check(1).errors.some(error => error.startsWith('Missing:')));
  write('src/sim/b.js', "export {a} from './a.js';");
  check(0);
  console.log('Architecture gate: accepts declared debt, rejects new cycles, presentation coupling and missing imports PASS');
} finally {
  // mkdtemp produced this exact isolated target; never traverse user source.
  assert.ok(path.basename(temporary).startsWith('genvo-architecture-'));
  assert.equal(path.dirname(temporary), os.tmpdir());
  fs.rmSync(temporary, {recursive: true, force: true});
}
