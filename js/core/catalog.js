// js/core/catalog.js
// ECUBE — Vocabulary Catalog Resolver
// --------------------------------------------------
// Responsável por:
// ✅ Carregar vocabCatalog.json
// ✅ Resolver item por ID
// ✅ Resolver imagens/áudios via assets.js
// ✅ Permitir variantes (a, b, _slow etc)
// --------------------------------------------------

import { vocabImage, vocabAudio } from "./assets.js";

export class Catalog {
  constructor() {
    this._data = null;
  }

  /**
   * Carrega o catálogo JSON (js/data/vocabCatalog.json)
   */
  async load(path = "js/data/vocabCatalog.json") {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Failed to load vocab catalog: ${path}`);
    }
    this._data = await res.json();
    return this._data;
  }

  /**
   * Retorna item bruto do catálogo
   */
  getItem(id) {
    if (!this._data) {
      throw new Error("Catalog not loaded yet.");
    }
    return this._data[id] || null;
  }

  /**
   * Retorna objeto completo resolvido com caminhos físicos.
   *
   * options:
   *  - imgVariant: "" | "a" | "b"
   *  - audioVariant: "" | "_slow"
   */
  resolveItem(id, options = {}) {
    const item = this.getItem(id);
    if (!item) return null;

    const {
      imgVariant = "",
      audioVariant = "",
    } = options;

    return {
      id,
      ...item,

      // Caminhos físicos resolvidos automaticamente
      img: vocabImage(id, imgVariant),
      audio: vocabAudio(id, audioVariant),
    };
  }

  /**
   * Retorna múltiplas imagens se existirem no JSON
   * (para níveis superiores ou variação de exposição)
   */
  resolveAllImages(id) {
    const item = this.getItem(id);
    if (!item) return [];

    if (!item.images || !Array.isArray(item.images)) {
      return [vocabImage(id)];
    }

    return item.images.map((variant) => vocabImage(id, variant));
  }

  /**
   * Retorna múltiplos áudios se existirem no JSON
   */
  resolveAllAudios(id) {
    const item = this.getItem(id);
    if (!item) return [];

    if (!item.audios || !Array.isArray(item.audios)) {
      return [vocabAudio(id)];
    }

    return item.audios.map((variant) => vocabAudio(id, variant));
  }

  /**
   * Filtro por campo (ex: group1, lesson, pos)
   */
  filterBy(field, value) {
    if (!this._data) return [];

    return Object.entries(this._data)
      .filter(([_, item]) => item[field] === value)
      .map(([id]) => id);
  }

  /**
   * Retorna lista de IDs por grupo (ex: food, fruit)
   */
  getByGroup(groupName) {
    if (!this._data) return [];

    return Object.entries(this._data)
      .filter(([_, item]) =>
        item.group1 === groupName || item.group2 === groupName
      )
      .map(([id]) => id);
  }

  /**
   * Retorna IDs pertencentes a uma lição específica
   */
  getByLesson(lessonId) {
    if (!this._data) return [];

    return Object.entries(this._data)
      .filter(([_, item]) => item.lesson === lessonId)
      .map(([id]) => id);
  }

  /**
   * Verifica se catálogo já foi carregado
   */
  get isLoaded() {
    return !!this._data;
  }
}