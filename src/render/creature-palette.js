// Native pigments are inherited phenotype values, independent of founder names.
// Return real RGB hex: the indexed-art skin ramp cannot parse CSS hsl strings.
export function creaturePalette(phenotype={}){
 const hue=(145+(phenotype.hueShift||0)+360)%360;
 const chroma=Number.isFinite(phenotype.pigmentChroma)?Math.max(.12,Math.min(.55,phenotype.pigmentChroma)):.26;
 const color=light=>{
  const h=hue/60,c=(1-Math.abs(2*light-1))*chroma,x=c*(1-Math.abs(h%2-1)),m=light-c/2;
  const rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
  return '#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
 };
 const light=Math.max(.35,Math.min(.65,.48+(phenotype.lightShift||0)/100));
 return {body:color(light),shade:color(light-.18),light:color(light+.16)};
}
