// Test-tool fast-forward overlay (Phase 3L, creator request 2026-10-17). Automated tools advance many game days in
// one synchronous call right after Begin World; the browser cannot repaint meanwhile, so whatever status text was on
// screen (for example the world-start "Saving...") stayed frozen there and recordings looked like a long load. Tools
// now paint a clear full-screen "Simulating N days..." notice before fast-forwarding and remove it, and wait for a
// repaint, before any measurement starts. Measurement never includes the overlay.
const OVERLAY_ID='__fastForwardOverlay';
async function showFastForward(page,days){
  if(!(days>0))return;
  await page.evaluate(async({n,id})=>{let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(6,12,9,.86);color:#f3e7b0;font:600 22px system-ui,sans-serif;letter-spacing:.02em;pointer-events:none;text-align:center';document.body.appendChild(el)}
    el.textContent=`Simulating ${n} days… (test tool fast-forward, not game loading)`;await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,30)))},{n:days,id:OVERLAY_ID});
}
async function hideFastForward(page){
  await page.evaluate(async id=>{document.getElementById(id)?.remove();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))},OVERLAY_ID);
}
// For tools that fast-forward inside one long in-page evaluate: remove the overlay from page code.
const REMOVE_IN_PAGE=`document.getElementById('${OVERLAY_ID}')?.remove()`;
module.exports={showFastForward,hideFastForward,REMOVE_IN_PAGE,OVERLAY_ID};
