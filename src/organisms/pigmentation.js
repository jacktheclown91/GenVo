// Independent, inherited appearance. No climate/metabolism gene is secretly a color gene.
// Seeded by immutable ancestry/event identity, never by camera, weather, or render order.
// This first stage is appearance only: camouflage and mate preference require separate
// functional sensing/reproduction integration.
export const PIGMENT_GENOME_SCHEMA='genvo.pigment-genome/1';
const BOUNDS=Object.freeze({hue:24,chroma:4,tone:4,marking:4,density:4,accent:12});
const LOCI=Object.freeze(Object.keys(BOUNDS));

function hash(value){
  let h=2166136261;
  for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return h>>>0;
}
const choice=(seed,key,bound)=>hash(seed+'|'+key)%bound;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function validPigmentGenome(genome){
  return genome?.schema===PIGMENT_GENOME_SCHEMA&&LOCI.every(key=>
    Number.isSafeInteger(genome[key])&&genome[key]>=0&&genome[key]<BOUNDS[key]);
}
export function founderPigmentGenome(worldSeed,animalId,species){
  const seed=worldSeed+'|pigment-founder|'+animalId+'|'+species;
  const genome={schema:PIGMENT_GENOME_SCHEMA};
  for(const key of LOCI)genome[key]=choice(seed,key,BOUNDS[key]);
  return genome;
}
export function inheritPigmentGenome(worldSeed,childId,parents){
  // Old saved lineages do not acquire a new color scheme without explicit migration.
  if(!Array.isArray(parents)||parents.length!==2||!parents.every(p=>validPigmentGenome(p?.pigmentGenome)))return null;
  const seed=worldSeed+'|pigment-child|'+childId;
  const genome={schema:PIGMENT_GENOME_SCHEMA};
  for(const key of LOCI){
    const parent=parents[choice(seed,key+'|parent',2)];
    genome[key]=parent.pigmentGenome[key];
  }
  // A bounded one-axis mutation; not chosen according to what the habitat needs.
  if(choice(seed,'mutation',1000)<45){
    const key=LOCI[choice(seed,'mutation-locus',LOCI.length)];
    const delta=choice(seed,'mutation-sign',2)===0?-1:1;
    genome[key]=key==='hue'||key==='accent'
      ?(genome[key]+delta+BOUNDS[key])%BOUNDS[key]
      :clamp(genome[key]+delta,0,BOUNDS[key]-1);
  }
  return genome;
}
export function pigmentExpression(genome){
  if(!validPigmentGenome(genome))return null;
  return {
    // Palette is intentionally quantized for bounded RGB/indexed-art cache diversity.
    hueShift:genome.hue*15-145,
    lightShift:(genome.tone-1.5)*6,
    pigmentChroma:.24+genome.chroma*.08,
    stripe:genome.marking===1||genome.marking===3,
    spot:genome.marking===2||genome.marking===3,
    patternBands:1+Math.min(2,genome.density),
    patternSpots:1+genome.density,
    patternPolarity:genome.accent<6?1:-1
  };
}
