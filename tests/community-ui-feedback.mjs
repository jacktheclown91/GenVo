import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
assert.match(css,/#hud\{[^}]*background:rgba\(/s,'primary HUD has a readability wash');
assert.match(css,/\.objective\{[^}]*background:rgba\(/s,'objective has a readability wash');
assert.match(css,/\.objective strong\{[^}]*17px/s,'primary objective type is larger');
assert.match(css,/\.context\{[^}]*font:bold 13px/s,'interaction prompt is larger');
// The separately authored v1.65 title menu deliberately uses gradients and button geometry
// (same boundary as ui-art-direction.mjs); the field UI before it must not.
assert.doesNotMatch(css.split('/* GenVo v1.65')[0],/linear-gradient|border-radius/,'feedback pass preserves authored UI direction');
console.log('community UI feedback checks: PASS');
