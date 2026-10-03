// Your personal leaderboard: the 10 best runs played in this browser, each with the name you gave it, kept in this
// browser's local storage. Nothing leaves the browser. Works as a plain browser script (window.SnakeLeaderboard) and
// as a Node module.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SnakeLeaderboard = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const KEY = "hopper-snake.leaderboard", NAME_KEY = "hopper-snake.name", SIZE = 10, NAME_MAX = 16;

  /** A name as it is kept: printable characters only, spaces collapsed, at most 16 characters; empty becomes "Player". */
  function cleanName(name) {
    const text = String(name ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
    return Array.from(text).slice(0, NAME_MAX).join("").trim() || "Player";
  }

  const valid = (e) => e && typeof e.name === "string" && Number.isInteger(e.score) && e.score >= 0 &&
    Number.isInteger(e.length) && e.length > 0 && typeof e.date === "string";

  /** Best first: higher score, then the longer snake; an earlier run keeps its place over a later one with the same result. */
  const order = (a, b) => b.score - a.score || b.length - a.length;

  /** The kept leaderboard, best first. Anything unreadable or malformed is left out rather than breaking the game. */
  function load(storage) {
    let raw = null;
    try { raw = storage.getItem(KEY); } catch { return []; }
    let list;
    try { list = JSON.parse(raw || "[]"); } catch { return []; }
    if (!Array.isArray(list)) return [];
    return list.filter(valid).map((e) => ({ ...e, name: cleanName(e.name) })).sort(order).slice(0, SIZE);
  }

  /** Whether a run with this score earns a place: it scored, and the board has room or it beats the 10th run. */
  function qualifies(entries, score) {
    return score > 0 && (entries.length < SIZE || score > entries[SIZE - 1].score);
  }

  /** The board with this run added in its place, and the run's rank (1 to 10), or rank 0 when it did not make it. */
  function add(entries, run) {
    const entry = { ...(run.extra || {}), name: cleanName(run.name), score: run.score, length: run.length, date: run.date };
    if (!valid(entry)) throw new TypeError("a run needs a whole score, a length and a date");
    const next = [...entries, entry].sort(order).slice(0, SIZE);
    return { entries: next, rank: next.indexOf(entry) + 1 };
  }

  /** Keep the board. Returns false when this browser will not store it (a private window, storage full). */
  function save(storage, entries) {
    try { storage.setItem(KEY, JSON.stringify(entries)); return true; } catch { return false; }
  }

  const lastName = (storage) => { try { return storage.getItem(NAME_KEY) || ""; } catch { return ""; } };
  const rememberName = (storage, name) => { try { storage.setItem(NAME_KEY, cleanName(name)); } catch { /* not kept */ } };

  return { KEY, NAME_KEY, SIZE, NAME_MAX, cleanName, load, qualifies, add, save, lastName, rememberName };
});
