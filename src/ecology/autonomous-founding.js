// Mechanics borrowed by PopulationPressureMemoryController, not another population
// authority. Observing establishment never breeds, moves or supplies an organism.
export const AUTONOMOUS_POPULATIONS = Object.freeze({
  policy: 'autonomous-populations/1', radius: 12, residenceDays: 8,
  minimumMembers: 4, minimumAdults: 2, recruitedDays: 2,
  minimumLitters: 2, supportedDays: 4, absenceDays: 8
});
export const autonomousPopulationsEnabled = sim =>
  sim?.autonomousPopulationRules === AUTONOMOUS_POPULATIONS.policy;

export function initializeAutonomousFounding(memory) {
  if (!autonomousPopulationsEnabled(memory.sim)) return;
  memory.natural = {nextId: 1, records: new Map(), births: new Map(),
    deaths: new Map(), membership: new Map(), events: []};
}

export function validateAutonomousPopulationPolicy(sim) {
  const policy = sim.autonomousPopulationRules;
  if (policy !== undefined && policy !== AUTONOMOUS_POPULATIONS.policy)
    throw Error('Unknown autonomous population policy.');
  for (const session of sim.planetaryTravel?.sessions || [])
    if (session.snapshot.core.autonomousPopulationRules !== policy)
      throw Error('Inconsistent regional autonomous population policy.');
}

export function validateAutonomousFoundingState(memory) {
  const state = memory.natural;
  if (!autonomousPopulationsEnabled(memory.sim)) {
    if (state !== undefined) throw Error('Population evidence requires its recorded policy.');
    return;
  }
  if (!state || !Number.isSafeInteger(state.nextId) || state.nextId < 1 ||
      !['records', 'births', 'deaths', 'membership'].every(key => state[key] instanceof Map) ||
      !Array.isArray(state.events)) throw Error('Invalid autonomous population evidence.');
  for (const [key, record] of state.records) {
    if (record.key !== key || !Number.isFinite(record.x) || !Number.isFinite(record.y) ||
        !(record.members instanceof Map) || !(record.everMembers instanceof Set) ||
        !(record.memberIds instanceof Set) || !(record.recruits instanceof Set) ||
        !(record.litters instanceof Set) || !Number.isSafeInteger(record.firstDay) ||
        record.firstDay < 1 || record.kind !== 'autonomous' || record.primary !== false ||
        !['candidate', 'established', 'declining', 'extinct', 'abandoned', 'merged'].includes(record.status) ||
        ![record.continuityDays, record.supportedDays].every(v => Number.isSafeInteger(v) && v >= 0) ||
        ![record.establishedDay, record.endedDay].every(v => v === null || Number.isSafeInteger(v) && v >= 1))
      throw Error('Invalid autonomous population record.');
    for (const [id, resident] of record.members)
      if (!Number.isSafeInteger(id) || ![resident.firstDay, resident.lastDay, resident.days]
        .every(v => Number.isSafeInteger(v) && v >= 1)) throw Error('Invalid population residence.');
  }
  for (const [id, birth] of state.births)
    if (birth.id !== id || !Number.isSafeInteger(id) || !Number.isSafeInteger(birth.day) || birth.day < 1 ||
        !Number.isSafeInteger(birth.tick) || birth.tick < 0 || !Number.isFinite(birth.x) || !Number.isFinite(birth.y) ||
        !Array.isArray(birth.parents) || birth.parents.length !== 2 || !birth.parents.every(Number.isSafeInteger) ||
        !Array.isArray(birth.parentKeys) || birth.parentKeys.length !== 2 ||
        !Array.isArray(birth.residentKeys) || birth.residentKeys.length !== 2)
      throw Error('Invalid population birth evidence.');
}

export function recordPopulationBirth(memory, child, parents) {
  if (!autonomousPopulationsEnabled(memory.sim)) return;
  const state = memory.natural;
  if (state.births.has(child.id)) return;
  state.births.set(child.id, {id: child.id, day: memory.sim.day, tick: memory.sim.tickCount,
    x: child.x, y: child.y, parents: parents.map(parent => parent.id),
    parentKeys: parents.map(parent => parent.geographicPopulation?.originKey ||
      state.membership.get(parent.id) || null),
    residentKeys: parents.map(parent => naturalPopulationFor(memory, parent, {candidates: true})?.key || null)});
}

