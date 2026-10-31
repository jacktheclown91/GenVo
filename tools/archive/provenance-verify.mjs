#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseArgs,
  readJson,
  readLedger,
  snapshotTree,
  verifyLedger
} from '../provenance-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = parseArgs(process.argv.slice(2));
const ledgerPath = path.join(root, 'provenance/ledger.jsonl');
const statePath = path.join(root, 'provenance/tree-state.json');
const releasePath = path.join(root, 'release-provenance.json');

const entries = readLedger(ledgerPath);
if (!entries.length) throw new Error('No provenance ledger entries found.');
const head = verifyLedger(entries);
const current = snapshotTree(root);
const state = readJson(statePath, null);
const release = readJson(releasePath, null);

const result = {
  ledger_entries: entries.length,
  ledger_head_sha256: head,
  current_source_tree_sha256: current.sha256,
  current_source_file_count: current.file_count,
  ledger_chain_ok: true,
  current_tree_matches_last_record: entries.at(-1)?.source_tree?.sha256 === current.sha256,
  state_matches_current_tree: state?.source_tree_sha256 === current.sha256,
  state_matches_ledger_head: state?.ledger_head_sha256 === head,
  release_manifest_present: Boolean(release),
  release_manifest_matches_current_source: release ? release.canonical_source_tree?.sha256 === current.sha256 : null,
  release_manifest_matches_ledger_head: release ? release.ledger?.head_sha256 === head : null
};

let distributionResult = null;
if (args.distribution) {
  const distribution = path.resolve(root, String(args.distribution));
  if (!fs.existsSync(distribution) || !fs.statSync(distribution).isDirectory()) throw new Error(`Distribution directory not found: ${distribution}`);
  const payload = snapshotTree(distribution, { excludeLedger: false, excludeState: false, excludeReleaseManifest: true });
  distributionResult = {
    path: distribution,
    payload_sha256: payload.sha256,
    payload_file_count: payload.file_count,
    matches_release_manifest: release ? release.distribution_payload?.sha256 === payload.sha256 : null
  };
  result.distribution = distributionResult;
}

console.log(JSON.stringify(result, null, 2));

const required = [
  result.ledger_chain_ok,
  result.current_tree_matches_last_record,
  result.state_matches_current_tree,
  result.state_matches_ledger_head
];
if (release) required.push(result.release_manifest_matches_current_source, result.release_manifest_matches_ledger_head);
if (distributionResult && release) required.push(distributionResult.matches_release_manifest);
if (required.some((value) => value !== true)) process.exit(1);
