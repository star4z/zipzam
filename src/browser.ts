import { Puzzle } from "./puzzle";
import * as inputPuzzle from "./inputPuzzle";
import { solvePuzzleWithHistory } from "./browserVisualizer";

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

// Pre-compute puzzle histories
const puzzlesData: PuzzleData[] = inputPuzzle.allPuzzles.map((puzzle) => {
  const testPuzzle = new Puzzle(puzzle.name, puzzle.cages);
  const history = solvePuzzleWithHistory(testPuzzle);
  return {
    name: puzzle.name,
    history,
  };
});

const OP_SYMBOLS: Record<string, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "=": "",
};

const cellSize = 100;
const margin = 40;
const titleHeight = 40;
const gridSize = 6;

interface CurrentData {
  puzzle: string;
  step: number;
  maxStep: number;
  pass: number;
  maxPass: number;
  resolved_cells: number;
  resolved_possibilities: number;
  has_solution: boolean;
  possibilities: number[][][];
}

let currentPuzzleIdx = 0;
let currentStepIdx = 0;
let currentData: CurrentData | null = null;

// Get puzzle data at a specific step
function getPuzzleData(puzzleIdx: number, stepIdx: number): CurrentData {
  const puzzleData = puzzlesData[puzzleIdx];
  const snap = puzzleData.history[stepIdx];
  const maxStep = puzzleData.history.length - 1;

  return {
    puzzle: puzzleData.name,
    step: stepIdx,
    maxStep,
    pass: snap.pass,
    maxPass: puzzleData.history[maxStep].pass,
    resolved_cells: snap.resolved_cells,
    resolved_possibilities: snap.resolved_possibilities,
    has_solution: snap.has_solution,
    possibilities: snap.possibilities,
  };
}

// Render puzzle to canvas
function render(canvas: HTMLCanvasElement): void {
  if (!currentData) {
    return;
  }

  const ctx = canvas.getContext("2d")!;
  const width = gridSize * cellSize + 2 * margin;
  const height = gridSize * cellSize + 2 * margin + titleHeight;

  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#333";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  const status = currentData.has_solution ? "solved" : "in progress";
  ctx.fillText(
    `${currentData.puzzle} | pass ${currentData.pass}/${currentData.maxPass} | ${status}`,
    width / 2,
    20
  );
  ctx.fillText(
    `resolved: ${currentData.resolved_cells}/36 cells, ${currentData.resolved_possibilities}/180 possibilities`,
    width / 2,
    35
  );

  // Draw cells
  const poss = currentData.possibilities;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = margin + j * cellSize;
      const y = margin + titleHeight + i * cellSize;

      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(x, y, cellSize, cellSize);

      // Light border
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Cell possibilities
      const cellPoss = poss[i][j];

      if (cellPoss.length === 1) {
        // Solved cell
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cellPoss[0].toString(), x + cellSize / 2, y + cellSize / 2 + 8);
      } else {
        // Show possibilities
        ctx.fillStyle = "#4a76d4";
        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const val of cellPoss) {
          const r = Math.floor((val - 1) / 3);
          const c = (val - 1) % 3;
          const cx = x + 20 + c * 30;
          const cy = y + 35 + r * 30;
          ctx.fillText(val.toString(), cx, cy);
        }
      }
    }
  }
}

