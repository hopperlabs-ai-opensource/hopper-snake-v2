"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Board = require("../leaderboard.js");
const { loadGame, randomFor } = require("./harness.js");

const memory = (initial = {}) => { const data = { ...initial }; return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } }; };
const run = (name, score, length = score + 3, date = "2026-10-03") => ({ name, score, length, date });

test("names are trimmed, spaces collapsed, control characters dropped, at most 16 characters", () => {
  assert.equal(Board.cleanName("  Ada \n  Lovelace  "), "Ada Lovelace");
  assert.equal(Board.cleanName("a\u0000b\u0007c"), "abc");
  assert.equal(Board.cleanName("Grace Brewster Murray Hopper"), "Grace Brewster M");
  assert.equal(Board.cleanName("   "), "Player");
  assert.equal(Board.cleanName(undefined), "Player");
});

test("the board keeps only the 10 best runs, best first", () => {
  let entries = [];
  for (const score of [5, 12, 3, 9, 20, 1, 7, 15, 8, 11, 2, 14]) entries = Board.add(entries, run("p" + score, score)).entries;
  assert.equal(entries.length, 10);
  assert.deepEqual(entries.map((e) => e.score), [20, 15, 14, 12, 11, 9, 8, 7, 5, 3]);
});

test("a run qualifies only when it scored and beats the 10th place on a full board", () => {
  assert.equal(Board.qualifies([], 0), false);
  assert.equal(Board.qualifies([], 1), true);
  let entries = [];
  for (let s = 1; s <= 10; s++) entries = Board.add(entries, run("p", s * 2)).entries;
  assert.equal(Board.qualifies(entries, 2), false, "a tie with 10th place does not push it out");
  assert.equal(Board.qualifies(entries, 3), true);
});

test("add reports the new run's rank, and an equal earlier run keeps its place", () => {
  const first = Board.add([], run("Ann", 8, 11)).entries;
  const { entries, rank } = Board.add(first, run("Bo", 8, 11));
  assert.equal(rank, 2);
  assert.deepEqual(entries.map((e) => e.name), ["Ann", "Bo"]);
  assert.equal(Board.add(entries, run("Cy", 9)).rank, 1);
});

test("the board persists in storage and malformed data never breaks loading", () => {
  const storage = memory();
  const { entries } = Board.add([], run("Ann", 4));
  assert.equal(Board.save(storage, entries), true);
  assert.deepEqual(Board.load(storage), entries);
  assert.deepEqual(Board.load(memory({ [Board.KEY]: "{not json" })), []);
  assert.deepEqual(Board.load(memory({ [Board.KEY]: JSON.stringify([{ name: "x", score: "9" }, run("ok", 2)]) })).map((e) => e.name), ["ok"]);
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.deepEqual(Board.load(throwing), []);
  assert.equal(Board.save(throwing, entries), false);
});

const START = [[10, 10], [9, 10], [8, 10]];
const plain = (value) => JSON.parse(JSON.stringify(value)); // values made inside the page context, as plain values

test("in the game: a top 10 run asks for a name, saves it, and the board is there on the next visit", () => {
  const r = randomFor([11, 10], START);
  const first = loadGame({ random: () => r });
  first.game.start();
  first.game.tick(); // eats at (11,10)
  assert.equal(first.game.state().score, 1);
  while (first.game.state().running) first.game.tick(); // into the right wall
  assert.equal(first.game.state().naming, true);
  assert.equal(first.elements("name-form").hidden, false);
  assert.ok(first.elements("name-input").focused > 0, "the name field takes focus");

  first.key("ArrowUp", first.elements("name-input"));
  assert.equal(first.game.state().running, false, "typing a name never steers or restarts");

  first.elements("name-input").value = "  Ada \n Lovelace the Countess ";
  first.elements("name-form").dispatch("submit");
  assert.equal(first.game.state().naming, false);
  assert.deepEqual(plain(first.game.leaders().map((e) => [e.name, e.score, e.length])), [["Ada Lovelace the", 1, 4]]);
  assert.equal(first.elements("leader-list").children.length, 1);
  assert.equal(first.elements("leader-list").children[0].className, "fresh");
  assert.equal(first.storage["hopper-snake.name"], "Ada Lovelace the");

  const again = loadGame({ stored: first.storage });
  assert.deepEqual(plain(again.game.leaders().map((e) => e.name)), ["Ada Lovelace the"]);
  assert.equal(again.elements("leader-list").children.length, 1);
  assert.equal(again.elements("leaders-empty").hidden, true);
  assert.equal(again.game.state().best, 1);
});

test("in the game: a run that scores nothing does not ask for a name", () => {
  const { game, elements } = loadGame({ random: () => randomFor([0, 0], START) });
  game.start();
  while (game.state().running) game.tick();
  assert.equal(elements("name-form").hidden, true);
  assert.equal(elements("leaders-empty").hidden, false);
});
