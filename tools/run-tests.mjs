#!/usr/bin/env node
// Execution tiers and validation purposes are independent. Every selected suite is
// reported, including deferred long scenarios. Ecological observations keep strict
// invariant checks and their original runtime ceilings.
// --all | --long; --jobs N; --filter text; --kind purpose; --list; --json file; --ledger file
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runValidationProcess} from './validation-process.mjs';
import {validationFailureKind} from './validation-kind.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tiers=JSON.parse(fs.readFileSync(path.join(root,'tests/test-tiers.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'tests/validation-kinds.json'),'utf8'));
const args=process.argv.slice(2),flag=f=>args.includes(f),opt=(f,d)=>{const i=args.indexOf(f);return i>=0?args[i+1]:d};
const known=JSON.parse(fs.readFileSync(path.resolve(root,opt('--ledger','tests/known-failures.json')),'utf8')).failures;
const mode=flag('--all')?'all':flag('--long')?'long':'fast',jobs=Number(opt('--jobs',3)),filter=opt('--filter',''),kind=opt('--kind',null),jsonOut=opt('--json',null);
if(!Number.isSafeInteger(jobs)||jobs<1)throw Error('--jobs must be a positive integer');
if(kind&&!Object.hasOwn(catalog.kinds,kind))throw Error('Unknown validation kind: '+kind);
const long=new Map(Object.entries(tiers.long));
const plan=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.mjs')&&!f.startsWith('__')&&f.includes(filter)).sort().map(f=>{
 const name=f.slice(0,-4),isLong=long.has(name),kinds=catalog.suites[name]?.kinds||catalog.defaultKinds;
 return{name,kinds,tier:isLong?'long':'fast',run:mode==='all'||(mode==='long'?isLong:!isLong),timeout:(isLong?long.get(name).timeoutSeconds:tiers.fastTimeoutSeconds)*1000};
}).filter(p=>!kind||p.kinds.includes(kind));
if(flag('--list')){console.log(JSON.stringify({mode,kind,suites:plan},null,2));process.exit(0)}
const artifactRoot=jsonOut?path.resolve(root,jsonOut.replace(/\.json$/i,'')+'.artifacts'):path.join(root,'docs/test-runs/artifacts',new Date().toISOString().replace(/[:.]/g,'-')+'-'+process.pid);
// Never overwrite a previous run's evidence, even if --json is reused.
const artifacts=fs.existsSync(artifactRoot)?artifactRoot+'-'+Date.now()+'-'+process.pid:artifactRoot;fs.mkdirSync(artifacts,{recursive:true});
function codeFingerprint(){const hash=createHash('sha256');function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(/\.(?:js|mjs|cjs|json)$/.test(entry.name)){hash.update(file.replaceAll('\\','/'));hash.update(fs.readFileSync(path.join(root,file)))}}}for(const dir of ['src','tools','tests'])walk(dir);return hash.digest('hex')}
const inputsStart=codeFingerprint(),results=[];let next=0;
function classify(name,run){
 const err=run.stderr+(run.spawnError||''),at=(err.match(/tests[\\/][A-Za-z0-9_\\/.-]+\.(?:mjs|js):\d+/)||[''])[0].replaceAll('\\','/'),error=((err.match(/^(?:[A-Za-z]*Error)[^\n]*/m)||err.match(/Error:[^\n]*/)||[''])[0]).slice(0,200),k=known[name];
 if(run.code===0&&!run.timedOut&&!run.spawnError&&!run.cleanupError)return{status:k?'stale':'pass',at:'',error:''};
 const matches=k&&!run.timedOut&&!run.spawnError&&((k.at&&k.at===at)||(k.match&&err.includes(k.match)));
 return{status:run.timedOut?'timeout':matches?'known-fail':'fail',at,error:error||run.spawnError||run.cleanupError||'',...(k&&!matches?{ledgerMismatch:'expected '+(k.at||k.match)}:{})};
}
async function runOne(item){
 const logPath=path.join(artifacts,item.name+'.log');let partial='';
 const run=await runValidationProcess({args:[path.join('tests',item.name+'.mjs')],cwd:root,timeoutMs:item.timeout,logPath,env:{...process.env,GENVO_VALIDATION_ARTIFACTS:artifacts},onStdout(text){partial+=text;let at;while((at=partial.indexOf('\n'))>=0){const line=partial.slice(0,at);partial=partial.slice(at+1);if(line.startsWith('OBSERVATION '))console.log('['+item.name+'] '+line)}if(partial.length>8192)partial=partial.slice(-8192)}});
 const classified=classify(item.name,run);
 return{name:item.name,kinds:item.kinds,failureKind:validationFailureKind(item.name,classified.status,run.stderr,catalog),tier:item.tier,seconds:run.seconds,timeoutSeconds:item.timeout/1000,...classified,logPath,...(run.cleanupError?{cleanupError:run.cleanupError}:{}),...(known[item.name]?{category:known[item.name].category}:{})};
}
async function worker(){while(next<plan.length){const item=plan[next++];if(!item.run){results.push({name:item.name,kinds:item.kinds,tier:item.tier,status:'deferred',reason:item.tier+' tier (run with --all or --long)'});continue}
 const r=await runOne(item);results.push(r);console.log(r.status.padEnd(10)+' '+r.name+' '+r.seconds+'s'+(['pass','known-fail'].includes(r.status)?'':'  '+r.error+(r.ledgerMismatch?' ['+r.ledgerMismatch+', got '+(r.at||'?')+']':'')));
}}
const serial=new Set(tiers.serial||[]),deferredSerial=plan.filter(p=>serial.has(p.name)),start=Date.now();
plan.splice(0,plan.length,...plan.filter(p=>!serial.has(p.name)));await Promise.all(Array.from({length:jobs},worker));plan.push(...deferredSerial);await worker();results.sort((a,b)=>a.name.localeCompare(b.name));
const count=s=>results.filter(r=>r.status===s).length;
const byKind=Object.fromEntries(Object.keys(catalog.kinds).map(k=>[k,Object.fromEntries(['pass','known-fail','fail','timeout','stale','deferred'].map(s=>[s,results.filter(r=>r.kinds.includes(k)&&r.status===s).length]))]));
const inputsEnd=codeFingerprint(),inputDrift=inputsStart!==inputsEnd;
const byFailureKind=Object.fromEntries(Object.keys(catalog.kinds).map(k=>[k,Object.fromEntries(['known-fail','fail','timeout','stale'].map(status=>[status,results.filter(r=>r.failureKind===k&&r.status===status).length]))]));
const summary={schema:'genvo.test-run/3',validationCode:{scope:'src, tools and tests code/configuration; not a release seal',start:inputsStart,end:inputsEnd,inputDrift},classificationNote:'byKind counts overlap for mixed suites; unclassified means not yet audited',mode,date:new Date().toISOString(),seconds:+((Date.now()-start)/1000).toFixed(0),artifacts,total:results.length,pass:count('pass'),knownFail:count('known-fail'),fail:count('fail'),timeout:count('timeout'),stale:count('stale'),deferred:count('deferred'),byKind,byFailureKind,results};
console.log('\n'+mode+' tier: '+summary.pass+' pass, '+summary.knownFail+' known-fail, '+summary.fail+' NEW fail, '+summary.timeout+' timeout, '+summary.stale+' stale ledger, '+summary.deferred+' deferred (of '+summary.total+') in '+summary.seconds+'s');
for(const r of results)if(['fail','timeout','stale'].includes(r.status))console.log('  '+r.status+': '+r.name);
if(inputDrift)console.error('VALIDATION INPUT DRIFT: code/configuration changed during the run; do not certify the current tree from this report.');
if(jsonOut)fs.writeFileSync(path.resolve(root,jsonOut),JSON.stringify(summary,null,1));process.exitCode=summary.fail||summary.timeout||summary.stale||inputDrift?1:0;
