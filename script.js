const arrayInput = document.getElementById('arrayInput');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const arrayContainer = document.getElementById('arrayContainer');
const statusText = document.getElementById('status');

const loadBtn = document.getElementById('loadBtn');
const randomBtn = document.getElementById('randomBtn');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');

const passesValue = document.getElementById('passesValue');
const comparisonsValue = document.getElementById('comparisonsValue');
const swapsValue = document.getElementById('swapsValue');

const state = {
  numbers: [],
  originalNumbers: [],
  pass: 0,
  i: 0,
  swappedThisPass: false,
  comparisons: 0,
  swaps: 0,
  sortedFrom: null,
  running: false,
  paused: false,
  finished: false,
  speed: Number(speedRange.value)
};

function parseInput() {
  return arrayInput.value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => Number(entry));
}

function formatArray(values) {
  return values.join(', ');
}

function resetMetrics() {
  state.pass = 0;
  state.i = 0;
  state.swappedThisPass = false;
  state.comparisons = 0;
  state.swaps = 0;
  state.sortedFrom = null;
  state.finished = false;
}

function updateStats() {
  passesValue.textContent = String(state.pass);
  comparisonsValue.textContent = String(state.comparisons);
  swapsValue.textContent = String(state.swaps);
}

function renderArray(compareIndices = []) {
  arrayContainer.innerHTML = '';

  if (state.numbers.length === 0) {
    arrayContainer.textContent = 'Enter at least 2 numbers to begin.';
    return;
  }

  const maxValue = Math.max(...state.numbers, 1);

  state.numbers.forEach((value, index) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.textContent = value;

    const normalizedHeight = (value / maxValue) * 180;
    bar.style.height = `${70 + normalizedHeight}px`;

    if (compareIndices.includes(index)) {
      bar.classList.add('compare');
    }

    if (state.sortedFrom !== null && index >= state.sortedFrom) {
      bar.classList.add('sorted');
    }

    arrayContainer.appendChild(bar);
  });
}

function setStatus(message) {
  statusText.textContent = message;
}

function validateParsedValues(values) {
  if (values.length < 2) {
    setStatus('Please enter at least two numbers separated by commas.');
    return false;
  }

  if (values.some((n) => Number.isNaN(n))) {
    setStatus('Invalid input detected. Use numbers only, separated by commas.');
    return false;
  }

  return true;
}

function loadArray() {
  if (state.running) {
    return;
  }

  const values = parseInput();
  if (!validateParsedValues(values)) {
    return;
  }

  state.numbers = [...values];
  state.originalNumbers = [...values];
  resetMetrics();
  updateStats();
  renderArray();
  setStatus(`Loaded ${state.numbers.length} values. Press Start to begin sorting.`);
}

function randomArray() {
  if (state.running) {
    return;
  }

  const length = Math.floor(Math.random() * 5) + 7;
  const randomValues = Array.from({ length }, () => Math.floor(Math.random() * 95) + 5);
  arrayInput.value = formatArray(randomValues);

  state.numbers = [...randomValues];
  state.originalNumbers = [...randomValues];
  resetMetrics();
  updateStats();
  renderArray();
  setStatus('Random array generated.');
}

function resetArray() {
  if (state.running && !state.paused) {
    return;
  }

  if (state.originalNumbers.length < 2) {
    loadArray();
    return;
  }

  state.running = false;
  state.paused = false;
  state.numbers = [...state.originalNumbers];
  arrayInput.value = formatArray(state.originalNumbers);
  resetMetrics();
  updateStats();
  renderArray();
  setStatus('Array reset to its original order.');
  refreshControls();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLoop() {
  while (state.running && !state.paused && !state.finished) {
    const done = stepOnce();
    if (done) {
      break;
    }
    await sleep(state.speed);
  }

  refreshControls();
}

function stepOnce() {
  const n = state.numbers.length;
  if (n < 2) {
    setStatus('Load at least two values first.');
    return true;
  }

  if (state.pass >= n - 1) {
    finishSorting('Sorting complete.');
    return true;
  }

  const current = state.i;
  const next = current + 1;
  const end = n - 1 - state.pass;

  state.comparisons += 1;
  setStatus(`Comparing ${state.numbers[current]} and ${state.numbers[next]}.`);
  renderArray([current, next]);

  if (state.numbers[current] > state.numbers[next]) {
    [state.numbers[current], state.numbers[next]] = [state.numbers[next], state.numbers[current]];
    state.swappedThisPass = true;
    state.swaps += 1;
    setStatus(`Swapped ${state.numbers[next]} and ${state.numbers[current]}.`);
    renderArray([current, next]);
  }

  state.i += 1;
  updateStats();

  if (state.i >= end) {
    state.pass += 1;
    state.i = 0;
    state.sortedFrom = n - state.pass;

    if (!state.swappedThisPass) {
      finishSorting('No swaps in this pass. Array is already sorted.');
      return true;
    }

    state.swappedThisPass = false;
    updateStats();
    renderArray();
    setStatus(`Pass ${state.pass} complete. Continuing...`);
  }

  if (state.pass >= n - 1) {
    finishSorting('Sorting complete.');
    return true;
  }

  return false;
}

function finishSorting(message) {
  state.running = false;
  state.paused = false;
  state.finished = true;
  state.sortedFrom = 0;
  renderArray();
  updateStats();
  setStatus(`${message} Final: ${formatArray(state.numbers)}.`);
}

function refreshControls() {
  const hasArray = state.numbers.length >= 2;
  const isRunning = state.running;
  const isPaused = state.paused;

  loadBtn.disabled = isRunning;
  randomBtn.disabled = isRunning;
  startBtn.disabled = !hasArray || (isRunning && !isPaused) || state.finished;
  pauseBtn.disabled = !isRunning;
  stepBtn.disabled = !hasArray || isRunning || state.finished;
  resetBtn.disabled = !hasArray;
  speedRange.disabled = isRunning && !isPaused;

  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

function startSorting() {
  if (state.numbers.length < 2) {
    loadArray();
  }

  if (state.numbers.length < 2 || state.finished) {
    refreshControls();
    return;
  }

  state.running = true;
  state.paused = false;
  refreshControls();
  runLoop();
}

function togglePause() {
  if (!state.running && !state.paused) {
    return;
  }

  if (state.paused) {
    state.paused = false;
    state.running = true;
    setStatus('Resumed sorting...');
    refreshControls();
    runLoop();
  } else {
    state.paused = true;
    state.running = false;
    setStatus('Paused. Use Step or Resume.');
    refreshControls();
  }
}

function doSingleStep() {
  if (state.running || state.finished) {
    return;
  }

  if (state.numbers.length < 2) {
    loadArray();
  }

  if (state.numbers.length < 2 || state.finished) {
    refreshControls();
    return;
  }

  const done = stepOnce();
  if (!done) {
    setStatus('Step executed. Press Step again or Start to continue.');
  }
  refreshControls();
}

speedRange.addEventListener('input', (event) => {
  state.speed = Number(event.target.value);
  speedValue.textContent = String(state.speed);
});

loadBtn.addEventListener('click', () => {
  loadArray();
  refreshControls();
});

randomBtn.addEventListener('click', () => {
  randomArray();
  refreshControls();
});

startBtn.addEventListener('click', startSorting);
pauseBtn.addEventListener('click', togglePause);
stepBtn.addEventListener('click', doSingleStep);
resetBtn.addEventListener('click', resetArray);

loadArray();
refreshControls();
