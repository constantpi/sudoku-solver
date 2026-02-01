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
let selectedIndex = null;

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
  for (let i=0;i<81;i++) gridState[i] = arr[i];
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

  // keyboard handling
  document.addEventListener('keydown', (ev)=>{
    if (selectedIndex === null) return;
    if (ev.key === 'Escape'){
      gridState[selectedIndex] = 0;
      renderGrid();
      selectCell(selectedIndex);
      ev.preventDefault();
      return;
    }
    if (/^[1-9]$/.test(ev.key)){
      gridState[selectedIndex] = Number(ev.key);
      renderGrid();
      selectCell(selectedIndex);
      ev.preventDefault();
      return;
    }
  });

  clearBtn.addEventListener('click', ()=>{
    gridState.fill(0);
    renderGrid();
    selectedIndex = null;
  });

  solveBtn.addEventListener('click', async ()=>{
    status.textContent = 'solving...';
    result.textContent = '...';
    try {
      const input = getUint8ArrayFromState();
      // wasm-bindgen: Vec<u8> -> Uint8Array, Option<Vec<u8>> -> Uint8Array | undefined
      const out = mod.solve_wasm(input);
      if (out === undefined || out === null) {
        result.textContent = '解が見つかりませんでした。';
      } else {
        // if returned a Uint8Array view (or JS array), convert
        let u8;
        if (out instanceof Uint8Array) u8 = out;
        else u8 = new Uint8Array(out);
        // convert 0-8 back to 1-9 for display
        // update grid state and render
        for (let i=0;i<81;i++) gridState[i] = (u8[i] === undefined ? 0 : u8[i]);
        renderGrid();
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
