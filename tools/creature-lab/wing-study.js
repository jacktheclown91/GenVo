import {winged,flightLoading,FLIGHT} from '../../src/lineage/flight.js';
import {aerialPose} from '../../src/render/aerial-presentation.js';

// Articulation only: the specimen keeps its ground stance. The shared game
// authority still checks takeoff, development, reserves, health and terrain.
export function wingStudyPose(animal,frame=0){
  if(!winged(animal))return null;
  const stroke=aerialPose({mode:'fly',phase:frame,age:1});
  return {flightSpread:stroke.flightSpread,wingSweep:stroke.wingSweep,wingFrame:stroke.wingFrame};
}

export function wingStudyReading(animal){
  if(!winged(animal))return {available:false,text:'An inherited flight wing is needed for this articulation study.'};
  const loading=flightLoading(animal);
  return {available:true,loading,limit:FLIGHT.maxAdultMass,
    text:'Wing motion study · ground stance · loading '+loading.toFixed(2)+' / '+FLIGHT.maxAdultMass.toFixed(2)+'. Takeoff is checked in the game against development, reserves, health and support.'};
}
