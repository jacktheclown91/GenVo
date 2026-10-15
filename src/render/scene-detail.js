import {drawHabitatGround} from './habitat-ground.js';
// One substrate signature per real interpreted scene. Living plants are drawn by flora.js.
export function drawHabitatSceneBackdrop(ctx,{scene,px,py,u,season='SPRING'}){
 if(!scene)return;drawHabitatGround(ctx,{kind:scene.kind,px,py,u,season,strength:scene.score,variant:((scene.x*7+scene.y*3)>>>0)%4});
}
// Compatibility export: ground no longer paints a second vegetation layer over animals.
export function drawHabitatSceneForeground(){}
