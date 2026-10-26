// Borrow one Simulation's existing bucket geometry and arrays. Construction,
// organism ownership and query-specific distance/eligibility checks stay with
// Simulation and its callers. There is no shared cache or second index.
export function rebuildSpatialIndex(sim) {
  for (const bucket of sim.spatial) bucket.length = 0;
  for (const animal of sim.animals) {
    if (!animal.alive) continue;
    const column = Math.max(0, Math.min(sim.spatialCols - 1, Math.floor(animal.x / sim.spatialBucketSize)));
    const row = Math.max(0, Math.min(sim.spatialCols - 1, Math.floor(animal.y / sim.spatialBucketSize)));
    sim.spatial[row * sim.spatialCols + column].push(animal);
  }
}

// This is the existing rectangular bucket broad phase, not a circular distance
// filter. Preserve row/column order, insertion order and strict false early exit.
export function forEachSpatialNeighbor(sim, origin, radius, visit) {
  const bucketSize = sim.spatialBucketSize;
  const columns = sim.spatialCols;
  const minX = Math.max(0, Math.floor((origin.x - radius) / bucketSize));
  const maxX = Math.min(columns - 1, Math.floor((origin.x + radius) / bucketSize));
  const minY = Math.max(0, Math.floor((origin.y - radius) / bucketSize));
  const maxY = Math.min(columns - 1, Math.floor((origin.y + radius) / bucketSize));
  for (let row = minY; row <= maxY; row++) {
    for (let column = minX; column <= maxX; column++) {
      const bucket = sim.spatial[row * columns + column];
      for (const animal of bucket) if (visit(animal) === false) return false;
    }
  }
  return true;
}
