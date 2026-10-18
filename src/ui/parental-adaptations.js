import {ADAPTATIONS} from '../lineage/evolution.js';
// Observed phenotypes are evidence about parents, not a probability distribution
// over the child's recombined body. This presentation must never synchronize anatomy.
export function parentalAdaptationText(a,b){
  const first=new Set(a?.adaptations||[]),second=new Set(b?.adaptations||[]),ids=[...new Set([...first,...second])];
  if(!ids.length)return 'No expressed adaptations observed in either parent. New inherited variation can still occur.';
  const rows=ids.map(id=>{const def=ADAPTATIONS[id],owner=first.has(id)&&second.has(id)?'both parents':first.has(id)?'you':'partner';return `${def?.name||id} (${owner})${def?.summary?`: ${def.summary}`:''}${def?.tradeoff?` ${def.tradeoff}`:''}`});
  return rows.join('\n  ')+'\n  Young can inherit a different body. These parental traits do not guarantee the same abilities in offspring.';
}
