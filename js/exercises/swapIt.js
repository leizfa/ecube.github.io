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

  function cleanup() {
    destroyed = true;
    try { vc.cancel(); } catch {}
    container.innerHTML = "";
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

  async function playAudioOnly(audioSrc) {
    if (!audioSrc) return 0;

    const start = performance.now();

    await new Promise((resolve) => {
      const a = new Audio(audioSrc);
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });

    return performance.now() - start;
  }

  async function playListenThenSpeak(audioSrc, speakDuration, cmdListenEl, cmdSpeakEl) {
    if (!audioSrc) return;

    // LISTEN durante o áudio
    setCmdState(cmdListenEl, cmdSpeakEl, "listen");
    await playAudioOnly(audioSrc);

    // desativa listen
    setCmdState(cmdListenEl, cmdSpeakEl, null);

    // SPEAK pelo tempo de sia1
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

  function resetVisualState() {
    btn1.textContent = data.si1;
    vocabImg.src = data.initialImageSrc;
    vocabImg.alt = "";
    setCmdState(cmdListen, cmdSpeak, null);
  }

  // ----------------------------
  // render shell
  // ----------------------------
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

  // AREA 1
  const video = vc.createVideoEl(data.videoSrc, {
    className: "vocab-video",
    muted: false,
    loop: false,
    playsInline: true
  });

  area1.appendChild(video);

  vc.playToEnd(video, { autoplay: true })
    .then(() => {
      if (destroyed) return;
      area1.innerHTML = "";

      const freezeImg = document.createElement("img");
      freezeImg.src = data.freezeImageSrc;
      freezeImg.className = "swapit-freeze-image";
      freezeImg.style.width = "100%";
      freezeImg.style.height = "100%";
      freezeImg.style.objectFit = "cover";

      area1.appendChild(freezeImg);
    })
    .catch(() => {
      if (destroyed) return;
      area1.innerHTML = "";

      const freezeImg = document.createElement("img");
      freezeImg.src = data.freezeImageSrc;
      freezeImg.className = "swapit-freeze-image";
      freezeImg.style.width = "100%";
      freezeImg.style.height = "100%";
      freezeImg.style.objectFit = "cover";

      area1.appendChild(freezeImg);
    });

  // AREA 2
  const stage = document.createElement("div");
  stage.className = "stage bg-blue-30";

  const card = document.createElement("div");
  card.className = "stage-card panel-white-50";

  const inner = document.createElement("div");
  inner.className = "vocab-card swapit-card";
  inner.style.display = "flex";
  inner.style.flexDirection = "column";
  inner.style.justifyContent = "flex-start";
  inner.style.alignItems = "center";
  inner.style.gap = "clamp(12px, 2vh, 24px)";
  inner.style.paddingTop = "clamp(10px, 2vh, 24px)";

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

  const btn1 = document.createElement("button");
  btn1.type = "button";
  btn1.className = "btn1 swapit-btn";
  btn1.textContent = data.si1;
  btn1.style.maxWidth = "min(92%, 900px)";
  btn1.style.width = "fit-content";
  btn1.style.whiteSpace = "normal";
  btn1.style.textAlign = "center";
  btn1.style.fontSize = "clamp(18px, 3.4vw, 34px)";
  btn1.style.lineHeight = "1.15";
  btn1.style.padding = "14px 18px";

  const vocabImg = document.createElement("img");
  vocabImg.className = "swapit-image";
  vocabImg.style.width = "min(42vmin, 340px)";
  vocabImg.style.height = "min(42vmin, 340px)";
  vocabImg.style.objectFit = "contain";
  vocabImg.style.borderRadius = "20px";
  vocabImg.style.pointerEvents = "none";
  vocabImg.alt = "";
  vocabImg.src = data.initialImageSrc;

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
    if (destroyed || !nextUnlocked) return;
    if (typeof nav.onNext === "function") nav.onNext();
  };

  navWrapper.appendChild(prevImg);
  navWrapper.appendChild(nextImg);

  inner.appendChild(cmdBar);
  inner.appendChild(btn1);
  inner.appendChild(vocabImg);
  inner.appendChild(navWrapper);

  card.appendChild(inner);
  stage.appendChild(card);
  area2.appendChild(stage);

  setCmdState(cmdListen, cmdSpeak, null);

  const candidates = getCandidateIds(data.vocabSource || {});

  async function runOneSwapCycle(sia1Duration) {
    const pickedId = pickRandomDifferent(candidates, lastPickedId);
    if (!pickedId) return false;

    lastPickedId = pickedId;
    const picked = catalog.resolveItem(pickedId);
    if (!picked) return false;

    const label = picked.label1_en || picked.label1 || picked.lemma || "";

    // troca si1/sin e preenche imediatamente
    btn1.textContent = String(data.sin).replace("____", label);

    // troca imagem
    vocabImg.src = picked.img;
    vocabImg.alt = label;

    // toca audio_main do item + listen, depois speak por tempo de sia1
    await playListenThenSpeak(picked.audio, sia1Duration, cmdListen, cmdSpeak);

    return true;
  }

  btn1.onclick = async () => {
    if (destroyed || running) return;
    running = true;
    nextUnlocked = false;
    nextImg.classList.add("disabled");

    // sempre volta ao estado inicial ao começar
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

    // volta visualmente ao estado inicial, mas continua liberado para replay
    resetVisualState();

    running = false;
  };

  return cleanup;
}