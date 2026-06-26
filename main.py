import time

import input_puzzle
from puzzle import Puzzle


def solve_puzzle(puzzle: Puzzle):
    start_time = time.perf_counter()
    resolved_possibilities = -1
    passes = 0
    while puzzle.resolved_possibilities() > resolved_possibilities:
        resolved_possibilities = puzzle.resolved_possibilities()
        puzzle.reduce_possibilities_from_cages()
        puzzle.reduce_possibilities_from_rows_and_columns()
        passes += 1
    puzzle.print()
    print(f"--- {time.perf_counter() - start_time:0.4f} seconds ---")
    print(f"has_solution: {puzzle.has_solution()} passes: {passes}")
    print(f"resolved_cells: {puzzle.resolved_cells()} resolved_possibilities: {puzzle.resolved_possibilities()}")
    print()


if __name__ == "__main__":
    for puzzle in input_puzzle.all_puzzles:
        solve_puzzle(puzzle)
