import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {founderFloraGenome,validFloraGenome,FLORA_TISSUES} from '../src/ecology/flora-genotype.js';
import {ancestralBotanicalGenome,botanicalFloraGenome,validSexualFloraGenome} from '../src/ecology/botanical-genetics.js';
const source=fs.readFileSync(new URL('../docs/performance/botanical-genetics-before-hash-pass-2026-10-20.txt',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'76308231f447cfffba3cb771a4b85c88249e430d0e8a21e3c388c23ea4f69c92');
const reference=await import('data:text/javascript;base64,'+Buffer.from(source.replace("'../sim/config.js'",JSON.stringify(new URL('../src/sim/config.js',import.meta.url).href))).toString('base64'));
const kinds=Object.keys(FLORA_TISSUES);
for(let i=0;i<512;i++){
 const kind=kinds[i%kinds.length],f=founderFloraGenome(kind),b=structuredClone(ancestralBotanicalGenome(77,'producer-'+i));
 b.cue=[i%256,(i*7)%256];b.selfMarker=['si:🌱:'+i,'si:é:'+i];
 const alleles=Object.fromEntries(Object.entries(f.traits).map(([k,v])=>[k,[v,v]]));alleles.seedAllocation=[.08+(i%27)*.01,.08+((i+3)%27)*.01];
 const old=reference.botanicalFloraGenome(kind,alleles,b),current=botanicalFloraGenome(kind,alleles,b);
 assert.deepEqual(current,old,'exact historical identity, expressed traits and immutable genotype content');
 assert.equal(validSexualFloraGenome(current),reference.validSexualFloraGenome(old));
 const corrupt=structuredClone(current);corrupt.id+='forged';assert.equal(validFloraGenome(corrupt),false,'collision/content validation remains active');
 assert.equal(validFloraGenome(f),true);
}
console.log('Botanical identity PASS: 512 historical content/identity comparisons, Unicode hashing, immutable founders and forged-ID rejection.');
