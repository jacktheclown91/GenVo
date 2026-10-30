import assert from 'node:assert/strict';
import fs from 'node:fs';
const renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../src/sim/config.js',import.meta.url),'utf8');
// Later layers (sensory fog) may sit between them; the anchor must still follow weather.
// Every full-screen overlay of the world pass (weather, the day-night wash, the underwater
// view and sensory fog) is painted before the player anchor, which stays readable above them.
{const anchor=renderer.indexOf('this.drawPlayerAnchor(tile);');assert.ok(anchor>0,'the world pass draws the player anchor');
 for(const layer of ['drawWeatherOverlay();','drawDiurnalLight(this);','drawUnderwaterView(this);','drawSensoryFog(this,']){const at=renderer.lastIndexOf(layer,anchor);assert.ok(at>0&&anchor-at<1200,`${layer} is painted just before the player anchor`)}}
assert.match(renderer,/a\.player&&this\.playerVisual\?this\.playerGaitVisual\(a,gaitPerTile\)/,'controlled creature drawn from its presentation pose');assert.match(renderer,/playerGaitVisual\(a,gaitPerTile\)\{const g=this\.motion\.sample\(\{\.\.\.a,id:'gait:'\+a\.id/,'gait has its own motion state');assert.match(renderer,/return\{\.\.\.this\.playerVisual,gaitPhase:g\.gaitPhase,recentlyMoving:g\.recentlyMoving\}/,'controlled GenVo8 uses render-time presentation prediction while ecology creatures keep interpolation');
// The published anchor replaced the earlier ground ellipse with a dark-backed segmented gold ring.
assert.match(renderer,/drawPlayerAnchor\(tile\)\{[\s\S]*?c\.arc\(x,y,radius,start,start\+Math\.PI\/4\)/,'controlled GenVo8 has a restrained locator ring');
assert.match(config,/controlHz:64, cameraFollowHz:42/,'manual control and camera response are tightened for high-refresh presentation');
console.log('player presence checks: PASS');
