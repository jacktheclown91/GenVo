import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export async function loadFundedNursingCandidate(sourceRoot){
  const file=path.join(sourceRoot,'family/family.js');
  let source=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
  const before=`const amount=Math.min(need,(care.nurseRate??.055)*(1-independence*.68),Math.max(0,caregiver.energy-parentSpec.maxEnergy*(care.parentReserve??.48)));
      if(amount<=0)continue;
      child.energy=Math.min(childSpec.maxEnergy,child.energy+amount*(care.nurseEfficiency??1.35));`;
  const after=`const rate=(care.nurseRate??.055)*(1-independence*.68)*Math.max(0,care.nurseEfficiency??1.35);
      const amount=Math.min(need,rate,Math.max(0,caregiver.energy-parentSpec.maxEnergy*(care.parentReserve??.48)));
      if(amount<=0)continue;
      child.energy=Math.min(childSpec.maxEnergy,child.energy+amount);`;
  assert.ok(source.includes(before),'candidate requires exact nursing transfer');
  source=source.replace(before,after).replace(/from (['"])(\.{1,2}\/[^'"]+)\1/g,(_m,_q,relative)=>'from '+JSON.stringify(pathToFileURL(path.resolve(path.dirname(file),relative)).href));
  return (await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).FamilyController;
}
