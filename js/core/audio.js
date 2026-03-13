// js/core/audio.js
// ECUBE — AudioController (play, stop, queue, cancel)
// ✅ Projetado para encaixar no seu comportamento atual:
// - você cria new Audio(src) e toca
// - você precisa: tocar 1x, esperar, tocar 2x, etc.
// - você precisa conseguir CANCELAR quando trocar de state (evitar áudio "vazando")
//
// Este controlador não muda a sua lógica; só dá ferramentas para controlar melhor.

export class AudioController {
  constructor() {
    this._current = null;         // HTMLAudioElement atual
    this._currentSrc = null;
    this._queueToken = 0;         // cancela sequências
    this._onEndBound = null;
  }

  /**
   * Toca um áudio e resolve quando terminar.
   * - cancela qualquer áudio anterior automaticamente (para evitar overlap)
   */
  async play(src, { volume = 1, rate = 1 } = {}) {
    this.stop();

    const token = ++this._queueToken;
    const audio = new Audio(src);
    this._current = audio;
    this._currentSrc = src;

    audio.volume = volume;
    audio.playbackRate = rate;

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        if (this._current === audio) {
          this._current = null;
          this._currentSrc = null;
        }
        audio.onended = null;
        audio.onerror = null;
      };

      audio.onended = () => {
        if (token !== this._queueToken) {
          cleanup();
          return resolve(false); // terminou, mas sequência foi cancelada
        }
        cleanup();
        resolve(true);
      };

      audio.onerror = () => {
        cleanup();
        reject(new Error(`Audio failed to load: ${src}`));
      };

      audio.play().catch((err) => {
        cleanup();
        reject(err);
      });
    });
  }

  /**
   * Toca um áudio sem aguardar o final (fire-and-forget).
   * Retorna o elemento para você anexar callbacks se quiser.
   */
  playNow(src, { volume = 1, rate = 1 } = {}) {
    this.stop();
    ++this._queueToken;

    const audio = new Audio(src);
    this._current = audio;
    this._currentSrc = src;
    audio.volume = volume;
    audio.playbackRate = rate;

    audio.play().catch(() => {
      // silencioso — seu app já trata falhas seguindo adiante
    });

    return audio;
  }

  /**
   * Para o áudio atual e limpa.
   */
  stop() {
    if (!this._current) return;
    try {
      this._current.pause();
      // reset para início
      this._current.currentTime = 0;
    } catch {}
    this._current = null;
    this._currentSrc = null;
  }

  /**
   * Cancela sequências em andamento (queueToken).
   * Também para o áudio atual.
   */
  cancel() {
    ++this._queueToken;
    this.stop();
  }

  /**
   * Aguarda X ms, mas respeita cancel().
   * Retorna false se cancelado.
   */
  async wait(ms) {
    const token = this._queueToken;
    await new Promise((res) => setTimeout(res, ms));
    return token === this._queueToken;
  }

  /**
   * Roda uma sequência de ações async em ordem.
   * Se cancel() for chamado no meio, interrompe.
   */
  async sequence(fn) {
    const token = this._queueToken;
    try {
      await fn({
        play: (src, opts) => this.play(src, opts),
        wait: (ms) => this.wait(ms),
        isCanceled: () => token !== this._queueToken,
      });
    } catch (e) {
      // você pode logar fora se quiser
      // console.warn("Audio sequence error:", e);
    }
  }

  get currentSrc() {
    return this._currentSrc;
  }

  get isPlaying() {
    return !!(this._current && !this._current.paused);
  }
}