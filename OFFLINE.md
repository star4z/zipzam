# KenKen Solver - Standalone Offline Version

## Quick Start

Simply open `dist/solver.html` in your web browser. No server or installation needed!

The page is completely self-contained with all puzzle logic bundled into a single JavaScript file.

## Features

- 🧩 **4 Pre-loaded Puzzles** - Ready to solve
- 📊 **Step-by-Step Visualization** - Watch the solver progress through each reduction pass
- ⌨️ **Keyboard Navigation** - Use arrow keys and shortcuts
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Instant Solving** - All computations happen in the browser

## Controls

### Mouse/Touch
- **← Prev Step / Next Step →** - Navigate solving steps
- **⏮ First** - Jump to initial state
- **⏭ Last (Solve)** - Jump to solved state
- **← Puzzle / Puzzle →** - Switch between puzzles
- **Puzzle Dropdown** - Select puzzle directly

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| ← / → | Previous / Next Puzzle |
| ↑ / ↓ | Previous / Next Step |
| Home | Jump to First Step |
| End | Jump to Last Step |

## How It Works

The solver uses constraint reduction algorithms:

1. **Cage Constraints** - Apply arithmetic rules (±×÷=) to eliminate possibilities
2. **Row/Column Constraints** - Remove duplicates using Sudoku-like logic
3. **Iterative Reduction** - Repeat until puzzle is solved

Each step shows:
- Current possibilities for unsolved cells
- Resolved values for solved cells
- Progress statistics (resolved cells/possibilities)
- Solving pass count

## Building From Source

```bash
npm install       # Install dependencies
npm run bundle    # Build the bundled JavaScript
```

This creates `dist/bundle.js` which is included in `dist/solver.html`.

## Files

- `dist/solver.html` - The standalone offline application
- `dist/bundle.js` - Bundled TypeScript compiled to JavaScript

## No Dependencies Required

The offline version:
- ✅ Works without internet
- ✅ No server needed
- ✅ No external dependencies
- ✅ All logic runs locally in your browser
