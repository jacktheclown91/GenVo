// Read-only presentation: caller supplies the unchanged canonical diagnostic message.
const views=new WeakMap();
export function processingNoticeModel(status,message){
 if(!message)return null;
 const regional=!!status?.load?.regionalWork;
 return{title:regional?'Life beyond this view':'The world is busy',body:regional?'Life in visited regions is updating.':'Responses may be slower while updates finish.',detail:message};
}
export function renderProcessingNotice(el,status,message){
 if(!el)return;const model=processingNoticeModel(status,message);el.hidden=!model;if(!model)return;
 let v=views.get(el);if(!v){const doc=el.ownerDocument,title=doc.createElement('strong'),body=doc.createElement('p'),details=doc.createElement('details'),summary=doc.createElement('summary'),detail=doc.createElement('p');
  title.style.cssText='display:block;color:#e1cc94;font:600 14px/1.35 Georgia,serif';body.style.cssText='margin:3px 0;color:#e8e0bd;font:13px/1.4 sans-serif';details.style.cssText='pointer-events:auto;margin-top:5px;font:12px/1.4 sans-serif';summary.textContent='Update details';summary.dataset.processingDisclosure='';details.className='processing-notice-details';for(const type of ['keydown','keyup'])summary.addEventListener(type,e=>{if(['Space','Enter','NumpadEnter'].includes(e.code))e.stopPropagation()});summary.style.cssText='cursor:pointer;color:#c9cfae';detail.style.cssText='margin:5px 0 0;color:#d6d3b7';details.append(summary,detail);el.replaceChildren(title,body,details);v={title,body,details,detail};views.set(el,v);
 }
 for(const key of ['title','body','detail'])if(v[key].textContent!==model[key])v[key].textContent=model[key];
}
