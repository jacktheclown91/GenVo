// Mature-world diagnostic; never substitutes for unchanged long test coverage.
// node --expose-gc tools/observe-ecology.mjs SEED DAYS --profile --gc --cpu-start 280 --cpu-end 320
import fs from 'node:fs';
import inspector from 'node:inspector';
import {observeNaturalWorld} from './ecological-observation.mjs';
import {observationArtifacts} from './observation-artifacts.mjs';
const args=process.argv.slice(2),[seed='GENVO8-TEST-A',days='100']=args,opt=(flag,fallback)=>{const i=args.indexOf(flag);return i<0?fallback:Number(args[i+1])};
const development100=args.includes('--development-100');
if(development100&&(seed!=='GENVO8-TEST-A'||Number(days)!==100))throw Error('Development benchmark uses GENVO8-TEST-A for 100 completed days');
const art=observationArtifacts('ecology-diagnostic',seed),cpuStart=opt('--cpu-start',null),cpuEnd=opt('--cpu-end',Number(days)+1),cpuChunkDays=opt('--cpu-chunk-days',10);
if(cpuStart!==null&&(!Number.isSafeInteger(cpuStart)||!Number.isSafeInteger(cpuEnd)||cpuStart<1||cpuEnd<=cpuStart||cpuEnd>Number(days)+1))throw Error('CPU window must be integer days within the observation horizon');
if(!Number.isSafeInteger(cpuChunkDays)||cpuChunkDays<1)throw Error('CPU chunk size must be a positive integer');
const session=cpuStart!==null?new inspector.Session():null;session?.connect();
const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(err,r)=>err?reject(err):resolve(r)));
let started=false,stopped=false,chunkStart=null;const cpuChunks=[];
async function capture(day,{final=false}={}){
 if(!started||stopped)return;const {profile}=await post('Profiler.stop');
 const file=art.result.replace(/\.json$/,'.cpu-'+chunkStart+'-'+day+'.cpuprofile');fs.writeFileSync(file,JSON.stringify(profile));
 const byId=new Map();for(let i=0;i<(profile.samples||[]).length;i++)byId.set(profile.samples[i],(byId.get(profile.samples[i])||0)+(profile.timeDeltas[i]||0));
 const hot=profile.nodes.map(n=>({fn:n.callFrame.functionName,file:n.callFrame.url,line:n.callFrame.lineNumber+1,ms:(byId.get(n.id)||0)/1000})).sort((a,b)=>b.ms-a.ms).slice(0,50);
 const chunk={cpuStart,cpuEnd,fromDay:chunkStart,throughDay:day,final,file,scope:'Whole diagnostic workload, including strict integrity checks, explicit GC and sampled readouts'};
 fs.writeFileSync(file+'.summary.json',JSON.stringify({...chunk,hot},null,2));cpuChunks.push(chunk);console.log('CPU_PROFILE '+file+(final?' final':' partial'));
 if(final)stopped=true;else{await post('Profiler.start');chunkStart=day}
}

try{
 if(session){await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:1000});if(cpuStart===1){await post('Profiler.start');started=true;chunkStart=1}}
 const result=await observeNaturalWorld({seed,days:Number(days),checkpoints:development100?[1,10,30,60,100]:null,sampleEvery:opt('--sample-every',20),profilePhases:args.includes('--profile'),collectGc:args.includes('--gc'),onSample:art.onSample,async onDay(day){if(session&&!started&&day>=cpuStart){await post('Profiler.start');started=true;chunkStart=day}if(started&&!stopped){if(day>=cpuEnd)await capture(day,{final:true});else if(day-chunkStart>=cpuChunkDays)await capture(day)}}});
 await capture(result.final.day,{final:true});console.log(JSON.stringify({artifact:art.finish(result),integrity:result.integrity,totalExtinction:result.final.totalExtinction,seconds:result.seconds,cpuWindowCompleted:stopped,cpuChunks}));
}finally{session?.disconnect()}
