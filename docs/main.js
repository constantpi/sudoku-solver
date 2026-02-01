async function tryImport(paths) {
  for (const p of paths) {
    try {
      const mod = await import(p);
      return {mod, path: p};
    } catch (e) {
      // try next
    }
  }
  throw new Error('failed to import wasm package');
}

function parseInput(text) {
  const lines = text.trim().split(/\r?\n/).slice(0,9);
  const arr = [];
  for (let r=0;r<9;r++){
    const line = (lines[r]||"").padEnd(9, '.')
    for (let c=0;c<9;c++){
      const ch = line[c];
      if (ch === '.' || ch === '0') arr.push(0);
      else if (/[1-9]/.test(ch)) arr.push(Number(ch));
      else arr.push(0);
    }
  }
  return new Uint8Array(arr);
}

// Grid state: 81 elements, 0 = empty, 1-9 = digits
let gridState = new Uint8Array(81);
let fixedCells = new Array(81).fill(false);
let selectedIndex = null;
let beforeSolveState = null;
let beforeFixedCells = null;

function renderGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (let i=0;i<81;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    // thicker borders between 3x3 blocks
    if ((i%9)%3 === 2 && (i%9) !== 8) cell.classList.add('sub-border-right');
    if (Math.floor(i/9)%3 === 2 && Math.floor(i/9) !== 8) cell.classList.add('sub-border-bottom');
    cell.tabIndex = 0;
    cell.setAttribute('role','gridcell');
    cell.dataset.index = String(i);
    const v = gridState[i];
    cell.textContent = v === 0 ? '' : String(v);
    if (fixedCells[i]) cell.classList.add('fixed');
    else if (v !== 0) cell.classList.add('solved');
    cell.addEventListener('click', ()=>{
      selectCell(i);
    });
    cell.addEventListener('focus', ()=> selectCell(i));
    grid.appendChild(cell);
  }
}

function selectCell(i){
  const prev = document.querySelector('.cell.selected');
  if (prev) prev.classList.remove('selected');
  const cell = document.querySelector(`.cell[data-index=\"${i}\"]`);
  if (cell) cell.classList.add('selected');
  selectedIndex = i;
  cell && cell.focus();
}

function getUint8ArrayFromState(){
  return new Uint8Array(gridState);
}

function loadInitialFromTextarea(){
  const ta = document.getElementById('puzzle');
  if (!ta) return;
  const arr = parseInput(ta.value);
  for (let i=0;i<81;i++){
    gridState[i] = arr[i];
    fixedCells[i] = arr[i] !== 0;
  }
}

function formatOutput(u8) {
  if (!u8) return 'No solution';
  let s = '';
  for (let i=0;i<81;i++){
    s += (u8[i] === undefined ? '.' : String(u8[i]));
    if ((i+1)%9===0) s += '\n';
  }
  return s;
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const status = document.getElementById('status');
  const solveBtn = document.getElementById('solve');
  const revertBtn = document.getElementById('revert');
  const clearBtn = document.getElementById('clear');
  const puzzle = document.getElementById('puzzle');
  const result = document.getElementById('result');

  status.textContent = 'loading wasm...';

  // Try common generated pkg names
  const tryPaths = [
    '../pkg/sudoku_rust.js',
    '../pkg/SudokuRust.js',
    '../pkg/sudokurust.js'
  ];

  let mod;
  try {
    const imp = await tryImport(tryPaths);
    mod = imp.mod;
    // call init if present
    if (typeof mod.default === 'function') {
      await mod.default();
    } else if (typeof mod.init === 'function') {
      await mod.init();
    }
    status.textContent = 'wasm loaded';
  } catch (e) {
    status.textContent = 'wasm load failed: see console';
    console.error(e);
    return;
  }

  // initialize grid state and render
  loadInitialFromTextarea();
  renderGrid();

  // keyboard handling: arrow navigation, digits, Esc
  document.addEventListener('keydown', (ev)=>{
    if (selectedIndex === null) return;
    const row = Math.floor(selectedIndex/9);
    const col = selectedIndex%9;
    if (ev.key === 'ArrowLeft'){
      const nc = col === 0 ? 8 : col-1;
      selectCell(row*9 + nc);
      ev.preventDefault();
      return;
    }
    if (ev.key === 'ArrowRight'){
      const nc = col === 8 ? 0 : col+1;
      selectCell(row*9 + nc);
      ev.preventDefault();
      return;
    }
    if (ev.key === 'ArrowUp'){
      const nr = row === 0 ? 2 : row-1;
      selectCell(nr*9 + col);
      ev.preventDefault();
      return;
    }
    if (ev.key === 'ArrowDown'){
      const nr = row === 8 ? 0 : row+1;
      selectCell(nr*9 + col);
      ev.preventDefault();
      return;
    }
    if (ev.key === 'Escape'){
      gridState[selectedIndex] = 0;
      fixedCells[selectedIndex] = false;
      renderGrid();
      selectCell(selectedIndex);
      ev.preventDefault();
      return;
    }
    if (/^[1-9]$/.test(ev.key)){
      gridState[selectedIndex] = Number(ev.key);
      fixedCells[selectedIndex] = true; // user input counts as fixed
      renderGrid();
      selectCell(selectedIndex);
      ev.preventDefault();
      return;
    }
  });

  clearBtn.addEventListener('click', ()=>{
    gridState.fill(0);
    fixedCells.fill(false);
    renderGrid();
    selectedIndex = null;
    // disable revert because there's nothing to revert
    if (revertBtn) revertBtn.disabled = true;
  });

  if (revertBtn) {
    revertBtn.addEventListener('click', ()=>{
      if (!beforeSolveState) return;
      // restore previous state
      gridState = new Uint8Array(beforeSolveState);
      fixedCells = beforeFixedCells ? Array.from(beforeFixedCells) : new Array(81).fill(false);
      renderGrid();
      // disable revert after using
      revertBtn.disabled = true;
      beforeSolveState = null;
      beforeFixedCells = null;
    });
  }

  solveBtn.addEventListener('click', async ()=>{
    status.textContent = 'solving...';
    result.textContent = '...';
    try {
      const input = getUint8ArrayFromState();
      // wasm-bindgen: Vec<u8> -> Uint8Array, Option<Vec<u8>> -> Uint8Array | undefined
      // save state so revert can restore
      beforeSolveState = new Uint8Array(gridState);
      beforeFixedCells = Array.from(fixedCells);

      const out = mod.solve_wasm(input);
      if (out === undefined || out === null) {
        result.textContent = '解が見つかりませんでした。';
        // no change, clear saved state
        beforeSolveState = null;
        beforeFixedCells = null;
      } else {
        // if returned a Uint8Array view (or JS array), convert
        let u8;
        if (out instanceof Uint8Array) u8 = out;
        else u8 = new Uint8Array(out);
        // convert 0-8 back to 1-9 for display
        // update grid state and render; keep track of which cells were user-input (fixed)
        for (let i=0;i<81;i++){
          const val = (u8[i] === undefined ? 0 : u8[i]);
          // do not overwrite user-input / fixed cells' fixed status
          if (!fixedCells[i]){
            gridState[i] = val;
          } else {
            gridState[i] = gridState[i] || val;
          }
        }
        renderGrid();
        // enable revert: allow undoing solver-filled cells
        if (revertBtn) revertBtn.disabled = false;
        result.textContent = formatOutput(gridState);
      }
      status.textContent = 'done';
    } catch (e) {
      console.error(e);
      status.textContent = 'error';
      result.textContent = 'エラーが発生しました。コンソールを確認してください。';
    }
  });
});
