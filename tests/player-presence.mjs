import assert from 'node:assert/strict';
import fs from 'node:fs';
const renderer=fs.readFileSync(new URL('../src/render/renderer.js',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../src/sim/config.js',import.meta.url),'utf8');
assert.match(renderer,/drawWeatherOverlay\(\);\s*this\.drawPlayerAnchor\(tile\);/,'player anchor stays readable above weather/foreground layers');
assert.match(renderer,/a\.player&&this\.playerVisual\?\{\.\.\.this\.playerVisual/,'controlled GenVo8 uses render-time presentation prediction while ecology creatures keep interpolation');
assert.match(renderer,/drawPlayerAnchor\(tile\)\{[\s\S]*ellipse\(x,y\+13/,'controlled GenVo8 has a restrained ground locator');
assert.match(config,/controlHz:64, cameraFollowHz:42/,'manual control and camera response are tightened for high-refresh presentation');
console.log('player presence checks: PASS');
