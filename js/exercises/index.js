// js/exercises/index.js
import { runbuildBlocks } from "./buildblocks.js";
import { runSwapIt } from "./swapIt.js";

export const exerciseRegistry = {
  buildblocks: runBuildblocks,
  swapIt: runSwapIt
};

export function getExerciseHandler(type) {
  return exerciseRegistry[type] || null;
}
