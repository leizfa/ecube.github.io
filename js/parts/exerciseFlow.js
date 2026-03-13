// js/parts/exerciseFlow.js
// ECUBE — Exercise Flow Runner
// Lê lessonData.partA.exercises (ou partB/partX no futuro) e executa em sequência.
// Cada exercício é um item com { id, type, ...data }.
// O handler é resolvido via js/exercises/index.js (registry).
//
// Convenção:
// handler(container, data, nav) -> retorna cleanup() (ou Promise<cleanup>)
//
// nav:
// { onPrev, onNext, disablePrev }

import { getExerciseHandler } from "../exercises/index.js";

export async function runExerciseFlow(container, lessonData, options = {}) {
  const { onDone } = options;

  const list = lessonData?.partA?.exercises || [];
  let destroyed = false;
  let idx = 0;
  let currentCleanup = null;
  let runToken = 0;

  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = `
      <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
        <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Exercises</div>
        <div class="text-dialogue">Nenhum exercício definido em lesson.partA.exercises.</div>
      </div>
    `;
    if (typeof onDone === "function") onDone();
    return () => (container.innerHTML = "");
  }

  async function mountExercise(newIndex) {
    if (destroyed) return;
    if (newIndex < 0 || newIndex >= list.length) return;

    // cancela exercício anterior
    if (typeof currentCleanup === "function") {
      try { currentCleanup(); } catch {}
      currentCleanup = null;
    }

    idx = newIndex;
    const item = list[idx] || {};
    const type = item.type;
    const handler = getExerciseHandler(type);

    if (!handler) {
      container.innerHTML = `
        <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
          <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Erro</div>
          <div class="text-dialogue">Handler não registrado para type: <b>${escapeHtml(String(type))}</b></div>
          <button class="start-button" id="btn-skip">PULAR</button>
        </div>
      `;
      const btn = container.querySelector("#btn-skip");
      btn?.addEventListener("click", () => {
        if (idx + 1 < list.length) mountExercise(idx + 1);
        else finish();
      }, { once: true });
      return;
    }

    const localToken = ++runToken;

    const nav = {
      disablePrev: idx === 0,
      onPrev: () => {
        if (destroyed) return;
        if (idx === 0) return;
        mountExercise(idx - 1);
      },
      onNext: () => {
        if (destroyed) return;
        if (idx + 1 < list.length) mountExercise(idx + 1);
        else finish();
      }
    };

    // Passa o item inteiro como "data" (inclui videoSrc/chunks/frames etc.)
    // O handler pode ignorar campos extras.
    const cleanup = await handler(container, item, nav);

    // se houve navegação rápida enquanto o handler "await"ava, descarta cleanup antigo
    if (destroyed || localToken !== runToken) {
      if (typeof cleanup === "function") {
        try { cleanup(); } catch {}
      }
      return;
    }

    currentCleanup = typeof cleanup === "function" ? cleanup : null;
  }

  function finish() {
    if (destroyed) return;

    if (typeof currentCleanup === "function") {
      try { currentCleanup(); } catch {}
      currentCleanup = null;
    }

    container.innerHTML = `
      <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
        <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Exercises</div>
        <div class="text-dialogue">Fim da sequência de exercícios.</div>
      </div>
    `;

    if (typeof onDone === "function") onDone();
  }

  // start
  await mountExercise(0);

  // cleanup
  return () => {
    destroyed = true;
    if (typeof currentCleanup === "function") {
      try { currentCleanup(); } catch {}
    }
    currentCleanup = null;
    container.innerHTML = "";
  };
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}