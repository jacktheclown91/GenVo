import {developmentFor} from '../../src/family/family.js';
import {phenotypeFor,SPECIES} from '../../src/organisms/species.js';
// An isolated workshop-age preview. It neither ages a saved animal nor owns a
// growth curve; the canonical family query and gameplay presentation factors do.
export function developmentalPreview(animal,percent=100){
 const maturity=SPECIES[animal.species]?.maturity;if(!maturity)throw Error('Preview requires a supported organism');
 if(!Number.isFinite(percent)||percent<0||percent>100)throw Error('Preview age must be 0–100% of maturity');
 const preview={...animal,age:maturity*percent/100},development=developmentFor(preview),phenotype=phenotypeFor(preview),growth=development.growth;
 phenotype.bodyScale*=growth;phenotype.limbScale*=.72+.28*growth;phenotype.sensoryScale*=.78+.22*growth;
 if(development.maturity<.55){phenotype.stripe=false;phenotype.spot=false;}
 return{animal:preview,phenotype,development,pose:{stage:development.stage,dependent:development.stage==='newborn'||development.stage==='juvenile',life:{growth}}};
}