export function recordPopulationDeath(memory, animal, cause) {
  if (!autonomousPopulationsEnabled(memory.sim)) return;
  if (!memory.natural.deaths.has(animal.id))
    memory.natural.deaths.set(animal.id, {day: memory.sim.day, cause});
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const currentRecord = record => !['extinct', 'abandoned', 'merged'].includes(record.status);

export function naturalPopulations(memory, {candidates = false} = {}) {
  if (!autonomousPopulationsEnabled(memory.sim)) return [];
  return [...memory.natural.records.values()].filter(record =>
    candidates ? currentRecord(record) : record.establishedDay !== null);
}

export function naturalPopulationFor(memory, animal, {candidates = false} = {}) {
  if (!animal?.alive) return null;
  const eligible = naturalPopulations(memory, {candidates}).filter(record =>
    currentRecord(record) && record.species === animal.species &&
    distance(record, animal) <= AUTONOMOUS_POPULATIONS.radius &&
    memory.sim.canReach(animal, record.x, record.y));
  const prior = memory.natural?.membership.get(animal.id) || animal.geographicPopulation?.key;
  const resident = eligible.find(record => record.key === prior);
  if (resident) return resident;
  const birth = memory.natural?.births.get(animal.id);
  const parent = eligible.find(record => birth?.residentKeys.includes(record.key));
  if (parent) return parent;
  return eligible.sort((a, b) => distance(a, animal) - distance(b, animal) || a.key.localeCompare(b.key))[0] || null;
}

function newCandidate(memory, members) {
  const state = memory.natural, sim = memory.sim, origin = sim.world.regionOrigin || {x: 0, y: 0};
  const serial = state.nextId++, key = `natural:${origin.x},${origin.y}:${serial}`;
  const record = {key, id: key, kind: 'autonomous', primary: false,
    label: `Wild ${members[0].species} population ${serial}`, species: members[0].species,
    x: members[0].x, y: members[0].y, originX: members[0].x, originY: members[0].y,
    regionOrigin: {...origin}, firstDay: sim.day, lastOccupiedDay: sim.day,
    establishedDay: null, endedDay: null, status: 'candidate', continuityDays: 0,
    supportedDays: 0, members: new Map(), memberIds: new Set(), everMembers: new Set(),
    recruits: new Set(), litters: new Set(), parentPopulationKeys: [], trajectory: [], supportHistory: []};
  state.records.set(key, record);
  state.events.push({type: 'candidate', key, day: sim.day});
  return record;
}

export function advanceAutonomousFounding(memory, {maturityFor,supportsMaintenance}) {
  if (!autonomousPopulationsEnabled(memory.sim)) return;
  const sim = memory.sim, state = memory.natural, rules = AUTONOMOUS_POPULATIONS;
  const living = sim.animals.filter(a => a.alive).slice().sort((a, b) => a.id - b.id);
  const groups = new Map(), assigned = new Set();
  // Stable geographic anchors prevent a long chain of neighbours becoming a
  // single continent-wide population. Founding labels seed census cohorts only:
  // they are never used here to allow/deny mating or to define a new species.
  for (const animal of living) {
    const record = naturalPopulationFor(memory, animal, {candidates: true});
    if (!record) continue;
    if (!groups.has(record.key)) groups.set(record.key, []);
    groups.get(record.key).push(animal); assigned.add(animal.id);
  }
  for (const seed of living) {
    if (assigned.has(seed.id)) continue;
    const members = living.filter(a => !assigned.has(a.id) && a.species === seed.species &&
      distance(a, seed) <= rules.radius && sim.canReach(a, seed.x, seed.y));
    if (members.length < 2) continue;
    const record = newCandidate(memory, members);
    groups.set(record.key, members);
    for (const a of members) assigned.add(a.id);
  }
  state.membership.clear();
  for (const record of state.records.values()) {
    if (!currentRecord(record)) continue;
    const members = groups.get(record.key) || [], previous = record.memberIds;
    record.memberIds = new Set(members.map(a => a.id));
    const continuing = members.filter(a => previous.has(a.id)).length;
    record.continuityDays = members.length >= 2 ? (continuing >= 2 ? record.continuityDays + 1 : 1) : 0;
    if (members.length) record.lastOccupiedDay = sim.day;
    // Follow the continuing biological community using an actual occupied point,
    // rather than letting overlapping fixed anchors continually rename residents.
    // This does not move an animal or assign a mutation/habitat advantage.
    if (continuing >= 2) {
      const residents = members.filter(a => previous.has(a.id));
      const centre = {x: residents.reduce((sum, a) => sum + a.x, 0) / residents.length,
        y: residents.reduce((sum, a) => sum + a.y, 0) / residents.length};
      const anchor = residents.slice().sort((a, b) => distance(a, centre) - distance(b, centre) || a.id - b.id)[0];
      record.x = anchor.x; record.y = anchor.y;
    }
    if (members.length) (record.trajectory ??= []).push({day: sim.day, x: record.x, y: record.y, members: members.length});
    const adults = members.filter(a => a.age >= maturityFor(a));
    let supported = 0;
    for (const adult of adults) {
      if (supportsMaintenance(adult)) supported++;
      if (supported >= rules.minimumAdults) break;
    }
    if (supported >= rules.minimumAdults) record.supportedDays++;
    (record.supportHistory ??= []).push({day: sim.day, supported: supported >= rules.minimumAdults});
    const recentSupport = record.supportHistory.filter(row => row.day > sim.day - rules.residenceDays && row.supported).length;
    for (const animal of members) {
      const prior = record.members.get(animal.id);
      const days = prior?.lastDay === sim.day - 1 ? prior.days + 1 : 1;
      record.members.set(animal.id, {firstDay: prior?.firstDay ?? sim.day, lastDay: sim.day, days});
      record.everMembers.add(animal.id); state.membership.set(animal.id, record.key);
      memory.noteResidence(animal, record);
      const birth = state.births.get(animal.id);
      if (birth && birth.day >= record.firstDay && days >= rules.recruitedDays &&
          distance(record, birth) <= rules.radius && birth.residentKeys.includes(record.key) &&
          birth.parents.some(id => (record.members.get(id)?.firstDay ?? Infinity) < birth.day)) {
        record.recruits.add(animal.id);
        record.litters.add(`${birth.tick}:${birth.parents[0]}`);
      }
    }
    const livingRecruits = members.filter(a => record.recruits.has(a.id));
    const livingLitters = new Set(livingRecruits.map(a => {
      const birth = state.births.get(a.id); return `${birth.tick}:${birth.parents[0]}`;
    }));
    if (record.establishedDay === null && members.length >= rules.minimumMembers &&
        adults.length >= rules.minimumAdults && record.continuityDays >= rules.residenceDays &&
        recentSupport >= rules.supportedDays && supported >= rules.minimumAdults &&
        livingRecruits.length >= 2 && livingLitters.size >= rules.minimumLitters) {
      record.establishedDay = sim.day; record.status = 'established';
      record.parentPopulationKeys = [...new Set(members.map(a => a.geographicPopulation?.originKey).filter(Boolean))];
      state.events.push({type: 'established', key: record.key, day: sim.day,
        recruits: [...record.recruits], litters: [...record.litters], parents: [...record.parentPopulationKeys]});
    }
    if (record.establishedDay !== null && members.length) {
      record.status = members.length >= rules.minimumMembers ? 'established' : 'declining';
      for (const animal of members) {
        if (animal.geographicPopulation?.key === record.key) continue;
        const previousKey = animal.geographicPopulation?.key || null;
        const originKey = animal.geographicPopulation?.originKey || record.key;
        animal.geographicPopulation = {key: record.key, originKey, joinedDay: sim.day};
        (animal.populationHistory ??= []).push({key: record.key, from: previousKey, day: sim.day});
      }
    }
    if (record.establishedDay !== null && !members.length) record.status = 'declining';
    if (!members.length && sim.day - record.lastOccupiedDay >= rules.absenceDays) {
      record.status = record.establishedDay === null ? 'abandoned' : 'extinct';
      record.endedDay = sim.day;
      state.events.push({type: record.status, key: record.key, day: sim.day, scope: 'local geographic population'});
    }
  }
  // A demographic merger requires actual former residents and surviving mixed
  // recruitment, not proximity alone. Species recognition remains elsewhere.
  for (const source of state.records.values()) {
    if (source.establishedDay === null || source.memberIds.size || !currentRecord(source)) continue;
    for (const target of state.records.values()) {
      if (target === source || target.establishedDay === null || !currentRecord(target)) continue;
      const arrivals = [...target.memberIds].filter(id => source.everMembers.has(id) &&
        target.members.get(id)?.days >= rules.recruitedDays);
      if (arrivals.length < 2) continue;
      const mixed = [...target.memberIds].filter(id => {
        const birth = state.births.get(id);
        return target.recruits.has(id) && birth?.parentKeys.includes(source.key) &&
          birth.parentKeys.some(key => key && key !== source.key);
      });
      if (!mixed.length) continue;
      source.status = 'merged'; source.mergedInto = target.key; source.endedDay = sim.day;
      state.events.push({type: 'merged', key: source.key, into: target.key,
        day: sim.day, arrivals, recruitedMixedOffspring: mixed});
      break;
    }
  }
}
