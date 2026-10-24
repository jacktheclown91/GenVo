// Real-time movement input buffer: preserves discrete taps and brief holds across
// sliced ticks and frame pacing delays without fabricating movement or altering physics.
export class MovementInputBuffer {
  constructor({ controlHz = 64, maxBufferedSteps = 64, clock = () => performance.now() } = {}) {
    this.controlHz = controlHz;
    this.maxBufferedSteps = maxBufferedSteps;
    this.clock = clock;
    this.directions = {
      up: { isDown: false, keys: new Set(), downTime: 0, stepsConsumed: 0, bufferedSteps: 0, opposite: 'down' },
      down: { isDown: false, keys: new Set(), downTime: 0, stepsConsumed: 0, bufferedSteps: 0, opposite: 'up' },
      left: { isDown: false, keys: new Set(), downTime: 0, stepsConsumed: 0, bufferedSteps: 0, opposite: 'right' },
      right: { isDown: false, keys: new Set(), downTime: 0, stepsConsumed: 0, bufferedSteps: 0, opposite: 'left' }
    };
    this.keyMap = {
      KeyW: 'up', ArrowUp: 'up',
      KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left',
      KeyD: 'right', ArrowRight: 'right'
    };
  }

  onKeyDown(code, timeStamp = this.clock()) {
    const dir = this.keyMap[code];
    if (!dir) return;
    const st = this.directions[dir];
    if (st.keys.size === 0) {
      st.downTime = timeStamp;
      st.stepsConsumed = 0;
      st.bufferedSteps = 0;
    }
    st.keys.add(code);
    st.isDown = true;
    const opp = this.directions[st.opposite];
    if (opp) opp.bufferedSteps = 0;
  }

  onKeyUp(code, timeStamp = this.clock()) {
    const dir = this.keyMap[code];
    if (!dir) return;
    const st = this.directions[dir];
    st.keys.delete(code);
    if (st.keys.size === 0) {
      st.isDown = false;
      const holdDuration = Math.max(0, timeStamp - st.downTime);
      const targetSteps = Math.max(1, Math.round((holdDuration * this.controlHz) / 1000));
      if (st.stepsConsumed < targetSteps) {
        const remaining = targetSteps - st.stepsConsumed;
        st.bufferedSteps = Math.min(remaining, this.maxBufferedSteps);
      }
    }
  }

  consume(dir) {
    const st = this.directions[dir];
    if (!st) return false;
    if (st.isDown) {
      st.stepsConsumed++;
      return true;
    }
    if (st.bufferedSteps > 0) {
      st.bufferedSteps--;
      return true;
    }
    return false;
  }

  peek(dir) {
    const st = this.directions[dir];
    if (!st) return false;
    return st.isDown || st.bufferedSteps > 0;
  }

  read(keysState = {}, consume = false) {
    const up = consume ? this.consume('up') : this.peek('up');
    const down = consume ? this.consume('down') : this.peek('down');
    const left = consume ? this.consume('left') : this.peek('left');
    const right = consume ? this.consume('right') : this.peek('right');
    const sprint = !!(keysState.ShiftLeft || keysState.ShiftRight);
    const brace = !!keysState.brace;
    return { up, down, left, right, sprint, brace };
  }

  clear() {
    for (const dir of Object.keys(this.directions)) {
      const st = this.directions[dir];
      st.isDown = false;
      st.keys.clear();
      st.downTime = 0;
      st.stepsConsumed = 0;
      st.bufferedSteps = 0;
    }
  }
}
