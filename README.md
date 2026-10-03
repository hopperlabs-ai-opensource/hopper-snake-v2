# Hopper Snake v2

Snake in the browser with your own top 10. The second version of a series built one version at a time. Each version is planned as a short
list of features with acceptance criteria, built, checked by an independent reviewer, and shipped at its own link.
Each version lives in its own repository, starting from the previous version's code.

| Version | What it adds | Code | Play |
| --- | --- | --- | --- |
| v1 | The classic game: a 20 x 20 board, food, growing, speeding up, walls, and a best score kept in your browser | [hopper-snake-v1](https://github.com/hopperlabs-ai-opensource/hopper-snake-v1) | https://hopper-snake-v1.vercel.app |
| **v2** | A personal leaderboard: your top 10 runs with your name, kept in your browser | [hopper-snake-v2](https://github.com/hopperlabs-ai-opensource/hopper-snake-v2) | https://hopper-snake-v2.vercel.app |
| v3 | Speed levels and obstacles | [hopper-snake-v3](https://github.com/hopperlabs-ai-opensource/hopper-snake-v3) | https://hopper-snake-v3.vercel.app |
| v4 | Power-ups, themes and a shareable replay link | [hopper-snake-v4](https://github.com/hopperlabs-ai-opensource/hopper-snake-v4) | https://hopper-snake-v4.vercel.app |

## Play

Arrow keys or WASD steer. Swipe on a phone, or use the on-screen pad. Space pauses and starts again.

## What v2 adds: your personal leaderboard

- When a run makes your top 10, the game asks for a name (up to 16 characters; it remembers the last one you used).
- **Your top 10** under the board lists each run's name, score, snake length and date, best first. The run you just
  saved is highlighted.
- It is kept in this browser's local storage, so it is still there next time. Nothing is sent anywhere; another
  browser or a private window has its own board.
- A run that ties the 10th place does not push it out; an earlier run keeps its place over a later one with the same
  score and length.

## How the code is laid out

| File | What it does |
| --- | --- |
| `core.js` | The rules: board, snake, food, turns, steps and pace. No page needed. |
| `leaderboard.js` | The top 10: names, ordering, whether a run qualifies, keeping it in storage. |
| `game.js` | The page: drawing, the clock, keyboard, swipe and pad, the name form and the list. |

## Run it yourself

Plain HTML, CSS and JavaScript, with no build step and no dependencies. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

## Tests

The tests run the real scripts, the rules and the leaderboard directly and `game.js` against a small stand-in for the
browser, with Node's built-in test runner (Node 20 or later, nothing to install):

```sh
node --test
```

They cover everything v1 does (movement, no reversing, growing, the speed-up, walls, self-collision, pause, every way
to steer) and the leaderboard: name cleaning, the top 10 cut, ties, qualifying, ranks, storage that is missing,
malformed or blocked, the name form in the game, typing a name never steering, and the board coming back on the next
visit.

## License

MIT. See [LICENSE](LICENSE).
