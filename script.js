// Color Match Game
// Goal: click the tile that matches the target color

const els = {
  targetSwatch: document.getElementById("targetSwatch"),
  targetHex: document.getElementById("targetHex"),
  board: document.getElementById("board"),
  message: document.getElementById("message"),
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  round: document.getElementById("round"),
  newRoundBtn: document.getElementById("newRoundBtn"),
  resetBtn: document.getElementById("resetBtn"),
  diffBtns: Array.from(document.querySelectorAll(".segBtn")),
};

let state = {
  difficulty: "easy",
  score: 0,
  streak: 0,
  round: 1,
  locked: false,
  target: null,      // { r,g,b, hex }
  options: [],       // array of { r,g,b, hex, isCorrect }
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rgbToHex(r, g, b) {
  const to2 = (x) => x.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function makeColor(r, g, b) {
  return { r, g, b, hex: rgbToHex(r, g, b) };
}

// How close the decoy colors are to the target.
// Smaller spread = harder (colors more similar).
function getSpread(difficulty) {
  if (difficulty === "easy") return 90;
  if (difficulty === "medium") return 45;
  return 22; // hard
}

function pickTarget() {
  // Avoid too-dark or too-bright extremes so it’s readable and fun
  const r = randInt(40, 220);
  const g = randInt(40, 220);
  const b = randInt(40, 220);
  return makeColor(r, g, b);
}

function makeDecoy(target, spread) {
  // Create a color near the target
  const r = clamp(target.r + randInt(-spread, spread), 0, 255);
  const g = clamp(target.g + randInt(-spread, spread), 0, 255);
  const b = clamp(target.b + randInt(-spread, spread), 0, 255);
  return makeColor(r, g, b);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setMessage(text, kind = "") {
  els.message.textContent = text;
  els.message.dataset.kind = kind;
}

function updateHUD() {
  els.score.textContent = String(state.score);
  els.streak.textContent = String(state.streak);
  els.round.textContent = String(state.round);
}

function renderTarget() {
  els.targetSwatch.style.background = state.target.hex;
  els.targetHex.textContent = state.target.hex;
}

function renderBoard() {
  els.board.innerHTML = "";

  state.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.type = "button";
    btn.style.background = opt.hex;
    btn.setAttribute("aria-label", `Color option ${idx + 1}`);
    btn.dataset.correct = opt.isCorrect ? "1" : "0";

    btn.addEventListener("click", () => handlePick(btn, opt));

    els.board.appendChild(btn);
  });
}

function handlePick(btn, opt) {
  if (state.locked) return;

  const isCorrect = opt.isCorrect;
  state.locked = true;

  // Visual feedback
  const tiles = Array.from(document.querySelectorAll(".tile"));
  tiles.forEach((t) => (t.disabled = true));

  if (isCorrect) {
    state.score += 10 + Math.min(state.streak, 10); // small streak bonus
    state.streak += 1;
    setMessage(`✅ Correct! +${10 + Math.min(state.streak - 1, 10)} points`, "good");

    // Next round after a short pause
    setTimeout(() => {
      state.round += 1;
      newRound();
    }, 550);
  } else {
    state.streak = 0;
    setMessage(`❌ Wrong — that was ${opt.hex}. Try again!`, "bad");

    // Allow another guess after a short pause (same round)
    setTimeout(() => {
      state.locked = false;
      tiles.forEach((t) => (t.disabled = false));
    }, 500);
  }

  updateHUD();
}

function buildRound() {
  const spread = getSpread(state.difficulty);
  const target = pickTarget();

  // Build 1 correct + 15 decoys (4x4 board)
  const options = [];
  options.push({ ...target, isCorrect: true });

  // Ensure decoys are not identical to target, and not duplicates
  const seen = new Set([target.hex]);

  while (options.length < 16) {
    const decoy = makeDecoy(target, spread);
    if (seen.has(decoy.hex)) continue;
    seen.add(decoy.hex);
    options.push({ ...decoy, isCorrect: false });
  }

  shuffle(options);

  state.target = target;
  state.options = options;
  state.locked = false;
}

function newRound() {
  buildRound();
  renderTarget();
  renderBoard();
  updateHUD();
  setMessage("Pick the exact match.", "");
}

function resetGame() {
  state.score = 0;
  state.streak = 0;
  state.round = 1;
  newRound();
}

function setDifficulty(diff) {
  state.difficulty = diff;

  els.diffBtns.forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.difficulty === diff ? "true" : "false");
  });

  setMessage(`Difficulty: ${diff.toUpperCase()}`, "");
  // Keep score, start a fresh round on new difficulty
  newRound();
}

els.newRoundBtn.addEventListener("click", () => {
  // Keep score/streak/round, just re-roll colors
  state.round += 1;
  newRound();
});

els.resetBtn.addEventListener("click", resetGame);

els.diffBtns.forEach((btn) => {
  btn.addEventListener("click", () => setDifficulty(btn.dataset.difficulty));
});

// Start
newRound();
