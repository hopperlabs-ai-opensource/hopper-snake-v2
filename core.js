// The rules of Snake, with no page in sight: a board, a snake, food, turns and steps. game.js draws it and runs the
// clock; the tests drive it directly. Works as a plain browser script (window.SnakeCore) and as a Node module.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SnakeCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const START_MS = 140, MIN_MS = 60, SPEED_UP_MS = 4;

  /** How long one step lasts at this score: faster as the score grows, never faster than MIN_MS. */
  const intervalFor = (score) => Math.max(MIN_MS, START_MS - score * SPEED_UP_MS);

  function createGame({ size = 20, random = Math.random } = {}) {
    const mid = Math.floor(size / 2);
    const state = { size, snake: [[mid, mid], [mid - 1, mid], [mid - 2, mid]], dir: "right", queued: [], food: null, score: 0, steps: 0, over: false, won: false };
    const same = (a, b) => a[0] === b[0] && a[1] === b[1];

    function placeFood() {
      const taken = new Set(state.snake.map(([x, y]) => x + "," + y)), free = [];
      for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (!taken.has(x + "," + y)) free.push([x, y]);
      state.food = free.length ? free[Math.floor(random() * free.length)] : null;
    }

    /** Queue a turn; a reversal into the snake's own neck, a repeat, or a fourth queued turn is ignored. */
    function turn(next) {
      if (!DIRS[next] || state.over) return false;
      const last = state.queued.length ? state.queued[state.queued.length - 1] : state.dir;
      const [dx, dy] = DIRS[next], [lx, ly] = DIRS[last];
      if (dx === -lx && dy === -ly) return false;
      if (next === last || state.queued.length >= 3) return false;
      state.queued.push(next);
      return true;
    }

    /** One step. Returns what happened: { ate, over, won }. */
    function step() {
      if (state.over) return { ate: false, over: true, won: state.won };
      if (state.queued.length) state.dir = state.queued.shift();
      const [dx, dy] = DIRS[state.dir], [hx, hy] = state.snake[0], head = [hx + dx, hy + dy];
      const ate = Boolean(state.food) && same(head, state.food);
      const body = ate ? state.snake : state.snake.slice(0, -1);
      state.steps += 1;
      if (head[0] < 0 || head[1] < 0 || head[0] >= size || head[1] >= size || body.some((cell) => same(cell, head))) {
        state.over = true;
        return { ate: false, over: true, won: false };
      }
      state.snake = [head, ...body];
      if (ate) {
        state.score += 1;
        if (state.snake.length === size * size) { state.over = true; state.won = true; return { ate, over: true, won: true }; }
        placeFood();
      }
      return { ate, over: false, won: false };
    }

    placeFood();
    return { state, turn, step, interval: () => intervalFor(state.score) };
  }

  return { DIRS, createGame, intervalFor };
});
