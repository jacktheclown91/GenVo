import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
// Historical field UI does not regress to generic cards. The separately authored
// title-menu vignette deliberately uses gradients and button geometry.
const fieldUiCss=css.split('/* GenVo v1.65')[0];
for(const stale of ['welcome-card','transition-card','class="brand"','linear-gradient','border-radius']){
  assert.equal((html+'\n'+fieldUiCss).includes(stale),false,`generic field UI pattern returned: ${stale}`);
}
for(const asset of ['assets/ui/body.png','assets/ui/seed.png','assets/ui/water.png','assets/ui/lineage.png','assets/ui/field-frame.png','assets/ui/handoff.png','assets/ui/journal-edge.png']){
  assert.ok(fs.existsSync(new URL('../'+asset,import.meta.url)),`missing authored UI asset: ${asset}`);
}
assert.match(css,/\.transition\{[^}]*inset:0/,'generation handoff is a full-screen scene');
assert.match(css,/\.lineage-portrait canvas\{[^}]*background:transparent/,'lineage portraits do not use card backgrounds');
assert.match(css,/\.journal-page\{[^}]*background:#0d160e/,'family journal uses one field leaf rather than nested cards');
console.log('UI art-direction checks: PASS');
