"use strict";

/**
 * Core model for the binary-grid simulation (no DOM dependencies).
 *
 * Rules:
 *  - Every cell holds 0 or 1.
 *  - A row/column is *valid* only when it contains exactly one 1
 *    (0 ones = insufficient, 2+ ones = too many).
 *  - Score = number of rectangular blocks the zeros tile into. Blocks are
 *    always rectangles: a zero region is partitioned by a top-down scan into
 *    maximal rectangles (a horizontal run of zeros keeps extending downward
 *    while the span is unchanged; new rectangles open at split edges).
 *    The score is computed for any state, but it only counts as a valid
 *    score when every row and column is valid.
 */

function createGrid(rows, cols, fill = 0) {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new RangeError("rows and cols must be positive integers");
  }
  if (fill !== 0 && fill !== 1) throw new RangeError("fill must be 0 or 1");
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function toggleCell(grid, r, c) {
  grid[r][c] = grid[r][c] === 1 ? 0 : 1;
  return grid[r][c];
}

/**
 * Analyze the grid:
 *  - per-row/column one-counts and validity flags,
 *  - rectangle partition of the zeros into maximal blocks (top-down greedy
 *    scan) plus a blockAt lookup map.
 *
 * Partition rule: a block starts at each maximal run of unclaimed zeros in
 * a row and extends downward for as long as a row covers its full column
 * span (extra zeros in that row open sibling blocks). Deterministic; each
 * zero belongs to exactly one rectangle.
 */
function analyzeGrid(grid) {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;

  const rowOnes = new Array(rows).fill(0);
  const colOnes = new Array(cols).fill(0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        rowOnes[r]++;
        colOnes[c]++;
      }
    }
  }

  const validRows = rowOnes.map((n) => n === 1);
  const validCols = colOnes.map((n) => n === 1);
  const invalidRows = validRows.filter((v) => !v).length;
  const invalidCols = validCols.filter((v) => !v).length;

  const blockAt = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  const blocks = [];
  let open = []; // { block, c1, c2 } — blocks that may still extend downward

  for (let r = 0; r < rows; r++) {
    const stillOpen = [];
    for (const o of open) {
      let extendsDown = true;
      for (let c = o.c1; c <= o.c2; c++) {
        if (grid[r][c] !== 0 || blockAt[r][c] !== -1) { extendsDown = false; break; }
      }
      if (!extendsDown) continue; // block closes at row r-1
      for (let c = o.c1; c <= o.c2; c++) {
        blockAt[r][c] = o.block.id;
        o.block.cells.push([r, c]);
      }
      o.block.maxR = r;
      stillOpen.push(o);
    }

    let c = 0;
    while (c < cols) {
      if (grid[r][c] !== 0 || blockAt[r][c] !== -1) { c++; continue; }
      const start = c;
      while (c < cols && grid[r][c] === 0 && blockAt[r][c] === -1) c++;
      const block = { id: blocks.length, cells: [], minR: r, maxR: r, minC: start, maxC: c - 1 };
      for (let cc = start; cc < c; cc++) {
        blockAt[r][cc] = block.id;
        block.cells.push([r, cc]);
      }
      blocks.push(block);
      stillOpen.push({ block, c1: start, c2: c - 1 });
    }
    open = stillOpen;
  }

  return {
    rows,
    cols,
    rowOnes,
    colOnes,
    validRows,
    validCols,
    invalidRows,
    invalidCols,
    valid: invalidRows === 0 && invalidCols === 0,
    blocks,
    blockAt,
    tally: blocks.length,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createGrid, toggleCell, analyzeGrid };
}
