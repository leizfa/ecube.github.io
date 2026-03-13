// js/lessons/foundations/lesson01.js
import { lessonIntroVideo, lessonExtra, lessonDialogAudio, lessonDialogImage, ui } from "../../core/assets.js";

export const lesson = {
  id: "lesson02",
  module: "foundations",
  title: "Lesson 02",

  // COMMON (Parte A)
  common: {
    introVideo: lessonIntroVideo("lesson01", "intro.webm"),
    vocabIntroVideo: lessonExtra("lesson02", "vocab_intro.webm")
  },

  warns: {
    beforeMiniDialog: ui("warn") // assets/common/ui/warn.webp
  },

  // Mini-dialog (Parte A)
  dialog: {
    images: [
      lessonDialogImage("lesson02", "sb1.webp"),
      lessonDialogImage("lesson02", "sb2.webp"),
      lessonDialogImage("lesson02", "sb3.webp")
    ],
    audios: [
      lessonDialogAudio("lesson02", "d1.mp3"),
      lessonDialogAudio("lesson02", "d2.mp3"),
      lessonDialogAudio("lesson02", "d3.mp3")
    ],
    subtitles: [
      "Lucas, what's your job. Are you a nurse?",
      "No, I'm not. I'm a student. And you?",
      "I'm an engineer."
    ],
    saturationTriggers: { "0": 0, "1": 1, "2": 2 }
  },

  // Vocab: use IDs do seu vocabCatalog.json
  vocabIds: [
    "000026",
    "000027",
    "000028",
    "000029",
    "000030",
    "000031",
    "000032",
    "000033",
    "000034",
    "000035"
  ],

partA: {
    exercises: [
      {
        type: "buildBlocks",
        title: "Build the blocks",
        videoSrc: lessonExtra("lesson02", "build_blocks.webm"),
         chunks: [
          { text: "what's your...", audio: lessonExtra("lesson02", "cha1.aac") },
        ],
        frames: [
          { text: "what's your name?", audio: lessonExtra("lesson02", "fra1.aac") },
          { text: "What's your job?", audio: lessonExtra("lesson02", "fra2.aac") }
        ]
      },

         {
  type: "swapIt",
  title: "Swap it",
  videoSrc: lessonExtra("lesson01", "swap_it.webm"),
  freezeImageSrc: lessonExtra("lesson01", "swap_it_freeze.webp"),

  si1: "I am a nurse",
  sin: "I am (a/an) ____",
  sia1: lessonExtra("lesson02", "sia1.aac"),

  initialImageSrc: lessonExtra("lesson02", "swap_it_initial.webp"),

  vocabSource: {
    introduced_in: "L2_A",
    group1: "profession",
    group2: "jobs"
  }
}

      
    ]
  },


  // Placeholders para o futuro
  partB: { steps: [] },
  partC: { tracks: [] },
  partD: { steps: [] },
}