export const escapePanel=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A window has one fixed header, one scroll owner and an optional fixed footer.
export function knowledgeWindowHTML(html){
 const header=html.match(/^\s*<header\b[\s\S]*?<\/header>/)?.[0];if(!header)return html;
 let content=html.slice(header.length);const footer=content.match(/<footer\b[\s\S]*?<\/footer>\s*$/)?.[0]||'';if(footer)content=content.slice(0,content.length-footer.length);
 return header+'<div class="knowledge-scroll" data-focus-key="information-scroll" tabindex="0" aria-label="Scrollable information">'+content+'</div>'+footer;
}
export function updateKnowledgeHTML(el,html){
 if(el.classList.contains('knowledge-panel'))html=knowledgeWindowHTML(html);
 if(el._knowledgeHTML===html)return;const scrollOwner=el.querySelector('.knowledge-scroll,.journal-scroll')||el,scroll=scrollOwner.scrollTop,open=new Map([...el.querySelectorAll('details')].map(d=>[d.dataset.section||d.querySelector('summary')?.textContent,d.open])),focused=el.contains(document.activeElement)?document.activeElement:null,key=focused?.dataset.focusKey;
 el.innerHTML=html;el._knowledgeHTML=html;for(const d of el.querySelectorAll('details')){const id=d.dataset.section||d.querySelector('summary')?.textContent;if(open.has(id))d.open=open.get(id)}(el.querySelector('.knowledge-scroll,.journal-scroll')||el).scrollTop=scroll;
 installKnowledgeSizeControl(el);
 if(key)[...el.querySelectorAll('[data-focus-key]')].find(n=>n.dataset.focusKey===key)?.focus({preventScroll:true});
}
export function knowledgeFold(title,text,key='biology'){return `<details class="knowledge-fold" data-section="${escapePanel(key)}"><summary data-focus-key="${escapePanel(key)}">${escapePanel(title)}</summary><div class="knowledge-data">${escapePanel(text)}</div></details>`}

// Expand the existing window without creating another scroll or information owner.
export function installKnowledgeSizeControl(el){const window=el.classList.contains('knowledge-panel')?el:el.querySelector('.knowledge-panel'),header=window?.querySelector(':scope>header');if(!header)return;window.classList.toggle('knowledge-expanded',!!el._knowledgeExpanded);let button=header.querySelector('[data-knowledge-size]');if(!button){button=document.createElement('button');button.type='button';button.dataset.knowledgeSize='toggle';button.dataset.focusKey='window-size';header.append(button)}const update=()=>{button.textContent=el._knowledgeExpanded?'Restore':'Expand';button.setAttribute('aria-label',el._knowledgeExpanded?'Restore information window':'Expand information window');button.setAttribute('aria-pressed',String(!!el._knowledgeExpanded))};button.onclick=()=>{el._knowledgeExpanded=!el._knowledgeExpanded;window.classList.toggle('knowledge-expanded',el._knowledgeExpanded);update()};update();}
