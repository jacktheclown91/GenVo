// Fast local playability gate. This complements, not replaces, the biological
// acceptance gate and real mouse/keyboard playtesting in Chromium.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const syntax=[
  'src/main.js',
  'src/ui/front-end.js',
  'src/persistence/save-manager.js',
  'src/sim/frame-stepper.js',
  'tests/save-concurrent-requests.mjs'
];
const runtime=[
  'tests/action-capabilities.mjs',
  'tests/diving.mjs',
  'tests/movement-adoption.mjs',
  'tests/gliding.mjs',
  'tests/jumping.mjs',
  'tests/authored-founders.mjs',
  'tests/resident-start.mjs',
  'tests/camera-bounds.mjs',
  'tests/save-concurrent-requests.mjs',
  'tests/save-async-coherence.mjs',
  'tests/save-persistence.mjs',
  'tests/save-storage.mjs',
  'tests/menu-world-slots.mjs',
  'tests/quick-interaction-default.mjs',
  'tests/gameplay-actions.mjs',
  'tests/contextual-interactions.mjs',
  'tests/world-swap-render.mjs',
  'tests/menu-task-usability.mjs'
];
let passed=0;
for(const [mode,items] of [['syntax',syntax],['playable',runtime]]){
  for(const item of items){
    console.log(`\n[GenVo ${mode}] ${item}`);
    const args=mode==='syntax'?['--check',item]:[item];
    const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',timeout:120000});
    if(result.error||result.status!==0){
      console.error(`\nGenVo playable check failed at ${item}: ${result.error?.message||'exit '+result.status}`);
      console.error('Do not mark this commit as a stable playable release.');
      process.exitCode=1;
      break;
    }
    passed++;
  }
  if(process.exitCode)break;
}
if(!process.exitCode)console.log(`\nGenVo playable checkpoint: ${passed} focused checks passed. Browser acceptance is still required.`);
