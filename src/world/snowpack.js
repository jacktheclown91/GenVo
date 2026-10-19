// E13: persistent, water-equivalent snow in the existing daily soil-water model.
// Not a hardcoded alpine perk: any cold land can accumulate snow, altitude and
// regional climate determine how long it persists. Nothing creates meltwater.
export const SNOW=Object.freeze({
 freezeBelow:.30,mixedUntil:.40,meltAbove:.31,
 meltPerDegree:.19,maxVisualDepth:.34,
 growthCover:.17,photosynthesisCover:.28,
 tractionDepth:.17
});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function snowFraction(temperature){
 return clamp((SNOW.mixedUntil-temperature)/(SNOW.mixedUntil-SNOW.freezeBelow));
}
export function snowDepth(world,index){return world?.soilWater?.snowpack?.[index]||0}
export function snowCover(world,index){return clamp(snowDepth(world,index)/SNOW.maxVisualDepth)}
export function snowLightFactor(world,index){return 1-.75*clamp(snowDepth(world,index)/SNOW.photosynthesisCover)}
export function snowGrowthFactor(world,index){return 1-.91*clamp(snowDepth(world,index)/SNOW.growthCover)}
export function coldSurfaceExchange(world,index,precipitation,temperature){
 if(!world?.soilWater?.snowpack||!Number.isFinite(precipitation)||precipitation<0||!Number.isFinite(temperature))throw Error('Invalid cold surface water exchange.');
 const before=world.soilWater.snowpack[index]||0;
 const snowfall=world.water[index]?0:precipitation*snowFraction(temperature);
 const melt=world.water[index]?before:Math.min(before,Math.max(0,temperature-SNOW.meltAbove)*SNOW.meltPerDegree);
 const after=Math.max(0,before+snowfall-melt);
 world.soilWater.snowpack[index]=after;
 return{snowfall,melt,rain:precipitation-snowfall+ (world.water[index]?0:melt),before,after};
}
export function snowFooting(animal,world,x,y){
 const cover=snowCover(world,world.idx(x,y));
 if(!cover)return{speed:1,energy:1,cover:0,pads:0};
 const parts=animal?.bodyPlan?.nodes||[],pads=parts.filter(n=>n.partId==='padded-leg'||n.partId==='webbed-leg'||n.partId==='arid-pad').length;
 const support=pads>=2?.60:pads===1?.23:0;
 return{speed:1-.46*cover*(1-support),energy:1+.72*cover*(1-support*.65),cover,pads};
}
export function validateSnowpack(world,store){
 if(!(store instanceof Float64Array)||store.length!==world.len||store.some(v=>!Number.isFinite(v)||v<0||v>1000))throw Error('Invalid persistent snowpack water store.');
 for(let i=0;i<world.len;i++)if(world.water[i]&&store[i]>1e-8)throw Error('Snow water cannot remain stored on permanent open water.');
}
