import * as inputPuzzle from "./inputPuzzle";
import { Puzzle } from "./puzzle";
import { solvePuzzleWithHistory, savePuzzleImage, renderAllPuzzles } from "./puzzleVisualizer";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputDir = args[0] || "puzzle_images";

  // Create output directory if it doesn't exist
  const fs = await import("fs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating visualizations in ${outputDir}...`);

  // Generate images for each puzzle at each solving step
  for (const puzzle of inputPuzzle.allPuzzles) {
    console.log(`\nProcessing puzzle: ${puzzle.name}`);

    // Create a fresh puzzle copy for solving with history
    const testPuzzle = new Puzzle(puzzle.name, puzzle.cages);
    const history = solvePuzzleWithHistory(testPuzzle);

    console.log(`  ${history.length} solving steps`);

    for (const snapshot of history) {
      const status = snapshot.has_solution ? "solved" : "in progress";
      const title = `${puzzle.name}  |  pass ${snapshot.pass}/${history[history.length - 1].pass}  |  ${status}
resolved cells: ${snapshot.resolved_cells}  resolved possibilities: ${snapshot.resolved_possibilities}`;

      const filename = `${outputDir}/${puzzle.name}_pass${String(snapshot.pass).padStart(2, "0")}.png`;
      await savePuzzleImage(testPuzzle, filename, {
        possibilitiesOverride: snapshot.possibilities,
        title,
      });
    }
  }

  // Create overview grid
  console.log("\nGenerating overview grid...");
  const allSolved = inputPuzzle.allPuzzles.map((p) => {
    const testPuzzle = new Puzzle(p.name, p.cages);
    // Solve it
    let resolvedPossibilities = -1;
    while (testPuzzle.resolvedPossibilities() > resolvedPossibilities) {
      resolvedPossibilities = testPuzzle.resolvedPossibilities();
      testPuzzle.reducePossibilitiesFromCages();
      testPuzzle.reducePossibilitiesFromRowsAndColumns();
    }
    return testPuzzle;
  });

  await renderAllPuzzles(allSolved, {
    cols: 2,
    savePath: `${outputDir}/all_puzzles.png`,
  });

  console.log("\nVisualization complete!");
}

main().catch(console.error);
