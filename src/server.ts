import express, { Express, Request, Response } from "express";
import * as path from "path";
import { Puzzle } from "./puzzle";
import * as inputPuzzle from "./inputPuzzle";
import { solvePuzzleWithHistory } from "./puzzleVisualizer";

const app: Express = express();
const PORT = 3000;

// Pre-compute puzzle histories
interface PuzzleData {
  name: string;
  history: Array<{
    pass: number;
    possibilities: number[][][];
    resolved_possibilities: number;
    resolved_cells: number;
    has_solution: boolean;
  }>;
}

const puzzlesData: PuzzleData[] = inputPuzzle.allPuzzles.map((puzzle) => {
  const testPuzzle = new Puzzle(puzzle.name, puzzle.cages);
  const history = solvePuzzleWithHistory(testPuzzle);
  return {
    name: puzzle.name,
    history,
  };
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

// API endpoints
app.get("/api/puzzles", (req: Request, res: Response) => {
  res.json(
    puzzlesData.map((p) => ({
      name: p.name,
      stepCount: p.history.length,
    }))
  );
});

app.get("/api/puzzle/:name/:step", (req: Request, res: Response) => {
  const { name, step } = req.params;
  const stepNum = parseInt(step, 10);

  const puzzleData = puzzlesData.find((p) => p.name === name);
  if (!puzzleData) {
    res.status(404).json({ error: "Puzzle not found" });
    return;
  }

  if (stepNum < 0 || stepNum >= puzzleData.history.length) {
    res.status(400).json({ error: "Invalid step number" });
    return;
  }

  const snap = puzzleData.history[stepNum];
  const maxStep = puzzleData.history.length - 1;

  res.json({
    puzzle: name,
    step: stepNum,
    maxStep,
    pass: snap.pass,
    maxPass: puzzleData.history[maxStep].pass,
    resolved_cells: snap.resolved_cells,
    resolved_possibilities: snap.resolved_possibilities,
    has_solution: snap.has_solution,
    possibilities: snap.possibilities,
  });
});

app.listen(PORT, () => {
  console.log(`\n✓ KenKen Solver Web Interface running at http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