// Update UI elements
function updateUI(
  resolvedCellsEl: HTMLElement,
  resolvedPossEl: HTMLElement,
  statusEl: HTMLElement,
  currentStepEl: HTMLElement,
  maxStepEl: HTMLElement,
  currentPassEl: HTMLElement,
  maxPassEl: HTMLElement,
  puzzleSelect: HTMLSelectElement,
  prevStepBtn: HTMLButtonElement,
  nextStepBtn: HTMLButtonElement,
  prevPuzzleBtn: HTMLButtonElement,
  nextPuzzleBtn: HTMLButtonElement
): void {
  if (!currentData) {
    return;
  }

  resolvedCellsEl.textContent = `${currentData.resolved_cells}/36`;
  resolvedPossEl.textContent = `${currentData.resolved_possibilities}/180`;
  statusEl.textContent = currentData.has_solution ? "✓ Solved" : "In Progress";
  currentStepEl.textContent = currentData.step.toString();
  maxStepEl.textContent = currentData.maxStep.toString();
  currentPassEl.textContent = currentData.pass.toString();
  maxPassEl.textContent = currentData.maxPass.toString();

  puzzleSelect.value = currentPuzzleIdx.toString();
  prevStepBtn.disabled = currentStepIdx === 0;
  nextStepBtn.disabled = currentStepIdx === currentData.maxStep;
  prevPuzzleBtn.disabled = currentPuzzleIdx === 0;
  nextPuzzleBtn.disabled = currentPuzzleIdx === puzzlesData.length - 1;
}

// Load and render puzzle
function loadAndRender(
  canvas: HTMLCanvasElement,
  resolvedCellsEl: HTMLElement,
  resolvedPossEl: HTMLElement,
  statusEl: HTMLElement,
  currentStepEl: HTMLElement,
  maxStepEl: HTMLElement,
  currentPassEl: HTMLElement,
  maxPassEl: HTMLElement,
  puzzleSelect: HTMLSelectElement,
  prevStepBtn: HTMLButtonElement,
  nextStepBtn: HTMLButtonElement,
  prevPuzzleBtn: HTMLButtonElement,
  nextPuzzleBtn: HTMLButtonElement
): void {
  currentData = getPuzzleData(currentPuzzleIdx, currentStepIdx);
  render(canvas);
  updateUI(
    resolvedCellsEl,
    resolvedPossEl,
    statusEl,
    currentStepEl,
    maxStepEl,
    currentPassEl,
    maxPassEl,
    puzzleSelect,
    prevStepBtn,
    nextStepBtn,
    prevPuzzleBtn,
    nextPuzzleBtn
  );
}

// Initialize on page load
declare global {
  interface Window {
    initPuzzleViewer: (
      canvas: HTMLCanvasElement,
      resolvedCellsEl: HTMLElement,
      resolvedPossEl: HTMLElement,
      statusEl: HTMLElement,
      currentStepEl: HTMLElement,
      maxStepEl: HTMLElement,
      currentPassEl: HTMLElement,
      maxPassEl: HTMLElement,
      puzzleSelect: HTMLSelectElement,
      prevStepBtn: HTMLButtonElement,
      nextStepBtn: HTMLButtonElement,
      firstStepBtn: HTMLButtonElement,
      lastStepBtn: HTMLButtonElement,
      prevPuzzleBtn: HTMLButtonElement,
      nextPuzzleBtn: HTMLButtonElement
    ) => void;
  }
}

