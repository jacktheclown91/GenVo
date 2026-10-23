// Shared-file transforms are proposals, never independent biological changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const portraitBaseSha='2a854dddea3245daab2ea6ae7bfad5c4b66458d19e6f2815855a92cee2f673e3';
const changes={
 'src/ui/lineage-comparison.js':[
 ["import {drawLineagePortrait} from '../render/lineage-portrait.js';","import {drawLineagePortrait,lineagePortraitBounds} from '../render/lineage-portrait.js';"],
 ['genes:parent.genes,adaptations:', 'genes:parent.genes,pigmentGenome:parent.pigmentGenome||null,lifestyle:parent.ecoLifestyle||null,adaptations:'],
 ['genes:animal?.genes||record.genes,adaptations:', 'genes:animal?.genes||record.genes,pigmentGenome:animal?.pigmentGenome||record.pigmentGenome||null,lifestyle:animal?.ecoLifestyle||null,adaptations:'],
 ['creatureFootprint(migrateLegacyReadings({id:m.id,genes:m.genes,adaptations:m.adaptations,anatomy:m.anatomy||{},bodyPlan:m.bodyPlan}),2)', 'lineagePortraitBounds(m.genes,{bodyPlan:m.bodyPlan,adaptations:m.adaptations,anatomy:m.anatomy,pigmentGenome:m.pigmentGenome,lifestyle:m.lifestyle,dir:2})'],
 ['bodyPlan:m.bodyPlan,adaptations:m.adaptations,anatomy:m.anatomy,dir:2', 'bodyPlan:m.bodyPlan,adaptations:m.adaptations,anatomy:m.anatomy,pigmentGenome:m.pigmentGenome,lifestyle:m.lifestyle,dir:2']],
 'src/ui/journal.js':[['record.genes,{frame:2','record.genes,{pigmentGenome:record.pigmentGenome||null,frame:2']],
 'src/ui/young-summary.js':[['bodyPlan:child.bodyPlan,anatomy:child.anatomy','pigmentGenome:child.pigmentGenome||null,lifestyle:child.ecoLifestyle||null,bodyPlan:child.bodyPlan,anatomy:child.anatomy']],
 'src/ui/resident-start.js':[['bodyPlan:a.bodyPlan,anatomy:a.anatomy','pigmentGenome:a.pigmentGenome||null,lifestyle:a.ecoLifestyle||null,bodyPlan:a.bodyPlan,anatomy:a.anatomy']],
 'src/ui/succession-chooser.js':[['portrait:{genes:{...h.genes},bodyPlan:', 'portrait:{genes:{...h.genes},pigmentGenome:h.pigmentGenome?structuredClone(h.pigmentGenome):null,bodyPlan:'],['bodyPlan:c.portrait.bodyPlan,frame:', 'pigmentGenome:c.portrait.pigmentGenome||null,bodyPlan:c.portrait.bodyPlan,frame:']],
 'src/ui/generation-reveal.js':[['fromGenes:fromRecord?.genes||toRecord.genes,toGenes:toRecord.genes,','fromGenes:fromRecord?.genes||toRecord.genes,toGenes:toRecord.genes,fromPigmentGenome:fromRecord?.pigmentGenome?structuredClone(fromRecord.pigmentGenome):null,toPigmentGenome:toRecord.pigmentGenome?structuredClone(toRecord.pigmentGenome):null,']],
 'src/ui/tutorial.js':[['bodyPlan:model.fromPlan,adaptations:', 'pigmentGenome:model.fromPigmentGenome||null,bodyPlan:model.fromPlan,adaptations:'],['bodyPlan:model.toPlan,adaptations:', 'pigmentGenome:model.toPigmentGenome||null,bodyPlan:model.toPlan,adaptations:'],['bodyPlan:this.currentReveal.toPlan,adaptations:', 'pigmentGenome:this.currentReveal.toPigmentGenome||null,bodyPlan:this.currentReveal.toPlan,adaptations:']]
};
function candidateFile(file,source){if(file==='src/render/lineage-portrait.js'){if(crypto.createHash('sha256').update(source).digest('hex')!==portraitBaseSha)throw Error('Shared portrait source drift: review before staging');return fs.readFileSync(path.join(__dirname,'presentation/lineage-portrait-v1.js'),'utf8')}const edits=changes[file];if(!edits)return source;for(const[a,b]of edits){if(source.split(a).length!==2)throw Error('Portrait source changed: '+file+' anchor '+a);source=source.replace(a,b)}if(file==='src/ui/lineage-comparison.js')source=source.replace("import {migrateLegacyReadings} from '../lineage/readings.js';",'').replace("import {creatureFootprint} from '../render/creature-footprint.js';",'');return source}
module.exports={candidateFile,files:['src/render/lineage-portrait.js',...Object.keys(changes)]};
