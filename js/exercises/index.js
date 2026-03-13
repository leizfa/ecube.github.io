// js/exercises/index.js
import { runBuildBlocks } from "./buildBlocks.js";
import { runSwapIt } from "./swapIt.js";

export const exerciseRegistry = {
  buildBlocks: runBuildBlocks,
  swapIt: runSwapIt
};

export function getExerciseHandler(type) {
  return exerciseRegistry[type] || null;
}