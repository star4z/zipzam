import itertools
import math

from cage import Cage
from cell import Cell


def cage_for_cell(cell_coords: (int, int), cages: list[Cage]) -> Cage:
    return next((cage for cage in cages if cell_coords in cage.coords))


class Puzzle:
    def __init__(self, cages):
        self.cages = cages
        self.cells = [[Cell(cage_for_cell((i, j), cages), (i, j)) for j in range(6)] for i in range(6)]

    def print(self):
        max_len = max(len(str(cage.value)) for cage in self.cages)
        for row in self.cells:
            print(" ".join((f"{cell.cage.value:0{max_len}}{cell.cage.sign}" for cell in row)))
            if self.has_solution():
                print(" ".join(f"{cell.possibilities[0]:>{max_len + 1}}" for cell in row))
            else:
                print(" ".join(f"{i if i in cell.possibilities else ' '}" for cell in row for i in range(1, 3)))
                print(" ".join(f"{i if i in cell.possibilities else ' '}" for cell in row for i in range(3, 5)))
                print(" ".join(f"{i if i in cell.possibilities else ' '}" for cell in row for i in range(5, 7)))
        print()

    def iter_cells(self, cage=None):
        for row in self.cells:
            for cell in row:
                if cage is None or cell.cage == cage:
                    yield cell

    @staticmethod
    def find_restricted_cell_possibilities_sum(cell_domains: list[list[int]], target_sum: int):
        # cell_domains is a list of lists, e.g., [[1,2,3,4,5,6], [1,2,4,5,6], [5]]
        n = len(cell_domains)
        cell_possibilities = [set() for _ in range(n)]

        # itertools.product(*list) takes the cartesian product of the specific lists
        for combo in itertools.product(*cell_domains):
            if sum(combo) == target_sum:
                for i, val in enumerate(combo):
                    cell_possibilities[i].add(val)

        return [sorted(list(s)) for s in cell_possibilities]

    @staticmethod
    def find_restricted_cell_possibilities_product(cell_domains: list[list[int]], target_product: int):
        # cell_domains is a list of lists, e.g., [[1,2,3,4,5,6], [1,2,4,5,6], [5]]
        n = len(cell_domains)
        cell_possibilities = [set() for _ in range(n)]

        # itertools.product(*list) takes the cartesian product of the specific lists
        for combo in itertools.product(*cell_domains):
            if math.prod(combo) == target_product:
                for i, val in enumerate(combo):
                    cell_possibilities[i].add(val)

        return [sorted(list(s)) for s in cell_possibilities]

    def reduce_possibilities_from_cages(self):
        # TODO: handle cases where duplicates are only allowed if they're not in the same row & col
        for cage in self.cages:
            if cage.sign == '=':
                self.set_possibilities(cage.coords, [[cage.value]])
            elif cage.sign == '+':
                # find all values 1-6 that can sum to the cage value
                # Addition cage size is not limited
                existing_possibilities = [cell.possibilities for cell in self.iter_cells(cage)]
                possibilities = self.find_restricted_cell_possibilities_sum(existing_possibilities, cage.value)
                self.set_possibilities(cage.coords, possibilities)
            elif cage.sign == '-':
                # Subtraction can be a - b or b - a but cage size limit is 2
                possibilities = [i for i in range(1, 7) if
                                 any((i - j == cage.value) or (j - i == cage.value) for j in range(1, 7))]
                self.set_possibilities(cage.coords, [possibilities for c in cage.coords])
            elif cage.sign == '*':
                # Multiplication cage size is not limited
                existing_possibilities = [cell.possibilities for cell in self.iter_cells(cage)]
                possibilities = self.find_restricted_cell_possibilities_product(existing_possibilities, cage.value)
                self.set_possibilities(cage.coords, possibilities)
            elif cage.sign == '/':
                # Division can be a / b or b / a but cage size limit is 2
                possibilities = [i for i in range(1, 7) if
                                 any((i / j == cage.value) or (j / i == cage.value) for j in range(1, 7))]
                self.set_possibilities(cage.coords, [possibilities for c in cage.coords])

    def set_possibilities(self, coords: list[tuple[int, int]], possibilities: list[list[int]]):
        for coord, possibility in zip(coords, possibilities):
            cell = self.cells[coord[0]][coord[1]]
            # Intersect instead of replacing
            cell.possibilities = [p for p in cell.possibilities if p in possibility]

    def resolved_cells(self):
        return len([cell for cell in self.iter_cells() if len(cell.possibilities) == 1])

    def has_solution(self):
        return all(len(cell.possibilities) == 1 for cell in self.iter_cells())

    def reduce_possibilities_from_rows_and_columns(self):
        def reduce_group(group):
            """Reduces possibilities within a specific group (row or column)."""
            for cell in group:
                poss_set = set(cell.possibilities)
                n = len(poss_set)

                if n == 0:
                    continue

                # Find all cells in this group that share the exact same N possibilities
                matches = [c for c in group if set(c.possibilities) == poss_set]

                # Naked subset rule: N cells with the same N possibilities
                if len(matches) == n:
                    for other_cell in group:
                        if other_cell not in matches:
                            other_cell.possibilities = [
                                p for p in other_cell.possibilities
                                if p not in poss_set
                            ]

        # Apply to rows
        for row in self.cells:
            reduce_group(row)

        # Apply to columns
        num_cols = len(self.cells[0]) if self.cells else 0
        for col_idx in range(num_cols):
            column = [row[col_idx] for row in self.cells]
            reduce_group(column)
