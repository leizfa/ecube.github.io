// js/exercises/index.js
import { runbuildBlocks } from "/buildBlocks.js";
import { runSwapIt } from "./swapIt.js";

export const exerciseRegistry = {
  buildBlocks: runBuildBlocks,
  swapIt: runSwapIt
};

export function getExerciseHandler(type) {
  return exerciseRegistry[type] || null;
}
