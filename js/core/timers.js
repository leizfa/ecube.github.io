// js/core/timers.js
// ECUBE — TimerManager (limpa timeouts/intervals)
// ✅ Objetivo: evitar vazamento de setTimeout/setInterval quando troca de state.
// ✅ Não muda sua lógica — só organiza.

export class TimerManager {
  constructor() {
    this._timeouts = new Set();
    this._intervals = new Set();
    this._raf = new Set();
  }

  setTimeout(fn, ms) {
    const id = window.setTimeout(() => {
      this._timeouts.delete(id);
      fn();
    }, ms);
    this._timeouts.add(id);
    return id;
  }

  clearTimeout(id) {
    if (id == null) return;
    window.clearTimeout(id);
    this._timeouts.delete(id);
  }

  setInterval(fn, ms) {
    const id = window.setInterval(fn, ms);
    this._intervals.add(id);
    return id;
  }

  clearInterval(id) {
    if (id == null) return;
    window.clearInterval(id);
    this._intervals.delete(id);
  }

  requestAnimationFrame(fn) {
    const id = window.requestAnimationFrame((t) => {
      this._raf.delete(id);
      fn(t);
    });
    this._raf.add(id);
    return id;
  }

  cancelAnimationFrame(id) {
    if (id == null) return;
    window.cancelAnimationFrame(id);
    this._raf.delete(id);
  }

  clearAll() {
    for (const id of this._timeouts) window.clearTimeout(id);
    for (const id of this._intervals) window.clearInterval(id);
    for (const id of this._raf) window.cancelAnimationFrame(id);

    this._timeouts.clear();
    this._intervals.clear();
    this._raf.clear();
  }
}