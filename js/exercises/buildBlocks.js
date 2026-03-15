// js/exercises/buildBlocks.js
// ECUBE — Exercise Type 1
// build the blocks / build it bigger / build it further

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

  let destroyed = false;
  let unlocked = false;
  let runningAuto = false;

  const vc = new VideoController();

  container.innerHTML = "";
  container.className = "exercise-root exercise-buildblocks";

  // ---------- shell ----------
  const vocabLayout = document.createElement("div");
  vocabLayout.className = "vocab-layout exercise-buildblocks__layout";

  const area1 = document.createElement("div");
  area1.className = "area1 exercise-buildblocks__media";

  const area2 = document.createElement("div");
  area2.className = "area2 exercise-buildblocks__stage";

  vocabLayout.appendChild(area1);
  vocabLayout.appendChild(area2);
  container.appendChild(vocabLayout);

  // ---------- area 1: video ----------
  const video = vc.createVideoEl(data.videoSrc, {
    className: "vocab-video exercise-buildblocks__video",
    muted: false,
    loop: false,
    playsInline: true,
  });

  area1.appendChild(video);

  vc.playAndFreeze(video, {
    thresholdSeconds: 0.12,
    autoplay: true,
  }).catch(() => {});

  // ---------- area 2: stage ----------
  const stage = document.createElement("div");
  stage.className = "stage bg-blue-30 exercise-buildblocks__stage-bg";

  const card = document.createElement("div");
  card.className = "stage-card panel-white-50 vocab-card exercise-buildblocks__card";

  const content = document.createElement("div");
  content.className = "exercise-content exercise-buildblocks__content";

  // ---------- command bar ----------
  const cmdBar = document.createElement("div");
  cmdBar.className = "cmd-bar exercise-buildblocks__cmdbar";

  const cmdListen = document.createElement("img");
  cmdListen.src = ICONS.listen;
  cmdListen.className = "cmd-icon exercise-buildblocks__cmdicon";
  cmdListen.alt = "Listen";

  const cmdSpeak = document.createElement("img");
  cmdSpeak.src = ICONS.speak;
  cmdSpeak.className = "cmd-icon exercise-buildblocks__cmdicon";
  cmdSpeak.alt = "Speak";

  cmdBar.appendChild(cmdListen);
  cmdBar.appendChild(cmdSpeak);

  // ---------- navigation ----------
  const navWrapper = document.createElement("div");
  navWrapper.className = "vocab-nav exercise-nav exercise-buildblocks__nav";

  const prevImg = document.createElement("img");
  prevImg.src = ICONS.prev;
  prevImg.className = "nav-icon exercise-buildblocks__navicon";
  prevImg.alt = "Previous";

  if (nav.disablePrev || !nav.onPrev) {
    prevImg.classList.add("disabled");
  } else {
    prevImg.addEventListener("click", () => {
      if (destroyed) return;
      nav.onPrev();
    });
  }

  const nextImg = document.createElement("img");
  nextImg.src = ICONS.next;
  nextImg.className = "nav-icon exercise-buildblocks__navicon disabled";
  nextImg.alt = "Next";

  nextImg.addEventListener("click", () => {
    if (destroyed) return;
    if (!unlocked) return;
    if (typeof nav.onNext === "function") nav.onNext();
  });

  navWrapper.appendChild(prevImg);
  navWrapper.appendChild(nextImg);

  // ---------- content wrappers ----------
  const chunksWrap = document.createElement("div");
  chunksWrap.className = "exercise-buildblocks__chunks";

  const framesWrap = document.createElement("div");
  framesWrap.className = "exercise-buildblocks__frames";

  // ---------- items ----------
  const items = [
    ...data.chunks.map((x) => ({ kind: "chunk", ...x })),
    ...data.frames.map((x) => ({ kind: "frame", ...x })),
  ];

  const buttons = items.map((item, idx) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.text ?? "";
    button.dataset.index = String(idx);
    button.className =
      item.kind === "chunk"
        ? "btn1 exercise-buildblocks__btn exercise-buildblocks__btn--chunk"
        : "btn1 exercise-buildblocks__btn exercise-buildblocks__btn--frame";

    const setDisabled = (value) => {
      button.disabled = !!value;
      button.classList.toggle("is-disabled", !!value);
    };

    // inicialmente: só o primeiro botão clicável
    setDisabled(idx !== 0);

    button.addEventListener("click", async () => {
      if (destroyed) return;

      // primeiro clique dispara sequência automática
      if (idx === 0 && !unlocked) {
        if (runningAuto) return;
        runningAuto = true;
        await runAutoSequence();
        runningAuto = false;
        return;
      }

      // depois da sequência, qualquer botão liberado toca seu próprio áudio
      if (unlocked) {
        if (button.disabled) return;
        await playOnceWithCmd(item.audio, cmdListen, cmdSpeak);
      }
    });

    return { el: button, setDisabled, item };
  });

  buttons.forEach((buttonObj) => {
    if (buttonObj.item.kind === "chunk") {
      chunksWrap.appendChild(buttonObj.el);
    } else {
      framesWrap.appendChild(buttonObj.el);
    }
  });

  // ---------- assemble ----------
  content.appendChild(cmdBar);
  content.appendChild(chunksWrap);
  content.appendChild(framesWrap);

  card.appendChild(content);
  card.appendChild(navWrapper);
  stage.appendChild(card);
  area2.appendChild(stage);

  setCmdState(cmdListen, cmdSpeak, null);

  // ---------- orientation class ----------
  const updateOrientationState = () => {
    if (destroyed) return;

    const isMobile = window.innerWidth <= 900;
    const isLandscape = window.innerWidth > window.innerHeight;
    const isPortrait = window.innerHeight > window.innerWidth;

    container.classList.toggle("is-mobile", isMobile);
    container.classList.toggle("is-mobile-landscape", isMobile && isLandscape);
    container.classList.toggle("is-mobile-portrait", isMobile && isPortrait);
  };

  updateOrientationState();
  window.addEventListener("resize", updateOrientationState);
  window.addEventListener("orientationchange", updateOrientationState);

  // ---------- auto sequence ----------
  async function runAutoSequence() {
    buttons.forEach((b) => {
      b.setDisabled(true);
      b.el.classList.add("is-dimmed");
    });

    nextImg.classList.add("disabled");

    for (let i = 0; i < items.length; i++) {
      if (destroyed) return;

      buttons[i].el.classList.remove("is-dimmed");
      buttons[i].el.classList.add("is-current");

      await playOnceWithCmd(items[i].audio, cmdListen, cmdSpeak);

      buttons[i].el.classList.remove("is-current");

      if (i < items.length - 1) {
        buttons[i].el.classList.add("is-dimmed");
      }
    }

    unlocked = true;

    buttons.forEach((b) => {
      b.setDisabled(false);
      b.el.classList.remove("is-dimmed");
      b.el.classList.remove("is-current");
    });

    nextImg.classList.remove("disabled");
    setCmdState(cmdListen, cmdSpeak, null);
  }

  // ---------- cleanup ----------
  return function cleanup() {
    destroyed = true;
    try {
      vc.cancel();
    } catch {}

    window.removeEventListener("resize", updateOrientationState);
    window.removeEventListener("orientationchange", updateOrientationState);

    container.innerHTML = "";
    container.className = "";
  };
}

// ------------------- helpers -------------------

async function playOnceWithCmd(audioSrc, cmdListenEl, cmdSpeakEl) {
  if (!audioSrc) return;

  setCmdState(cmdListenEl, cmdSpeakEl, "listen");

  await new Promise((resolve) => {
    const audio = new Audio(audioSrc);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });

  setCmdState(cmdListenEl, cmdSpeakEl, "speak");
  await wait(2000);

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
  return new Promise((resolve) => setTimeout(resolve, ms));
}
