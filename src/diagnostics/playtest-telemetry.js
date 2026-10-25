// Local Playtest Diagnostics (zero external network telemetry, strictly local storage and memory).
// Tracks session metrics, generational milestones, planetary exploration, hitches, and survival.

const STORAGE_KEY = 'genvo.playtest.diagnostics.v1';
const OPT_IN_KEY = 'genvo.playtest.optin';

export class PlaytestDiagnostics {
  // Opt-in only: nothing is recorded unless enable() was called (stored locally),
  // or the page was opened with ?diagnostics=1. No network transmission exists.
  constructor({sim = null, enabled = false} = {}) {
    this.sim = sim;
    this.enabled = this._checkOptIn(enabled);
    this.sessionStartTime = Date.now();
    this.sessionActiveMs = 0;
    this.lastFrameTime = performance.now();
    this.mode = 'manual';
    this.daysSurvived = 0;
    this.generationsReached = 1;
    this.births = [];
    this.mutations = [];
    this.regionsExplored = new Set(['0,0']);
    this.deaths = [];
    this.lastDeathCause = null;
    this.frameHitches = {
      count50ms: 0,
      count100ms: 0,
      worstMs: 0,
      recentHitches: []
    };
    this.saveStatus = {
      saveCount: 0,
      lastSaveTime: null,
      lastSaveDay: null,
      lastSaveSuccess: true,
      lastError: null
    };

    this._loadPersisted();
  }

