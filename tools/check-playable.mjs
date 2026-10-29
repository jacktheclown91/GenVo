// Fast local playability gate. This complements, not replaces, the biological
// acceptance gate and real mouse/keyboard playtesting in Chromium.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const syntax=[
  'src/main.js',
  'src/ui/front-end.js',
  'src/ui/tutorial.js',
  'src/ui/movement-input-buffer.js',
  'src/persistence/save-manager.js',
  'src/sim/frame-stepper.js',
  'tests/save-concurrent-requests.mjs'
];
const runtime=[
  'tests/autonomous-population-founding.mjs',
  'tests/autonomous-evolution-policy.mjs',
  'tests/autonomous-evolution-v1-compatibility.mjs',
  'tests/autonomous-evolution-v2-compatibility.mjs',
  'tests/autonomous-evolution-v3-compatibility.mjs',
  'tests/autonomous-cross-region-reference.mjs',
  'tests/regional-pressure-observations.mjs',
  'tests/inherited-anatomy-evidence.mjs',
  'tests/population-birth-evidence.mjs',
  'tests/autonomous-recognition.mjs',
  'tests/regional-taxon-identity.mjs',
  'tests/evolution-tree-history.mjs',
  'tests/regional-evolution-history.mjs',
  'tests/regional-paid-inheritance.mjs',
  'tests/autonomous-paid-inheritance.mjs',
  'tests/autonomous-policy-compatibility.mjs',
  'tests/extinct-lineage-save.mjs',
  'tests/botanical-gamete-parity.mjs',
  'tests/snapshot-signature.mjs',
  'tests/interleaved-day-clock.mjs',
  'tests/care-expression.mjs',
  'tests/spatial-index.mjs',
  'tests/reproductive-similarity.mjs',
  'tests/controller-composition.mjs',
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
  'tests/save-milestone-cadence.mjs',
  'tests/flora-seed-columns-2.mjs',
  'tests/snapshot-copy.mjs',
  'tests/audio-movement-presentation.mjs',
  'tests/turn-cadence-presentation.mjs',
  'tests/save-persistence.mjs',
  'tests/bundled-scenario-restore.mjs',
  'tests/regional-records.mjs',
  'tests/regional-dirty.mjs',
  'tests/overlay-placement.mjs',
  'tests/regional-founding.mjs',
  'tests/regional-founding-water.mjs',
  'tests/body-size.mjs',
  'tests/body-size-reserves.mjs',
  'tests/body-size-physics.mjs',
  'tests/inertia.mjs',
  'tests/structural-support.mjs',
  'tests/arid-physiology.mjs',
  'tests/climate-water.mjs',
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
  'tests/young-summary.mjs',
  'tests/ecological-capability-feedback.mjs',
  'tests/paid-capability-feedback.mjs',
  'tests/world-story.mjs',
  'tests/threat-display.mjs',
  'tests/reaction-expression.mjs',
  'tests/stranger-response.mjs',
  'tests/observed-creature-activity.mjs',
  'tests/landform-uniform-mask.mjs',
  'tests/day-clock.mjs',
  'tests/metabolism-policy.mjs',
  'tests/tissue-water.mjs',
  'tests/winter-water.mjs',
  'tests/wildlife-needs.mjs',
  'tests/tissue-energy.mjs',
  'tests/body-reserves.mjs',
  'tests/perennial-regrowth.mjs',
  'tests/regional-multi-hop-biology.mjs',
  'tests/regional-synchronized-replay.mjs',
  'tests/regional-job-slicing.mjs',
  'tests/aquatic.mjs',
  'tests/save-storage.mjs',
  'tests/menu-world-slots.mjs',
  'tests/quick-interaction-default.mjs',
  'tests/gameplay-actions.mjs',
  'tests/contextual-interactions.mjs',
  'tests/world-swap-render.mjs',
  'tests/menu-task-usability.mjs',
  'tests/movement-input-buffer.mjs',
  'tests/input-responsiveness.mjs',
  'tests/mandatory-tutorial.mjs',
  'tests/mating-tutorial-guide.mjs',
  'tests/home-ground-actions.mjs',
  'tests/survival-threat-guide.mjs',
  'tests/multigenerational-lineage.mjs',
  'tests/natural-multigen-acceptance.mjs',
  'tests/living-planet-extended.mjs'
];
// Partition only the ordered execution plan; each test still runs in its own
// process under the original 240-second budget. No simulation state is shared.
export function playablePlan(shard=null){
  const plan=[...syntax.map(item=>({mode:'syntax',item})),...runtime.map(item=>({mode:'playable',item}))];
  if(shard===null)return plan;
  const match=/^([1-9]\d*)\/([1-9]\d*)$/.exec(shard);
  if(!match)throw Error('Expected --shard=index/count with one-based positive integers.');
  const index=Number(match[1]),count=Number(match[2]);
  if(!Number.isSafeInteger(index)||!Number.isSafeInteger(count)||index>count||count>plan.length)throw Error('Invalid playable shard range.');
  return plan.filter((_,position)=>position%count===index-1);
}
function run(args){
  const shards=args.filter(arg=>arg.startsWith('--shard='));
  if(shards.length>1||args.filter(arg=>arg==='--list').length>1||args.some(arg=>arg!=='--list'&&!arg.startsWith('--shard=')))throw Error('Usage: check-playable.mjs [--shard=index/count] [--list]');
  const shard=shards.length?shards[0].slice('--shard='.length):null,plan=playablePlan(shard);
  if(args.includes('--list')){console.log(JSON.stringify(plan));return;}
  let passed=0;
  for(const {mode,item} of plan){
    console.log(`\n[GenVo ${mode}] ${item}`);
    const command=mode==='syntax'?['--check',item]:[item];
    const result=spawnSync(process.execPath,command,{cwd:root,stdio:'inherit',timeout:240000});
    if(result.error||result.status!==0){
      console.error(`\nGenVo playable check failed at ${item}: ${result.error?.message||'exit '+result.status}`);
      console.error('Do not mark this commit as a stable playable release.');
      process.exitCode=1;
      break;
    }
    passed++;
  }
  if(!process.exitCode)console.log(`\nGenVo playable checkpoint${shard?' shard '+shard:''}: ${passed} focused checks passed. Browser acceptance is still required.`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{run(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}
}
