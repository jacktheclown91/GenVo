// Frozen snapshot fixtures were recorded when saves stored flora seed banks as
// seed columns /1. Saves now write /2, which decodes to exactly the same cohorts.
// For comparison with those fixtures, re-encode every seed table in a snapshot
// copy with the unchanged /1 packer. Every cohort, amount, field order and value
// is still compared; only the table's storage encoding is normalized.
// The input must be a disposable copy: tables are replaced in place.
import {SEED_COLUMNS_2,packFloraSeedBanks,unpackFloraSeedBanks} from '../src/persistence/flora-seed-codec.js';

export function withCanonicalSeedTables(snapshot) {
  const seen = new Set(), stack = [snapshot];
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || seen.has(value) || ArrayBuffer.isView(value)) continue;
    seen.add(value);
    if (value instanceof Map) { for (const item of value.values()) stack.push(item); continue; }
    if (value instanceof Set) { for (const item of value) stack.push(item); continue; }
    for (const key of Object.keys(value)) {
      const item = value[key];
      if (item?.codec === SEED_COLUMNS_2) value[key] = packFloraSeedBanks(unpackFloraSeedBanks(item));
      else stack.push(item);
    }
  }
  return snapshot;
}
