import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, readLedger, snapshotTree, verifyLedger } from '../tools/provenance-lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const ledger = readLedger(path.join(root, 'provenance/ledger.jsonl'));
assert.ok(ledger.length >= 2, 'expected baseline plus at least one prospective stable-pass record');
const head = verifyLedger(ledger);
assert.equal(ledger[0].record_type, 'pre_provenance_baseline');
assert.equal(ledger[0].version, '1.05.0');
assert.match(ledger[0].summary, /Earlier development is intentionally not reconstructed/i);

const decisions = readJson(path.join(root, 'provenance/decision-map.json'));
assert.ok(decisions.decisions.some((decision) => decision.id === 'GEN-PROV-001'));
const manifest = readJson(path.join(root, 'provenance/authorship-manifest.json'));
assert.equal(manifest.formal_tracking_begins_with.status, 'pre-provenance baseline');

const current = snapshotTree(root);
assert.equal(ledger.at(-1).source_tree.sha256, current.sha256, 'last ledger record must fingerprint current canonical source tree');
const state = readJson(path.join(root, 'provenance/tree-state.json'));
assert.equal(state.source_tree_sha256, current.sha256);
assert.equal(state.ledger_head_sha256, head);
console.log(`provenance ok: ${ledger.length} records, head ${head.slice(0, 16)}...`);
