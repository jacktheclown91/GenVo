import fs from 'node:fs';
import assert from 'node:assert/strict';

const [input, output] = process.argv.slice(2);
assert.ok(input && output, 'Expected observer JSON and output path');
const result = JSON.parse(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
const lineage = result.records.filter(row => row.lineage);
const deaths = lineage.filter(row => !row.alive);
const causes = {};
for (const row of deaths) {
  assert.ok(Number.isFinite(row.deathDay) && row.cause, 'Death has recorded day and cause');
  causes[row.cause] = (causes[row.cause] || 0) + 1;
}
const living = lineage.filter(row => row.alive).map(row => row.id);
const report = {
  seed: result.seed, day: result.day, complete: result.complete,
  sourceFingerprint: result.sourceFingerprint,
  scope: 'Recorded lineage mortality and terminal interaction state. A death cause identifies the lethal mechanism, not the complete historical cause or proof that behavior was correct.',
  lineageIndividuals: lineage.length, living, causes,
  extinctByDay: living.length ? null : Math.max(...deaths.map(row => row.deathDay)),
  deaths: deaths.map(row => ({id: row.id, bornDay: row.bornDay,
    deathDay: row.deathDay, cause: row.cause, age: row.age,
    parentIds: row.parentIds, children: row.children, deathState: row.deathState})),
};
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({day: report.day, living, causes, extinctByDay: report.extinctByDay}));
