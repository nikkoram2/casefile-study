// Sequence timing for scripted scenes. wait() obeys a time scale and can be skipped; skipping fast-forwards to the end state.
export class Director {
  skipping = false; reduced = false; private waiters = new Set<() => void>(); private snapHooks: (() => void)[] = [];
  wait(ms: number): Promise<void> {
    if (this.skipping) return Promise.resolve(); const d = this.reduced ? Math.min(ms, 250) : ms;
    return new Promise(res => { const id = setTimeout(() => { this.waiters.delete(done); res(); }, d); const done = () => { clearTimeout(id); this.waiters.delete(done); res(); }; this.waiters.add(done); });
  }
  onSkip(fn: () => void) { this.snapHooks.push(fn); }
  skip() { this.skipping = true; this.snapHooks.forEach(f => f()); [...this.waiters].forEach(w => w()); }
  reset() { this.skipping = false; this.snapHooks = []; }
  get instant() { return this.skipping || this.reduced; }
}
