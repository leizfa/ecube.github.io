// js/exercises/buildBlocks.js
// ECUBE — Exercise Type 1
// build the blocks / build it bigger / build it further
//
// Espera data no formato:
// {
//   type: "buildBlocks",
//   title?: "Build the blocks",
//   videoSrc: "assets/lessons/lesson01/exercises/build_blocks.webm",
//   chunks: [ { text:"ch1 text", audio:".../cha1.aac" }, ... ],
//   frames: [ { text:"fr1 text", audio:".../fra1.aac" }, { text:"fr2 text", audio:".../fra2.aac" } ]
// }
//
// nav:
// { onPrev?: ()=>void, onNext?: ()=>void, disablePrev?: boolean }

import { VideoController } from "../core/video.js";
import { icon } from "../core/assets.js";

const ICONS = {
  listen: icon("listen"),
  speak: icon("speak"),
  prev: icon("prev"),
  next: icon("next"),
};

export async function runBuildBlocks(container, data, nav = {}) {
  if (!container) throw new Error("runBuildBlocks: missing container");
  if (!data?.videoSrc) throw new Error("runBuildBlocks: missing data.videoSrc");
  if (!Array.isArray(data?.chunks)) throw new Error("runBuildBlocks: data.chunks must be an array");
  if (!Array.isArray(data?.frames)) throw new Error("runBuildBlocks: data.frames must be an array");

  // ---------- local state ----------
  let destroyed = false;
  let unlocked = false;          // libera cliques individuais e Next
  let runningAuto = false;       // evita duplo clique
  const vc = new VideoController();

  // ---------- render shell (igual vocab layout) ----------
  container.innerHTML = "";

  const vocabLayout = document.createElement("div");
  vocabLayout.className = "vocab-layout";

  const area1 = document.createElement("div");
  area1.className = "area1";

  const area2 = document.createElement("div");
  area2.className = "area2";

  vocabLayout.appendChild(area1);
  vocabLayout.appendChild(area2);
  container.appendChild(vocabLayout);

  // ---------- AREA 1: video play + freeze last frame ----------
  const video = vc.createVideoEl(data.videoSrc, { className: "vocab-video", muted: false, loop: false, playsInline: true });
  area1.appendChild(video);

  // toca e congela no último frame
  // (se autoplay falhar, o exercício ainda funciona — vídeo pode ficar parado)
  vc.playAndFreeze(video, { thresholdSeconds: 0.12, autoplay: true }).catch(() => {});

  // ---------- AREA 2: stage + card ----------
  const stage = document.createElement("div");
  stage.className = "stage bg-blue-30";

  const card = document.createElement("div");
  card.className = "stage-card panel-white-50";

  const inner = document.createElement("div");
  inner.className = "vocab-card";

// Reserva espaço para a barra de navegação absoluta (prev/next)
inner.style.paddingBottom = "clamp(10px, 2vh, 120px)";

// Sobe um pouco o conteúdo total (ajuste fino)
inner.style.justifyContent = "flex-start";
inner.style.paddingTop = "clamp(10px, 2vh, 24px)";

  // CMD BAR
  const cmdBar = document.createElement("div");
  cmdBar.className = "cmd-bar";

  const cmdListen = document.createElement("img");
  cmdListen.src = ICONS.listen;
  cmdListen.className = "cmd-icon";
  cmdListen.alt = "Listen";

  const cmdSpeak = document.createElement("img");
  cmdSpeak.src = ICONS.speak;
  cmdSpeak.className = "cmd-icon";
  cmdSpeak.alt = "Speak";

  cmdBar.appendChild(cmdListen);
  cmdBar.appendChild(cmdSpeak);

  // NAV (mesma posição do vocab)
  const navWrapper = document.createElement("div");
  navWrapper.className = "vocab-nav exercise-nav";

  const prevImg = document.createElement("img");
  prevImg.src = ICONS.prev;
  prevImg.className = "nav-icon";
  if (nav.disablePrev || !nav.onPrev) {
    prevImg.classList.add("disabled");
  } else {
    prevImg.onclick = () => {
      if (destroyed) return;
      nav.onPrev();
    };
  }

  const nextImg = document.createElement("img");
  nextImg.src = ICONS.next;
  nextImg.className = "nav-icon disabled";
  nextImg.onclick = () => {
    if (destroyed) return;
    if (!unlocked) return;
    if (typeof nav.onNext === "function") nav.onNext();
  };

  navWrapper.appendChild(prevImg);
  navWrapper.appendChild(nextImg);

  // Buttons container (wrap, multi-line)
  const btnWrap = document.createElement("div");
  btnWrap.style.width = "100%";
  btnWrap.style.display = "flex";
  btnWrap.style.flexWrap = "wrap";
  btnWrap.style.justifyContent = "center";
  btnWrap.style.gap = "12px";
  btnWrap.style.marginTop = "6px";
  btnWrap.style.marginBottom = "6px";

  // Frame buttons (fr1/fr2) container (stacked)
  const frameWrap = document.createElement("div");
  frameWrap.style.width = "100%";
  frameWrap.style.display = "flex";
  frameWrap.style.flexDirection = "column";
  frameWrap.style.alignItems = "center";
  frameWrap.style.gap = "12px";
  frameWrap.style.marginTop = "4px";

  // Build list: chunks first, then frames
  const items = [
    ...data.chunks.map((x) => ({ kind: "chunk", ...x })),
    ...data.frames.map((x) => ({ kind: "frame", ...x })),
  ];

  // create buttons
// create buttons
const buttons = items.map((item, idx) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = item.text ?? "";
  b.dataset.index = String(idx);

  // style = btn1 (RGB 58,89,153 / white bold / radius 8)
  b.style.background = "rgb(58, 89, 153)";
  b.style.color = "white";
  b.style.fontWeight = "700";
  b.style.border = "none";
  b.style.borderRadius = "8px";
  b.style.cursor = "pointer";
  b.style.padding = "14px 18px";
  b.style.fontSize = "clamp(16px, 3.3vw, 34px)";
  b.style.lineHeight = "1.1";
  b.style.maxWidth = "100%";
  b.style.whiteSpace = "normal";
  b.style.textAlign = "center";

  // sizes:
  // chunks can be smaller; frames should feel larger
  if (item.kind === "chunk") {
    b.style.flex = "0 1 auto";
  } else {
    b.style.width = "min(92%, 900px)";
  }

  // disabled look helper
  const setDisabled = (val) => {
    b.disabled = !!val;
    b.style.opacity = val ? "0.45" : "1";
    b.style.pointerEvents = val ? "none" : "auto";
  };

  // initially: ONLY first button clickable (ch1)
  setDisabled(idx !== 0);

  // click behavior
  b.onclick = async () => {
    if (destroyed) return;

    // CASO 1: Clique no primeiro chunk (índice 0) e AINDA NÃO EXECUTOU A SEQUÊNCIA
    if (idx === 0 && !unlocked) {
      if (runningAuto) return;
      runningAuto = true;
      
      // Inicia a sequência automática
      await runAutoSequence();
      runningAuto = false;
      return;
    }

    // CASO 2: Clique em QUALQUER botão APÓS a sequência
    if (unlocked) {
      // Garante que o botão não está disabled
      if (b.disabled) return;
      
      // Toca APENAS o áudio deste botão específico
      console.log(`Playing individual audio for item ${idx}`);
      await playOnceWithCmd(item.audio, cmdListen, cmdSpeak);
    }
  };

  // Retorna o objeto com o botão - FORA do click handler
  return { el: b, setDisabled, item };
});

  // mount buttons: chunks in btnWrap, frames in frameWrap
  buttons.forEach((b) => {
    if (b.item.kind === "chunk") btnWrap.appendChild(b.el);
    else frameWrap.appendChild(b.el);
  });

  // assemble
  inner.appendChild(cmdBar);
  inner.appendChild(btnWrap);
  inner.appendChild(frameWrap);
  inner.appendChild(navWrapper);

  card.appendChild(inner);
  stage.appendChild(card);
  area2.appendChild(stage);

  setCmdState(cmdListen, cmdSpeak, null);

