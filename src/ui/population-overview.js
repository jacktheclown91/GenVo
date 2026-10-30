// Read-only population presentation. Every number and label is supplied by
// authoritative simulation snapshots in inspector.js. Never create ecology,
// a census event, an evolutionary outcome or an inferred habitat condition here.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const card=(label,value,detail='')=>`<div><b>${esc(label)}</b><strong>${esc(value)}</strong>${detail?`<span>${esc(detail)}</span>`:''}</div>`;
const plural=(n,singular,pluralLabel=singular+'s')=>`${n} ${n===1?singular:pluralLabel}`;

/**
 * The first reading answers three questions:
 * How many animals are alive? How is my family doing? What do we know of
 * its habitat? Species totals and lineage authority remain one click away.
 */
export function populationOverviewHTML({
 total=0,speciesRows=[],activeTaxon='GenVo',lifestyle=null,
 rangeStatus='UNMEASURED',forage=null,competitors=0,
 familyActive=0,dependents=0,adultLineage=0,familiarCells=0,
 guidance='Autonomous'
}={}){
 const measured=typeof forage==='number'&&Number.isFinite(forage);
 const forageReading=measured?`${Math.round(Math.max(0,Math.min(1,forage))*100)}% forage`:'Forage not measured';
 const familyCount=Number(familyActive)||0,dependentCount=Number(dependents)||0;
 return `<p class="knowledge-summary">Living creatures, family and habitat first. Open the census for species details; the records below explain long-term ecology.</p>
  <div class="panel-summary" aria-label="Population at a glance">
    ${card('LIVING ANIMALS',plural(total,'animal'),'All living taxa in this world')}
    ${card('YOUR FAMILY',plural(familyCount,'member'),plural(dependentCount,'dependent')+' · recorded relationships and care')}
    ${card('HABITAT',rangeStatus,forageReading+' · '+plural(competitors,'competitor'))}
  </div>
  <details class="knowledge-fold" data-section="population-census">
    <summary data-focus-key="population-census">Species census &amp; lineage guidance</summary>
    <div class="panel-section">
      <p>Living animals by kind: ${esc(speciesRows.join(' · ')||'No species counts recorded')}</p>
      <div class="panel-summary">
        ${card('ACTIVE TAXON',activeTaxon,lifestyle?`${lifestyle} lifestyle`:'Lifestyle not established')}
        ${card('LINEAGE GUIDANCE',guidance,`${plural(adultLineage,'lineage adult')} · ${plural(familiarCells,'familiar cell')}`)}
      </div>
      <p>Guidance describes the existing lineage command state. It does not change which creatures you control.</p>
    </div>
  </details>`;
}
