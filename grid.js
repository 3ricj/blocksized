"use strict";

/**
 * Core model for the binary-grid simulation (no DOM dependencies).
 *
 * Rules:
 *  - Every cell holds 0 or 1.
 *  - A row/column is *valid* only when it contains exactly one 1
 *    (0 ones = insufficient, 2+ ones = too many).
 *  - Score = number of 4-connected components of 0s (diagonal contact
 *    does not make cells contiguous). The score is computed for any
 *    state, but it only counts as a valid score when every row and
 *    column is valid.
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
 * Analyze the grid in one pass:
 *  - per-row/column one-counts and validity flags,
 *  - flood-fill of the 0 regions into blocks (plus a blockAt lookup map).
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
  const stack = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 0 || blockAt[r][c] !== -1) continue;
      const id = blocks.length;
      const cells = [];
      let minR = r, maxR = r, minC = c, maxC = c;
      blockAt[r][c] = id;
      stack.push([r, c]);
      while (stack.length) {
        const [cr, cc] = stack.pop();
        cells.push([cr, cc]);
        if (cr < minR) minR = cr;
        if (cr > maxR) maxR = cr;
        if (cc < minC) minC = cc;
        if (cc > maxC) maxC = cc;
        if (cr > 0 && grid[cr - 1][cc] === 0 && blockAt[cr - 1][cc] === -1) {
          blockAt[cr - 1][cc] = id; stack.push([cr - 1, cc]);
        }
        if (cr + 1 < rows && grid[cr + 1][cc] === 0 && blockAt[cr + 1][cc] === -1) {
          blockAt[cr + 1][cc] = id; stack.push([cr + 1, cc]);
        }
        if (cc > 0 && grid[cr][cc - 1] === 0 && blockAt[cr][cc - 1] === -1) {
          blockAt[cr][cc - 1] = id; stack.push([cr, cc - 1]);
        }
        if (cc + 1 < cols && grid[cr][cc + 1] === 0 && blockAt[cr][cc + 1] === -1) {
          blockAt[cr][cc + 1] = id; stack.push([cr, cc + 1]);
        }
      }
      blocks.push({ id, cells, minR, maxR, minC, maxC });
    }
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
