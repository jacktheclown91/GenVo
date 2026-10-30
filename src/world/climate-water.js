// Climate water balance (morphology S5): evaporation potential follows temperature
// above freezing (Thornthwaite-type): 0.085 per temperature unit per day above
// 0.30, in the moisture units rain and soil use. Anchors: freezing is the snow and
// ice rules' 0.30; 1 temperature unit is about 50 C; 1 moisture unit is about
// 100 mm; about 0.17 mm per day per C.
//  - climate-water/1: soil evaporation follows this law.
//  - climate-water/2: the same, and rainfall-runoff pools (cells flooded by
//    rainfall-runoff-inundation) also evaporate at it, so seasonal pools dry and
//    recede through the existing funded-channel recession. Generated rivers and
//    lakes stand for catchment-scale supply outside the regional model and keep
//    their recorded balance.
//  - climate-water/3: the same, and rivers discharge. Each connected body of
//    open water that reaches a border side open to external water (a river or
//    sea continuing beyond the region, not a side owned by a paired neighbouring
//    region) drains a quarter of its liquid water above the generated level per
//    day (a flood-wave residence of about four days), from every cell, scaled by
//    its most open outlet, with its dissolved salt. Runoff-made cells have no
//    generated level and drain to a thin film, so floodplains return toward
//    their generated levels and runoff pools can dry and recede.
// The rule travels in the day's climate (climate.evaporation) so every soil and
// open-water day, resident or archived, follows its own world's recorded rule.
export const CLIMATE_WATER=Object.freeze({policy:'climate-water/3',pools:'climate-water/2',soil:'climate-water/1',freezing:.30,perDegree:.085,dischargeFraction:.25});
export const climateWaterPolicy=value=>value===CLIMATE_WATER.policy||value===CLIMATE_WATER.pools||value===CLIMATE_WATER.soil;
export function temperaturePotential(temperature){return CLIMATE_WATER.perDegree*Math.max(0,temperature-CLIMATE_WATER.freezing)}
export const poolEvaporation=climate=>climate?.evaporation===CLIMATE_WATER.policy||climate?.evaporation===CLIMATE_WATER.pools;
export const riverDischarge=climate=>climate?.evaporation===CLIMATE_WATER.policy;
