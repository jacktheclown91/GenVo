// Summarize completed or partial diagnostic artifacts without converting outcomes into gates.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function summarizeObservation(progress){
 const text=fs.readFileSync(progress,'utf8'),lines=text.split('\n'),rows=[];let truncatedTail=false;
 for(let i=0;i<lines.length;i++){if(!lines[i])continue;try{rows.push(JSON.parse(lines[i]))}catch(error){if(i===lines.length-1&&!text.endsWith('\n'))truncatedTail=true;else throw error}}
 if(!rows.length)throw Error('No complete observation samples: '+progress);
 const resultFile=progress.replace(/\.ndjson$/,'.json');let receipt=null,receiptError=null;if(fs.existsSync(resultFile)){try{receipt=JSON.parse(fs.readFileSync(resultFile,'utf8'))}catch(error){receiptError=error.message}}
 const first=rows[0],last=rows.at(-1),intervals=[];
 for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i],days=b.day-a.day,delta=(x,y)=>Object.fromEntries(Object.keys(y||{}).map(key=>[key,(y[key]||0)-(x?.[key]||0)]));
  intervals.push({fromDay:a.day,toDay:b.day,seconds:b.seconds-a.seconds,msPerDay:days>0?(b.seconds-a.seconds)*1000/days:null,heapChange:b.memory.heapUsed-a.memory.heapUsed,postGcHeapChange:a.memory.gcCollected&&b.memory.gcCollected?b.memory.heapUsed-a.memory.heapUsed:null,cohortChange:b.structures.seedCohorts-a.structures.seedCohorts,genomeChange:b.structures.genomes-a.structures.genomes,births:b.births-a.births,deaths:b.deaths-a.deaths,deathCauses:delta(a.deathCauses,b.deathCauses),resources:delta(a.resources,b.resources),waterFlows:delta(a.waterFlows,b.waterFlows),producerFlows:delta(a.producerFlows,b.producerFlows),phases:b.phases?Object.fromEntries(Object.entries(b.phases).map(([k,v])=>[k,{calls:v.calls-(a.phases?.[k]?.calls||0),ms:v.ms-(a.phases?.[k]?.ms||0)}])):null});
 }
 return{schema:'genvo.observation-summary/1',seed:last.seed,completed:!!receipt,truncatedTail,receiptError,integrity:receipt?.integrity||'not completed; partial samples only',requestedHorizon:receipt?.horizon??last.horizon??null,observedThroughDay:last.day,totalExtinctionAtLastSample:last.totalExtinction,populationAtLastSample:last.population,wildAtLastSample:last.wild,branchIds:last.branchIds,peakSampledRss:Math.max(...rows.map(r=>r.memory.rss)),lastStructures:last.structures,lastCaches:last.caches,lastProducerLimits:last.producerLimits,lastMigration:last.migration,lastLineage:last.lineage,lastWaterClosureMax:last.recentWaterClosureMax,intervals,causalLimit:'Net stocks, recorded causes and diagnostic association do not alone establish why a lineage survived or went extinct. Phase clocks are inclusive and diagnostic overhead/GC is included in elapsed time.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const input=process.argv[2];if(!input)throw Error('Usage: node tools/summarize-observations.mjs progress.ndjson [output.json]');const result=summarizeObservation(input);if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
