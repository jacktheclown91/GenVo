import {TutorialControlCue} from './tutorial-control-cue.js';
import {homeInteractionStatus} from '../gameplay/home-interactions.js';

// Read actual territory/shelter state. A plan is not established territory.
export function earnedTutorialHome(sim,actor){
  const shelter=sim.shelter.nearest(actor,{radius:Infinity,familyOnly:true});
  const state=sim.territory.states.get(actor.id);
  return{shelter,state,earned:!!shelter||!!(state?.established&&state.home)};
}
export class HomeTutorialGuide extends TutorialControlCue{
  reset(){this.clear()}
  read(sim){
    const actor=sim.player(),home=earnedTutorialHome(sim,actor),planned=sim.territory.homeSiteFor(actor);
    const button=this.query('[data-tutorial-action="build-shelter"], [data-tutorial-action="mark-home-site"]')
      .find(b=>!b.disabled&&b.getAttribute('aria-disabled')!=='true');
    const selected=button?{kind:'ground',x:Number(button.dataset.targetX),y:Number(button.dataset.targetY)}:null;
    const intro=sim.uiTutorialHome||{};
    const ownsPlannedRange=planned&&home.state?.established&&home.state.home&&
      Math.hypot(planned.x-home.state.home.x,planned.y-home.state.home.y)<=sim.territory.coreRadius(actor);
    if(home.shelter||home.earned&&(intro.preexisting||ownsPlannedRange)){
      this.clear();return{complete:true,home,planned};
    }
    if(planned&&home.state?.established&&!ownsPlannedRange){
      this.clear();return{step:'learned-range',site:home.state.home,label:'Home centre',title:'Your learned home is here',
        text:'Your familiar home centre differs from your plan. Click empty dry ground by the Home centre marker, then Mark Home Site or Build Shelter.'};
    }
    if(button){
      const build=this.query('[data-tutorial-action="build-shelter"]').find(b=>!b.disabled&&b.getAttribute('aria-disabled')!=='true');
      const next=build||button,action=next.dataset.tutorialAction;
      this.setCue(next,action);
      return{step:action,site:selected,title:build?'Build your family shelter':'Choose a home site',
        text:build?'Click the glowing Build Shelter action. It uses local plants and your energy.':
          'Click the glowing Mark Home Site action. You still earn a home by living nearby.'};
    }
    this.clear();
    if(planned){
      const target={kind:'ground',x:planned.x,y:planned.y,homeSeed:planned.seed,homeRegion:planned.region};
      const status=homeInteractionStatus(sim,target,'build-shelter');
      const settled=home.state?.established;
      return{step:'settle',site:planned,title:settled?'Choose ground for your shelter':'Live around your planned home',
        text:settled?(status.enabled||status.state==='approachable'?'Click dry ground near your home centre, then Build Shelter.':status.reason):
          'Stay fed and watered here while your familiarity grows through real residence. Marking alone gives no territory.'};
    }
    return{step:'select-ground',title:'Make a home',site:home.state?.established?home.state.home:null,
      text:'Click an empty patch of dry ground to open its wheel. Choose Mark Home Site or an available Build Shelter action.'};
  }
  showBrace(sim){
    const status=sim.playerCombat.braceAvailability();
    const button=this.query('[data-command="brace"], [data-tutorial-action="brace"]')
      .find(b=>!b.disabled&&b.getAttribute('aria-disabled')!=='true');
    this.setCue(status.enabled?button:null,'brace');
    return{step:'brace',title:'Try a safe brace',text:status.enabled?
      'Hold the glowing Brace control, or hold J. Face incoming attacks: bracing uses breath and reduces frontal damage.':status.reason};
  }
}
