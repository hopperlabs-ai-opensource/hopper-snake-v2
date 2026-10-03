"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame, randomFor } = require("./harness.js");

const START = [[10, 10], [9, 10], [8, 10]];

test("a new game is a three-cell snake in the middle, heading right, score 0", () => {
  const { game } = loadGame();
  const s = game.state();
  assert.equal(s.length, 3);
  assert.deepEqual([...s.head], [10, 10]);
  assert.equal(s.dir, "right");
  assert.equal(s.score, 0);
  assert.equal(s.running, false);
});

test("one tick moves the head one cell in the current direction", () => {
  const { game } = loadGame({ random: () => randomFor([0, 0], START) });
  game.start();
  game.tick();
  assert.deepEqual([...game.state().head], [11, 10]);
  game.turn("down");
  game.tick();
  assert.deepEqual([...game.state().head], [11, 11]);
});

test("the snake cannot reverse into itself", () => {
  const { game } = loadGame({ random: () => randomFor([0, 0], START) });
  game.start();
  game.turn("left");
  game.tick();
  assert.deepEqual([...game.state().head], [11, 10]);
  assert.equal(game.state().running, true);
});

test("eating food grows the snake, scores a point, keeps the best score and speeds up", () => {
  const r = randomFor([11, 10], START);
  const { game, storage, timers } = loadGame({ random: () => r });
  game.start();
  assert.deepEqual([...game.state().food], [11, 10]);
  game.tick();
  const s = game.state();
  assert.equal(s.score, 1);
  assert.equal(s.length, 4);
  assert.equal(s.best, 1);
  assert.equal(storage["snake-best"], "1");
  assert.ok(timers.at(-1) < timers[0], `interval ${timers.at(-1)} ms should be shorter than ${timers[0]} ms`);
});

test("running into a wall ends the game", () => {
  const { game, elements } = loadGame({ random: () => randomFor([0, 0], START) });
  game.start();
  for (let i = 0; i < 9; i++) game.tick();
  assert.deepEqual([...game.state().head], [19, 10]);
  assert.equal(game.state().running, true);
  game.tick();
  assert.equal(game.state().running, false);
  assert.equal(elements("overlay-title").textContent, "Game over");
  assert.equal(elements("overlay").hidden, false);
});

test("the best score comes back from this browser's storage", () => {
  const { game, elements } = loadGame({ stored: { "snake-best": "7" } });
  assert.equal(game.state().best, 7);
  assert.equal(String(elements("best").textContent), "7");
});

test("space starts a game, then pauses and resumes it", () => {
  const { game, key, elements } = loadGame({ random: () => randomFor([0, 0], START) });
  key("Space");
  assert.equal(game.state().running, true);
  key("Space");
  assert.equal(game.state().paused, true);
  assert.equal(elements("overlay-title").textContent, "Paused");
  key("Space");
  assert.equal(game.state().paused, false);
});

test("arrow keys, WASD and the on-screen pad all steer", () => {
  const { game, key, padButtons } = loadGame({ random: () => randomFor([0, 0], START) });
  key("ArrowUp");
  game.tick();
  assert.deepEqual([...game.state().head], [10, 9]);
  key("KeyD");
  game.tick();
  assert.deepEqual([...game.state().head], [11, 9]);
  padButtons.find((b) => b.dataset.dir === "down").dispatch("click");
  game.tick();
  assert.deepEqual([...game.state().head], [11, 10]);
});
