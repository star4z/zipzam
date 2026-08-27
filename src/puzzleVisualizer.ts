import * as fs from "fs";
import * as path from "path";
import { Puzzle } from "./puzzle";
import { Cell } from "./cell";
import { Cage } from "./cage";

const OP_SYMBOLS: Record<string, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "=": "",
};

interface RenderOptions {
  possibilitiesOverride?: number[][][];
  title?: string;
}

interface Snapshot {
  pass: number;
  possibilities: number[][][];
  resolved_possibilities: number;
  resolved_cells: number;
  has_solution: boolean;
}

function cageBorders(puzzle: Puzzle): Map<string, Set<string>> {
  const n = puzzle.cells.length;
  const borders = new Map<string, Set<string>>();

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const cage = puzzle.cells[i][j].cage;
      const sides = new Set<string>();

      if (i === 0 || puzzle.cells[i - 1][j].cage !== cage) {
        sides.add("top");
      }
      if (i === n - 1 || puzzle.cells[i + 1][j].cage !== cage) {
        sides.add("bottom");
      }
      if (j === 0 || puzzle.cells[i][j - 1].cage !== cage) {
        sides.add("left");
      }
      if (j === n - 1 || puzzle.cells[i][j + 1].cage !== cage) {
        sides.add("right");
      }

      borders.set(`${i},${j}`, sides);
    }
  }

  return borders;
}

function renderPuzzleToSVG(
  puzzle: Puzzle,
  options: RenderOptions = {}
): string {
  const n = puzzle.cells.length;
  const cellSize = 100;
  const margin = 60;
  const titleHeight = 40;
  const width = n * cellSize + 2 * margin;
  const height = n * cellSize + 2 * margin + titleHeight;

  const borders = cageBorders(puzzle);
  const clueCells = new Map<Cage, [number, number]>();

  for (const cage of puzzle.cages) {
    const topLeft = cage.coords.reduce((min, current) => {
      if (current[0] < min[0] || (current[0] === min[0] && current[1] < min[1])) {
        return current;
      }
      return min;
    });
    clueCells.set(cage, topLeft);
  }

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: Arial, sans-serif; }
    .clue { font-weight: bold; font-size: 10px; }
    .value { font-weight: bold; font-size: 28px; }
    .possibility { font-size: 8px; }
    .border { stroke: black; stroke-width: 2.5; }
    .light-border { stroke: #cccccc; stroke-width: 1; }
  </style>
  <rect width="${width}" height="${height}" fill="white"/>
`;

  // Draw title
  if (options.title) {
    const lines = options.title.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      svg += `  <text x="${width / 2}" y="${15 + i * 13}" text-anchor="middle" fill="#333333" style="font-size: 11px; font-weight: bold;">${escapeXml(lines[i])}</text>\n`;
    }
  }

  // Draw cells
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const cell = puzzle.cells[i][j];
      const x = margin + j * cellSize;
      const y = margin + titleHeight + i * cellSize;
      const poss = options.possibilitiesOverride ? options.possibilitiesOverride[i][j] : cell.possibilities;

      // Draw cell background and light border
      svg += `  <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="white" class="light-border"/>\n`;

      // Draw thick cage borders
      const sides = borders.get(`${i},${j}`) || new Set<string>();

      if (sides.has("top")) {
        svg += `  <line x1="${x}" y1="${y}" x2="${x + cellSize}" y2="${y}" class="border"/>\n`;
      }
      if (sides.has("bottom")) {
        svg += `  <line x1="${x}" y1="${y + cellSize}" x2="${x + cellSize}" y2="${y + cellSize}" class="border"/>\n`;
      }
      if (sides.has("left")) {
        svg += `  <line x1="${x}" y1="${y}" x2="${x}" y2="${y + cellSize}" class="border"/>\n`;
      }
      if (sides.has("right")) {
        svg += `  <line x1="${x + cellSize}" y1="${y}" x2="${x + cellSize}" y2="${y + cellSize}" class="border"/>\n`;
      }

      // Draw cage clue
      const isClueCell = clueCells.get(cell.cage);
      if (isClueCell && isClueCell[0] === i && isClueCell[1] === j) {
        const op = OP_SYMBOLS[cell.cage.sign] || "";
        const clueText = `${cell.cage.value}${op}`;
        svg += `  <text x="${x + 8}" y="${y + 13}" class="clue" fill="#333333">${escapeXml(clueText)}</text>\n`;
      }

      // Draw possibilities or resolved value
      if (poss.length === 1) {
        svg += `  <text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 8}" text-anchor="middle" dominant-baseline="middle" class="value" fill="#1a1a1a">${poss[0]}</text>\n`;
      } else {
        for (const val of poss) {
          const r = Math.floor((val - 1) / 3);
          const c = (val - 1) % 3;
          const cx = x + 20 + c * 30;
          const cy = y + 35 + r * 30;
          svg += `  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" class="possibility" fill="#4a76d4">${val}</text>\n`;
        }
      }
    }
  }

  svg += `</svg>`;
  return svg;
}

async function savePuzzleImage(
  puzzle: Puzzle,
  filename: string,
  options: RenderOptions = {}
): Promise<string> {
  // Generate SVG (automatically use .svg extension)
  const svgFilename = filename.replace(/\.(png|jpg|svg)$/, ".svg");
  const svg = renderPuzzleToSVG(puzzle, {
    possibilitiesOverride: options.possibilitiesOverride,
    title: options.title || puzzle.name,
  });

  fs.writeFileSync(svgFilename, svg);
  console.log(`Saved ${svgFilename}`);

  return svgFilename;
}

async function renderAllPuzzles(
  puzzles: Puzzle[],
  options: { cols?: number; savePath?: string } = {}
): Promise<void> {
  const cols = options.cols || 3;
  const n = puzzles.length;
  const rows = Math.ceil(n / cols);

  const cellSize = 600;
  const margin = 60;
  const titleHeight = 40;
  const padding = 20;
  const puzzleWidth = cellSize + 2 * margin;
  const puzzleHeight = cellSize + 2 * margin + titleHeight;
  const width = cols * puzzleWidth + (cols + 1) * padding;
  const height = rows * puzzleHeight + (rows + 1) * padding;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: Arial, sans-serif; }
    .clue { font-weight: bold; font-size: 10px; }
    .value { font-weight: bold; font-size: 28px; }
    .possibility { font-size: 8px; }
    .border { stroke: black; stroke-width: 2.5; }
    .light-border { stroke: #cccccc; stroke-width: 1; }
  </style>
  <rect width="${width}" height="${height}" fill="white"/>
`;

  for (let idx = 0; idx < n; idx += 1) {
    const puzzle = puzzles[idx];
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const baseX = padding + col * (puzzleWidth + padding);
    const baseY = padding + row * (puzzleHeight + padding);

    svg += `  <g transform="translate(${baseX}, ${baseY})">\n`;
    const puzzleSVG = renderPuzzleToSVG(puzzle, { title: puzzle.name });
    // Extract just the content, without the XML declaration and outer svg tag
    const content = puzzleSVG
      .replace(/<\?xml[^?]*\?>\n/, "")
      .replace(/<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "");
    svg += content;
    svg += `  </g>\n`;
  }

  svg += `</svg>`;

  const svgFilename = options.savePath ? options.savePath.replace(/\.(png|jpg|svg)$/, ".svg") : "all_puzzles.svg";
  fs.writeFileSync(svgFilename, svg);
  console.log(`Saved ${svgFilename}`);
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

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export { savePuzzleImage, renderAllPuzzles, solvePuzzleWithHistory, renderPuzzleToSVG };

