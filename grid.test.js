"use strict";

const assert = require("node:assert/strict");
const { createGrid, toggleCell, analyzeGrid } = require("./grid.js");

function gridFromStrings(lines) {
  return lines.map((l) => [...l].map(Number));
}

// --- empty grid: one giant block, but all rows/cols invalid (0 ones) ---
{
  const a = analyzeGrid(createGrid(4, 5));
  assert.equal(a.tally, 1);
  assert.equal(a.valid, false);
  assert.equal(a.invalidRows, 4);
  assert.equal(a.invalidCols, 5);
}

// --- single 1 in a 3x3: splits the zeros into 4 corner blocks? No: they connect around ---
{
  const g = gridFromStrings(["000", "010", "000"]);
  const a = analyzeGrid(g);
  assert.equal(a.tally, 1, "ring of zeros stays one block");
  assert.equal(a.valid, false); // outer row/col have no ones
}

// --- full valid permutation grid (identity): 3 separate zero regions ---
{
  const g = gridFromStrings(["100", "010", "001"]);
  const a = analyzeGrid(g);
  assert.equal(a.valid, true);
  assert.deepEqual(a.rowOnes, [1, 1, 1]);
  assert.deepEqual(a.colOnes, [1, 1, 1]);
  // zeros: top-right triangle and bottom-left triangle are each one 4-connected region
  assert.equal(a.tally, 2);
}

// --- single zero surrounded by ones counts as one block ---
{
  const g = gridFromStrings(["111", "101", "111"]);
  const a = analyzeGrid(g);
  assert.equal(a.tally, 1);
  assert.equal(a.valid, false); // rows have 2 or 3 ones
  assert.equal(a.invalidRows, 3);
  assert.equal(a.invalidCols, 3);
}

// --- diagonal contact does NOT merge blocks ---
{
  const g = gridFromStrings(["01", "10"]);
  const a = analyzeGrid(g);
  assert.equal(a.tally, 2, "diagonal zeros are separate blocks");
  assert.equal(a.valid, true);
}

// --- checkerboard 4x4: 8 zero blocks; invalid (2 ones per line) ---
{
  const g = gridFromStrings(["1010", "0101", "1010", "0101"]);
  const a = analyzeGrid(g);
  assert.equal(a.tally, 8);
  assert.equal(a.valid, false);
  assert.equal(a.invalidRows, 4);
  assert.equal(a.invalidCols, 4);
}

// --- row with 2 ones invalid, row with 0 ones invalid; col checks independent ---
{
  const g = gridFromStrings(["1010", "0000", "0100", "0001"]);
  const a = analyzeGrid(g);
  assert.deepEqual(a.validRows, [false, false, true, true]);
  assert.deepEqual(a.validCols, [true, true, true, true]);
  assert.equal(a.valid, false);
}

// --- blocks expose bounding boxes ---
{
  const g = gridFromStrings(["0000", "0110", "0000"]);
  const a = analyzeGrid(g);
  assert.equal(a.tally, 1);
  const b = a.blocks[0];
  assert.deepEqual([b.minR, b.maxR, b.minC, b.maxC], [0, 2, 0, 3]);
  assert.equal(b.cells.length, 10); // 12 cells - 2 ones
}

// --- blockAt covers every zero exactly once, ones get -1 ---
{
  const g = gridFromStrings(["010", "101", "010"]);
  const a = analyzeGrid(g);
  let zeros = 0;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      if (g[r][c] === 0) {
        zeros++;
        assert.ok(a.blockAt[r][c] >= 0 && a.blockAt[r][c] < a.tally);
      } else {
        assert.equal(a.blockAt[r][c], -1);
      }
    }
  assert.equal(zeros, a.blocks.reduce((n, b) => n + b.cells.length, 0));
}

// --- toggle flips values ---
{
  const g = createGrid(2, 2);
  assert.equal(toggleCell(g, 0, 0), 1);
  assert.equal(toggleCell(g, 0, 0), 0);
}

// --- createGrid validation ---
{
  assert.throws(() => createGrid(0, 3), RangeError);
  assert.throws(() => createGrid(3.5, 3), RangeError);
  assert.throws(() => createGrid(3, 3, 2), RangeError);
}

console.log("grid.test.js: all tests passed");
