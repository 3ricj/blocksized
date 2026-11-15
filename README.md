# Grid Zero-Block Simulator

A binary grid (rows x cols, configurable at init and via the header controls):

- Each cell holds `0` or `1`; clicking a cell toggles it and the whole grid is
  re-scored immediately.
- **Validity:** every row and every column must contain *exactly one* `1`.
  Rows/columns with zero or multiple ones get a red background (small `R`/`C`
  badges mark which check failed; dark red = both).
- **Score:** number of rectangular (or square) blocks the `0`s tile into.
  Blocks are always rectangles: a zero region that bends is partitioned into
  maximal rectangles by a deterministic top-down scan, so every zero belongs
  to exactly one block. A lone zero ringed by ones counts as one block.
  The tally is shown in the footer at all times, but is flagged
  "score doesn't count" while the grid is invalid.

## Run

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Layout

- `grid.js`  — pure model: `createGrid`, `toggleCell`, `analyzeGrid` (no DOM).
- `app.js`   — rendering, click handling, SVG block outlines.
- `grid.test.js` — `node grid.test.js`.