// ============ LANDSCAPE MOBILE FIX ============

 // ============ LANDSCAPE MOBILE FIX - KEEP LAYOUT, SHRINK CONTENT ============
// ============ LANDSCAPE MOBILE FIX - PROPER SIZING ============
function applyOrientationFix() {
  const isLandscape = window.innerWidth > window.innerHeight && window.innerWidth <= 900;
  const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth <= 768;
  
  if (isLandscape) {
    console.log("Landscape mode - proper sizing");
    
    // ===== KEEP ORIGINAL 50/50 LAYOUT =====
    vocabLayout.style.flexDirection = "row";
    // Don't change flex ratios - keep original
    
    // ===== MAKE AREA2 ELEMENTS FIT AND CENTERED =====
    
    // Make inner container use full height and center content
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.justifyContent = "center";  // Center vertically
    inner.style.alignItems = "center";       // Center horizontally
    inner.style.height = "100%";
    inner.style.padding = "15px 10px";
    inner.style.gap = "12px";
    
    // ===== CMD BAR =====
    cmdBar.style.display = "flex";
    cmdBar.style.justifyContent = "center";
    cmdBar.style.gap = "30px";
    cmdBar.style.marginBottom = "5px";
    cmdBar.style.width = "100%";
    
    // Good sized icons
    cmdListen.style.width = "36px";
    cmdListen.style.height = "36px";
    cmdSpeak.style.width = "36px";
    cmdSpeak.style.height = "36px";
    
    // ===== CHUNK BUTTONS (one row) =====
    btnWrap.style.display = "flex";
    btnWrap.style.flexDirection = "row";
    btnWrap.style.flexWrap = "wrap";
    btnWrap.style.justifyContent = "center";
    btnWrap.style.alignItems = "center";
    btnWrap.style.gap = "10px";
    btnWrap.style.margin = "5px 0";
    btnWrap.style.width = "100%";
    
    // ===== FRAME BUTTONS (stacked) =====
    frameWrap.style.display = "flex";
    frameWrap.style.flexDirection = "column";
    frameWrap.style.alignItems = "center";
    frameWrap.style.justifyContent = "center";
    frameWrap.style.gap = "10px";
    frameWrap.style.margin = "5px 0";
    frameWrap.style.width = "100%";
    
    // ===== ALL BUTTONS - GOOD SIZED =====
    buttons.forEach(({ el, item }) => {
      // Base button styles - good for landscape
      el.style.padding = "10px 16px";
      el.style.fontSize = "16px";
      el.style.minHeight = "40px";
      el.style.lineHeight = "1.2";
      el.style.borderRadius = "8px";
      el.style.fontWeight = "600";
      
      if (item.kind === "chunk") {
        el.style.flex = "0 1 auto";
        el.style.width = "auto";
        el.style.minWidth = "100px";
      } else {
        el.style.width = "80%";
        el.style.maxWidth = "300px";
      }
    });
    
    // ===== NAVIGATION =====
    navWrapper.style.display = "flex";
    navWrapper.style.justifyContent = "space-between";
    navWrapper.style.alignItems = "center";
    navWrapper.style.marginTop = "10px";
    navWrapper.style.padding = "5px 10px";
    navWrapper.style.width = "100%";
    navWrapper.style.maxWidth = "250px";  // Limit width to keep icons closer
    navWrapper.style.marginLeft = "auto";
    navWrapper.style.marginRight = "auto";
    
    // Good sized nav icons
    prevImg.style.width = "36px";
    prevImg.style.height = "36px";
    nextImg.style.width = "36px";
    nextImg.style.height = "36px";
    
    // ===== ENSURE EVERYTHING FITS =====
    area2.style.overflowY = "auto";
    area2.style.display = "flex";
    area2.style.alignItems = "center";     // Center vertically
    area2.style.justifyContent = "center";  // Center horizontally
    
  } else if (isPortrait) {
    console.log("Portrait mode - original layout");
    
    // ===== RESTORE ORIGINAL PORTRAIT STYLES =====
    // Reset everything to original
    
    vocabLayout.style.flexDirection = "column";
    
    // Reset inner
    inner.style.display = "";
    inner.style.justifyContent = "flex-start";
    inner.style.alignItems = "";
    inner.style.height = "";
    inner.style.padding = "";
    inner.style.paddingBottom = "clamp(10px, 2vh, 120px)";
    inner.style.paddingTop = "clamp(10px, 2vh, 24px)";
    inner.style.gap = "";
    
    // Reset cmd bar
    cmdBar.style.justifyContent = "";
    cmdBar.style.gap = "";
    cmdBar.style.marginBottom = "";
    cmdBar.style.width = "";
    
    cmdListen.style.width = "";
    cmdListen.style.height = "";
    cmdSpeak.style.width = "";
    cmdSpeak.style.height = "";
    
    // Reset button wrap
    btnWrap.style.flexDirection = "row";
    btnWrap.style.flexWrap = "wrap";
    btnWrap.style.justifyContent = "center";
    btnWrap.style.alignItems = "";
    btnWrap.style.gap = "12px";
    btnWrap.style.margin = "6px 0";
    btnWrap.style.width = "100%";
    
    // Reset frame wrap
    frameWrap.style.flexDirection = "column";
    frameWrap.style.alignItems = "center";
    frameWrap.style.justifyContent = "";
    frameWrap.style.gap = "12px";
    frameWrap.style.margin = "4px 0";
    frameWrap.style.width = "100%";
    
    // Reset buttons
    buttons.forEach(({ el, item }) => {
      el.style.padding = "14px 18px";
      el.style.fontSize = "clamp(16px, 3.3vw, 34px)";
      el.style.minHeight = "";
      el.style.lineHeight = "1.1";
      el.style.fontWeight = "700";
      
      if (item.kind === "chunk") {
        el.style.flex = "0 1 auto";
        el.style.width = "auto";
        el.style.minWidth = "";
      } else {
        el.style.width = "min(92%, 900px)";
        el.style.maxWidth = "min(92%, 900px)";
      }
    });
    
    // Reset navigation
    navWrapper.style.display = "";
    navWrapper.style.justifyContent = "";
    navWrapper.style.alignItems = "";
    navWrapper.style.marginTop = "";
    navWrapper.style.padding = "";
    navWrapper.style.width = "";
    navWrapper.style.maxWidth = "";
    navWrapper.style.marginLeft = "";
    navWrapper.style.marginRight = "";
    
    prevImg.style.width = "";
    prevImg.style.height = "";
    nextImg.style.width = "";
    nextImg.style.height = "";
    
    // Reset area2
    area2.style.overflowY = "";
    area2.style.display = "";
    area2.style.alignItems = "";
    area2.style.justifyContent = "";
    
  } else {
    // Desktop - keep original
  }
}

