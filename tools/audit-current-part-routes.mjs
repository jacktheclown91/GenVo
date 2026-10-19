// Reuse the preserved operator-search experiment against current authorities.
// It proves structural witnesses, never births, survival or useful mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const goal=process.argv.includes('--goal')?process.argv[process.argv.indexOf('--goal')+1]:null;
const expanded=process.argv.includes('--expanded')?Number(process.argv[process.argv.indexOf('--expanded')+1]):64;assert.ok(Number.isSafeInteger(expanded)&&expanded>=64&&expanded<=1024);
const out=process.argv[2];assert.ok(out&&!fs.existsSync(out),'fresh receipt required');
const original=new URL('../docs/living-planet-architecture/multistep-accessibility/audit.mjs',import.meta.url),bytes=fs.readFileSync(original),source=bytes.toString('utf8');
let patched=source.replace("const output='docs/living-planet-architecture/multistep-accessibility/results.json';",'const output='+JSON.stringify(out)+';').replace(/from '([^']+)'/g,(_,s)=>'from '+JSON.stringify(s.startsWith('.')?new URL(s,original).href:s)).replace('including current draft viability and /2 optional loss','including installed draft viability, optional loss and head-structure policies');
if(goal){assert.ok(/^[a-z-]+$/.test(goal));patched=patched.replace('for(const part of Object.values(PARTS)){','for(const part of Object.values(PARTS).filter(p=>p.id==='+JSON.stringify(goal)+')){')}
patched=patched.replace('expandedPerGoal:64','expandedPerGoal:'+expanded);
assert.notEqual(patched,source);await import('data:text/javascript;base64,'+Buffer.from(patched+'\n//# sourceURL=current-part-route-search.js').toString('base64'));
const report=JSON.parse(fs.readFileSync(out));if(goal)assert.ok(report.rows.some(r=>r.kind==='part'&&r.id===goal),'Unknown catalog goal');report.auditedGoals={goalFilter:goal,expandedPerGoal:expanded,partGoals:report.rows.filter(r=>r.kind==='part').length};report.experimentProvenance={script:'docs/living-planet-architecture/multistep-accessibility/audit.mjs',sha256:createHash('sha256').update(bytes).digest('hex'),changes:'Fresh output path, absolute imports and updated scope wording; optional declared goal filter/expansion bound; same bounded search algorithm',limitations:'Constructed mutation-operator witnesses; not actual inherited births, developmental funding, survival, reproduction, frequency or functional action proof'};
fs.writeFileSync(out,JSON.stringify(report,null,2));
