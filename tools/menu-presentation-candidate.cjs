// Inspection/integration preparation only. Fail if the shared-owner source moved.
exports.candidateFrontEnd=function(source){
 const anchor="for(const b of this.el.querySelectorAll('#newWorldCreatureCards [data-creature]'))b.setAttribute('aria-checked',String(b.dataset.creature===creature));";
 const title="title.textContent=o.textContent.replace(/^Evolved: /,'').replace(/ Â· Day \\d+$/,'');";
 if(!source.includes(anchor)||!source.includes(title))throw Error('Shared front-end source changed; review integration patch before use.');
 source=source.replace(anchor,anchor+`
    // Presentation labels follow the selected existing world, not a new founder.
    const recorded=this.el.querySelector('#newWorldCreatureCards [data-creature="recorded"]'),fresh=start?.value==='new';
    if(recorded){recorded.querySelector('b').textContent=fresh?'Walker':'Recorded lineage';recorded.querySelector('span').textContent=fresh?'A plain four-legged founder. Learn the land, then evolve it your way.':'Continue the living lineage recorded in this world.';}
`);
 source=source.replace(title,"const entry=this.catalog.find(c=>o.value==='catalog:'+c.id);title.textContent=entry?entry.label.replace(/[,Â·]\\s*Day\\s+\\d+$/,'')+' Â· Day '+entry.day:o.textContent.replace(/^Evolved: /,'');");
 return source;
};
