// Untargeted E is contextual: with several available actions it returns 'interaction-choice'
// and the player picks one (radial menu, or Shift+E for drink). Tests that intend one action
// assert it is offered, then choose it through the same canonical executeInteraction path.
export function interactAs(sim,assert,actionId,target=null){
  const offered=sim.playerInteract(target);
  if(offered.type!=='interaction-choice')return offered;
  assert.ok(offered.choices.some(c=>c.id===actionId),`untargeted interaction offers ${actionId}: ${offered.choices.map(c=>c.id).join(', ')}`);
  return sim.playerInteract(target,actionId);
}
