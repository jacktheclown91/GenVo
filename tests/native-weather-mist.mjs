import assert from 'node:assert/strict';
import {weatherMistArt as a} from '../assets/art/environment/weather-mist.js';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
assert.equal(a.schema,'genvo.environment-weather-indexed/1');assert.equal(a.width,64);assert.equal(a.height,32);assert.equal(a.frames.length,4);assert.equal(a.palette.length,4);
assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../assets/art/production-review/weather-v1/mist-master.png',import.meta.url))).digest('hex'),a.sourceSha256);
for(const frame of a.frames){assert.equal(frame.length,a.width*a.height);assert.ok(frame.every(v=>Number.isInteger(v)&&v>=0&&v<32));const occupied=frame.filter(v=>v%8>0).length;assert.ok(occupied>100&&occupied<frame.length*.85,'broken transparent silhouette');assert.ok(new Set(frame.map(v=>v%8)).size>=4,'retained multilevel alpha');assert.ok(frame.slice(0,a.width).every(v=>v%8===0),'transparent top gutter');assert.ok(frame.slice(-a.width).every(v=>v%8===0),'transparent bottom gutter')}
assert.equal(new Set(a.frames.map(f=>JSON.stringify(f))).size,4);
console.log('Native weather mist PASS: retained master hash, four distinct indexed transparent silhouettes, native bounds and alpha levels.');
