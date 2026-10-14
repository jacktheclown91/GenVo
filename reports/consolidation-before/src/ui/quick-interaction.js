// Owns keyboard intention only. Validation and execution remain in gameplay controllers.
export class QuickInteractionSelection{
 clear(){this.choice=null}
 sync(sim){if(this.choice&&(this.choice.world!==sim||this.choice.actor!==sim.player()))this.clear()}
 remember(sim,option){this.choice={world:sim,actor:sim.player(),key:option.key,target:{...option.target},label:option.label}}
 resolve(sim,optionsFor,defaultTarget=null){this.sync(sim);if(this.choice){const option=optionsFor(this.choice.target).find(o=>o.key===this.choice.key);return option||{key:this.choice.key,label:this.choice.label,target:this.choice.target,enabled:false,state:'unavailable',reason:'That selected interaction is no longer available. Q selects another interaction.'}}const options=optionsFor(defaultTarget);return options.find(o=>o.enabled)||options[0]||null}
 cycle(sim,options){this.sync(sim);const available=options.filter(o=>o.enabled);if(!available.length)return null;const i=available.findIndex(o=>o.key===this.choice?.key),next=available[(i+1)%available.length];this.remember(sim,next);return next}
}
