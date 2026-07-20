"""
KenKen puzzle visualizer.

Draws puzzles with matplotlib (grid, thick cage borders, cage clues, and
either the resolved value or the remaining candidates in each cell), and
provides an interactive viewer to browse all puzzles and step through the
solving passes.

ASSUMPTIONS ABOUT YOUR CLASSES (adjust the two names in _get_attr calls
below if yours differ):
    Cage(target, operation, cells)   -> cage.target / cage.operation / cage.coords
    Cell.possibilities                -> list[int]
    Cell.cage                         -> Cage
    Puzzle.cells                      -> 2D list [row][col] of Cell
    Puzzle.resolved_possibilities()   -> int
    Puzzle.resolved_cells()           -> int
    Puzzle.has_solution()             -> bool
    Puzzle.reduce_possibilities_from_cages()
    Puzzle.reduce_possibilities_from_rows_and_columns()

Usage:
    from kenken_visualize import show_viewer, save_puzzle_image, render_all_puzzles
    import input_puzzle

    show_viewer(input_puzzle.all_puzzles)          # interactive
    save_puzzle_image(puzzle, "solved.png")         # single static image
    render_all_puzzles(input_puzzle.all_puzzles,    # overview grid
                        save_path="all_puzzles.png")
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.widgets import Button

OP_SYMBOLS = {
    "+": "+",
    "-": "\u2212",
    "*": "\u00d7",
    "/": "\u00f7",
    "=": "",
}


def _cage_borders(puzzle):
    """(row, col) -> set of sides that need a thick line (neighbor is a different cage)."""
    n = len(puzzle.cells)
    borders = {}
    for i in range(n):
        for j in range(n):
            cage = puzzle.cells[i][j].cage
            sides = set()
            if i == 0 or puzzle.cells[i - 1][j].cage is not cage:
                sides.add("top")
            if i == n - 1 or puzzle.cells[i + 1][j].cage is not cage:
                sides.add("bottom")
            if j == 0 or puzzle.cells[i][j - 1].cage is not cage:
                sides.add("left")
            if j == n - 1 or puzzle.cells[i][j + 1].cage is not cage:
                sides.add("right")
            borders[(i, j)] = sides
    return borders


def _cage_clue_cells(puzzle):
    """cage id -> (row, col) of the top-left cell of that cage, where the clue is drawn."""
    clue_cell = {}
    for cage in puzzle.cages:
        top_left = min(cage.coords, key=lambda rc: (rc[0], rc[1]))
        clue_cell[id(cage)] = top_left
    return clue_cell


def render_puzzle(ax, puzzle, possibilities_override=None, title=None):
    """Draw one puzzle onto a matplotlib Axes.

    possibilities_override: optional 2D list [row][col] -> list[int], used to render
    an intermediate solving state instead of the puzzle's current live possibilities.
    """
    n = len(puzzle.cells)
    ax.clear()
    ax.set_xlim(0, n)
    ax.set_ylim(0, n)
    ax.set_aspect("equal")
    ax.invert_yaxis()
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    borders = _cage_borders(puzzle)
    clue_cells = _cage_clue_cells(puzzle)

    for i in range(n):
        for j in range(n):
            cell = puzzle.cells[i][j]
            x, y = j, i
            poss = possibilities_override[i][j] if possibilities_override is not None else cell.possibilities

            ax.add_patch(patches.Rectangle((x, y), 1, 1, facecolor="white", edgecolor="none"))
            ax.add_patch(patches.Rectangle((x, y), 1, 1, facecolor="none", edgecolor="#cccccc", linewidth=1))

            sides = borders[(i, j)]
            lw = 2.5
            if "top" in sides:
                ax.plot([x, x + 1], [y, y], color="black", linewidth=lw)
            if "bottom" in sides:
                ax.plot([x, x + 1], [y + 1, y + 1], color="black", linewidth=lw)
            if "left" in sides:
                ax.plot([x, x], [y, y + 1], color="black", linewidth=lw)
            if "right" in sides:
                ax.plot([x + 1, x + 1], [y, y + 1], color="black", linewidth=lw)

            if clue_cells.get(id(cell.cage)) == (i, j):
                op = OP_SYMBOLS.get(cell.cage.sign)
                clue_text = f"{cell.cage.value}{op}"
                ax.text(x + 0.08, y + 0.16, clue_text, fontsize=8, fontweight="bold",
                         ha="left", va="top", color="#333333")

            if len(poss) == 1:
                ax.text(x + 0.5, y + 0.58, str(poss[0]), fontsize=20, fontweight="bold",
                         ha="center", va="center", color="#1a1a1a")
            else:
                for val in poss:
                    r, c = (val - 1) // 3, (val - 1) % 3
                    cx, cy = x + 0.2 + c * 0.3, y + 0.35 + r * 0.3
                    ax.text(cx, cy, str(val), fontsize=7, ha="center", va="center", color="#4a76d4")

    if title:
        ax.set_title(title, fontsize=11)


def save_puzzle_image(puzzle, filename, possibilities_override=None, title=None, dpi=150):
    fig, ax = plt.subplots(figsize=(6, 6))
    render_puzzle(ax, puzzle, possibilities_override=possibilities_override, title=title or puzzle.name)
    fig.tight_layout()
    fig.savefig(filename, dpi=dpi)
    plt.close(fig)
    print(f"Saved {filename}")
    return filename


def render_all_puzzles(puzzles, cols=3, save_path=None):
    """Overview grid of every puzzle in its current (e.g. solved) state."""
    n = len(puzzles)
    rows = (n + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 4, rows * 4))
    axes = axes.flatten() if n > 1 else [axes]
    for ax, puzzle in zip(axes, puzzles):
        render_puzzle(ax, puzzle, title=puzzle.name)
    for ax in axes[n:]:
        ax.axis("off")
    fig.tight_layout()
    if save_path:
        fig.savefig(save_path, dpi=150)
        print(f"Saved {save_path}")
    return fig


def solve_puzzle_with_history(puzzle):
    """Same loop as your solve_puzzle, but records a snapshot after every pass so
    you can step through it afterwards. Returns a list of snapshot dicts."""
    n = len(puzzle.cells)
    history = []

    def snapshot(pass_no):
        grid = [[list(puzzle.cells[i][j].possibilities) for j in range(n)] for i in range(n)]
        history.append({
            "pass": pass_no,
            "possibilities": grid,
            "resolved_possibilities": puzzle.resolved_possibilities(),
            "resolved_cells": puzzle.resolved_cells(),
            "has_solution": puzzle.has_solution(),
        })

    snapshot(0)  # initial state, before any reduction
    resolved_possibilities = -1
    passes = 0
    while puzzle.resolved_possibilities() > resolved_possibilities:
        resolved_possibilities = puzzle.resolved_possibilities()
        puzzle.reduce_possibilities_from_cages()
        passes += 1
        snapshot(passes)
        puzzle.reduce_possibilities_from_rows_and_columns()
        passes += 1
        snapshot(passes)

    return history


class PuzzleViewer:
    """Interactive viewer.

    Controls:
        left / right arrow  -> previous / next puzzle
        down / up arrow      -> previous / next solving pass
        s                    -> save the current view as a PNG
    (Buttons at the bottom of the window do the same thing.)
    """

    def __init__(self, puzzles, output_dir="puzzle_images"):
        self.puzzles = puzzles
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        self.histories = [solve_puzzle_with_history(p) for p in puzzles]

        self.puzzle_idx = 0
        self.step_idx = len(self.histories[0]) - 1  # start on the final (solved) state

        self.fig, self.ax = plt.subplots(figsize=(7, 7.5))
        plt.subplots_adjust(bottom=0.18)

        w, h, y = 0.12, 0.06, 0.03
        self.btn_prev_puzzle = Button(plt.axes((0.03, y, w, h)), "< Puzzle")
        self.btn_next_puzzle = Button(plt.axes((0.17, y, w, h)), "Puzzle >")
        self.btn_prev_step = Button(plt.axes((0.36, y, w, h)), "< Step")
        self.btn_next_step = Button(plt.axes((0.50, y, w, h)), "Step >")
        self.btn_save = Button(plt.axes((0.69, y, w, h)), "Save PNG")

        self.btn_prev_puzzle.on_clicked(lambda evt: self.change_puzzle(-1))
        self.btn_next_puzzle.on_clicked(lambda evt: self.change_puzzle(1))
        self.btn_prev_step.on_clicked(lambda evt: self.change_step(-1))
        self.btn_next_step.on_clicked(lambda evt: self.change_step(1))
        self.btn_save.on_clicked(lambda evt: self.save_current())

        self.fig.canvas.mpl_connect("key_press_event", self._on_key)
        self.redraw()

    def _on_key(self, event):
        if event.key == "left":
            self.change_puzzle(-1)
        elif event.key == "right":
            self.change_puzzle(1)
        elif event.key == "down":
            self.change_step(-1)
        elif event.key == "up":
            self.change_step(1)
        elif event.key == "s":
            self.save_current()

    def change_puzzle(self, delta):
        self.puzzle_idx = (self.puzzle_idx + delta) % len(self.puzzles)
        self.step_idx = len(self.histories[self.puzzle_idx]) - 1
        self.redraw()

    def change_step(self, delta):
        max_step = len(self.histories[self.puzzle_idx]) - 1
        self.step_idx = max(0, min(max_step, self.step_idx + delta))
        self.redraw()

    def redraw(self):
        puzzle = self.puzzles[self.puzzle_idx]
        history = self.histories[self.puzzle_idx]
        snap = history[self.step_idx]
        status = "solved" if snap["has_solution"] else "in progress"
        title = (f"{puzzle.name}  |  pass {snap['pass']}/{history[-1]['pass']}  |  {status}\n"
                  f"resolved cells: {snap['resolved_cells']}  "
                  f"resolved possibilities: {snap['resolved_possibilities']}")
        render_puzzle(self.ax, puzzle, possibilities_override=snap["possibilities"], title=title)
        self.fig.canvas.draw_idle()

    def save_current(self):
        puzzle = self.puzzles[self.puzzle_idx]
        snap = self.histories[self.puzzle_idx][self.step_idx]
        filename = os.path.join(self.output_dir, f"{puzzle.name}_pass{snap['pass']:02d}.png")
        self.fig.savefig(filename, dpi=150)
        print(f"Saved {filename}")


def show_viewer(puzzles):
    viewer = PuzzleViewer(puzzles)
    plt.show()
    return viewer


if __name__ == "__main__":
    import input_puzzle  # your module with e.g. `all_puzzles = [sfe_20260624, ...]`
    show_viewer(input_puzzle.all_puzzles)