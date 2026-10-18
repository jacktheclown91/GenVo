import {fileURLToPath} from 'node:url';
import {CANONICAL_HORIZONS,observeNaturalWorld} from '../tools/ecological-observation.mjs';
import {observationArtifacts} from '../tools/observation-artifacts.mjs';
import {runObservationWorkers} from '../tools/observation-workers.mjs';
// Additional short diagnostic, never a replacement for the original long soak.
const seed=process.argv[2];
if(seed){
 if(!Object.hasOwn(CANONICAL_HORIZONS,seed))throw Error('Unknown canonical observation seed: '+seed);
 const art=observationArtifacts('ecology-observation-100',seed),result=await observeNaturalWorld({seed,days:100,onSample:art.onSample});
 console.log('SOAK '+JSON.stringify({seed,horizon:100,integrity:result.integrity,totalExtinction:result.final.totalExtinction,artifact:art.finish(result),population:result.final.population,seconds:result.seconds}));
}else await runObservationWorkers(fileURLToPath(import.meta.url),Object.keys(CANONICAL_HORIZONS),{workers:Number(process.env.GENVO_OBSERVATION_WORKERS||5)});
