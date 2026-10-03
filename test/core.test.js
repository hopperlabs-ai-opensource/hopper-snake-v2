"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame, intervalFor } = require("../core.js");

test("a new game is a three-cell snake in the middle heading right, with food on a free cell", () => {
  const g = createGame({ random: () => 0 });
  assert.deepEqual(g.state.snake, [[10, 10], [9, 10], [8, 10]]);
  assert.equal(g.state.dir, "right");
  assert.deepEqual(g.state.food, [0, 0]);
});

test("turns queue up to three, ignore repeats and reversals", () => {
  const g = createGame({ random: () => 0 });
  assert.equal(g.turn("left"), false);
  assert.equal(g.turn("right"), false);
  assert.equal(g.turn("up"), true);
  assert.equal(g.turn("down"), false);
  assert.equal(g.turn("left"), true);
  assert.equal(g.turn("down"), true);
  assert.equal(g.turn("right"), false, "a fourth queued turn is dropped");
  g.step(); assert.deepEqual(g.state.snake[0], [10, 9]);
  g.step(); assert.deepEqual(g.state.snake[0], [9, 9]);
  g.step(); assert.deepEqual(g.state.snake[0], [9, 10]);
});

test("running into the snake's own body ends the game", () => {
  let n = 0;
  // Food lands straight ahead twice so the snake grows to five, then it turns back into itself.
  const g = createGame({ random: () => [0.55, 0.555, 0][Math.min(n++, 2)] });
  g.state.food = [11, 10]; g.step();
  g.state.food = [12, 10]; g.step();
  assert.equal(g.state.snake.length, 5);
  g.turn("up"); g.step();
  g.turn("left"); g.step();
  g.turn("down");
  const result = g.step();
  assert.equal(result.over, true);
  assert.equal(g.state.over, true);
});

test("the pace quickens with the score and stops at 60 ms", () => {
  assert.equal(intervalFor(0), 140);
  assert.equal(intervalFor(5), 120);
  assert.equal(intervalFor(100), 60);
});
