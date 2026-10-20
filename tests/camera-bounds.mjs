import assert from 'node:assert/strict';
import {clampCameraToWorld} from '../src/render/camera-bounds.js';
for(const tile of [16,32,48])for(const [x,y] of [[0,0],[128,0],[0,128],[128,128],[64,64]]){
 const camera={x,y};clampCameraToWorld(camera,128,1100,760,tile);
 assert.ok(camera.x-550/tile>=0&&camera.x+550/tile<=128);
 assert.ok(camera.y-380/tile>=0&&camera.y+380/tile<=128);
 if(x===64&&y===64)assert.deepEqual(camera,{x,y},'interior following stays centered');
}
assert.deepEqual(clampCameraToWorld({x:0,y:0},10,1100,760,16),{x:5,y:5},'oversized viewport centers the entire available region');
console.log('Finite regional camera: all borders, zoom levels, interior following and oversized viewports PASS');
