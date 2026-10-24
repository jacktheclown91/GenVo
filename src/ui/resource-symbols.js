// Original field-guide symbols: object classes, never fabricated specimens or events.
const symbols={
 object:['World object','M35 7L61 29L35 51L9 29ZM35 20a9 9 0 1 0 0 18a9 9 0 1 0 0-18'],
 water:['Water','M6 35Q13 29 20 35T34 35T48 35T62 35M6 45Q13 39 20 45T34 45T48 45T62 45M35 5C29 15 24 20 24 25a11 11 0 0 0 22 0C46 20 41 15 35 5Z'],
 ground:['Ground','M6 29L22 21L38 25L53 16L64 24M6 35L20 32L35 36L49 30L64 34M6 44L19 41L34 45L50 39L64 43M17 22l2-9m-2 5l-5-4m7 3l5-5'],
 cave:['Cave opening','M6 48L12 25L25 10L41 7L57 23L64 48ZM23 48V35Q23 22 35 22Q47 22 47 35V48M12 25l10 4m20-18l-2 7'],
 shelter:['Shelter','M7 45L14 22L35 10L56 22L63 45M13 22L35 28L57 22M35 28v20M14 35l21 6l21-6M20 17l5 8m20-8l-5 8'],
 nest:['Nest','M9 31Q35 20 61 31Q58 49 35 51Q12 49 9 31ZM9 31Q35 42 61 31M13 40l12 7m32-7l-12 7M17 24l11 7m24-7l-11 7M21 35l4 11m24-11l-4 11'],
 egg:['Egg','M35 7C25 7 18 26 18 37a17 17 0 0 0 34 0C52 26 45 7 35 7ZM26 25q-5 9-3 15'],
 trace:['Trail','M13 48Q34 45 28 28T53 7M12 37l5-4m-4-2l4 1M43 20l6-2m-5-5l4 2'],
 corpse:['Organic remains','M8 35Q9 22 21 20Q32 17 34 28Q36 39 24 45Q10 49 8 35ZM42 17Q49 12 58 20L62 29Q56 34 48 29Q39 26 42 17ZM43 40Q48 35 55 40L58 48Q47 53 41 47ZM16 29q8-5 12 3M48 20l6 3'],
 site:['World site','M12 46L17 26L28 16L42 13L56 26L60 46ZM17 26l17 6l22-6M34 32v14M22 20l7 9'],
 den:['Animal scrape','M9 33Q35 20 61 33Q58 47 35 49Q12 47 9 33ZM20 25l-5-6m16 2l-2-8m14 8l3-8m8 12l5-6'],
};
export function resourceSymbolKind(target){return target.cave!==undefined?'cave':target.kind==='cave-water'?'water':target.kind==='drinkable-ground'?'water':target.kind==='food'&&target.food==='carrion'?'corpse':symbols[target.kind]?target.kind:'object'}
export function appendResourceSymbol(container,target){const kind=resourceSymbolKind(target),[label,path]=symbols[kind],svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 70 58');svg.setAttribute('role','img');svg.setAttribute('aria-label',label+' symbol');svg.dataset.resourceSymbol=kind;const line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('d',path);svg.append(line);container.append(svg);return svg}