window.initPuzzleViewer = (
  canvas: HTMLCanvasElement,
  resolvedCellsEl: HTMLElement,
  resolvedPossEl: HTMLElement,
  statusEl: HTMLElement,
  currentStepEl: HTMLElement,
  maxStepEl: HTMLElement,
  currentPassEl: HTMLElement,
  maxPassEl: HTMLElement,
  puzzleSelect: HTMLSelectElement,
  prevStepBtn: HTMLButtonElement,
  nextStepBtn: HTMLButtonElement,
  firstStepBtn: HTMLButtonElement,
  lastStepBtn: HTMLButtonElement,
  prevPuzzleBtn: HTMLButtonElement,
  nextPuzzleBtn: HTMLButtonElement
): void => {
  // Populate puzzle selector
  puzzleSelect.innerHTML = puzzlesData
    .map((p, i) => `<option value="${i}">${p.name}</option>`)
    .join("");

  // Event listeners
  puzzleSelect.addEventListener("change", (e) => {
    currentPuzzleIdx = parseInt((e.target as HTMLSelectElement).value, 10);
    currentStepIdx = 0;
    loadAndRender(
      canvas,
      resolvedCellsEl,
      resolvedPossEl,
      statusEl,
      currentStepEl,
      maxStepEl,
      currentPassEl,
      maxPassEl,
      puzzleSelect,
      prevStepBtn,
      nextStepBtn,
      prevPuzzleBtn,
      nextPuzzleBtn
    );
  });

  prevStepBtn.addEventListener("click", () => {
    if (currentStepIdx > 0) {
      currentStepIdx--;
      loadAndRender(
        canvas,
        resolvedCellsEl,
        resolvedPossEl,
        statusEl,
        currentStepEl,
        maxStepEl,
        currentPassEl,
        maxPassEl,
        puzzleSelect,
        prevStepBtn,
        nextStepBtn,
        prevPuzzleBtn,
        nextPuzzleBtn
      );
    }
  });

  nextStepBtn.addEventListener("click", () => {
    if (currentData && currentStepIdx < currentData.maxStep) {
      currentStepIdx++;
      loadAndRender(
        canvas,
        resolvedCellsEl,
        resolvedPossEl,
        statusEl,
        currentStepEl,
        maxStepEl,
        currentPassEl,
        maxPassEl,
        puzzleSelect,
        prevStepBtn,
        nextStepBtn,
        prevPuzzleBtn,
        nextPuzzleBtn
      );
    }
  });

  firstStepBtn.addEventListener("click", () => {
    currentStepIdx = 0;
    loadAndRender(
      canvas,
      resolvedCellsEl,
      resolvedPossEl,
      statusEl,
      currentStepEl,
      maxStepEl,
      currentPassEl,
      maxPassEl,
      puzzleSelect,
      prevStepBtn,
      nextStepBtn,
      prevPuzzleBtn,
      nextPuzzleBtn
    );
  });

  lastStepBtn.addEventListener("click", () => {
    if (currentData) {
      currentStepIdx = currentData.maxStep;
      loadAndRender(
        canvas,
        resolvedCellsEl,
        resolvedPossEl,
        statusEl,
        currentStepEl,
        maxStepEl,
        currentPassEl,
        maxPassEl,
        puzzleSelect,
        prevStepBtn,
        nextStepBtn,
        prevPuzzleBtn,
        nextPuzzleBtn
      );
    }
  });

  prevPuzzleBtn.addEventListener("click", () => {
    if (currentPuzzleIdx > 0) {
      currentPuzzleIdx--;
      currentStepIdx = 0;
      loadAndRender(
        canvas,
        resolvedCellsEl,
        resolvedPossEl,
        statusEl,
        currentStepEl,
        maxStepEl,
        currentPassEl,
        maxPassEl,
        puzzleSelect,
        prevStepBtn,
        nextStepBtn,
        prevPuzzleBtn,
        nextPuzzleBtn
      );
    }
  });

  nextPuzzleBtn.addEventListener("click", () => {
    if (currentPuzzleIdx < puzzlesData.length - 1) {
      currentPuzzleIdx++;
      currentStepIdx = 0;
      loadAndRender(
        canvas,
        resolvedCellsEl,
        resolvedPossEl,
        statusEl,
        currentStepEl,
        maxStepEl,
        currentPassEl,
        maxPassEl,
        puzzleSelect,
        prevStepBtn,
        nextStepBtn,
        prevPuzzleBtn,
        nextPuzzleBtn
      );
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevPuzzleBtn.click();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextPuzzleBtn.click();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      prevStepBtn.click();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nextStepBtn.click();
    } else if (e.key === "Home") {
      e.preventDefault();
      firstStepBtn.click();
    } else if (e.key === "End") {
      e.preventDefault();
      lastStepBtn.click();
    }
  });

  // Initial load
  loadAndRender(
    canvas,
    resolvedCellsEl,
    resolvedPossEl,
    statusEl,
    currentStepEl,
    maxStepEl,
    currentPassEl,
    maxPassEl,
    puzzleSelect,
    prevStepBtn,
    nextStepBtn,
    prevPuzzleBtn,
    nextPuzzleBtn
  );
};
