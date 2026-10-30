// Focused presentation regressions: portraits navigate retained family records,
// without transferring gameplay control or creating information not in the lineage.
import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {FieldJournal,buildJournalEntry,journalMarkup} from '../src/ui/journal.js';

const sim=new Simulation('JOURNAL-FAMILY-UX',{player:true});
const player=sim.player();
const mate=sim.animals.find(a=>a.id===sim.starterMateId);
const child=sim.spawnAnimal('genvo',player.x+.3,player.y+.2,[player,mate]);
sim.lineage.registerBirth(child,[player,mate]);
sim.family.registerBirth(child,player,mate);

const childRecord=sim.lineage.records.get(child.id);
const parentRecord=sim.lineage.records.get(player.id);
assert.ok(childRecord&&parentRecord,'both displayed relatives exist in lineage records');

const model=buildJournalEntry(sim,child.id);
const markup=journalMarkup(model,false,sim.lineage.records.size,1);
assert.match(markup,/Family member at a glance/);
assert.ok(markup.includes(model.born),'birth information must be read from the record');
assert.match(markup,/recorded parent/);
assert.match(markup,/data-journal="member"/,'family portraits are clickable controls');
assert.ok(markup.includes('data-member-id="'+player.id+'"'),'parent links to actual retained record');
assert.match(markup,/Select a parent or child portrait/,'interaction is discoverable');
assert.match(markup,/data-journal="prev"/,'expert record cycling remains available');
assert.match(markup,/data-journal="next"/,'existing cycling remains available');
assert.match(markup,/data-journal="close"/,'journal keeps a close control');

const scroll={scrollTop:218},heading={tabIndex:0,focused:false,focus(opts){this.focused=opts?.preventScroll===true}};
let updates=0;
const journal=Object.create(FieldJournal.prototype);
journal.sim=sim;
journal.selectedId=child.id;
journal.lastSignature='previous';
journal.el={querySelector(selector){if(selector==='.journal-scroll')return scroll;if(selector==='.journal-head h2')return heading;return null}};
journal.update=()=>{updates++};
const activeBefore=sim.lineage.activeId, rngBefore=sim.rng.state;
assert.equal(journal.selectMember(String(player.id)),true);
assert.equal(journal.selectedId,player.id);
assert.equal(journal.lastSignature,'');
assert.equal(scroll.scrollTop,0,'new family member opens at top of record');
assert.equal(heading.tabIndex,-1);
assert.equal(heading.focused,true,'reading focus follows the selected family member');
assert.equal(updates,1);

for(const invalid of ['not-a-number','999999',String(child.id)+'.5']){
 assert.equal(journal.selectMember(invalid),false,'unretained or invalid members cannot be selected');
 assert.equal(journal.selectedId,player.id);
}
assert.equal(updates,1,'invalid selections trigger no render');

scroll.scrollTop=198;
journal.records=()=>[parentRecord,childRecord];
journal.cycle(1);
assert.equal(journal.selectedId,child.id,'previous/next record order is preserved');
assert.equal(scroll.scrollTop,0,'new record does not inherit the prior scroll position');
assert.equal(sim.lineage.activeId,activeBefore,'journal navigation never transfers lineage control');
assert.equal(sim.rng.state,rngBefore,'reading the journal does not spend randomness');
console.log('journal family navigation UI: PASS');
