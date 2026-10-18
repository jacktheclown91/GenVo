import {preyPreference} from '../ecology/functional-diet.js';
// Trophic recognition (Phase 3J Step 3, investigation finding). Stalkers made every courtship attempt with
// other species — including mosskip, their prey — because a compatible-enough animal of another species
// was always nearer than a conspecific, so the long-range mate search never ran. An animal now does not
// court a creature of another species that it would hunt or that would hunt it (preyPreference by mouth and
// body).
// Non-trophic gene flow (e.g. two grazers) is unaffected; compatibility, choice and conception are
// unchanged. Same rule for wildlife and the player. ?trophicRecognition=0 restores the old behaviour.
export const TROPHIC_RECOGNITION={enabled:true};
// Between members of one species the rule does not apply: GenVo allows cannibalism between unrelated
// animals (functional-diet.js), and a cannibal-capable species still courts its own kind.
export function trophicallyMateable(a,b){return !TROPHIC_RECOGNITION.enabled||a?.species===b?.species||!(preyPreference(a,b)>0||preyPreference(b,a)>0)}
