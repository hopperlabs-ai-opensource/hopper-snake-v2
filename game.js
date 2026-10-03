// Snake v2 in the page: draws the board, runs the clock, takes keyboard, swipe and pad input, and keeps your personal
// top 10 (core.js has the rules, leaderboard.js the leaderboard).
(() => {
  "use strict";
  const { createGame } = window.SnakeCore;
  const Board = window.SnakeLeaderboard;
  const SIZE = 20;
  const $ = (id) => document.getElementById(id);
  const canvas = $("board"), ctx = canvas.getContext("2d");
  const scoreEl = $("score"), bestEl = $("best");
  const overlay = $("overlay"), overlayTitle = $("overlay-title"), overlayHint = $("overlay-hint"), startButton = $("start");
  const nameForm = $("name-form"), nameInput = $("name-input");
  const list = $("leader-list"), empty = $("leaders-empty");
  const KEYS = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  const storage = (() => { try { return window.localStorage; } catch { return null; } })() || { getItem: () => null, setItem: () => {} };
  const readBest = () => { try { return Number(storage.getItem("snake-best")) || 0; } catch { return 0; } };
  const saveBest = (value) => { try { storage.setItem("snake-best", String(value)); } catch { /* private mode: best lasts this visit */ } };

  let game, timer = null, running = false, paused = false, pending = null;
  let leaders = Board.load(storage), fresh = -1;
  let best = Math.max(readBest(), leaders.length ? leaders[0].score : 0);
  bestEl.textContent = best;

  function reset() {
    game = createGame({ size: SIZE });
    scoreEl.textContent = 0;
    draw();
  }

  function tick() {
    const { ate, over, won } = game.step();
    if (over) return gameOver(won);
    if (ate) {
      const score = game.state.score;
      scoreEl.textContent = score;
      if (score > best) { best = score; bestEl.textContent = best; saveBest(best); }
      schedule();
    }
    draw();
  }

  function schedule() {
    clearInterval(timer);
    timer = setInterval(tick, game.interval());
  }

  function start() {
    reset(); running = true; paused = false; pending = null;
    nameForm.hidden = true; overlay.hidden = true; schedule();
  }

  function gameOver(won = false) {
    clearInterval(timer); running = false; draw();
    const { score, snake } = game.state;
    overlayTitle.textContent = won ? "You filled the board" : "Game over";
    startButton.textContent = "Play again"; overlay.hidden = false;
    if (Board.qualifies(leaders, score)) {
      pending = { score, length: snake.length, date: new Date().toISOString().slice(0, 10) };
      overlayHint.textContent = `Score ${score} · a new top 10 run`;
      nameInput.value = Board.lastName(storage);
      nameForm.hidden = false;
      nameInput.focus(); if (nameInput.select) nameInput.select();
    } else {
      overlayHint.textContent = `Score ${score} · Best ${best}`;
      startButton.focus();
    }
  }

  function saveRun(name) {
    if (!pending) return;
    const result = Board.add(leaders, { ...pending, name });
    leaders = result.entries; fresh = result.rank - 1; pending = null;
    Board.save(storage, leaders); Board.rememberName(storage, name);
    nameForm.hidden = true;
    overlayHint.textContent = result.rank ? `Saved at number ${result.rank} in your top 10` : "Saved";
    renderLeaders(); startButton.focus();
  }

  function renderLeaders() {
    empty.hidden = leaders.length > 0;
    const rows = leaders.map((entry, i) => {
      const li = document.createElement("li");
      if (i === fresh) li.className = "fresh";
      const cells = [["rank", String(i + 1)], ["who", entry.name], ["points", String(entry.score)], ["meta", `length ${entry.length} · ${entry.date}`]];
      for (const [cls, text] of cells) { const span = document.createElement("span"); span.className = cls; span.textContent = text; li.append(span); }
      return li;
    });
    list.replaceChildren(...rows);
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) { clearInterval(timer); overlayTitle.textContent = "Paused"; overlayHint.textContent = "Press space to continue"; startButton.textContent = "Resume"; overlay.hidden = false; }
    else { overlay.hidden = true; schedule(); }
  }

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  function draw() {
    const cell = canvas.width / SIZE, { snake, food } = game.state;
    ctx.fillStyle = css("--panel");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = css("--grid");
    for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) if ((x + y) % 2 === 0) ctx.fillRect(x * cell, y * cell, cell, cell);
    if (food) {
      ctx.fillStyle = css("--food");
      ctx.beginPath(); ctx.arc(food[0] * cell + cell / 2, food[1] * cell + cell / 2, cell * 0.36, 0, Math.PI * 2); ctx.fill();
    }
    snake.forEach(([x, y], i) => {
      ctx.fillStyle = i === 0 ? css("--head") : css("--snake");
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath(); ctx.roundRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.25); ctx.fill();
    });
  }

  const typing = (event) => event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName || "");
  document.addEventListener("keydown", (event) => {
    if (typing(event) || !nameForm.hidden) return;
    if (event.code === "Space") { event.preventDefault(); if (running) togglePause(); else start(); return; }
    const next = KEYS[event.code];
    if (!next) return;
    event.preventDefault();
    if (!running) start();
    if (!paused) game.turn(next);
  });

  let touch = null;
  canvas.addEventListener("pointerdown", (event) => { touch = [event.clientX, event.clientY]; });
  canvas.addEventListener("pointerup", (event) => {
    if (!touch) return;
    const dx = event.clientX - touch[0], dy = event.clientY - touch[1]; touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (!running) start();
    game.turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
  document.querySelectorAll(".pad button").forEach((button) => button.addEventListener("click", () => { if (!running) start(); game.turn(button.dataset.dir); }));
  startButton.addEventListener("click", () => { if (paused) togglePause(); else start(); });
  nameForm.addEventListener("submit", (event) => { event.preventDefault(); saveRun(nameInput.value); });

  reset();
  renderLeaders();
  window.snake = {
    state: () => ({ running, paused, score: game.state.score, best, length: game.state.snake.length, head: game.state.snake[0], food: game.state.food, dir: game.state.dir, naming: !nameForm.hidden }),
    leaders: () => leaders.map((e) => ({ ...e })),
    tick, turn: (dir) => game.turn(dir), start, saveRun,
  };
})();
