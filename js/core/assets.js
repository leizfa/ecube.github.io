// js/core/assets.js
// ECUBE — Asset Resolver (paths + preload opcional)
// ✅ Centraliza caminhos conforme nova estrutura de pastas.
// ✅ Não altera comportamento da versão funcionando — só evita hardcode espalhado.
// ✅ Compatível com:
//    assets/common/icons/
//    assets/common/ui/
//    assets/lessons/<lessonId>/...
//    assets/vocab/img/
//    assets/vocab/audio/

// -----------------------------
// BASE PATH (caso um dia mova ECUBE para subpasta)
// -----------------------------
const BASE = ""; // ex: "/ecube/" se precisar no futuro

// -----------------------------
// ICONS
// -----------------------------
export function icon(name) {
  return `${BASE}assets/common/icons/${name}.webp`;
}

// -----------------------------
// UI / WARN / BACKGROUNDS
// -----------------------------
export function ui(name) {
  return `${BASE}assets/common/ui/${name}.webp`;
}

// -----------------------------
// LESSON-SPECIFIC
// lessonId exemplo: "lesson01"
// -----------------------------
export function lessonIntroVideo(lessonId, file = "intro.webm") {
  return `${BASE}assets/common/ui/${file}`;
}

export function lessonDialogImage(lessonId, file) {
  return `${BASE}assets/lessons/${lessonId}/dialog/${file}`;
}

export function lessonDialogAudio(lessonId, file) {
  return `${BASE}assets/lessons/${lessonId}/dialog/${file}`;
}

export function lessonExerciseVideo(lessonId, file) {
  return `${BASE}assets/lessons/${lessonId}/exercises/${file}`;
}

export function lessonExtra(lessonId, file) {
  return `${BASE}assets/lessons/${lessonId}/extra/${file}`;
}

// -----------------------------
// VOCAB (por ID do catálogo)
// id exemplo: "000045"
// variante opcional: "a", "b", "_slow"
// -----------------------------
export function vocabImage(id, variant = "") {
  return `${BASE}assets/vocab/img/${id}${variant}.webp`;
}

export function vocabAudio(id, variant = "") {
  return `${BASE}assets/vocab/audio/${id}${variant}.aac`;
}

// -----------------------------
// PRELOAD HELPERS (opcional)
// -----------------------------
export function preloadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

export function preloadAudio(src) {
  const audio = new Audio();
  audio.src = src;
  audio.preload = "auto";
  return audio;
}

export function preloadVideo(src) {
  const video = document.createElement("video");
  video.src = src;
  video.preload = "auto";
  return video;
}