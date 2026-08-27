import { Puzzle } from "./puzzle";
import * as inputPuzzle from "./inputPuzzle";

function solvePuzzle(puzzle: Puzzle): void {
  const startTime = performance.now();
  let resolvedPossibilities = -1;
  let passes = 0;

  while (puzzle.resolvedPossibilities() > resolvedPossibilities) {
    resolvedPossibilities = puzzle.resolvedPossibilities();
    puzzle.reducePossibilitiesFromCages();
    puzzle.reducePossibilitiesFromRowsAndColumns();
    passes += 1;
  }

  puzzle.print();
  const endTime = performance.now();
  console.log(`--- ${((endTime - startTime) / 1000).toFixed(4)} seconds ---`);
  console.log(`has_solution: ${puzzle.hasSolution()} passes: ${passes}`);
  console.log(`resolved_cells: ${puzzle.resolvedCells()} resolved_possibilities: ${puzzle.resolvedPossibilities()}`);
  console.log();
}

for (const puzzle of inputPuzzle.allPuzzles) {
  solvePuzzle(puzzle);
}
