import time

import input_puzzle
from puzzle import Puzzle

if __name__ == "__main__":
    start_time = time.perf_counter()
    puzzle = Puzzle(input_puzzle.cages)
    resolved_cells = -1
    iterations = 0
    while puzzle.resolved_cells() > resolved_cells:
        resolved_cells = puzzle.resolved_cells()
        puzzle.reduce_possibilities_from_cages()
        puzzle.reduce_possibilities_from_rows_and_columns()
        iterations += 1
    puzzle.print()
    print(f"--- {time.perf_counter() - start_time:0.4f} seconds ---")
    print(f"resolved_cells: {puzzle.resolved_cells()} has_solution: {puzzle.has_solution()} iterations: {iterations}")

