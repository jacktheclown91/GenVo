import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {populationOverviewHTML} from '../src/ui/population-overview.js';

// Read-only presentation: no fabricated population facts, hidden totals, or
// changes to existing ecology, evolution and family-control authorities.
const census={
 total:27,
 speciesRows:['GenVo 12','Stalker 15'],
 activeTaxon:'Marshclaw',lifestyle:'Forager',
 rangeStatus:'VIABLE',forage:.43,competitors:8,
 familyActive:4,dependents:2,
 adultLineage:3,familiarCells:10,guidance:'Guard nearby'
};
const html=populationOverviewHTML(census);
assert.match(html,/aria-label="Population at a glance"/);
assert.match(html,/27 animals/);
assert.match(html,/4 members/);
assert.match(html,/2 dependents/);
assert.match(html,/VIABLE/);
assert.match(html,/43% forage/);
assert.match(html,/8 competitors/);
// Previous detailed counts and active-taxonomy facts are disclosed, not dropped.
assert.match(html,/data-section="population-census"/);
assert.match(html,/data-focus-key="population-census"/);
for(const text of ['GenVo 12','Stalker 15','Marshclaw','Forager lifestyle','Guard nearby','3 lineage adults','10 familiar cells'])
 assert.ok(html.includes(text),'census retains '+text);
assert.equal((html.match(/<details\b/g)||[]).length,1,'one new optional census fold');
assert.equal((html.match(/class="panel-summary"/g)||[]).length,2,'compact summary plus detailed roster');

const unmeasured=populationOverviewHTML({total:0,speciesRows:[],rangeStatus:'UNMEASURED'});
assert.match(unmeasured,/0 animals/);
assert.match(unmeasured,/Forage not measured/);
assert.doesNotMatch(unmeasured,/0% forage/,'no fake zero when forage is unmeasured');
const safe=populationOverviewHTML({
 speciesRows:['Unknown <script>alert(1)</script> 1'],
 activeTaxon:'<strong>fake</strong>',guidance:'" onclick="attack()"',
 rangeStatus:'<script>bad</script>'
});
assert.doesNotMatch(safe,/<script>|<strong>fake|onclick="attack/);
assert.match(safe,/&lt;script&gt;/);
assert.match(safe,/&quot; onclick=/);

const inspector=readFileSync(new URL('../src/ui/inspector.js',import.meta.url),'utf8');
assert.match(inspector,/import \{populationOverviewHTML\} from '\.\/population-overview\.js';/);
assert.match(inspector,/populationOverviewHTML\(\{total,speciesRows:rows,activeTaxon/);
for(const heading of ['Evolution and lifestyles','Population centers and ecology','Evolutionary tree and leadership','Births, dispersal, and illness'])
 assert.ok(inspector.includes("sectionBlock('"+heading+"'"),'keeps original '+heading+' disclosure');
console.log('population overview UI checks: PASS');
