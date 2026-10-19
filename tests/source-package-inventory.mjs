import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
// Exercise the actual package selector against a disposable Git repository.
const result=spawnSync('python',['-c',String.raw`
import sys,tempfile,subprocess
from pathlib import Path
sys.path.insert(0,str(Path('tools').resolve()))
from source_package_inventory import source_files
with tempfile.TemporaryDirectory(prefix='genvo-inventory-') as tmp:
 r=Path(tmp)
 subprocess.run(['git','init','-q',str(r)],check=True)
 def put(name,text='fixture'):
  p=r/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
 put('.gitignore','builds/\nreports/*\n!reports/consolidation-before/\n!reports/consolidation-before/**\ndocs/**/*.snapshot.bin\ndocs/test-runs/*.artifacts/\n')
 for name in ['src/main.js','tests/check.mjs','reports/consolidation-before/src/main.js','docs/test-runs/summary.json','docs/run.snapshot.bin','docs/test-runs/run.artifacts/log.txt','reports/raw.json','builds/old.zip']:
  put(name)
 subprocess.run(['git','add','.'],cwd=r,check=True)
 # Even accidentally tracked snapshots must be excluded by packaging policy.
 subprocess.run(['git','add','-f','docs/run.snapshot.bin'],cwd=r,check=True)
 names={p.relative_to(r).as_posix() for p in source_files(r)}
 assert {'src/main.js','tests/check.mjs','reports/consolidation-before/src/main.js','docs/test-runs/summary.json'}<=names,names
 assert not {'docs/run.snapshot.bin','docs/test-runs/run.artifacts/log.txt','reports/raw.json','builds/old.zip'}&names,names
 print('source-package-inventory: ignored artifacts excluded; tracked fixtures and receipts retained PASS')
`],{encoding:'utf8'});
assert.equal(result.status,0,result.stdout+result.stderr);
console.log(result.stdout.trim());
