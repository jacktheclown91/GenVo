import assert from 'node:assert/strict';
import {createDraft,draftCost} from '../src/lineage/evolution-draft.js';
import {bodyPlanFromLegacy} from '../src/lineage/body-plan.js';
import {projectMount,mountedChanges} from '../src/ui/workshop-projection.js';
const d=createDraft({base:bodyPlanFromLegacy({adaptations:[]}),budget:3});const before=JSON.stringify(d.plan),history=d.history.length;
const projected=projectMount(d,'spring-leg',[{parent:'root',socket:'limb.3'},{parent:'root',socket:'limb.5'}]);assert.equal(projected.ok,true);assert.equal(projected.total,4);assert.ok(projected.problems.some(p=>p.includes('more than')));assert.equal(draftCost(d),0);assert.equal(d.history.length,history);assert.equal(JSON.stringify(d.plan),before);assert.equal(mountedChanges(d.plan,projected.plan).length,2);
assert.equal(projectMount(d,'crushing-jaw',[{parent:'root',socket:'mouth'}]).ok,false,'unearned ancestry is not offered by a projection');assert.equal(projectMount(d,'spring-leg',[{parent:'root',socket:'mouth'}]).ok,false,'incompatible mounts remain rejected');
console.log('Canonical projection cost, overspend warning, anatomical restrictions and no draft mutations PASS');
