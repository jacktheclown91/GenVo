import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readLedger,verifyLedger,snapshotTree} from '../tools/provenance-lib.mjs';

const root=fileURLToPath(new URL('..',import.meta.url)),parent=path.resolve(os.tmpdir());
const fixture=fs.mkdtempSync(path.join(parent,'genvo8-provenance-'));
try{
  fs.mkdirSync(path.join(fixture,'tools'));fs.mkdirSync(path.join(fixture,'provenance'));
  for(const file of ['provenance-record.mjs','provenance-lib.mjs'])fs.copyFileSync(path.join(root,'tools',file),path.join(fixture,'tools',file));
  fs.writeFileSync(path.join(fixture,'provenance/decision-map.json'),JSON.stringify({project:'checkpoint fixture',decisions:[{id:'FIXTURE'}]}));
  fs.writeFileSync(path.join(fixture,'provenance/authorship-manifest.json'),JSON.stringify({project:'checkpoint fixture'}));
  const run=args=>spawnSync(process.execPath,[path.join(fixture,'tools/provenance-record.mjs'),...args],{cwd:fixture,encoding:'utf8'});
  const baseline=run(['baseline','--version','1.05.0']);assert.equal(baseline.status,0,baseline.stderr);
  fs.writeFileSync(path.join(fixture,'unfinished.txt'),'unfinished source with remaining acceptance work');
  const checkpoint=run(['checkpoint','--version','1.60.2','--decision-id','FIXTURE','--summary','Unaccepted development fixture']);assert.equal(checkpoint.status,0,checkpoint.stderr);
  const ledger=readLedger(path.join(fixture,'provenance/ledger.jsonl'));
  assert.ok(verifyLedger(ledger));assert.equal(ledger.at(-1).record_type,'development_checkpoint');
  assert.equal(ledger.at(-1).source_tree.sha256,snapshotTree(fixture).sha256);
  const release=run(['release','--version','1.60.2','--distribution',fixture]);
  assert.notEqual(release.status,0);assert.match(release.stderr,/development checkpoint is not release acceptance/);
  assert.equal(fs.existsSync(path.join(fixture,'release-provenance.json')),false,'unfinished checkpoint cannot generate a release manifest');
}finally{
  const resolved=path.resolve(fixture);
  assert.equal(path.dirname(resolved),parent);assert.ok(path.basename(resolved).startsWith('genvo8-provenance-'));
  fs.rmSync(resolved,{recursive:true,force:true});
}
console.log('development checkpoints preserve provenance without granting release acceptance');
