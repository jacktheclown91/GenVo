#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import {
  SCHEMA_VERSION,
  appendLedger,
  asList,
  diffSnapshots,
  hashRecord,
  parseArgs,
  readJson,
  readLedger,
  snapshotTree,
  verifyLedger,
  writeJson
} from './provenance-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(root, 'provenance/ledger.jsonl');
const statePath = path.join(root, 'provenance/tree-state.json');
const decisionsPath = path.join(root, 'provenance/decision-map.json');
const releasePath = path.join(root, 'release-provenance.json');

function usage() {
  console.log('Use checkpoint with the record options to capture unfinished development honestly; it does not authorize release.');
  console.log(`Usage:\n  node tools/provenance-record.mjs baseline --version <version> [--baseline-root <dir> | --source-tree-sha <sha256>] [--summary <text>]\n  node tools/provenance-record.mjs record --version <version> --decision-id <id> --summary <text> [--subsystem <name>] [--verify <text>]\n  node tools/provenance-record.mjs release --version <version> --distribution <dir>\n  node tools/provenance-record.mjs archive --file <zip-or-build-file>`);
}

function now() { return new Date().toISOString(); }

function projectName() {
  return readJson(path.join(root, 'provenance/authorship-manifest.json'), {})?.project
    || readJson(decisionsPath, {})?.project
    || path.basename(root);
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
if (!command) { usage(); process.exit(2); }

const ledger = readLedger(ledgerPath);
if (ledger.length) verifyLedger(ledger);
const previousRecordHash = ledger.at(-1)?.record_hash ?? null;

if (command === 'baseline') {
  if (ledger.length) throw new Error('Baseline can only be created when the ledger is empty.');
  if (!args.version) throw new Error('baseline requires --version.');

  let baselineSnapshot = null;
  if (args['baseline-root']) {
    const baselineRoot = path.resolve(root, String(args['baseline-root']));
    if (!fs.existsSync(baselineRoot) || !fs.statSync(baselineRoot).isDirectory()) throw new Error(`Baseline root not found: ${baselineRoot}`);
    baselineSnapshot = snapshotTree(baselineRoot);
  } else if (!args['source-tree-sha']) {
    baselineSnapshot = snapshotTree(root);
  }

  const suppliedSha = args['source-tree-sha'] ? String(args['source-tree-sha']).toLowerCase() : null;
  if (suppliedSha && !/^[a-f0-9]{64}$/i.test(suppliedSha)) throw new Error('--source-tree-sha must be a SHA-256 hex digest.');
  if (baselineSnapshot && suppliedSha && baselineSnapshot.sha256 !== suppliedSha) throw new Error('The supplied --source-tree-sha does not match --baseline-root.');
  const baselineSha = suppliedSha || baselineSnapshot.sha256;

  const payload = {
    schema_version: SCHEMA_VERSION,
    record_type: 'pre_provenance_baseline',
    timestamp_utc: now(),
    project: projectName(),
    version: String(args.version),
    decision_ids: [],
    summary: String(args.summary || 'Formal provenance tracking begins here. Earlier development is intentionally not reconstructed into the ledger.'),
    affected_subsystems: ['project provenance'],
    changed_files: { added: [], modified: [], removed: [] },
    verification: ['Baseline source-tree SHA-256 captured from the canonical project state at provenance initialization.'],
    source_tree: {
      algorithm: baselineSnapshot?.algorithm || 'sha256(sorted path\\0file_sha256\\n)',
      sha256: baselineSha,
      file_count: baselineSnapshot?.file_count ?? null,
      scope_note: 'Pre-provenance canonical state. No retrospective authorship claims are inferred from this hash.'
    },
    previous_record_hash: null
  };
  const record = { ...payload, record_hash: hashRecord(payload) };
  appendLedger(ledgerPath, record);

  if (baselineSnapshot) {
    writeJson(statePath, {
      schema_version: SCHEMA_VERSION,
      project: projectName(),
      version: String(args.version),
      captured_at_utc: payload.timestamp_utc,
      ledger_head_sha256: record.record_hash,
      source_tree_sha256: baselineSnapshot.sha256,
      files: baselineSnapshot.files
    });
  } else {
    console.error('warning: baseline hash recorded without a per-file baseline snapshot; the first prospective record may need an explicitly prepared tree-state to auto-detect changes accurately.');
  }

  console.log(record.record_hash);
  process.exit(0);
}

if (command === 'record' || command === 'checkpoint') {
  if (!args.version || !args.summary) throw new Error('record requires --version and --summary.');
  const decisionIds = asList(args['decision-id']);
  const decisions = readJson(decisionsPath, { decisions: [] });
  const known = new Set((decisions.decisions || []).map((item) => item.id));
  for (const id of decisionIds) if (!known.has(id)) throw new Error(`Decision ID ${id} is not present in provenance/decision-map.json.`);

  const current = snapshotTree(root);
  const previousState = readJson(statePath, null);
  const changes = previousState?.files ? diffSnapshots(previousState.files, current.files) : {
    added: Object.keys(current.files).sort(), modified: [], removed: []
  };
  const payload = {
    schema_version: SCHEMA_VERSION,
    record_type: command === 'checkpoint' ? 'development_checkpoint' : 'stable_pass',
    timestamp_utc: now(),
    project: projectName(),
    version: String(args.version),
    decision_ids: decisionIds,
    summary: String(args.summary),
    affected_subsystems: asList(args.subsystem),
    changed_files: changes,
    verification: asList(args.verify),
    source_tree: {
      algorithm: current.algorithm,
      sha256: current.sha256,
      file_count: current.file_count
    },
    previous_record_hash: previousRecordHash
  };
  const record = { ...payload, record_hash: hashRecord(payload) };
  appendLedger(ledgerPath, record);
  writeJson(statePath, {
    schema_version: SCHEMA_VERSION,
    project: projectName(),
    version: String(args.version),
    captured_at_utc: payload.timestamp_utc,
    ledger_head_sha256: record.record_hash,
    source_tree_sha256: current.sha256,
    files: current.files
  });
  console.log(record.record_hash);
  process.exit(0);
}

if (command === 'archive') {
  if (!args.file) throw new Error('archive requires --file <path>.');
  const file = path.resolve(root, String(args.file));
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Archive/build file not found: ${file}`);
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const sidecar = `${file}.sha256`;
  fs.writeFileSync(sidecar, `${digest}  ${path.basename(file)}\n`, 'utf8');
  console.log(JSON.stringify({ file, sha256: digest, sidecar }, null, 2));
  process.exit(0);
}

if (command === 'release') {
  if (!args.version || !args.distribution) throw new Error('release requires --version and --distribution <dir>.');
  const distribution = path.resolve(root, String(args.distribution));
  if (!fs.existsSync(distribution) || !fs.statSync(distribution).isDirectory()) throw new Error(`Distribution directory not found: ${distribution}`);
  const entries = readLedger(ledgerPath);
  const head = verifyLedger(entries);
  if (!head) throw new Error('Cannot fingerprint a release with an empty ledger.');
  if (entries.at(-1)?.record_type !== 'stable_pass') throw new Error('Release requires an accepted stable pass; a development checkpoint is not release acceptance.');
  const source = snapshotTree(root);
  const payload = snapshotTree(distribution, { excludeLedger: false, excludeState: false, excludeReleaseManifest: true });
  const manifest = {
    schema_version: SCHEMA_VERSION,
    project: projectName(),
    version: String(args.version),
    generated_at_utc: now(),
    canonical_source_tree: {
      algorithm: source.algorithm,
      sha256: source.sha256,
      file_count: source.file_count,
      exclusions: ['provenance/ledger.jsonl', 'provenance/tree-state.json', 'release-provenance.json', 'reports/', '.git', 'node_modules', '__pycache__', '*.pyc']
    },
    distribution_payload: {
      algorithm: payload.algorithm,
      sha256: payload.sha256,
      file_count: payload.file_count,
      exclusions: ['release-provenance.json'],
      note: 'This hashes the exact unzipped distribution payload except this manifest, avoiding a circular self-hash.'
    },
    ledger: {
      entry_count: entries.length,
      head_sha256: head
    },
    archive_sha256: {
      value: null,
      note: 'The final ZIP byte hash is written as a sidecar after packaging because an archive cannot contain its own final SHA-256 without circularity.'
    },
    provenance_tracking: {
      baseline_version: entries[0]?.version ?? null,
      baseline_record_sha256: entries[0]?.record_hash ?? null
    }
  };
  writeJson(releasePath, manifest);
  writeJson(path.join(distribution, 'release-provenance.json'), manifest);
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}

usage();
process.exit(2);
