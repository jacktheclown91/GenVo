// Presentation definitions belong to cataloged parts, not the creature coordinator.
// Extent is normalized retraction/folding, not a world movement or anatomy trait.
const actions=Object.freeze(['idle','eat','drink','walk','swim','court']);
function definition(partId,motion){
 const channels=Object.freeze({extent:Object.freeze({min:.25,max:1,neutral:1,maxSpeed:2})});
 const responses=Object.freeze([
  Object.freeze({signal:'fatigue',channel:'extent',target:.4,gain:1,priority:1,attackSeconds:.3,releaseSeconds:.4,actions}),
  Object.freeze({signal:'pain',channel:'extent',target:.25,gain:1,priority:2,attackSeconds:.15,releaseSeconds:.4,actions})
 ]);
 return Object.freeze({partId,version:1,motion,channels,responses});
}
export const PART_ANIMATIONS=Object.freeze({
 'stalk-eye':definition('stalk-eye','stalk-retraction'),
 'display-frill':definition('display-frill','frill-fold')
});
export function animationForPart(partId){return PART_ANIMATIONS[partId]??null;}
export function expressionForNode(node){
 const definition=animationForPart(node.partId);
 return definition?{id:node.id,channels:definition.channels,responses:definition.responses}:null;
}
