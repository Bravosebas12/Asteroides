# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Asteroids clone in pure HTML5 canvas + vanilla JS. No build step, no bundler, no dependencies, no tests. Whole game logic lives in one file: `game.js`.

## Running it

Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
```

Then visit `http://localhost:3000`. There is no build/lint/test command — this is plain script code loaded directly by `index.html`.

## Architecture

Single-file game (`game.js`), structured as classes + a global mutable game state, driven by a `requestAnimationFrame` loop:

- **Entities** (`Bullet`, `Asteroid`, `Ship`, `Particle`): each has `update(dt)` and `draw()`. All movement wraps toroidally across the canvas via `wrap(v, max)` — the playfield has no walls.
- **Global state**: `ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state` (`'playing' | 'dead' | 'gameover'`), `deadTimer`. Reset via `initGame()`, advanced via `nextLevel()`.
- **Game loop** (`loop(ts)` at the bottom of the file): computes `dt` (clamped to 0.05s), calls `update(dt)` then `draw()`, then reschedules itself.
- **`update(dt)`**: branches on `state`. In `'playing'`, it moves entities, filters out dead bullets/particles, does bullet-vs-asteroid and ship-vs-asteroid collision (simple radius/distance checks via `dist()`), and triggers `nextLevel()` when `asteroids.length === 0`.
- **Asteroid splitting**: size 3 → 2 → 1, each split spawns two smaller asteroids at the same position (`Asteroid.split()`); size 1 asteroids don't split further. `RADII`, `SPEEDS`, `POINTS` arrays are indexed by size.
- **Input**: raw keydown/keyup state in `keys{}`, plus `justPressed{}`/`pressed(code)` for single-fire actions like shooting (Space) so holding the key doesn't repeat-fire faster than `shootCooldown` allows.
- **Rendering**: everything drawn directly with Canvas 2D API (no sprites/images) — ships and asteroids are stroked polygons defined in local space and transformed with `ctx.translate`/`ctx.rotate`.

When modifying gameplay, keep changes inside the relevant class's `update`/`draw`, and remember collision, splitting, and scoring are all wired through the single `update()` function's `'playing'` branch.

## Controls

`←`/`→` rotate, `↑` thrusts, `Space` shoots (also restarts from game-over screen).