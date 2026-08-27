import { Puzzle } from "./puzzle";
import * as inputPuzzle from "./inputPuzzle";
import { solvePuzzleWithHistory } from "./browserVisualizer";

interface PuzzleData {
  name: string;
  cages: Array<{
    value: number;
    sign: string;
    coords: Array<[number, number]>;
  }>;
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
    cages: puzzle.cages.map((cage) => ({
      value: cage.value,
      sign: cage.sign,
      coords: cage.coords,
    })),
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

function render(puzzleDisplay: HTMLElement): void {
  if (!currentData) {
    return;
  }

  const status = currentData.has_solution ? "solved" : "in progress";
  const puzzleData = puzzlesData[currentPuzzleIdx];
  const clueCells = new Map<string, { value: number; sign: string }>();
  for (const cage of puzzleData.cages) {
    const clue = cage.coords.reduce((topLeft, coord) =>
      coord[0] < topLeft[0] || (coord[0] === topLeft[0] && coord[1] < topLeft[1]) ? coord : topLeft
    );
    clueCells.set(`${clue[0]},${clue[1]}`, cage);
  }

  puzzleDisplay.replaceChildren();
  const heading = document.createElement("div");
  heading.className = "puzzle-heading";
  heading.textContent = `${currentData.puzzle} | pass ${currentData.pass}/${currentData.maxPass} | ${status}`;
  const summary = document.createElement("div");
  summary.className = "puzzle-summary";
  summary.textContent = `resolved: ${currentData.resolved_cells}/36 cells, ${currentData.resolved_possibilities}/180 possibilities`;
  const grid = document.createElement("div");
  grid.className = "puzzle-grid";

  const poss = currentData.possibilities;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cell = document.createElement("div");
      cell.className = "puzzle-cell";
      const cage = puzzleData.cages.find((candidate) =>
        candidate.coords.some(([row, column]) => row === i && column === j)
      );
      const hasCageCell = (row: number, column: number): boolean =>
        cage?.coords.some(([cageRow, cageColumn]) => cageRow === row && cageColumn === column) ?? false;
      cell.style.borderTop = i === 0 || !hasCageCell(i - 1, j) ? "2.5px solid #111" : "1px solid #ccc";
      cell.style.borderBottom = i === gridSize - 1 || !hasCageCell(i + 1, j) ? "2.5px solid #111" : "1px solid #ccc";
      cell.style.borderLeft = j === 0 || !hasCageCell(i, j - 1) ? "2.5px solid #111" : "1px solid #ccc";
      cell.style.borderRight = j === gridSize - 1 || !hasCageCell(i, j + 1) ? "2.5px solid #111" : "1px solid #ccc";

      const clue = clueCells.get(`${i},${j}`);
      if (clue) {
        const clueElement = document.createElement("span");
        clueElement.className = "cage-clue";
        clueElement.textContent = `${clue.value}${OP_SYMBOLS[clue.sign] || ""}`;
        cell.appendChild(clueElement);
      }

      const cellPoss = poss[i][j];
      if (cellPoss.length === 1) {
        const value = document.createElement("span");
        value.className = "cell-value";
        value.textContent = cellPoss[0].toString();
        cell.appendChild(value);
      } else {
        for (const val of cellPoss) {
          const possibility = document.createElement("span");
          possibility.className = `possibility possibility-${val}`;
          possibility.textContent = val.toString();
          cell.appendChild(possibility);
        }
      }
      grid.appendChild(cell);
    }
  }

  puzzleDisplay.append(heading, summary, grid);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function downloadPuzzleImage(): void {
  if (!currentData) {
    return;
  }

  const puzzleData = puzzlesData[currentPuzzleIdx];
  const margin = 40;
  const titleHeight = 40;
  const width = gridSize * cellSize + 2 * margin;
  const height = gridSize * cellSize + 2 * margin + titleHeight;
  const cageForCell = (row: number, column: number) => puzzleData.cages.find((cage) =>
    cage.coords.some(([cageRow, cageColumn]) => cageRow === row && cageColumn === column)
  );
  const clueCells = new Map<string, { value: number; sign: string }>();
  for (const cage of puzzleData.cages) {
    const clue = cage.coords.reduce((topLeft, coord) =>
      coord[0] < topLeft[0] || (coord[0] === topLeft[0] && coord[1] < topLeft[1]) ? coord : topLeft
    );
    clueCells.set(`${clue[0]},${clue[1]}`, cage);
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<rect width="100%" height="100%" fill="white"/>
<style>text { font-family: Arial, sans-serif; } .clue { font-weight: bold; font-size: 10px; } .value { font-weight: bold; font-size: 28px; } .possibility { font-size: 8px; }</style>
<text x="${width / 2}" y="20" text-anchor="middle" fill="#333" font-size="14" font-weight="bold">${escapeXml(`${currentData.puzzle} | pass ${currentData.pass}/${currentData.maxPass}`)}</text>
<text x="${width / 2}" y="35" text-anchor="middle" fill="#333" font-size="11">${escapeXml(`resolved: ${currentData.resolved_cells}/36 cells, ${currentData.resolved_possibilities}/180 possibilities`)}</text>`;

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const x = margin + column * cellSize;
      const y = margin + titleHeight + row * cellSize;
      const cage = cageForCell(row, column);
      const sameCage = (nextRow: number, nextColumn: number): boolean =>
        cage?.coords.some(([cageRow, cageColumn]) => cageRow === nextRow && cageColumn === nextColumn) ?? false;
      const borders = [
        ["top", row === 0 || !sameCage(row - 1, column), `M ${x} ${y} H ${x + cellSize}`],
        ["bottom", row === gridSize - 1 || !sameCage(row + 1, column), `M ${x} ${y + cellSize} H ${x + cellSize}`],
        ["left", column === 0 || !sameCage(row, column - 1), `M ${x} ${y} V ${y + cellSize}`],
        ["right", column === gridSize - 1 || !sameCage(row, column + 1), `M ${x + cellSize} ${y} V ${y + cellSize}`],
      ];
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="white" stroke="#ccc"/>`;
      for (const [, isOuter, path] of borders) {
        if (isOuter) svg += `<path d="${path}" stroke="#111" stroke-width="2.5" fill="none"/>`;
      }
      const clue = clueCells.get(`${row},${column}`);
      if (clue) svg += `<text x="${x + 8}" y="${y + 13}" class="clue" fill="#333">${clue.value}${escapeXml(OP_SYMBOLS[clue.sign] || "")}</text>`;
      const cellPoss = currentData.possibilities[row][column];
      if (cellPoss.length === 1) {
        svg += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 8}" text-anchor="middle" class="value" fill="#1a1a1a">${cellPoss[0]}</text>`;
      } else {
        for (const value of cellPoss) {
          const possibilityRow = Math.floor((value - 1) / 3);
          const possibilityColumn = (value - 1) % 3;
          svg += `<text x="${x + 20 + possibilityColumn * 30}" y="${y + 35 + possibilityRow * 30}" text-anchor="middle" class="possibility" fill="#4a76d4">${value}</text>`;
        }
      }
    }
  }
  svg += "</svg>";

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentData.puzzle}-step-${currentData.step}.svg`;
  link.click();
  URL.revokeObjectURL(url);
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
  puzzleDisplay: HTMLElement,
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
  render(puzzleDisplay);
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
      puzzleDisplay: HTMLElement,
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
      nextPuzzleBtn: HTMLButtonElement,
      savePuzzleBtn: HTMLButtonElement
    ) => void;
  }
}

window.initPuzzleViewer = (
  puzzleDisplay: HTMLElement,
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
  nextPuzzleBtn: HTMLButtonElement,
  savePuzzleBtn: HTMLButtonElement
): void => {
  savePuzzleBtn.addEventListener("click", downloadPuzzleImage);

  // Populate puzzle selector
  puzzleSelect.innerHTML = puzzlesData
    .map((p, i) => `<option value="${i}">${p.name}</option>`)
    .join("");

  // Event listeners
  puzzleSelect.addEventListener("change", (e) => {
    currentPuzzleIdx = parseInt((e.target as HTMLSelectElement).value, 10);
    currentStepIdx = 0;
    loadAndRender(
      puzzleDisplay,
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
        puzzleDisplay,
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
        puzzleDisplay,
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
      puzzleDisplay,
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
        puzzleDisplay,
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
        puzzleDisplay,
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
        puzzleDisplay,
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
    puzzleDisplay,
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
