import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const tutorial=fs.readFileSync(new URL('../src/ui/tutorial.js',import.meta.url),'utf8');
const reveal=fs.readFileSync(new URL('../src/ui/generation-reveal.js',import.meta.url),'utf8');

assert.match(html,/id="briefing"/,'opening has a dedicated large narrative briefing');
// The v1.65 menu redesign deliberately removed the compulsory welcome text
// (docs/GenVo-Menu-Redesign-v1.65.0.md). Control scope and post-G8 continuation are
// still answered by Help below and by the retained briefing copy.
assert.match(html,/How the lineage works/,'help has a lineage explanation section');
assert.match(html,/one GenVo at a time/i,'help answers multi-control question');
assert.match(html,/ecosystem keeps running/i,'help answers what happens after G8');

assert.match(tutorial,/START SMALL/,'briefing deliberately starts with immediate needs');
assert.match(tutorial,/Control one creature\. Choose what it does next\./,'briefing explicitly explains the active creature scope');
assert.match(tutorial,/any order/,'the opening goals can be pursued in any order');
assert.match(tutorial,/YOUR LINE CONTINUES/,'briefing introduces the autonomous lineage after the basics');
assert.match(tutorial,/raising a lineage, not managing every animal/i,'briefing explains autonomous family-scale purpose');
assert.match(tutorial,/family controls when they become useful/i,'briefing deliberately defers advanced controls');
assert.match(tutorial,/this\.briefing&&!this\.briefing\.hidden/,'briefing blocks world input while being read');
assert.match(tutorial,/Generation 8 is the milestone, not the ending/,'post-onboarding objective reinforces perpetual continuation');
assert.match(reveal,/jam milestone is complete, but the lineage is not/i,'G8 transition explicitly continues the line');

assert.match(css,/\.briefing-stage\{/,'briefing has dedicated large-format styling');
assert.match(css,/font:700 31px\/1\.05 Georgia/,'briefing title is deliberately large');

console.log('lineage purpose + narrative onboarding checks: PASS');
