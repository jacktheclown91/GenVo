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
//    region) drains a quarter of its net liquid water above its generated levels
//    per day (a flood-wave residence of about four days), scaled by its most
//    open outlet, with its dissolved salt. Runoff-made cells have no generated
//    level and drain to a thin film. Generated water fills a channel incised by
//    its own depth (bankfull water is level with its banks), so runoff pools
//    beside rivers drain into them and can dry and recede.
//  - climate-water/4: the same, and water ponded on land (overland water
//    waiting to run downhill) soaks in. Each soil day the cell's ponded water
//    evaporates at this potential first (the soil beneath gets what potential is
//    left) and the rest joins the cell's rain under the same infiltration law;
//    what the soil cannot take runs on downhill as before. Without it ponded water
//    could only move downhill or wait, so it built up on unsaturated land and kept
//    flooding new pools.
// The rule travels in the day's climate (climate.evaporation) so every soil and
// open-water day, resident or archived, follows its own world's recorded rule.
export const CLIMATE_WATER=Object.freeze({policy:'climate-water/4',discharge:'climate-water/3',pools:'climate-water/2',soil:'climate-water/1',freezing:.30,perDegree:.085,dischargeFraction:.25});
const RULES=[CLIMATE_WATER.soil,CLIMATE_WATER.pools,CLIMATE_WATER.discharge,CLIMATE_WATER.policy];
const rank=climate=>RULES.indexOf(climate?.evaporation)+1;
export const climateWaterPolicy=value=>RULES.includes(value);
export function temperaturePotential(temperature){return CLIMATE_WATER.perDegree*Math.max(0,temperature-CLIMATE_WATER.freezing)}
export const poolEvaporation=climate=>rank(climate)>=2;
export const riverDischarge=climate=>rank(climate)>=3;
export const pondedRunOn=climate=>rank(climate)>=4;
