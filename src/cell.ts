import { Cage } from "./cage";

export class Cell {
  possibilities: number[];
  cage: Cage;
  coords: [number, number];

  constructor(cage: Cage, coords: [number, number]) {
    this.possibilities = [1, 2, 3, 4, 5, 6];
    this.cage = cage;
    this.coords = coords;
  }
}
