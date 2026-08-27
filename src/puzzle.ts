import { Cage } from "./cage";
import { Cell } from "./cell";

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) {
    return [[]];
  }
  return arrays.reduce<T[][]>((acc, array) => {
    return acc.flatMap((partial) => array.map((value) => [...partial, value] as T[]));
  }, [[]]);
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function setEquality<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}

export class Puzzle {
  name: string;
  cages: Cage[];
  cells: Cell[][];

  constructor(name: string, cages: Cage[]) {
    this.name = name;
    this.cages = cages;
    this.cells = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => new Cell(Puzzle.cageForCell([i, j], cages), [i, j]))
    );
  }

  static cageForCell(cellCoords: [number, number], cages: Cage[]): Cage {
    const [row, col] = cellCoords;
    const cage = cages.find((cageItem) =>
      cageItem.coords.some(([r, c]) => r === row && c === col)
    );
    if (!cage) {
      throw new Error(`No cage found for cell ${row},${col}`);
    }
    return cage;
  }

  print(): void {
    console.log(`Puzzle: ${this.name}`);
    console.log();

    const maxLen = Math.max(...this.cages.map((cage) => cage.value.toString().length));
    for (const row of this.cells) {
      console.log(
        row
          .map((cell) => `${cell.cage.value.toString().padStart(maxLen, " ")}${cell.cage.sign}`)
          .join(" ")
      );
      if (this.hasSolution()) {
        console.log(
          row
            .map((cell) => cell.possibilities[0].toString().padStart(maxLen + 1, " "))
            .join(" ")
        );
      } else {
        const space = " ".repeat(Math.max(0, maxLen + 1 - 3));
        const printValue = (i: number, cell: Cell): string =>
          (i % 2 === 1 ? space : "") + (cell.possibilities.includes(i) ? i.toString() : " ");
        console.log(
          row.flatMap((cell) => [1, 2].map((i) => printValue(i, cell))).join(" ")
        );
        console.log(
          row.flatMap((cell) => [3, 4].map((i) => printValue(i, cell))).join(" ")
        );
        console.log(
          row.flatMap((cell) => [5, 6].map((i) => printValue(i, cell))).join(" ")
        );
      }
    }
    console.log();
  }

  *iterCells(cage?: Cage): Generator<Cell, void, unknown> {
    for (const row of this.cells) {
      for (const cell of row) {
        if (!cage || cell.cage === cage) {
          yield cell;
        }
      }
    }
  }

  static satisfiesRowColConstraint(combo: number[], cellCoords: Array<[number, number]>): boolean {
    for (let i = 0; i < combo.length; i += 1) {
      for (let j = i + 1; j < combo.length; j += 1) {
        if (combo[i] === combo[j]) {
          const [rowI, colI] = cellCoords[i];
          const [rowJ, colJ] = cellCoords[j];
          if (rowI === rowJ || colI === colJ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  static findRestrictedCellPossibilities(
    cells: Cell[],
    targetProduct: number,
    func: (combo: number[]) => number
  ): number[][] {
    const cellDomains = cells.map((cell) => cell.possibilities);
    const coords = cells.map((cell) => cell.coords);

    const cellPossibilities: Array<Set<number>> = Array.from({ length: cells.length }, () => new Set<number>());

    for (const combo of cartesianProduct(cellDomains)) {
      if (func(combo) === targetProduct && Puzzle.satisfiesRowColConstraint(combo, coords)) {
        combo.forEach((value, index) => cellPossibilities[index].add(value));
      }
    }

    return cellPossibilities.map((set) => Array.from(set).sort((a, b) => a - b));
  }

  reducePossibilitiesFromCages(): void {
    for (const cage of this.cages) {
      if (cage.sign === "=") {
        this.setPossibilities(cage.coords, [ [cage.value] ]);
      } else if (cage.sign === "+") {
        const possibilities = Puzzle.findRestrictedCellPossibilities(
          Array.from(this.iterCells(cage)),
          cage.value,
          (combo) => combo.reduce((acc, value) => acc + value, 0)
        );
        this.setPossibilities(cage.coords, possibilities);
      } else if (cage.sign === "-") {
        const possibilities = Array.from({ length: 6 }, (_, index) => index + 1).filter((i) =>
          Array.from({ length: 6 }, (_, index) => index + 1).some((j) => i - j === cage.value || j - i === cage.value)
        );
        this.setPossibilities(cage.coords, cage.coords.map(() => possibilities));
      } else if (cage.sign === "*") {
        const possibilities = Puzzle.findRestrictedCellPossibilities(
          Array.from(this.iterCells(cage)),
          cage.value,
          (combo) => combo.reduce((acc, value) => acc * value, 1)
        );
        this.setPossibilities(cage.coords, possibilities);
      } else if (cage.sign === "/") {
        const possibilities = Array.from({ length: 6 }, (_, index) => index + 1).filter((i) =>
          Array.from({ length: 6 }, (_, index) => index + 1).some((j) => i / j === cage.value || j / i === cage.value)
        );
        this.setPossibilities(cage.coords, cage.coords.map(() => possibilities));
      }
    }
  }

  setPossibilities(coords: Array<[number, number]>, possibilities: number[][]): void {
    for (let index = 0; index < coords.length; index += 1) {
      const [row, col] = coords[index];
      const cell = this.cells[row][col];
      const allowed = possibilities[index];
      cell.possibilities = cell.possibilities.filter((p) => allowed.includes(p));
      if (cell.possibilities.length < 1) {
        throw new Error(
          `Invalid cell possibilities: ${cell.cage.value}${cell.cage.sign} ${cell.coords[0]},${cell.coords[1]} ${JSON.stringify(
            possibilities
          )}`
        );
      }
    }
  }

  resolvedCells(): number {
    return Array.from(this.iterCells()).filter((cell) => cell.possibilities.length === 1).length;
  }

  resolvedPossibilities(): number {
    return 6 * 6 * 6 - Array.from(this.iterCells()).reduce((sum, cell) => sum + cell.possibilities.length, 0);
  }

  hasSolution(): boolean {
    return Array.from(this.iterCells()).every((cell) => cell.possibilities.length === 1);
  }

  reducePossibilitiesFromRowsAndColumns(): void {
    const reduceGroup = (group: Cell[]): void => {
      for (const cell of group) {
        const possSet = new Set(cell.possibilities);
        const n = possSet.size;
        if (n === 0) {
          continue;
        }
        const matches = group.filter((candidate) => setEquality(new Set(candidate.possibilities), possSet));
        if (matches.length === n) {
          for (const otherCell of group) {
            if (!matches.includes(otherCell)) {
              this.setPossibilities([otherCell.coords], [otherCell.possibilities.filter((p) => !possSet.has(p))]);
            }
          }
        }
      }

      const allPossibilities = group.flatMap((cell) => cell.possibilities);
      const uniquePossibilities = Array.from(new Set(allPossibilities));
      for (const value of uniquePossibilities) {
        const occurrences = allPossibilities.filter((candidate) => candidate === value).length;
        if (occurrences === 1) {
          const coords = group.filter((cell) => cell.possibilities.includes(value)).map((cell) => cell.coords);
          this.setPossibilities(coords, coords.map(() => [value]));
        }
      }
    };

    for (const row of this.cells) {
      reduceGroup(row);
    }

    const numCols = this.cells.length > 0 ? this.cells[0].length : 0;
    for (let colIdx = 0; colIdx < numCols; colIdx += 1) {
      const column = this.cells.map((row) => row[colIdx]);
      reduceGroup(column);
    }
  }
}
