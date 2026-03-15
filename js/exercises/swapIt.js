// js/exercises/swapIt.js

import { VideoController } from "../core/video.js";
import { icon } from "../core/assets.js";
import { Catalog } from "../core/catalog.js";

const ICONS = {
  listen: icon("listen"),
  speak: icon("speak"),
  prev: icon("prev"),
  next: icon("next")
};

export async function runSwapIt(container, data, nav = {}) {
  if (!container) throw new Error("runSwapIt: missing container");
  if (!data?.videoSrc) throw new Error("runSwapIt: missing data.videoSrc");
  if (!data?.freezeImageSrc) throw new Error("runSwapIt: missing data.freezeImageSrc");
  if (!data?.initialImageSrc) throw new Error("runSwapIt: missing data.initialImageSrc");
  if (!data?.si1) throw new Error("runSwapIt: missing data.si1");
  if (!data?.sin) throw new Error("runSwapIt: missing data.sin");
  if (!data?.sia1) throw new Error("runSwapIt: missing data.sia1");

  let destroyed = false;
  let running = false;
  let nextUnlocked = false;
  let lastPickedId = null;

  const vc = new VideoController();
  const catalog = new Catalog();
  await catalog.load("js/data/vocabCatalog.json");

  container.innerHTML = "";
  container.className = "exercise-root exercise-swapit";

  // ----------------------------
  // helpers
  // ----------------------------

  function cleanup() {
    destroyed = true;
    try {
      vc.cancel();
    } catch {}

    window.removeEventListener("resize", updateOrientationState);
    window.removeEventListener("orientationchange", updateOrientationState);

    container.innerHTML = "";
    container.className = "";
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

  async function playAudioOnly(audioSrc) {
    if (!audioSrc) return 0;

    const start = performance.now();

    await new Promise((resolve) => {
      const audio = new Audio(audioSrc);
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });

    return performance.now() - start;
  }

  async function playListenThenSpeak(audioSrc, speakDuration, cmdListenEl, cmdSpeakEl) {
    if (!audioSrc) return;

    setCmdState(cmdListenEl, cmdSpeakEl, "listen");
    await playAudioOnly(audioSrc);

    setCmdState(cmdListenEl, cmdSpeakEl, null);

    setCmdState(cmdListenEl, cmdSpeakEl, "speak");
    await wait(speakDuration);
    setCmdState(cmdListenEl, cmdSpeakEl, null);
  }

  function normalize(value) {
    if (!value) return null;
    return String(value).toLowerCase().trim();
  }

  function getCandidateIds(source = {}) {
    if (!catalog.isLoaded) return [];

    const lessonFilter = normalize(source.lesson);
    const g1 = normalize(source.group1);
    const g2 = normalize(source.group2);

    return Object.entries(catalog._data || {})
      .filter(([_, item]) => {
        const itemLesson = normalize(item.lesson || item.introduced_in || item.introducedIn);
        const itemG1 = normalize(item.group1);
        const itemG2 = normalize(item.group2);

        const lessonOk = lessonFilter ? itemLesson === lessonFilter : true;
        const g1Ok = g1 ? itemG1 === g1 : true;
        const g2Ok = g2 ? itemG2 === g2 : true;

        return lessonOk && g1Ok && g2Ok;
      })
      .map(([id]) => id);
  }

  function pickRandomDifferent(list, previousId = null) {
    if (!Array.isArray(list) || list.length === 0) return null;
    if (list.length === 1) return list[0];

    const filtered = previousId ? list.filter((id) => id !== previousId) : list;
    if (!filtered.length) return list[0];

    const idx = Math.floor(Math.random() * filtered.length);
    return filtered[idx];
  }

  function setFreezeImage() {
    if (destroyed) return;

    area1.innerHTML = "";

    const freezeImg = document.createElement("img");
    freezeImg.src = data.freezeImageSrc;
    freezeImg.className = "exercise-swapit__freeze";
    freezeImg.alt = "";

    area1.appendChild(freezeImg);
  }

  function resetVisualState() {
    btn1.textContent = data.si1;
    vocabImg.src = data.initialImageSrc;
    vocabImg.alt = "";
    setCmdState(cmdListen, cmdSpeak, null);
  }

  function updateOrientationState() {
    if (destroyed) return;

    const isMobile = window.innerWidth <= 900;
    const isLandscape = window.innerWidth > window.innerHeight;
    const isPortrait = window.innerHeight > window.innerWidth;

    container.classList.toggle("is-mobile", isMobile);
    container.classList.toggle("is-mobile-landscape", isMobile && isLandscape);
    container.classList.toggle("is-mobile-portrait", isMobile && isPortrait);
  }

  // ----------------------------
  // render shell
  // ----------------------------

  const vocabLayout = document.createElement("div");
  vocabLayout.className = "vocab-layout exercise-swapit__layout";

  const area1 = document.createElement("div");
  area1.className = "area1 exercise-swapit__media";

  const area2 = document.createElement("div");
  area2.className = "area2 exercise-swapit__stage";

  vocabLayout.appendChild(area1);
  vocabLayout.appendChild(area2);
  container.appendChild(vocabLayout);

  // ----------------------------
  // AREA 1
  // ----------------------------

  const video = vc.createVideoEl(data.videoSrc, {
    className: "vocab-video exercise-swapit__video",
    muted: false,
    loop: false,
    playsInline: true
  });

  area1.appendChild(video);

  vc.playToEnd(video, { autoplay: true })
    .then(setFreezeImage)
    .catch(setFreezeImage);

  // ----------------------------
  // AREA 2
  // ----------------------------

  const stage = document.createElement("div");
  stage.className = "stage bg-blue-30 exercise-swapit__stagebg";

  const card = document.createElement("div");
  card.className = "stage-card panel-white-50 vocab-card exercise-swapit__card";

  const inner = document.createElement("div");
  inner.className = "exercise-content exercise-swapit__content";

  const cmdBar = document.createElement("div");
  cmdBar.className = "cmd-bar exercise-swapit__cmdbar";

  const cmdListen = document.createElement("img");
  cmdListen.src = ICONS.listen;
  cmdListen.className = "cmd-icon exercise-swapit__cmdicon";
  cmdListen.alt = "Listen";

  const cmdSpeak = document.createElement("img");
  cmdSpeak.src = ICONS.speak;
  cmdSpeak.className = "cmd-icon exercise-swapit__cmdicon";
  cmdSpeak.alt = "Speak";

  cmdBar.appendChild(cmdListen);
  cmdBar.appendChild(cmdSpeak);

  const btn1 = document.createElement("button");
  btn1.type = "button";
  btn1.className = "btn1 exercise-swapit__button";
  btn1.textContent = data.si1;

  const vocabImg = document.createElement("img");
  vocabImg.className = "exercise-swapit__image";
  vocabImg.alt = "";
  vocabImg.src = data.initialImageSrc;

  const navWrapper = document.createElement("div");
  navWrapper.className = "vocab-nav exercise-nav exercise-swapit__nav";

  const prevImg = document.createElement("img");
  prevImg.src = ICONS.prev;
  prevImg.className = "nav-icon exercise-swapit__navicon";
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
  nextImg.className = "nav-icon exercise-swapit__navicon disabled";
  nextImg.alt = "Next";

  nextImg.addEventListener("click", () => {
    if (destroyed || !nextUnlocked) return;
    if (typeof nav.onNext === "function") nav.onNext();
  });

  navWrapper.appendChild(prevImg);
  navWrapper.appendChild(nextImg);

  inner.appendChild(cmdBar);
  inner.appendChild(btn1);
  inner.appendChild(vocabImg);

  card.appendChild(inner);
  card.appendChild(navWrapper);
  stage.appendChild(card);
  area2.appendChild(stage);

  setCmdState(cmdListen, cmdSpeak, null);

  updateOrientationState();
  window.addEventListener("resize", updateOrientationState);
  window.addEventListener("orientationchange", updateOrientationState);

  const candidates = getCandidateIds(data.vocabSource || {});

  async function runOneSwapCycle(sia1Duration) {
    const pickedId = pickRandomDifferent(candidates, lastPickedId);
    if (!pickedId) return false;

    lastPickedId = pickedId;

    const picked = catalog.resolveItem(pickedId);
    if (!picked) return false;

    const label = picked.label1_en || picked.label1 || picked.lemma || "";

    btn1.textContent = String(data.sin).replace("____", label);
    vocabImg.src = picked.img;
    vocabImg.alt = label;

    await playListenThenSpeak(picked.audio, sia1Duration, cmdListen, cmdSpeak);

    return true;
  }

  btn1.addEventListener("click", async () => {
    if (destroyed || running) return;

    running = true;
    nextUnlocked = false;
    nextImg.classList.add("disabled");

    resetVisualState();

    // 1) toca sia1
    setCmdState(cmdListen, cmdSpeak, "listen");
    const sia1Duration = await playAudioOnly(data.sia1);
    setCmdState(cmdListen, cmdSpeak, null);

    // speak pelo tempo de sia1
    setCmdState(cmdListen, cmdSpeak, "speak");
    await wait(sia1Duration);
    setCmdState(cmdListen, cmdSpeak, null);

    // 2) primeira substituição
    const ok1 = await runOneSwapCycle(sia1Duration);

    // 3) segunda substituição automática
    const ok2 = ok1 ? await runOneSwapCycle(sia1Duration) : false;

    // 4) libera next
    if (ok1 && ok2) {
      nextUnlocked = true;
      nextImg.classList.remove("disabled");
    }

    // volta ao estado visual inicial
    resetVisualState();

    running = false;
  });

  return cleanup;
}
