import {observeNaturalWorld} from '../tools/ecological-observation.mjs';
import {observationArtifacts} from '../tools/observation-artifacts.mjs';
// Same original seed, 420-day horizon and 900-second runner ceiling. No survival,
// evolved-survivor, or branch-count target. Invariants remain hard failures.
const seed='GENVO8-WILD-RUN',art=observationArtifacts('wild-evolution-observation',seed);
const result=await observeNaturalWorld({seed,days:420,onSample:art.onSample,profilePhases:true});
console.log(JSON.stringify({artifact:art.finish(result),integrity:result.integrity,population:result.final.population,wild:result.final.wild,branchIds:result.final.branchIds}));
