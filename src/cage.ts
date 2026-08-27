export class Cage {
  value: number;
  sign: string;
  coords: Array<[number, number]>;

  constructor(value: number, sign: string, coords: Array<[number, number]>) {
    this.value = value;
    this.sign = sign;
    this.coords = coords;
  }
}
