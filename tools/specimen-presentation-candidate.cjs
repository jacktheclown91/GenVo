// Strict review transform for the shared FieldGuide; no simulation edits.
const edits=[
  [
    "this.page='creatures';",
    "this.catalogOpen=false;this.el.addEventListener('toggle',e=>{if(e.target.matches?.('.specimen-catalog'))this.catalogOpen=e.target.open},{capture:true});this.specimenId=null;this.specimenDir=3;this.page='creatures';"
  ],
  [
    "const t=e.target.closest('[data-page]');",
    "const turn=e.target.closest('[data-specimen-turn]');if(turn){this.specimenDir=(this.specimenDir+Number(turn.dataset.specimenTurn)+8)%8;this.key=null;this.render()}const specimen=e.target.closest('[data-specimen]');if(specimen){this.catalogOpen=false;this.specimenId=specimen.dataset.specimen;this.specimenDir=3;this.key=null;this.render()}const t=e.target.closest('[data-page]');"
  ],
  [
    "name:'Your current creature',animal:player,known:true",
    "name:'Your current creature',animal:player,known:true,current:true"
  ],
  [
    "const key=JSON.stringify([this.page,",
    "const selected=creatures.find(c=>c.key===this.specimenId)||creatures[0];this.specimenId=selected?.key||null;const key=JSON.stringify([this.specimenId,this.specimenDir,this.page,"
  ],
  [
    "<section class=\"fg-creatures\"><h3>Creatures</h3><div class=\"fg-cards\">",
    "<section class=\"fg-creatures\"><details class=\"specimen-catalog\" ${this.catalogOpen?'open':''}><summary>Observed body collection · ${creatures.length}</summary><p class=\"fg-note\">Choose a retained body to study its specimen sheet.</p><div class=\"fg-cards\">"
  ],
  [
    "<figure class=\"${c.known?'':'unknown'} ${c.special?'special':''}\">",
    "<figure class=\"${c.key===selected?.key?'specimen-selected':''} ${c.known?'':'unknown'} ${c.special?'special':''}\">"
  ],
  [
    "<canvas data-c=\"${i}\" width=\"96\" height=\"76\"></canvas>",
    "<button type=\"button\" data-specimen=\"${esc(c.key)}\" aria-pressed=\"${c.key===selected?.key}\" aria-label=\"Study ${esc(c.name)}\"><canvas data-c=\"${i}\" width=\"96\" height=\"76\"></canvas></button>"
  ],
  [
    "</figure>`).join('')}</div>${(()=>{const notes=creatures",
    "</figure>`).join('')}</div></details>${selected?specimenSheetHTML(selected,this.getSim(),this.specimenDir):''}${(()=>{const notes=creatures"
  ],
  [
    "    this.el.querySelectorAll('canvas[data-c]')",
    "    if(selected)drawSpecimenSheet(this.el,selected,this.specimenDir);\n    this.el.querySelectorAll('canvas[data-c]')"
  ],
  [
    "id:player.bodyPlan.id,name:'Your current creature'",
    "id:player.bodyPlan.id,key:'current:'+player.bodyPlan.id,name:'Your current creature'"
  ],
  [
    "seen.add(player.bodyPlan.id)",
    "/* The live specimen and a retained example may share an anatomy. */"
  ],
  [
    "id:animal.bodyPlan.id,name:animal.name",
    "id:animal.bodyPlan.id,key:'observed:'+animal.bodyPlan.id,name:animal.name"
  ]
];
function candidateGuide(s){s="import {specimenSheetHTML,drawSpecimenSheet} from '../../assets/ui/specimen-sheet.js';\n"+s;for(const[a,b]of edits){if(s.split(a).length!==2)throw Error('Field guide changed: review integration anchor');s=s.replace(a,b)}return s}
function candidateMain(s){const anchor='onObserve:a=>{sim.discovery.noteCreatureAppearance(a);fieldGuide.setOpen(true)}';if(s.split(anchor).length!==3)throw Error('Observe callback changed: coordinate integration');return s.split(anchor).join("onObserve:a=>{sim.discovery.noteCreatureAppearance(a);fieldGuide.specimenId=a.bodyPlan?.id?'observed:'+a.bodyPlan.id:null;fieldGuide.page='creatures';fieldGuide.catalogOpen=false;fieldGuide.setOpen(true)}")}
module.exports={candidateGuide,candidateMain};
