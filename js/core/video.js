// js/core/video.js
// ECUBE — VideoController (play, freeze-last-frame)
// ✅ Compatível com seu comportamento atual:
// - Intro: video fullscreen, autoplay, onended -> next state, onerror -> next state
// - Vocab intro (area1): autoplay; ao terminar, "some" e entra menu
// ✅ Inclui freeze-last-frame (quando você quiser manter o último frame visível)
//
// Observação importante:
// "Congelar no último frame" é mais confiável se você PAUSAR perto do final
// (às vezes o navegador limpa o frame quando o vídeo termina). Este controller
// faz isso de forma controlada.

export class VideoController {
  constructor() {
    this._video = null;
    this._token = 0; // cancela execuções
  }

  /**
   * Cria um elemento <video> com defaults seguros para mobile.
   */
  createVideoEl(src, { className, muted = false, loop = false, playsInline = true } = {}) {
    const v = document.createElement("video");
    v.src = src;
    if (className) v.className = className;

    v.muted = muted;
    v.loop = loop;
    v.playsInline = !!playsInline; // iOS
    v.setAttribute("playsinline", "");

    // Dica: preload ajuda a reduzir flash branco
    v.preload = "auto";

    return v;
  }

  /**
   * Toca um vídeo até o final. Resolve true quando termina, false se cancelado.
   * Em caso de erro, resolve false (para você seguir adiante sem travar).
   */
  async playToEnd(videoEl, { autoplay = true } = {}) {
    this.cancel();
    const token = ++this._token;
    this._video = videoEl;

    return new Promise((resolve) => {
      const cleanup = () => {
        videoEl.onended = null;
        videoEl.onerror = null;
      };

      videoEl.onended = () => {
        cleanup();
        if (token !== this._token) return resolve(false);
        resolve(true);
      };

      videoEl.onerror = () => {
        cleanup();
        resolve(false);
      };

      if (autoplay) {
        videoEl.play().catch(() => {
          // Autoplay pode falhar dependendo do dispositivo/política
          cleanup();
          resolve(false);
        });
      }
    });
  }

  /**
   * Toca um vídeo e congela no último frame (mantém na tela).
   * - Estratégia: durante o playback, monitora time; quando perto do final,
   *   pausa e resolve true.
   */
  async playAndFreeze(videoEl, { thresholdSeconds = 0.12, autoplay = true } = {}) {
    this.cancel();
    const token = ++this._token;
    this._video = videoEl;

    return new Promise((resolve) => {
      let rafId = 0;

      const stopRaf = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      };

      const cleanup = () => {
        stopRaf();
        videoEl.onended = null;
        videoEl.onerror = null;
      };

      const checkFreeze = () => {
        if (token !== this._token) {
          cleanup();
          return resolve(false);
        }

        // Se o metadata ainda não carregou, tenta de novo
        if (!isFinite(videoEl.duration) || videoEl.duration === 0) {
          rafId = requestAnimationFrame(checkFreeze);
          return;
        }

        const remaining = videoEl.duration - videoEl.currentTime;
        if (remaining <= thresholdSeconds) {
          try {
            // Pause exatamente antes do fim para manter o frame
            videoEl.pause();
          } catch {}
          cleanup();
          return resolve(true);
        }

        rafId = requestAnimationFrame(checkFreeze);
      };

      videoEl.onerror = () => {
        cleanup();
        resolve(false);
      };

      // fallback: se realmente terminar, pausa no final e resolve
      videoEl.onended = () => {
        try {
          videoEl.pause();
        } catch {}
        cleanup();
        if (token !== this._token) return resolve(false);
        resolve(true);
      };

      if (autoplay) {
        videoEl.play().then(() => {
          rafId = requestAnimationFrame(checkFreeze);
        }).catch(() => {
          cleanup();
          resolve(false);
        });
      } else {
        rafId = requestAnimationFrame(checkFreeze);
      }
    });
  }

  /**
   * Para o vídeo atual (se existir)
   */
  stop() {
    if (!this._video) return;
    try {
      this._video.pause();
      this._video.currentTime = 0;
    } catch {}
    this._video = null;
  }

  /**
   * Cancela qualquer execução/monitoramento e para o vídeo.
   */
  cancel() {
    ++this._token;
    this.stop();
  }

  get current() {
    return this._video;
  }
}