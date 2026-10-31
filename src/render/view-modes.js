// Player viewing modes (creator playtest direction 2026-10-22). Presentation
// only: perception, AI sensing, interaction legality and saves are unchanged.
// Every mode keeps live organisms, carrion, dens, sites and tracks limited to
// what the creature actually senses; modes differ only in how much known or
// environmental scenery is drawn outside that view.
//  biological  strict anatomical viewpoint, softened edges
//  comfort     the land (terrain and water) readable everywhere, remembered
//              ground lighter; plants and live layers only where sensed (default)
//  sandbox     the whole environment (terrain and vegetation) dimmed outside
//              sight, explicitly presentation-only
export const VIEW_MODES=Object.freeze({
 biological:Object.freeze({label:'Biological Vision',fog:[.96,.8,0],clipVegetation:true,note:'Only what your creature senses; everything else stays dark.'}),
 comfort:Object.freeze({label:'Comfort View',fog:[.54,.28,0],clipVegetation:true,note:'The land stays readable around you; plants, carcasses and creatures appear only when your creature senses them.'}),
 sandbox:Object.freeze({label:'Sandbox View',fog:[.3,.2,0],clipVegetation:false,note:'Shows the whole landscape and its plants for viewing. Creatures, carcasses and dens still need your senses.'})
});
export const DEFAULT_VIEW_MODE='comfort';
const KEY='genvo.viewMode';
let current=null;
export function viewMode(){
 if(current)return current;
 try{const stored=globalThis.localStorage?.getItem(KEY);current=VIEW_MODES[stored]?stored:DEFAULT_VIEW_MODE}catch{current=DEFAULT_VIEW_MODE}
 return current;
}
export function setViewMode(mode){
 if(!VIEW_MODES[mode])throw Error('Unknown view mode: '+mode);
 current=mode;try{globalThis.localStorage?.setItem(KEY,mode)}catch{}
 return mode;
}
