// Paint only: physical shoreline coverage stays in habitat-detail.js.
import {riparianBankArt as art} from '../../assets/art/environment/riparian-bank.js';
const styles=art.palettes.map((palette,band)=>palette.map(rgb=>'rgba('+rgb.join(',')+','+art.alpha[band]+')'));
export function riparianColorAt(score,sx,sy,x,y){
 if(!Number.isFinite(score)||score<.30||score>.53)return null;
 const band=score>.45?0:score>.38?1:2,variant=((y&1)<<1)|(x&1),sample=art.frames[variant][(sy&31)*32+(sx&31)];
 return styles[band][sample];
}
