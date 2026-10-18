import {fileURLToPath} from 'node:url';
import {CANONICAL_HORIZONS,observeNaturalWorld} from '../tools/ecological-observation.mjs';
import {observationArtifacts} from '../tools/observation-artifacts.mjs';
import {runObservationWorkers} from '../tools/observation-workers.mjs';
// Original five seeds and 640/320-day horizons are unchanged. Every tick/day retains
// the original mechanical gates; complete extinction is recorded rather than forbidden.
const seed=process.argv[2];
if(seed){
 const days=CANONICAL_HORIZONS[seed];if(!days)throw Error('Unknown canonical soak seed: '+seed);
 const art=observationArtifacts('natural-world-soak',seed),result=await observeNaturalWorld({seed,days,onSample:art.onSample});
 console.log('SOAK '+JSON.stringify({seed,horizon:days,integrity:result.integrity,totalExtinction:result.final.totalExtinction,artifact:art.finish(result),population:result.final.population,seconds:result.seconds}));
}else{
 const workers=Number(process.env.GENVO_OBSERVATION_WORKERS||5);
 const results=await runObservationWorkers(fileURLToPath(import.meta.url),Object.keys(CANONICAL_HORIZONS),{workers});
 console.log(JSON.stringify({suite:'natural-world-soak',workers,results,outcomePolicy:'No required population or survival; original full-horizon integrity gates retained.'}));
}
