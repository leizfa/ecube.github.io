// js/app.js
import { runPartA } from "./parts/partA.js";
import { runPartB } from "./parts/partB.js";
import { runPartC } from "./parts/partC.js";
import { runPartD } from "./parts/partD.js";

const container = document.getElementById("state-container");
if (!container) throw new Error("Missing #state-container");

installVHFix();

let lessonsIndex = null;
let currentCleanup = null;

boot();

async function boot() {
  lessonsIndex = await safeFetchJson("./js/data/lessonsIndex.json");

  if (!lessonsIndex?.lessons?.length) {
    container.innerHTML = `
      <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
        <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Erro</div>
        <div class="text-dialogue">Não carregou js/data/lessonsIndex.json. Use Live Server (não file://).</div>
      </div>
    `;
    return;
  }

  renderMenu();
}

function renderMenu() {
  cleanupCurrent();
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "fullscreen centered";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "12px";
  wrap.style.padding = "18px";
  wrap.style.boxSizing = "border-box";
  wrap.style.textAlign = "center";

  const title = document.createElement("div");
  title.className = "text-primary";
  title.style.fontSize = "clamp(22px, 4vw, 52px)";
  title.textContent = "ECUBE — Menu";

  const list = document.createElement("div");
  list.style.width = "min(92vw, 780px)";
  list.style.maxHeight = "70vh";
  list.style.overflow = "auto";
  list.style.padding = "10px";
  list.style.boxSizing = "border-box";
  list.style.borderRadius = "14px";
  list.style.background = "rgba(255,255,255,0.45)";

  const lessons = lessonsIndex.lessons.filter(l => l.enabled !== false);

  const cleanups = [];
  for (const meta of lessons) {
    const row = document.createElement("div");
    row.className = "menu-item";
    row.style.color = "#1c2a4a";
    row.style.background = "rgba(255,255,255,0.65)";
    row.style.padding = "12px 14px";
    row.style.borderRadius = "12px";
    row.style.margin = "10px 0";
    row.style.cursor = "pointer";
    row.textContent = `${meta.module.toUpperCase()} • ${meta.id} — ${meta.title}`;

    const onClick = () => startLesson(meta);
    row.addEventListener("click", onClick);
    cleanups.push(() => row.removeEventListener("click", onClick));

    list.appendChild(row);
  }

  wrap.appendChild(title);
  wrap.appendChild(list);
  container.appendChild(wrap);

  currentCleanup = () => cleanups.forEach(fn => fn());
}

async function startLesson(meta) {
  cleanupCurrent();
  container.innerHTML = `
    <div class="fullscreen centered" style="flex-direction:column; gap:12px;">
      <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Carregando...</div>
      <div class="text-dialogue">${meta.module.toUpperCase()} • ${meta.id} — ${meta.title}</div>
    </div>
  `;

  const lessonData = await importLesson(meta.path);
  if (!lessonData) {
    container.innerHTML = `
      <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
        <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Erro</div>
        <div class="text-dialogue">Falha ao importar a lição: ${meta.path}</div>
        <button class="start-button" id="btn-back">VOLTAR</button>
      </div>
    `;
    container.querySelector("#btn-back")?.addEventListener("click", renderMenu, { once: true });
    return;
  }

  // ===== Fluxo atual: Part A -> (B placeholder) -> (C placeholder) -> (D placeholder) -> menu =====
  const cleanupA = await runPartA(container, lessonData);
  currentCleanup = cleanupA;

  // Quando você quiser ativar o fluxo completo, substituímos o final de PartA
  // para chamar PartB/C/D em sequência.
  // Por enquanto, PartA termina em "Exercises" (igual ao seu app antigo).
}

function cleanupCurrent() {
  if (typeof currentCleanup === "function") {
    try { currentCleanup(); } catch {}
  }
  currentCleanup = null;
}

async function safeFetchJson(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function importLesson(path) {
  try {
    const mod = await import(path);
    return mod.lesson || mod.default || null;
  } catch (e) {
    console.error("Lesson import error:", e);
    return null;
  }
}

function installVHFix() {
  function updateVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }
  window.addEventListener("resize", updateVH);
  window.addEventListener("orientationchange", () => setTimeout(updateVH, 250));
  updateVH();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // The second argument { scope: './' } is the key here
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      console.log("Service Worker registrado com escopo relativo.");
    } catch (err) {
      console.error("Falha ao registrar Service Worker:", err);
    }
  });
}