// Apply on load and orientation change
applyOrientationFix();
window.addEventListener('resize', applyOrientationFix);
window.addEventListener('orientationchange', applyOrientationFix);

  // ---------- auto sequence ----------
 // ---------- auto sequence ----------
// ---------- auto sequence ----------
// ---------- auto sequence ----------
async function runAutoSequence() {
  console.log("Starting auto sequence");
  
  // Durante a sequência, desabilita TODOS os botões usando setDisabled
  buttons.forEach((b) => {
    b.setDisabled(true);  // Usa setDisabled em vez de manipular diretamente
  });
  nextImg.classList.add("disabled");
  
  // Começa com todos em opacity 0.3 (estado inicial da sequência)
  buttons.forEach((b) => {
    b.el.style.opacity = "0.3";
  });

  // Sequência para cada item
  for (let i = 0; i < items.length; i++) {
    if (destroyed) return;

    // Ativa o botão atual (opacity 1)
    buttons[i].el.style.opacity = "1";
    
    // Toca o áudio correspondente
    const src = items[i].audio;
    await playOnceWithCmd(src, cmdListen, cmdSpeak);
    
    // Desativa o botão atual (volta para 0.3) se não for o último
    if (i < items.length - 1) {
      buttons[i].el.style.opacity = "0.3";
    }
  }

  // ===== AO FINAL DA SEQUÊNCIA =====
  // Todos os botões ficam clicáveis e com opacity 1
  unlocked = true;
  buttons.forEach((b) => {
    b.setDisabled(false);  // Usa setDisabled para habilitar consistentemente
    b.el.style.opacity = "1";
  });
  
  nextImg.classList.remove("disabled");
  setCmdState(cmdListen, cmdSpeak, null);
  
  console.log("Auto sequence complete - todos os botões liberados para cliques individuais");
}

  // ---------- cleanup ----------
  return function cleanup() {
    destroyed = true;
    try { vc.cancel(); } catch {}
    container.innerHTML = "";
  };
}

// ------------------- helpers -------------------

async function playOnceWithCmd(audioSrc, cmdListenEl, cmdSpeakEl) {
  if (!audioSrc) return;

  // 1) LISTEN while audio plays
  setCmdState(cmdListenEl, cmdSpeakEl, "listen");

  await new Promise((resolve) => {
    const a = new Audio(audioSrc);
    a.onended = () => resolve();
    a.onerror = () => resolve(); // não trava o flow
    a.play().catch(() => resolve());
  });

  // 2) SPEAK window for 2 seconds
  setCmdState(cmdListenEl, cmdSpeakEl, "speak");
  await wait(2000);

  // 3) back to baseline
  setCmdState(cmdListenEl, cmdSpeakEl, null);
}

function setCmdState(cmdListenEl, cmdSpeakEl, which) {
  if (!cmdListenEl || !cmdSpeakEl) return;

  cmdListenEl.classList.remove("active");
  cmdSpeakEl.classList.remove("active");

  if (which === "listen") cmdListenEl.classList.add("active");
  if (which === "speak") cmdSpeakEl.classList.add("active");
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
