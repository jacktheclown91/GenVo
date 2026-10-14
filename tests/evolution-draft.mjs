import assert from 'node:assert/strict';
import {bodyPlanFromLegacy,serializePlan,deserializePlan} from '../src/lineage/body-plan.js';
import {createDraft,draftCost,draftProblems,place,remove,mirror,undo,redo,revert,commitDraft,mirrorSocket,whyNot} from '../src/lineage/evolution-draft.js';

// Evolution Expansion Phase C (EV-008): the editor draft engine.
const founder=bodyPlanFromLegacy({adaptations:[]});
const d=createDraft({base:founder,ancestry:[],budget:8});
assert.equal(draftCost(d),0);assert.deepEqual(draftProblems(d),[],'an unchanged body is valid and free');

// Guided ancestry: a radical change needs its precursor in the lineage first.
assert.match(whyNot(d,'crushing-jaw','root','mouth'),/Requires tearing jaw in the lineage first/);
assert.equal(whyNot(d,'tearing-jaw','root','mouth'),null);
assert.match(whyNot(d,'walking-leg','root','mouth'),/Does not fit a mouth socket/);

// Place, cost, mirror, undo/redo, revert.
assert.equal(place(d,'spring-leg','root','limb.3').ok,true);assert.equal(draftCost(d),2,'a new spring leg costs its mutation cost');
assert.equal(mirrorSocket('limb.3'),'limb.5');assert.equal(mirror(d,'root/limb.3').ok,true);assert.equal(draftCost(d),4,'mirroring adds the matching leg');
assert.equal(place(d,'tearing-jaw','root','mouth').ok,true);assert.equal(draftCost(d),6);
assert.equal(undo(d),true);assert.equal(draftCost(d),4,'undo refunds within the draft');assert.equal(redo(d),true);assert.equal(draftCost(d),6);
assert.equal(remove(d,'root/eye.left').ok,true);assert.equal(draftCost(d),7,'removing a part costs a little');
assert.equal(remove(d,'root/eye.right').ok,true);assert.match(draftProblems(d).join(' '),/at least one eye/,'viability: a creature needs an eye');
assert.equal(commitDraft(d).ok,false,'an unviable draft cannot be committed');
undo(d);assert.deepEqual(draftProblems(d),[]);
assert.equal(place(d,'claw','root/limb.2','spur').ok,true);assert.equal(place(d,'claw','root/limb.6','spur').ok,true);assert.match(draftProblems(d).join(' '),/more than the 8 MP available/,'the budget is enforced');
undo(d);undo(d);
assert.equal(remove(d,'root').ok,false,'the torso stays');
for(const i of [0,1,2,6,7])remove(d,`root/limb.${i}`);assert.match(draftProblems(d).join(' '),/four legs/,'viability: enough legs to stand');
revert(d);assert.equal(draftCost(d),0,'revert returns the whole budget');assert.equal(d.plan.id,founder.id);
undo(d);assert.ok(draftCost(d)>0,'revert itself can be undone');

// Commit is atomic and the result reloads exactly.
const e=createDraft({base:founder,ancestry:['tearing-jaw'],budget:12});place(e,'crushing-jaw','root','mouth');place(e,'armor-plate','root','flank.left');mirror(e,'root/flank.left');
const r=commitDraft(e,{tick:100,day:3,generation:2});assert.equal(r.ok,true);assert.equal(r.record.from,founder.id);assert.equal(r.record.spent,3+2+2);
assert.ok(Object.isFrozen(r.record));assert.deepEqual(deserializePlan(serializePlan(r.record.plan)),r.record.plan,'the committed target saves and reloads exactly');
assert.equal(founder.nodes.length,bodyPlanFromLegacy({adaptations:[]}).nodes.length,'editing never changed the parent body');
console.log('evolution draft ok');
