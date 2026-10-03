// Loads the page's scripts into a small stand-in for the browser (no dependencies), so the real game code runs under
// node --test exactly as the page loads it.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SCRIPTS = ["core.js", "leaderboard.js", "game.js"];
const HIDDEN_AT_LOAD = new Set(["name-form"]);

function element(tagName, id) {
  const listeners = {};
  const el = {
    tagName: tagName.toUpperCase(), id, hidden: HIDDEN_AT_LOAD.has(id), textContent: "", className: "", value: "", dataset: {}, children: [],
    width: 480, height: 480, listeners, focused: 0,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    dispatch(type, event = {}) { for (const fn of listeners[type] || []) fn({ preventDefault() {}, target: el, ...event }); },
    focus() { el.focused += 1; },
    select() {},
    append(...nodes) { el.children.push(...nodes); },
    replaceChildren(...nodes) { el.children = nodes; },
    setAttribute(name, value) { el[name] = value; },
    getContext() {
      return new Proxy({}, { get: (target, key) => (key in target ? target[key] : () => {}), set: (target, key, value) => { target[key] = value; return true; } });
    },
  };
  return el;
}

function loadGame({ stored = {}, random = () => 0.5, scripts = SCRIPTS, url = "https://example.test/" } = {}) {
  const elements = {};
  const byId = (id) => (elements[id] ||= element(id === "name-input" ? "input" : "div", id));
  const docListeners = {};
  const storage = { ...stored };
  const timers = [];
  const padButtons = ["up", "left", "down", "right"].map((dir) => Object.assign(element("button", "pad-" + dir), { dataset: { dir } }));
  const context = {
    console, URL, URLSearchParams,
    location: new URL(url),
    history: { replaceState() {} },
    navigator: {},
    document: {
      documentElement: { dataset: {} },
      getElementById: byId,
      createElement: (tag) => element(tag, ""),
      addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
      querySelectorAll: (selector) => (selector === ".pad button" ? padButtons : []),
    },
    getComputedStyle: () => ({ getPropertyValue: () => "#16212d" }),
    localStorage: {
      getItem: (key) => (key in storage ? storage[key] : null),
      setItem: (key, value) => { storage[key] = String(value); },
    },
    setInterval: (fn, ms) => { timers.push(ms); return timers.length; },
    clearInterval: () => {},
  };
  context.window = context;
  context.self = context;
  vm.createContext(context);
  vm.runInContext("Math.random = () => __random()", Object.assign(context, { __random: random }));
  for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context, { filename: file });
  const key = (code, target) => { for (const fn of docListeners.keydown || []) fn({ code, target: target || null, preventDefault() {} }); };
  return { game: context.window.snake, elements: byId, storage, timers, key, padButtons, context };
}

// The free cells in the order the game lists them (x outer, y inner), so a test can pick where food lands.
function randomFor(cell, taken, size = 20) {
  const busy = new Set(taken.map(([x, y]) => x + "," + y));
  const free = [];
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (!busy.has(x + "," + y)) free.push(x + "," + y);
  const index = free.indexOf(cell.join(","));
  if (index < 0) throw new Error("cell is taken");
  return (index + 0.5) / free.length;
}

module.exports = { loadGame, randomFor, element };
