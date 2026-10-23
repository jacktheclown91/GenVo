import assert from 'node:assert/strict';
import fs from 'node:fs';

// Viewing modes (creator playtest direction 2026-10-22): presentation only.
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
const {VIEW_MODES,DEFAULT_VIEW_MODE,viewMode,setViewMode}=await import('../src/render/view-modes.js');
assert.equal(DEFAULT_VIEW_MODE,'comfort');assert.equal(viewMode(),'comfort','Comfort View is the default');
for(const [id,m] of Object.entries(VIEW_MODES)){
 const [unknown,remembered,seen]=m.fog;assert.equal(seen,0,id+': sensed cells are never darkened');
 assert.ok(unknown>=remembered&&remembered>seen,id+': unexplored is darkest, remembered lighter');
 assert.ok(m.label&&m.note,id+' is explained in Options');
}
assert.ok(VIEW_MODES.biological.fog[0]>VIEW_MODES.comfort.fog[0]&&VIEW_MODES.comfort.fog[0]>VIEW_MODES.sandbox.fog[0]);
assert.equal(VIEW_MODES.sandbox.clipVegetation,false,'only Sandbox shows plants outside the senses');
assert.equal(VIEW_MODES.comfort.clipVegetation,true);assert.equal(VIEW_MODES.biological.clipVegetation,true);
setViewMode('sandbox');assert.equal(viewMode(),'sandbox');assert.equal(store.get('genvo.viewMode'),'sandbox','kept in browser storage, not in saves');
assert.throws(()=>setViewMode('x-ray'),/Unknown view mode/);
// Live layers that carry information are clipped to sensed cells in every mode;
// creatures are still filtered by perception.
const renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
for(const layer of ['this.drawStalkerDens(tile)','this.drawSites(tile,cols,rows)','this.drawCarrion('])
 assert.ok(new RegExp('clipToSensed\\(this,tile\\)[^}]{0,400}'+layer.replace(/[().]/g,'\\$&')).test(renderer),layer+' is clipped to what the creature senses');
assert.match(renderer,/visuallyObservable\(this\.sim,observer,a,8,playerView\)/,'creatures stay perception-filtered');
console.log('View modes PASS: Comfort default, ordered fog levels, Sandbox-only vegetation, browser-stored preference, live layers clipped to the senses.');
