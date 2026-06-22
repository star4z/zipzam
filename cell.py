from cage import Cage


class Cell:
    def __init__(self, cage: Cage, coords: tuple[int, int]):
        self.possibilities = [1, 2, 3, 4, 5, 6]
        self.cage = cage
        self.coords = coords