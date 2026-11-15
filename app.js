"use strict";

(() => {
  const table = document.getElementById("grid-table");
  const overlay = document.getElementById("block-overlay");
  const wrap = document.getElementById("grid-wrap");
  const tallyEl = document.getElementById("tally");
  const validEl = document.getElementById("validity");
  const inpRows = document.getElementById("inp-rows");
  const inpCols = document.getElementById("inp-cols");
  const chkTint = document.getElementById("chk-tint");

  const SVG_NS = "http://www.w3.org/2000/svg";
  const TINTS = ["#8ecbff33", "#ffd36e33", "#a7e8a033", "#ff9ecb33", "#c9a7ff33", "#7fe0d833"];

  let grid = null;

  function buildTable(rows, cols) {
    table.replaceChildren();
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td");
        td.className = "cell";
        td.dataset.r = r;
        td.dataset.c = c;
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
  }

  function newGrid(rows, cols, fill = 0) {
    grid = createGrid(rows, cols, fill);
    buildTable(rows, cols);
    render();
  }

  function render() {
    const a = analyzeGrid(grid);
    const rows = grid.length;
    const cols = grid[0].length;

    // cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const td = table.rows[r].cells[c];
        const v = grid[r][c];
        td.textContent = v;
        td.classList.toggle("one", v === 1);
        td.classList.toggle("zero", v === 0);
        td.classList.toggle("invalid-row", !a.validRows[r]);
        td.classList.toggle("invalid-col", !a.validCols[c]);
      }
    }

    drawOverlay(a);
    drawStatus(a);
  }

  function drawOverlay(a) {
    overlay.replaceChildren();
    if (!a.blocks.length) {
      overlay.style.width = overlay.style.height = "0";
      return;
    }
    const size = table.rows[0].cells[0].getBoundingClientRect();
    const cw = size.width, ch = size.height;
    const w = a.cols * cw, h = a.rows * ch;
    overlay.setAttribute("width", w);
    overlay.setAttribute("height", h);
    overlay.setAttribute("viewBox", `0 0 ${w} ${h}`);
    overlay.style.width = w + "px";
    overlay.style.height = h + "px";

    const frame = wrap.getBoundingClientRect();
    const tbox = table.getBoundingClientRect();
    overlay.style.left = (tbox.left - frame.left) + "px";
    overlay.style.top = (tbox.top - frame.top) + "px";

    const tint = chkTint.checked;
    for (const b of a.blocks) {
      const cellSet = new Set(b.cells.map(([r, c]) => r + "," + c));
      const inBlock = (r, c) => cellSet.has(r + "," + c);
      const color = TINTS[b.id % TINTS.length];
      for (const [r, c] of b.cells) {
        const x = c * cw, y = r * ch;
        if (tint) {
          const rect = document.createElementNS(SVG_NS, "rect");
          rect.setAttribute("x", x); rect.setAttribute("y", y);
          rect.setAttribute("width", cw); rect.setAttribute("height", ch);
          rect.setAttribute("fill", color);
          overlay.appendChild(rect);
        }
        // outline only the edges not shared with a cell of the same block
        const line = (x1, y1, x2, y2) => {
          const l = document.createElementNS(SVG_NS, "line");
          l.setAttribute("x1", x1); l.setAttribute("y1", y1);
          l.setAttribute("x2", x2); l.setAttribute("y2", y2);
          l.setAttribute("stroke", "#0b84ff");
          l.setAttribute("stroke-width", "2.5");
          l.setAttribute("stroke-linecap", "square");
          overlay.appendChild(l);
        };
        if (!inBlock(r - 1, c)) line(x, y, x + cw, y);
        if (!inBlock(r + 1, c)) line(x, y + ch, x + cw, y + ch);
        if (!inBlock(r, c - 1)) line(x, y, x, y + ch);
        if (!inBlock(r, c + 1)) line(x + cw, y, x + cw, y + ch);
      }
    }
  }

  function drawStatus(a) {
    tallyEl.textContent = `Block tally: ${a.tally}`;
    validEl.className = "validity " + (a.valid ? "ok" : "bad");
    if (a.valid) {
      validEl.textContent = "✔ Valid grid";
    } else {
      const parts = [];
      if (a.invalidRows) parts.push(`${a.invalidRows} row${a.invalidRows > 1 ? "s" : ""}`);
      if (a.invalidCols) parts.push(`${a.invalidCols} column${a.invalidCols > 1 ? "s" : ""}`);
      validEl.textContent = `✖ Invalid — ${parts.join(" and ")} (score doesn't count)`;
    }
  }

  table.addEventListener("click", (ev) => {
    const td = ev.target.closest("td.cell");
    if (!td || !grid) return;
    toggleCell(grid, +td.dataset.r, +td.dataset.c);
    render();
  });

  document.getElementById("btn-rebuild").addEventListener("click", () => {
    const r = Math.max(1, Math.min(40, +inpRows.value | 0 || 1));
    const c = Math.max(1, Math.min(40, +inpCols.value | 0 || 1));
    inpRows.value = r; inpCols.value = c;
    newGrid(r, c);
  });

  document.getElementById("btn-clear").addEventListener("click", () => {
    newGrid(grid.length, grid[0].length, 0);
  });

  document.getElementById("btn-random").addEventListener("click", () => {
    const rows = grid.length, cols = grid[0].length;
    newGrid(rows, cols, 0);
    // permutation-style placement: one 1 in each row, distinct columns
    const perm = Array.from({ length: cols }, (_, i) => i);
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let r = 0; r < rows; r++) grid[r][perm[r % cols]] = 1;
    render();
  });

  chkTint.addEventListener("change", render);
  window.addEventListener("resize", () => grid && render());

  // initialize
  newGrid(+inpRows.value || 8, +inpCols.value || 8, 0);
})();
