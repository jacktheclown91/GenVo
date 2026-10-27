// One visible, enabled real control per coach. Presentation never invokes it.
export const visibleTutorialControl=element=>!!element&&!element.closest?.('[hidden]')&&
  (!element.getClientRects||element.getClientRects().length>0);
export class TutorialControlCue{
  constructor(root=globalThis.document){this.root=root;this.highlighted=new Set()}
  query(selector){return[...(this.root?.querySelectorAll?.(selector)||[])].filter(visibleTutorialControl)}
  clear(){
    for(const element of this.highlighted){
      element.classList.remove('tutorial-next');delete element.dataset.tutorialCue;
      const ids=(element.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!=='tutorial');
      if(ids.length)element.setAttribute('aria-describedby',ids.join(' '));else element.removeAttribute('aria-describedby');
    }
    this.highlighted.clear();
  }
  setCue(element,action){
    if(element&&(element.disabled||element.getAttribute('aria-disabled')==='true'))element=null;
    if(!element||!this.highlighted.has(element)){
      this.clear();
      if(element){element.classList.add('tutorial-next');element.dataset.tutorialCue=action;
        element.setAttribute('aria-describedby',[element.getAttribute('aria-describedby'),'tutorial'].filter(Boolean).join(' '));this.highlighted.add(element)}
    }
  }
}