  _checkOptIn(defaultEnabled) {
    try {
      if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('diagnostics') === '1') return true;
    } catch {}
    if (typeof localStorage === 'undefined') return defaultEnabled;
    try {
      const stored = localStorage.getItem(OPT_IN_KEY);
      if (stored !== null) return stored === 'true';
    } catch {
      // localStorage may fail in restricted sandboxes
    }
    return defaultEnabled;
  }

  enable() {
    this.enabled = true;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(OPT_IN_KEY, 'true');
    } catch {}
  }

  disable() {
    this.enabled = false;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(OPT_IN_KEY, 'false');
    } catch {}
  }

  isEnabled() {
    return this.enabled;
  }

  setSim(sim) {
    this.sim = sim;
  }

  setMode(mode) {
    this.mode = mode;
  }

  recordFrame(frameWorkMs, totalDtMs) {
    if (!this.enabled) return;
    const now = performance.now();
    const dt = totalDtMs ?? (now - this.lastFrameTime);
    this.lastFrameTime = now;
    this.sessionActiveMs += Math.min(100, dt);

    if (dt >= 50) {
      this.frameHitches.count50ms++;
      if (dt >= 100) this.frameHitches.count100ms++;
      if (dt > this.frameHitches.worstMs) this.frameHitches.worstMs = Math.round(dt);

      this.frameHitches.recentHitches.push({
        dtMs: Math.round(dt),
        workMs: Math.round(frameWorkMs || 0),
        timestamp: Date.now()
      });
      if (this.frameHitches.recentHitches.length > 20) {
        this.frameHitches.recentHitches.shift();
      }
    }
  }

  recordBirth(child, parents = []) {
    if (!this.enabled) return;
    const parentList = Array.isArray(parents) ? parents : (parents != null ? [parents] : []);
    const record = {
      childId: child?.id || (typeof child === 'number' ? child : null),
      species: child?.species || (typeof child === 'string' ? child : 'genvo'),
      generation: child?.generation || 1,
      day: this.sim?.day || 0,
      parentIds: parentList.map(p => p?.id || p).filter(Boolean)
    };
    this.births.push(record);
    if (record.generation > this.generationsReached) {
      this.generationsReached = record.generation;
    }
    this._persist();
  }

  recordHandoff(handoff) {
    if (!this.enabled) return;
    const gen = handoff?.generation || (typeof handoff === 'number' ? handoff : null);
    if (gen && gen > this.generationsReached) {
      this.generationsReached = gen;
    }
    this._persist();
  }

  recordMutation(mutation) {
    if (!this.enabled) return;
    this.mutations.push({
      partId: mutation?.partId || mutation?.id,
      day: this.sim?.day || 0,
      generation: this.sim?.player()?.generation || 1,
      type: mutation?.type || 'addition'
    });
    this._persist();
  }

  recordRegion(regionCoords) {
    if (!this.enabled) return;
    const key = typeof regionCoords === 'string' ? regionCoords : `${regionCoords.x},${regionCoords.y}`;
    this.regionsExplored.add(key);
    this._persist();
  }

  recordDeath(animal, cause = 'unknown') {
    if (!this.enabled) return;
    const isPlayer = !!animal?.player || animal?.id === this.sim?.playerId;
    const rec = {
      animalId: animal?.id,
      species: animal?.species,
      isPlayer,
      generation: animal?.generation || 1,
      age: animal?.age || 0,
      day: this.sim?.day || 0,
      cause
    };
    this.deaths.push(rec);
    if (isPlayer) {
      this.lastDeathCause = cause;
    }
    this._persist();
  }

  recordSave({ok = true, day = 0, error = null} = {}) {
    if (!this.enabled) return;
    this.saveStatus.saveCount++;
    this.saveStatus.lastSaveTime = Date.now();
    this.saveStatus.lastSaveDay = day || this.sim?.day || 0;
    this.saveStatus.lastSaveSuccess = ok;
    this.saveStatus.lastError = error ? String(error.message || error) : null;
    this._persist();
  }

  updateFromSim() {
    if (!this.sim) return;
    const currentDay = this.sim.day || 0;
    if (currentDay > this.daysSurvived) {
      this.daysSurvived = currentDay;
    }
    const p = this.sim.player?.();
    if (p && p.generation > this.generationsReached) {
      this.generationsReached = p.generation;
    }
    if (this.sim.playerAutonomy) {
      this.mode = 'autonomy';
    } else {
      this.mode = 'manual';
    }
    if (this.sim.world?.planetCoords) {
      const c = this.sim.world.planetCoords;
      this.regionsExplored.add(`${c.x},${c.y}`);
    }
  }

  getSummary() {
    this.updateFromSim();
    const durationSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);
    return {
      enabled: this.enabled,
      sessionDurationSeconds: durationSeconds,
      sessionActiveSeconds: Math.round(this.sessionActiveMs / 1000),
      mode: this.mode,
      currentDay: this.sim?.day || 0,
      daysSurvived: this.daysSurvived,
      generationsReached: this.generationsReached,
      birthsCount: this.births.length,
      recentBirths: this.births.slice(-5),
      mutationsCount: this.mutations.length,
      regionsExplored: Array.from(this.regionsExplored),
      regionsCount: this.regionsExplored.size,
      deathsCount: this.deaths.length,
      lastDeathCause: this.lastDeathCause,
      frameHitches: {
        hitchesOver50ms: this.frameHitches.count50ms,
        hitchesOver100ms: this.frameHitches.count100ms,
        worstFrameMs: this.frameHitches.worstMs,
        recent: this.frameHitches.recentHitches.slice(-5)
      },
      saveStatus: {
        saveCount: this.saveStatus.saveCount,
        lastSaveTime: this.saveStatus.lastSaveTime,
        lastSaveDay: this.saveStatus.lastSaveDay,
        lastSaveSuccess: this.saveStatus.lastSaveSuccess,
        lastError: this.saveStatus.lastError
      }
    };
  }

  exportJSON() {
    return JSON.stringify(this.getSummary(), null, 2);
  }

  reset() {
    this.sessionStartTime = Date.now();
    this.sessionActiveMs = 0;
    this.daysSurvived = this.sim?.day || 0;
    this.generationsReached = this.sim?.player?.()?.generation || 1;
    this.births = [];
    this.mutations = [];
    this.regionsExplored = new Set([this.sim?.world?.planetCoords ? `${this.sim.world.planetCoords.x},${this.sim.world.planetCoords.y}` : '0,0']);
    this.deaths = [];
    this.lastDeathCause = null;
    this.frameHitches = {count50ms: 0, count100ms: 0, worstMs: 0, recentHitches: []};
    this.saveStatus = {saveCount: 0, lastSaveTime: null, lastSaveDay: null, lastSaveSuccess: true, lastError: null};
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  _persist() {
    if (!this.enabled || typeof localStorage === 'undefined') return;
    try {
      const data = {
        daysSurvived: this.daysSurvived,
        generationsReached: this.generationsReached,
        regionsExplored: Array.from(this.regionsExplored),
        saveStatus: this.saveStatus
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  _loadPersisted() {
    if (!this.enabled || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.daysSurvived) this.daysSurvived = Math.max(this.daysSurvived, data.daysSurvived);
      if (data.generationsReached) this.generationsReached = Math.max(this.generationsReached, data.generationsReached);
      if (Array.isArray(data.regionsExplored)) {
        for (const r of data.regionsExplored) this.regionsExplored.add(r);
      }
      if (data.saveStatus) {
        this.saveStatus.saveCount = data.saveStatus.saveCount || 0;
        this.saveStatus.lastSaveTime = data.saveStatus.lastSaveTime || null;
      }
    } catch {}
  }
}
