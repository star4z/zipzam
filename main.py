import time

import input_puzzle
from cage import Cage
from puzzle import Puzzle


def solve_puzzle(cages: list[Cage]):
    start_time = time.perf_counter()
    puzzle = Puzzle(cages)
    resolved_cells = -1
    passes = 0
    while puzzle.resolved_cells() > resolved_cells:
        resolved_cells = puzzle.resolved_cells()
        puzzle.reduce_possibilities_from_cages()
        puzzle.reduce_possibilities_from_rows_and_columns()
        passes += 1
    puzzle.print()
    print(f"--- {time.perf_counter() - start_time:0.4f} seconds ---")
    print(f"resolved_cells: {puzzle.resolved_cells()} has_solution: {puzzle.has_solution()} passes: {passes}")
    print()


if __name__ == "__main__":
    solve_puzzle(input_puzzle.sfe_20260617)
    solve_puzzle(input_puzzle.sfe_20260621)

