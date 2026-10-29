// A focused browser-free regression for live Guide rerender control state.
// Render/pixel acceptance still requires the existing Chromium harnesses.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/ui/field-guide.js',import.meta.url),'utf8');
const stripped=source.replace(/^import[^\r\n]*\r?\n/gm,'').replace('export class FieldGuide','class FieldGuide');
const activeDocument={activeElement:null};
const FieldGuide=vm.runInNewContext(stripped+'\nFieldGuide;', {document:activeDocument});

function capture({kind='turn',selection='observed:body-a',page='creatures'}={}){
 const active={
  dataset:kind==='turn'?{specimenTurn:'1'}:kind==='page'?{page:'places'}:kind==='specimen'?{specimen:'observed:body-b'}:{},
  hasAttribute(name){return Object.hasOwn(this.dataset,name)},
  matches(selector){return kind==='catalog'&&selector==='.specimen-catalog > summary'}
 };
 activeDocument.activeElement=active;
 const list={scrollLeft:38},body={dataset:{show:page},scrollTop:168};
 const elements={'.fg-body':body,'.specimen-catalog .fg-cards':list,'.specimen-selected [data-specimen]':{dataset:{specimen:selection}},'.fg-protection-archive':{open:true}};
 const el={contains:x=>x===active,querySelector:selector=>elements[selector]||null};
 return FieldGuide.prototype.captureView.call({el});
}
function restore(state,{page='creatures',selection='observed:body-a'}={}){
 const body={scrollTop:0},cards={scrollLeft:0};
 const nodes={
  '[data-page]':[{dataset:{page:'places'},focus(opts){this.focusOptions=opts}}],
  '[data-specimen-turn]':[{dataset:{specimenTurn:'1'},focus(opts){this.focusOptions=opts}}]
 };
 const heading={tabIndex:0,focus(opts){this.focusOptions=opts}};
 const elements={'.fg-body':body,'.specimen-catalog .fg-cards':cards,'.specimen-sheet > header h3':heading};
 const el={querySelector:selector=>elements[selector]||null,querySelectorAll:selector=>nodes[selector]||[]};
 FieldGuide.prototype.restoreView.call({el,page,specimenId:selection},state);
 return {body,cards,heading,nodes};
}
// Periodic body update: keep a reader's position, the selected facing control and
// the horizontal collection position; the expanded record remains exposed to HTML.
const state=capture();
assert.equal(state.notesOpen,true);
assert.equal(state.selected,'observed:body-a');
const stable=restore(state);
assert.equal(stable.body.scrollTop,168);
assert.equal(stable.cards.scrollLeft,38);
assert.deepEqual({...stable.nodes['[data-specimen-turn]'][0].focusOptions},{preventScroll:true});

// Selecting a retained observation should focus its heading instead of the now
// closed catalog's removed button; do not inherit the previous body's scroll.
const chosen=restore(capture({kind:'specimen'}),{selection:'observed:body-b'});
assert.equal(chosen.body.scrollTop,0);
assert.equal(chosen.heading.tabIndex,-1);
assert.deepEqual({...chosen.heading.focusOptions},{preventScroll:true});

// Changing Guide chapters resets body scroll, but retains keyboard position on
// the chosen tab instead of abandoning it after innerHTML replacement.
const page=restore(capture({kind:'page'}),{page:'places'});
assert.equal(page.body.scrollTop,0);
assert.deepEqual({...page.nodes['[data-page]'][0].focusOptions},{preventScroll:true});
assert.match(source,/aria-current="\$\{this\.page===id\?'page':'false'\}"/);
assert.match(source,/Compare plate protection records/);
console.log('Field Guide UI rerender state: PASS');
