import assert from 'node:assert/strict';
import fs from 'node:fs';
const renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../src/sim/config.js',import.meta.url),'utf8');
// Later layers (sensory fog) may sit between them; the anchor must still follow weather.
assert.match(renderer,/drawWeatherOverlay\(\);[^\n]*\n(?:[^\n]*\n){0,3}?\s*this\.drawPlayerAnchor\(tile\);/,'player anchor stays readable above weather/foreground layers');
assert.match(renderer,/a\.player&&this\.playerVisual\?this\.playerGaitVisual\(a,gaitPerTile\)/,'controlled creature drawn from its presentation pose');assert.match(renderer,/playerGaitVisual\(a,gaitPerTile\)\{const g=this\.motion\.sample\(\{\.\.\.a,id:'gait:'\+a\.id/,'gait has its own motion state');assert.match(renderer,/return\{\.\.\.this\.playerVisual,gaitPhase:g\.gaitPhase,recentlyMoving:g\.recentlyMoving\}/,'controlled GenVo8 uses render-time presentation prediction while ecology creatures keep interpolation');
// The published anchor replaced the earlier ground ellipse with a dark-backed segmented gold ring.
assert.match(renderer,/drawPlayerAnchor\(tile\)\{[\s\S]*?c\.arc\(x,y,radius,start,start\+Math\.PI\/4\)/,'controlled GenVo8 has a restrained locator ring');
assert.match(config,/controlHz:64, cameraFollowHz:42/,'manual control and camera response are tightened for high-refresh presentation');
console.log('player presence checks: PASS');
