// js/lessons/foundations/lesson01.js
import { lessonIntroVideo, lessonExtra, lessonDialogAudio, lessonDialogImage, ui } from "../../core/assets.js";

export const lesson = {
  id: "lesson01",
  module: "foundations",
  title: "Lesson 01",

  // COMMON (Parte A)
  common: {
    introVideo: lessonIntroVideo("lesson01", "intro.webm"),
    vocabIntroVideo: lessonExtra("lesson01", "vocab_intro.webm")
  },

  warns: {
    beforeMiniDialog: ui("warn") // assets/common/ui/warn.webp
  },

  // Mini-dialog (Parte A)
  dialog: {
    images: [
      lessonDialogImage("lesson01", "sb1.webp"),
      lessonDialogImage("lesson01", "sb2.webp"),
      lessonDialogImage("lesson01", "sb3.webp")
    ],
    audios: [
      lessonDialogAudio("lesson01", "d1.mp3"),
      lessonDialogAudio("lesson01", "d2.mp3"),
      lessonDialogAudio("lesson01", "d3.mp3"),
      lessonDialogAudio("lesson01", "d4.mp3")
    ],
    subtitles: [
      "Hello! My name is Lucas. What's your name?",
      "Hi Lucas. I'm John",
      "Nice to meet you.",
      "You too!"
    ],
    saturationTriggers: { "0": 0, "2": 1, "3": 2 }
  },

  // Vocab: use IDs do seu vocabCatalog.json
  vocabIds: [
    "000001",
    "000002",
    "000003",
    "000004",
    "000005",
    "000006",
    "000007",
    "000008",
    "000009",
    "000010"
  ],

partA: {
    exercises: [
      {
        type: "buildBlocks",
        title: "Build the blocks",
        videoSrc: lessonExtra("lesson01", "build_blocks.webm"),
        chunks: [
          { text: "what", audio: lessonExtra("lesson01", "cha1.aac") },
          { text: "is", audio: lessonExtra("lesson01", "cha2.aac") },
          { text: "what's", audio: lessonExtra("lesson01", "cha3.aac") }
        ],
        frames: [
          { text: "what's your name?", audio: lessonExtra("lesson01", "fra1.aac") },
          { text: "What's your name?", audio: lessonExtra("lesson01", "fra2.aac") }
        ]
      }
    ]
  },


  // Placeholders para o futuro
  partB: { steps: [] },
  partC: { tracks: [] },
  partD: { steps: [] },
}