// Paired groundwater exchange across a real border of two synchronized,
// independently owned planetary regions. Groundwater remains solely in each
// World.soilWater.groundwater (Float32). This module stages a proposed flux;
// the existing planetary seam transaction checks and publishes both sides.
// Older worlds without this explicit policy retain closed land borders.
import {SOIL_WATER} from '../ecology/soil-water.js';

export const PLANETARY_SEAM_GROUNDWATER=Object.freeze({
 schema:1,policy:'paired-land-groundwater/1'
});

export function validateSeamGroundwaterPolicy(w,soil){
 if(soil?.seamGroundwaterPolicy===undefined)return;
 if(soil.seamGroundwaterPolicy!==PLANETARY_SEAM_GROUNDWATER.policy||
    w?.generator!=='planetary/1'||soil.schema!==1||
    !(soil.groundwater instanceof Float32Array)||soil.groundwater.length!==w.len)
  throw Error('Invalid planetary seam-groundwater policy.');
 for(const name of ['seamGroundwaterInput','seamGroundwaterOutput'])
  if(soil.totals?.[name]!==undefined&&
     (!Number.isFinite(soil.totals[name])||soil.totals[name]<0))
   throw Error('Invalid planetary seam-groundwater totals.');
 for(const row of [...(soil.daily||[]),...(soil.lastDay?[soil.lastDay]:[])])
  if(['seamGroundwaterInput','seamGroundwaterOutput'].some(name=>
    row[name]!==undefined&&(!Number.isFinite(row[name])||row[name]<0||
    (name==='seamGroundwaterInput'?row.inputs:row.outputs)+1e-6<row[name])))
   throw Error('Invalid planetary seam-groundwater receipt.');
}

export function stagePlanetarySeamGroundwater(a,b,i,j,changes,receipts,day,tick){
 const rule=PLANETARY_SEAM_GROUNDWATER.policy;
 if(a.soil?.seamGroundwaterPolicy!==rule||b.soil?.seamGroundwaterPolicy!==rule)
  return 0;
 if(a.water[i]||b.water[j])return 0; // Wet-land exchange belongs to the local soil authority.
 if(!a.terrain?.elevation||!b.terrain?.elevation)
  throw Error('Paired groundwater requires actual terrain.');
 const ga=a.soil.groundwater,gb=b.soil.groundwater,
   da=changes.get(a.key).get(i)||0,db=changes.get(b.key).get(j)||0,
   aStock=ga[i]+da,bStock=gb[j]+db;
 if(!Number.isFinite(aStock)||!Number.isFinite(bStock)||
    aStock<0||bStock<0||aStock>1+1e-6||bStock>1+1e-6)
  throw Error('Invalid cross-region groundwater stock.');
 const head=(a.terrain.elevation[i]+aStock)-(b.terrain.elevation[j]+bStock);
 if(!Number.isFinite(head))throw Error('Invalid cross-region groundwater head.');
 if(Math.abs(head)<1e-12)return 0;
 const donor=head>0?a:b,receiver=head>0?b:a,
   fi=head>0?i:j,ti=head>0?j:i,
   available=head>0?aStock:bStock,
   capacity=head>0?1-bStock:1-aStock;
 const amount=Math.min(Math.abs(head)*SOIL_WATER.lateral*.25,
    available*.25,Math.max(0,capacity));
 if(!(amount>1e-12))return 0;
 const debit=changes.get(donor.key),credit=changes.get(receiver.key);
 debit.set(fi,(debit.get(fi)||0)-amount);
 credit.set(ti,(credit.get(ti)||0)+amount);
 const key=a.key+'|'+b.key;
 let receipt=receipts.get(key);
 if(!receipt){receipt={tick,day,a:a.key,b:b.key,aToB:0,bToA:0};receipts.set(key,receipt)}
 if(head>0)receipt.groundwaterAToB=(receipt.groundwaterAToB||0)+amount;
 else receipt.groundwaterBToA=(receipt.groundwaterBToA||0)+amount;
 return amount;
}
