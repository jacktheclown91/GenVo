// Native information-window navigation is UI input, not a biological action.
const navigationKeys=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End','Tab','Enter','NumpadEnter','Space']);
export function informationNavigationEvent(event){
 if(!['keydown','keyup'].includes(event.type)||event.code==='Escape')return false;
 const target=event.target;if(!target?.closest?.('.detail-panel,.journal-page,#fieldGuide'))return false;
 return navigationKeys.has(event.code)||!!target.closest('input,textarea,select,[contenteditable="true"]');
}
