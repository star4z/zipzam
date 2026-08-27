# KenKen Solver

A TypeScript KenKen solver with a browser-based visualization and a self-contained HTML page that runs locally without a server.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the browser bundle and generated page:
   ```bash
   npm run build:browser
   ```
3. Open the generated page in a browser:
   ```text
   dist/solver.html
   ```

## What this project includes

- TypeScript solver logic in [src](src)
- Browser visualization and puzzle history in [src/browser.ts](src/browser.ts)
- Source HTML template in [public/solver.html](public/solver.html)
- Generated browser page in [dist/solver.html](dist/solver.html)
- Bundled browser code in [dist/bundle.js](dist/bundle.js)

## Features

- 6x6 KenKen solving logic with cage arithmetic constraints
- Row and column validity checks
- Step-by-step solving visualization
- Puzzle navigation and keyboard shortcuts
- Fully local browser execution with no server required

## Controls

- Previous / next puzzle
- Previous / next solving step
- Jump to first or final solved state
- Keyboard shortcuts: Left/Right for puzzles, Up/Down for steps, Home/End for first/last

## Build scripts

```bash
npm run build         # TypeScript compile
npm run bundle        # Bundle browser code to dist/bundle.js
npm run build:browser # Copy source HTML into dist/solver.html
```

## Notes

The app is intentionally designed as a standalone browser experience. The generated HTML in [dist/solver.html](dist/solver.html) is the user-facing entry point, while the editable source template lives in [public/solver.html](public/solver.html).
