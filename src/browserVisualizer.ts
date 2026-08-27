import { Puzzle } from "./puzzle";
import { Cell } from "./cell";
import { Cage } from "./cage";

interface Snapshot {
  pass: number;
  possibilities: number[][][];
  resolved_possibilities: number;
  resolved_cells: number;
  has_solution: boolean;
}

function solvePuzzleWithHistory(puzzle: Puzzle): Snapshot[] {
  const n = puzzle.cells.length;
  const history: Snapshot[] = [];

  function snapshot(passNo: number): void {
    const grid: number[][][] = [];
    for (let i = 0; i < n; i += 1) {
      const row: number[][] = [];
      for (let j = 0; j < n; j += 1) {
        row.push([...puzzle.cells[i][j].possibilities]);
      }
      grid.push(row);
    }

    history.push({
      pass: passNo,
      possibilities: grid,
      resolved_possibilities: puzzle.resolvedPossibilities(),
      resolved_cells: puzzle.resolvedCells(),
      has_solution: puzzle.hasSolution(),
    });
  }

  snapshot(0); // initial state

  let resolvedPossibilities = -1;
  let passes = 0;

  while (puzzle.resolvedPossibilities() > resolvedPossibilities) {
    resolvedPossibilities = puzzle.resolvedPossibilities();
    puzzle.reducePossibilitiesFromCages();
    passes += 1;
    snapshot(passes);
    puzzle.reducePossibilitiesFromRowsAndColumns();
    passes += 1;
    snapshot(passes);
  }

  return history;
}

export { solvePuzzleWithHistory };
