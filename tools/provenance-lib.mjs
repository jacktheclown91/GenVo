import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SCHEMA_VERSION = 1;
export const TREE_HASH_ALGORITHM = 'sha256(sorted path\\0file_sha256\\n)';

const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '__pycache__']);
const EXCLUDED_FILES = new Set([
  'release-provenance.json',
  'provenance/ledger.jsonl',
  'provenance/tree-state.json'
]);

export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hashRecord(recordWithoutHash) {
  return sha256(Buffer.from(stableStringify(recordWithoutHash), 'utf8'));
}

function shouldExclude(rel, options = {}) {
  const parts = rel.split('/');
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) return true;
  // Top-level reports/ holds per-turn status reports for the creator; it is not part of the build.
  if (parts[0] === 'reports') return true;
  if (rel.endsWith('.pyc') || rel === '.DS_Store') return true;
  if (options.excludeReleaseManifest !== false && rel === 'release-provenance.json') return true;
  if (options.excludeLedger !== false && rel === 'provenance/ledger.jsonl') return true;
  if (options.excludeState !== false && rel === 'provenance/tree-state.json') return true;
  if (options.extraExcludes?.has(rel)) return true;
  return false;
}

export function listFiles(root, options = {}) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs).split(path.sep).join('/');
      if (shouldExclude(rel, options)) continue;
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile()) out.push(rel);
    }
  };
  walk(root);
  out.sort();
  return out;
}

export function snapshotTree(root, options = {}) {
  const files = {};
  for (const rel of listFiles(root, options)) {
    files[rel] = sha256(fs.readFileSync(path.join(root, rel)));
  }
  const rows = Object.entries(files).map(([rel, digest]) => `${rel}\0${digest}\n`).join('');
  return {
    algorithm: TREE_HASH_ALGORITHM,
    sha256: sha256(Buffer.from(rows, 'utf8')),
    file_count: Object.keys(files).length,
    files
  };
}

export function diffSnapshots(previous = {}, current = {}) {
  const paths = new Set([...Object.keys(previous), ...Object.keys(current)]);
  const added = [];
  const modified = [];
  const removed = [];
  for (const rel of [...paths].sort()) {
    if (!(rel in previous)) added.push(rel);
    else if (!(rel in current)) removed.push(rel);
    else if (previous[rel] !== current[rel]) modified.push(rel);
  }
  return { added, modified, removed };
}

export function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function readLedger(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`Invalid ledger JSON on line ${index + 1}: ${error.message}`); }
  });
}

export function appendLedger(file, record) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf8');
}

export function verifyLedger(entries) {
  let previous = null;
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const { record_hash, ...payload } = entry;
    const expected = hashRecord(payload);
    if (record_hash !== expected) {
      throw new Error(`Ledger record ${i + 1} hash mismatch: expected ${expected}, found ${record_hash}`);
    }
    if ((payload.previous_record_hash ?? null) !== previous) {
      throw new Error(`Ledger record ${i + 1} previous hash mismatch.`);
    }
    previous = record_hash;
  }
  return previous;
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      if (args[key] === undefined) args[key] = next;
      else if (Array.isArray(args[key])) args[key].push(next);
      else args[key] = [args[key], next];
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

export function asList(value) {
  if (value === undefined || value === null || value === false) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
}
