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
  'tests/itch-preview-performance.mjs',
  'tests/botanical-identity-parity.mjs',
  'tests/flora-genome-lifetime.mjs',
  'tests/sensory-perception.mjs',
  'tests/vibration-sensing.mjs',
  'tests/cave-exploration-feedback.mjs',
  'tests/local-lineage-assortment.mjs',
  'tests/first-generation-heir-stakes.mjs',
  'tests/physical-starter-presets.mjs',
  'tests/planetary-walkthrough.mjs',
  'tests/regional-frontier.mjs',
  'tests/regional-fauna.mjs',
  'tests/planetary-preparation.mjs',
  'tests/planetary-work-queue.mjs',
  'tests/planetary-seam-work.mjs',
  'tests/stratum-senses.mjs',
  'tests/surface-ice.mjs',
  'tests/surface-ice-coupling.mjs',
  'tests/surface-ice-continuity.mjs',
  'tests/surface-ice-access.mjs',
  'tests/ice-locomotion.mjs',
  'tests/ice-aerial-breathing.mjs',
  'tests/surface-ice-regional.mjs',
  'tests/thermal-refuge.mjs',
  'tests/thermal-weather.mjs',
  'tests/habitat-hazards.mjs',
  'tests/wildfire.mjs',
  'tests/thunderstorms.mjs',
  'tests/thunderstorm-regions.mjs',
  'tests/atmospheric-visibility.mjs',
  'tests/natural-caves.mjs',
  'tests/cave-chambers.mjs',
  'tests/cave-roof.mjs',
  'tests/cave-air.mjs',
  'tests/cave-water.mjs',
  'tests/cave-drinking.mjs',
  'tests/burrowing.mjs',
  'tests/climbing.mjs',
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
  'tests/bundled-scenario-restore.mjs',
  'tests/regional-records.mjs',
  'tests/regional-dirty.mjs',
  'tests/overlay-placement.mjs',
  'tests/regional-founding.mjs',
  'tests/regional-demography.mjs',
  'tests/regional-residency.mjs',
  'tests/border-terrain.mjs',
  'tests/regional-scene.mjs',
  'tests/regional-pointer-route.mjs',
  'tests/pointer-route-availability.mjs',
  'tests/continental-projection.mjs',
  'tests/regional-warm-cache.mjs',
  'tests/evolved-library.mjs',
  'tests/evolved-library-store.mjs',
  'tests/regional-dispersal.mjs',
  'tests/marine-food-web.mjs',
  'tests/anatomical-vision.mjs',
  'tests/observatory-neutrality.mjs',
  'tests/aquatic-foraging.mjs',
  'tests/seed-viability.mjs',
  'tests/breeding-support.mjs',
  'tests/plant-lifecycle.mjs',
  'tests/legacy-milestones.mjs',
  'tests/journey-continuity.mjs',
  'tests/sliced-ticks.mjs',
  'tests/player-suitors.mjs',
  'tests/view-modes.mjs',
  'tests/regional-multi-hop-biology.mjs',
  'tests/regional-synchronized-replay.mjs',
  'tests/aquatic.mjs',
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
