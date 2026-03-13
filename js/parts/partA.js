// js/parts/partA.js
// ✅ ALTERAÇÃO MÍNIMA: STATE_EXERCISES agora chama o ExerciseFlow
// Todo o resto permanece 1:1 com seu último funcionamento.

import { Catalog } from "../core/catalog.js";
import { icon } from "../core/assets.js";
import { runExerciseFlow } from "./exerciseFlow.js";

const ICONS = {
  listen: icon("listen"),
  speak: icon("speak"),
  prev: icon("prev"),
  next: icon("next"),
  audioicon: icon("audioicon")
};

export async function runPartA(container, lessonData, opts = {}) {
  // ====== IGUAL AO SEU RUNTIME ======
  let isFirstVocabLoad = true;
  let currentBlockIndex = 0; // mantido
  let currentCheckType = null;
  let blockItems = [];
  let checkedItems = new Set();
  let checkErrorCount = 0;
  let blockCheckQueue = [];
  let currentState = "STATE_BOOT";
  let currentVocabIndex = 0;
  let audioPlayCount = 0;
  let rotationIndex = 0;
  let isVocabAudioRunning = false;
  const checkRotation = ["CK1", "CK2", "CK1", "CK2", "CK3"];

  // ====== EXTRA: controle do exercise flow ======
  let destroyed = false;
  let exercisesCleanup = null;
  let exercisesRenderToken = 0;

  // ====== CATALOG + VOCAB RESOLVIDO ======
  const catalog = new Catalog();
  await catalog.load("js/data/vocabCatalog.json");

  const lessonConfig = {
    dialog: lessonData.dialog || { images: [], audios: [], subtitles: [], saturationTriggers: {} },
    vocab: (lessonData.vocabIds || [])
      .map((id) => catalog.resolveItem(id))
      .filter(Boolean)
  };

  // ====== HELPERS ======
  function setState(newState) {
    currentState = newState;
    renderState();
  }

  function renderState() {
    if (!container) return;
    container.innerHTML = "";

    // sempre cancela exercise flow ao sair/entrar de estados não-exercises
    if (currentState !== "STATE_EXERCISES" && typeof exercisesCleanup === "function") {
      try { exercisesCleanup(); } catch {}
      exercisesCleanup = null;
    }

    switch (currentState) {
      case "STATE_INTRO_VIDEO": renderIntro(container); break;
      case "STATE_DIALOG_WARN": renderWarn(container); break;
      case "STATE_MINI_DIALOG": renderMiniDialog(container); break;
      case "STATE_VOCAB_LOOP": renderVocabItem(container); break;

      // ✅ ALTERAÇÃO: agora roda flow real
      case "STATE_EXERCISES": renderExercises(container); break;

      case "SUBSTATE_CHECK": renderSubstateCheck(container); break;
      case "STATE_BOOT": renderBootScreen(container); break;
    }
  }

  function renderExercises(container) {
    // Evita corrida se renderState for chamado múltiplas vezes
    const token = ++exercisesRenderToken;

    container.innerHTML = `
      <div class="fullscreen centered" style="flex-direction:column; gap:12px; padding:18px; box-sizing:border-box; text-align:center;">
        <div class="text-primary" style="font-size:clamp(18px,4vw,44px)">Exercises</div>
        <div class="text-dialogue">Carregando exercícios...</div>
      </div>
    `;

    (async () => {
      const cleanup = await runExerciseFlow(container, lessonData, {
        onDone: () => {
          // por enquanto, não encadeia PartB/C/D aqui
          // mantém o comportamento simples: termina e fica na tela final do flow
        }
      });

      if (destroyed || token !== exercisesRenderToken) {
        if (typeof cleanup === "function") {
          try { cleanup(); } catch {}
        }
        return;
      }

      exercisesCleanup = cleanup;
    })();
  }

  function renderBootScreen(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "fullscreen centered";

    const btn = document.createElement("button");
    btn.className = "start-button";
    btn.innerText = "COMEÇAR";

    btn.onclick = () => setState("STATE_INTRO_VIDEO");

    wrapper.appendChild(btn);
    container.appendChild(wrapper);
  }

  function renderIntro(container) {
    const video = document.createElement("video");
    video.src = lessonData?.common?.introVideo || "assets/common/ui/missing.webm";
    video.autoplay = true;
    video.className = "fullscreen";

    video.play().catch((e) => {
      console.warn("Falha ao tocar vídeo, pulando...", e);
      setState("STATE_DIALOG_WARN");
    });

    video.onended = () => setState("STATE_DIALOG_WARN");
    video.onerror = () => {
      console.error("Arquivo de vídeo não encontrado em:", video.src);
      setState("STATE_DIALOG_WARN");
    };

    container.appendChild(video);
  }

  function renderWarn(container) {
    const div = document.createElement("div");
    div.className = "fullscreen centered";
    const warnSrc = lessonData?.warns?.beforeMiniDialog || "assets/common/ui/warn.webp";
    div.innerHTML = `<img class="warn-img" src="${warnSrc}" />`;
    container.appendChild(div);
    setTimeout(() => setState("STATE_MINI_DIALOG"), 3000);
  }

  function renderMiniDialog(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "fullscreen mini-dialog";

    const imagesRow = document.createElement("div");
    imagesRow.className = "mini-dialog-images";

    const subtitle = document.createElement("div");
    subtitle.className = "text-dialogue";

    const images = (lessonConfig.dialog.images || []).map((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.style.filter = "grayscale(100%)";
      img.style.height = "auto";
      imagesRow.appendChild(img);
      return img;
    });

    function playAudio(index) {
      if (index >= (lessonConfig.dialog.audios || []).length) {
        setTimeout(() => setState("STATE_VOCAB_LOOP"), 500);
        return;
      }

      const audio = new Audio(lessonConfig.dialog.audios[index]);
      subtitle.innerText = (lessonConfig.dialog.subtitles || [])[index] || "";

      const trig = lessonConfig.dialog.saturationTriggers || {};
      if (trig[index] !== undefined) {
        const imgIndex = trig[index];
        if (images[imgIndex]) images[imgIndex].style.filter = "grayscale(0%)";
      }

      audio.onended = () => playAudio(index + 1);
      audio.play();
    }

    if (images[0]) {
      images[0].onclick = () => {
        images[0].style.filter = "grayscale(0%)";
        playAudio(0);
      };
    }

    wrapper.appendChild(imagesRow);
    wrapper.appendChild(subtitle);
    container.appendChild(wrapper);

    if (!images.length) {
      setTimeout(() => setState("STATE_VOCAB_LOOP"), 400);
    }
  }

  function renderVocabItem(container) {
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

    if (isFirstVocabLoad) {
      const video = document.createElement("video");
      video.src = lessonData?.common?.vocabIntroVideo || "assets/common/ui/missing.webm";
      video.className = "vocab-video";
      video.autoplay = true;

      video.onended = () => {
        isFirstVocabLoad = false;
        renderVocabMenu(area1, area2);
        loadVocabContent(area2, currentVocabIndex);
      };

      video.onerror = () => {
        console.warn("Vocab intro video não encontrado em:", video.src);
        isFirstVocabLoad = false;
        renderVocabMenu(area1, area2);
        loadVocabContent(area2, currentVocabIndex);
      };

      area1.appendChild(video);
    } else {
      renderVocabMenu(area1, area2);
      loadVocabContent(area2, currentVocabIndex);
    }
  }

  function renderVocabMenu(area1, area2) {
    area1.innerHTML = "";

    const menuList = document.createElement("div");
    menuList.style.textAlign = "center";

    lessonConfig.vocab.forEach((item, index) => {
      const link = document.createElement("div");
      link.className = "menu-item";
      link.innerText = item.label1_en ?? item.label1 ?? item.lemma ?? `Item ${index + 1}`;

      link.onclick = () => {
        currentVocabIndex = index;
        audioPlayCount = 0;
        isVocabAudioRunning = false;
        loadVocabContent(area2, index);
      };

      menuList.appendChild(link);
    });

    area1.appendChild(menuList);
  }

  function loadVocabContent(area2, index) {
    area2.innerHTML = "";
    const item = lessonConfig.vocab[index];
    if (!item) {
      setState("STATE_EXERCISES");
      return;
    }

    const stage = document.createElement("div");
    stage.className = "stage bg-blue-30";

    const card = document.createElement("div");
    card.className = "stage-card panel-white-50";

    const inner = document.createElement("div");
    inner.className = "vocab-card";

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

    const img = document.createElement("img");
    img.src = item.img;
    img.className = "vocab-image";
    img.style.cursor = "pointer";

    const label1 = document.createElement("div");
    label1.className = "text-primary";
    label1.innerText = item.label1_en ?? item.label1 ?? item.lemma ?? "";
    label1.style.fontSize = "clamp(20px, 8vh, 60px)";

    const label2 = document.createElement("div");
    label2.className = "text-secondary";
    label2.innerText = item.label2_pt ?? item.label2 ?? "";
    label2.style.fontSize = "clamp(16px, 5vh, 30px)";

    const navWrapper = document.createElement("div");
    navWrapper.className = "vocab-nav";

    const prevImg = document.createElement("img");
    prevImg.src = ICONS.prev;
    prevImg.className = "nav-icon";
    prevImg.onclick = () => {
      if (currentVocabIndex > 0) {
        currentVocabIndex--;
        audioPlayCount = 0;
        isVocabAudioRunning = false;
        loadVocabContent(area2, currentVocabIndex);
      }
    };

    const nextImg = document.createElement("img");
    nextImg.src = ICONS.next;
    nextImg.className = "nav-icon disabled";
    nextImg.onclick = () => {
      if (audioPlayCount >= 2) nextVocab();
    };

    navWrapper.appendChild(prevImg);
    navWrapper.appendChild(nextImg);

    img.onclick = () => {
      if (isVocabAudioRunning) return;
      isVocabAudioRunning = true;
      audioPlayCount = 1;
      nextImg.classList.add("disabled");

      setCmdState(cmdListen, cmdSpeak, "listen");

      const audio1 = new Audio(item.audio);
      audio1.play();

      audio1.onended = async () => {
        setCmdState(cmdListen, cmdSpeak, "speak");
        await wait(2000);

        setCmdState(cmdListen, cmdSpeak, "listen");

        const audio2 = new Audio(item.audio);
        audio2.play();

        audio2.onended = async () => {
          setCmdState(cmdListen, cmdSpeak, "speak");
          await wait(2500);

          setCmdState(cmdListen, cmdSpeak, null);

          audioPlayCount = 2;
          nextImg.classList.remove("disabled");
          isVocabAudioRunning = false;
        };
      };
    };

    inner.appendChild(cmdBar);
    inner.appendChild(img);
    inner.appendChild(label1);
    inner.appendChild(label2);
    inner.appendChild(navWrapper);

    card.appendChild(inner);
    stage.appendChild(card);
    area2.appendChild(stage);
    setCmdState(cmdListen, cmdSpeak, null);
  }

  function nextVocab() {
    currentVocabIndex++;
    if (currentVocabIndex % 5 === 0 && currentVocabIndex > 0) {
      setState("SUBSTATE_CHECK");
      return;
    }
    if (currentVocabIndex >= lessonConfig.vocab.length) {
      setState("STATE_EXERCISES"); // ✅ agora chama ExerciseFlow
      return;
    }
    audioPlayCount = 0;
    setState("STATE_VOCAB_LOOP");
  }

  function renderSubstateCheck(container) {
    initializeBlock();
    loadNextCheck(container);
  }

  function initializeBlock() {
    const blockStart = Math.max(0, currentVocabIndex - 5);
    blockItems = lessonConfig.vocab.slice(blockStart, currentVocabIndex);
    checkedItems.clear();
    blockCheckQueue = shuffle([...blockItems]);
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function loadNextCheck(container) {
    if (checkedItems.size >= blockItems.length) {
      finishBlock();
      return;
    }
    const remaining = blockCheckQueue.filter((item) => !checkedItems.has(item.label1_en ?? item.label1));
    const currentItem = remaining[0];
    currentCheckType = getNextCheckType();
    checkErrorCount = 0;

    if (currentCheckType === "CK1") renderCK1(container, currentItem);
    else if (currentCheckType === "CK2") renderCK2(container, currentItem);
    else renderCK3(container, currentItem);
  }

  function getNextCheckType() {
    const type = checkRotation[rotationIndex];
    rotationIndex = (rotationIndex + 1) % checkRotation.length;
    return type;
  }

  function renderCK1(container, item) {
    container.innerHTML = "";

    const stage = document.createElement("div");
    stage.className = "stage bg-blue-30";

    const card = document.createElement("div");
    card.className = "check-card panel-white-50";

    const row = document.createElement("div");
    row.className = "ck1-row";

    const imgWrap = document.createElement("div");
    imgWrap.className = "ck1-imgwrap";

    const img = document.createElement("img");
    img.src = item.img;
    img.className = "ck1-main-image";
    imgWrap.appendChild(img);

    const options = document.createElement("div");
    options.className = "ck1-options";

    generateLabelOptions(item).forEach((opt) => {
      const pill = document.createElement("div");
      pill.className = "opt-pill text-primary";
      pill.innerText = opt;
      pill.onclick = () => handleCheckAnswer(container, item, opt === (item.label1_en ?? item.label1));
      options.appendChild(pill);
    });

    row.appendChild(imgWrap);
    row.appendChild(options);

    card.appendChild(row);
    stage.appendChild(card);
    container.appendChild(stage);
  }

  function renderCK2(container, item) {
    container.innerHTML = "";

    const stage = document.createElement("div");
    stage.className = "stage bg-blue-30";

    const card = document.createElement("div");
    card.className = "check-card panel-white-50";

    const label = document.createElement("div");
    label.className = "text-primary ck2-title";
    label.innerText = item.label1_en ?? item.label1 ?? "";

    const imagesRow = document.createElement("div");
    imagesRow.className = "ck2-images";

    generateImageOptions(item).forEach((imgItem) => {
      const img = document.createElement("img");
      img.src = imgItem.img;
      img.className = "check-image";
      img.onclick = () => handleCheckAnswer(container, item, (imgItem.label1_en ?? imgItem.label1) === (item.label1_en ?? item.label1));
      imagesRow.appendChild(img);
    });

    card.appendChild(label);
    card.appendChild(imagesRow);
    stage.appendChild(card);
    container.appendChild(stage);
  }

  function renderCK3(container, item) {
    container.innerHTML = "";

    const stage = document.createElement("div");
    stage.className = "stage bg-blue-30";

    const card = document.createElement("div");
    card.className = "check-card panel-white-50";

    const audioIcon = document.createElement("img");
    audioIcon.src = ICONS.audioicon;
    audioIcon.className = "ck3-audio";

    let audioPlayed = false;
    audioIcon.onclick = () => {
      new Audio(item.audio).play();
      audioPlayed = true;
    };

    const imagesRow = document.createElement("div");
    imagesRow.className = "ck2-images";

    generateImageOptions(item).forEach((imgItem) => {
      const img = document.createElement("img");
      img.src = imgItem.img;
      img.className = "check-image";
      img.onclick = () => {
        if (!audioPlayed) return;
        handleCheckAnswer(container, item, (imgItem.label1_en ?? imgItem.label1) === (item.label1_en ?? item.label1));
      };
      imagesRow.appendChild(img);
    });

    card.appendChild(audioIcon);
    card.appendChild(imagesRow);
    stage.appendChild(card);
    container.appendChild(stage);
  }

  function handleCheckAnswer(container, item, isCorrect) {
    const key = item.label1_en ?? item.label1;
    if (isCorrect) {
      checkedItems.add(key);
      loadNextCheck(container);
    } else {
      checkErrorCount++;
      alert("Wrong! Try again.");
      if (checkErrorCount >= 3) {
        checkedItems.add(key);
        loadNextCheck(container);
      }
    }
  }

  function generateLabelOptions(correctItem) {
    const correct = correctItem.label1_en ?? correctItem.label1;
    const others = blockItems
      .filter((i) => (i.label1_en ?? i.label1) !== correct)
      .map((i) => (i.label1_en ?? i.label1));

    const shuffledOthers = shuffle([...others]).slice(0, 2);
    return shuffle([correct, ...shuffledOthers]);
  }

  function generateImageOptions(correctItem) {
    const correct = correctItem.label1_en ?? correctItem.label1;
    const others = blockItems.filter((i) => (i.label1_en ?? i.label1) !== correct);
    const randomOther = shuffle([...others])[0];
    return shuffle([correctItem, randomOther].filter(Boolean));
  }

  function finishBlock() {
    if (currentVocabIndex >= lessonConfig.vocab.length) setState("STATE_EXERCISES");
    else setState("STATE_VOCAB_LOOP");
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

  // START
  renderState();

  return () => {
    destroyed = true;
    if (typeof exercisesCleanup === "function") {
      try { exercisesCleanup(); } catch {}
      exercisesCleanup = null;
    }
    container.innerHTML = "";
  };
}