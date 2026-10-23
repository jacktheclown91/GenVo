// Resumable simulation work (day-boundary slicing, October 22). A step
// generator yields only where pausing changes nothing: no state is read or
// written by the pause itself, so the work, its order and every random draw
// are those of the uninterrupted call. drain() runs it to completion at once,
// which is exactly the original synchronous behaviour.
export function drain(steps){let r;do r=steps.next();while(!r.done);return r.value}
