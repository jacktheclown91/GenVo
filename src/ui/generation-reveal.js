import {traitListText,visualChanges} from '../lineage/adaptation.js';

export function buildGenerationReveal({bringsText='',handoff,fromRecord,toRecord,pressureText='No one pressure dominated.',causeText='',strategyText='',careText='',divergenceText='',divergenceChip='',progressionText='',progressionChip='',populationHistoryText='',populationHistoryChip='',protoText='',inheritedMovement=null,protoChip='',speciesText='',speciesChip='',lifestyleText='',lifestyleChip='' }={}){
  if(!handoff||!toRecord)return null;
  const fromGen=fromRecord?.generation??Math.max(1,(toRecord.generation||handoff.generation)-1),toGen=toRecord.generation??handoff.generation;
  const visible=visualChanges(toRecord.genes,fromRecord?.genes,{limit:4});
  const inherited=traitListText(handoff.changes,{empty:'little inherited change'});
  const founder=traitListText(handoff.founderChanges,{empty:'still close to the founder'});
  let relation='descendant';
  if(fromRecord){
    if(toRecord.parentIds?.includes(fromRecord.id)){
      relation=toRecord.sex==='female'?'daughter':toRecord.sex==='male'?'son':'child';
      relation+=` of #${fromRecord.id}`;
    }else if(toGen>fromGen+1){
      relation=toRecord.sex==='female'?'granddaughter':toRecord.sex==='male'?'grandson':'descendant';
      relation+=` of #${fromRecord.id}`;
    }else if(fromGen===toGen){
      relation=`kin of #${fromRecord.id}`;
    }else{
      relation=`descendant of #${fromRecord.id}`;
    }
  }

  let kicker='NEXT GENERATION',title=`Generation ${toGen} begins`,lead=`You take over as #${toRecord.id} (${relation}).`,button=`Play Generation ${toGen}`;
  if(handoff.newlyEstablished){kicker='LINE ESTABLISHED';title='Generation 8 reached';lead=`Eight generations survived. You take over as #${toRecord.id} (${relation}) to carry the family forward.`;button='Keep going'}
  else if(handoff.reason==='death'){
    kicker='THE FAMILY CONTINUES';
    if(fromGen===toGen){
      title=`Generation ${toGen} continues`;
      lead=`Generation ${fromGen} #${fromRecord?.id??'?'} died${causeText?` from ${causeText}`:''}. Control passes to #${toRecord.id} (${relation}).`;
      button=`Continue Generation ${toGen}`;
    }else{
      title=`Generation ${fromGen} → ${toGen}`;
      lead=`Generation ${fromGen} #${fromRecord?.id??'?'} died${causeText?` from ${causeText}`:''}. You take over as #${toRecord.id} (${relation}).`;
    }
  }
  const chips=visible.length?visible.map(v=>v.phrase):['little visible change'];
  // v1.57.0: body part changes (from the editor or from inheritance) lead the list.
  {const before=new Set(fromRecord?.bodyPlanParts||[]),now=toRecord.bodyPlanParts||[],gained=now.filter(id=>!before.has(id)),lost=[...before].filter(id=>!now.includes(id)),nice=id=>id.replace(/-/g,' ');
   if(gained.length||lost.length){if(chips[0]==='little visible change')chips.length=0;chips.unshift(...lost.slice(0,2).map(id=>`lost ${nice(id)}`),...gained.slice(0,3).map(id=>`new ${nice(id)}`))}}if(divergenceChip)chips.unshift(divergenceChip);if(progressionChip)chips.unshift(progressionChip);if(populationHistoryChip)chips.unshift(populationHistoryChip);if(protoChip)chips.unshift(protoChip);if(speciesChip)chips.unshift(speciesChip);if(lifestyleChip)chips.unshift(lifestyleChip);if(handoff.crossTaxon)chips.unshift(`LEAD · ${(handoff.toTaxon?.label||'DESCENDANT TAXON').toUpperCase()}`);
  const details=[
    ['Inherited',inherited],
    ['Since the founder',founder],
    ['Last generation faced',pressureText]
  ];
  // Genuine functional thresholds are visible at a glance on the new body.
  // Terrain, energy and conditions still decide when those actions can execute.
  if(inheritedMovement?.gained?.length){
    chips.unshift(...inheritedMovement.gained.slice(0,2).map(v=>`BODY CAN ${v.label.toUpperCase()}`));
    details.unshift(['Inherited movement',`This descendant has the body structure to ${inheritedMovement.gained.map(v=>v.label).join(' and ')} when conditions allow.`]);
  }
  if(inheritedMovement?.lost?.length)details.push(['Movement no longer available',inheritedMovement.lost.map(v=>v.label).join(' · ')]);
  if(handoff.bornAdaptations?.length){details.unshift(['Born with',`${handoff.bornAdaptations.join(' · ')}, a new adaptation its parents did not have`]);chips.unshift(`born with ${handoff.bornAdaptations[0].toLowerCase()}`)}
  if(divergenceText){details.push(['Lineage form',divergenceText]);if(!handoff.newlyEstablished&&handoff.reason!=='death')lead=`You take over as #${toRecord.id} (${relation}). How the family lived has begun shaping this body.`}
  if(progressionText)details.push(['New ecological test',progressionText]);
  if(populationHistoryText)details.push(['Population upbringing',populationHistoryText]);
  if(protoText){details.push(['Proto-divergence',protoText]);if(!handoff.newlyEstablished&&handoff.reason!=='death')lead=`You take over as #${toRecord.id} (${relation}). Separate population pressures have begun leaving inherited differences.`}
  if(speciesText){details.push(['Species split',speciesText]);kicker='SPECIES SPLIT';lead=`You take over as #${toRecord.id} (${relation}), a descendant of a population crossing the species threshold.`}
  if(lifestyleText){details.push(['Species lifestyle',lifestyleText]);if(!speciesText&&!handoff.newlyEstablished&&handoff.reason!=='death')lead=`You take over as #${toRecord.id} (${relation}) inside a taxon whose repeated way of living has become a recognizable ecological lifestyle.`}
  if(careText)details.push(['Upbringing',careText]);
  if(handoff.preparedness){const p=handoff.preparedness,prep=p.fieldReady?`field-ready · ${p.routes}/2 solo routes`:`${p.label} · ${p.lessons}/4 lessons · ${Math.round((p.independence||0)*100)}% independent`;details.push(['Takeover readiness',prep])}
  if(strategyText)details.push(['Lineage strategy',strategyText]);
  if(handoff.crossTaxon){details.push(['Leadership shift',`${handoff.fromTaxon?.label||'Previous taxon'} → ${handoff.toTaxon?.label||'descendant taxon'} · family guidance now defaults to the active taxon.`]);if(!speciesText&&!handoff.newlyEstablished&&handoff.reason!=='death')lead=`You take over as #${toRecord.id} (${relation}) inside ${handoff.toTaxon?.label||'a descendant taxon'}. Other living branches remain autonomous unless you explicitly guide the whole lineage.`}
  // v1.33.5: one line on what this creature brings beyond its body: its habits and what it knows.
  if(bringsText){details.unshift(['What it brings',bringsText]);lead=`${lead} What it brings: ${bringsText}.`}
  if(handoff.reason==='death'&&causeText)details.unshift(['Cause of death',causeText]);
  return{generation:toGen,kicker,title,lead,button,fromLabel:fromRecord?`Generation ${fromGen} #${fromRecord.id}`:`Generation ${fromGen}`,toLabel:`Generation ${toGen} #${toRecord.id} (${relation})`,chips,details,fromGenes:fromRecord?.genes||toRecord.genes,toGenes:toRecord.genes,fromPigmentGenome:fromRecord?.pigmentGenome?structuredClone(fromRecord.pigmentGenome):null,toPigmentGenome:toRecord.pigmentGenome?structuredClone(toRecord.pigmentGenome):null,fromPlan:fromRecord?.bodyPlan||null,toPlan:toRecord.bodyPlan||null,fromAdaptations:[...(fromRecord?.adaptations||[])],toAdaptations:[...(toRecord.adaptations||[])],fromDivergence:fromRecord?.divergence||null,toDivergence:toRecord?.divergence||null,fromProtoTrait:fromRecord?.protoTrait||null,toProtoTrait:toRecord?.protoTrait||null,fromSpeciesBranch:fromRecord?.speciesBranch||null,toSpeciesBranch:toRecord?.speciesBranch||null,fromLifestyle:fromRecord?.speciesLifestyle||null,toLifestyle:toRecord?.speciesLifestyle||null,established:!!handoff.newlyEstablished};
}
