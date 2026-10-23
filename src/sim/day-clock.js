import {CFG} from './config.js';

// Day clock (creator decision 2026-10-23, GenVo v1 survival rebalance): a day lasts 30 seconds of
// play at 1x instead of 6, so a creature can travel, gather and prepare within a day and a season.
// Movement, perception, decisions, combat and every other real-time process keep their real-time
// rates (8 ticks a second; decisions every CFG.lifeStride ticks). Daily biology keeps its daily
// totals: metabolism, healing, ageing and the other per-stride biological amounts run on a
// biological stride (CFG.bioStride) that always falls 8 times a day, and the few biological
// accumulators updated at decision time are scaled by bioFactor(). Day-based cadences already
// convert through CFG.dayTicks. Worlds recorded before this policy (including the evolved
// checkpoints) keep their 48-tick, 6-second day, for which bioStride equals lifeStride and
// bioFactor() is exactly 1, so they run exactly as before.
export const DAY_CLOCK=Object.freeze({policy:'day-clock/30s',secondsPerDay:30,bioStepsPerDay:8});
export const LEGACY_DAY_TICKS=48;
export function dayTicksFor(sim){return sim?.dayClockRules===DAY_CLOCK.policy?DAY_CLOCK.secondsPerDay*CFG.simHz:LEGACY_DAY_TICKS}
// CFG.dayTicks and CFG.bioStride are shared by every module; the simulation being advanced sets them.
export function applyDayClock(sim){
 const ticks=dayTicksFor(sim);if(CFG.dayTicks===ticks)return ticks;
 CFG.dayTicks=ticks;CFG.bioStride=ticks/DAY_CLOCK.bioStepsPerDay;return ticks;
}
// Share of a day's biological change that one decision-time update carries (1 on recorded worlds).
export function bioFactor(){return CFG.lifeStride/CFG.bioStride}
// Biological steps per day: constant under every clock.
export const BIO_STEPS_PER_DAY=DAY_CLOCK.bioStepsPerDay;
export function restoreDayClock(sim,core){
 if(core.dayClockRules!==undefined&&core.dayClockRules!==DAY_CLOCK.policy)throw Error('Unknown saved day clock.');
 if(core.dayClockRules===undefined)delete sim.dayClockRules;
 applyDayClock(sim);
}
