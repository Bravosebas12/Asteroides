# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

No build step or dependencies — open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
# then open http://localhost:3000
```

## Architecture

The entire game lives in two files:

- `index.html` — minimal shell: black body, centered 800×600 `<canvas>`, loads `game.js`
- `game.js` — all logic, ~420 lines, no modules or external deps

`game.js` is organized top-to-bottom as:

1. **Input** — `keys` (held) and `justPressed` (one-frame) maps; `pressed(code)` consumes a one-frame press
2. **Utils** — `wrap`, `dist`, `rand`, `randInt`
3. **Entity classes** — `Bullet`, `Asteroid`, `Ship`, `Particle`; each has `update(dt)` and `draw()`, plus a `dead` flag used for removal
4. **Game state** — module-level vars: `ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state` (`'playing'|'dead'|'gameover'`), `deadTimer`
5. **State functions** — `initGame`, `nextLevel`, `explode`, `killShip`, `spawnAsteroids`
6. **`update(dt)`** — main logic tick; branches on `state`, then runs movement, collision detection (bullet↔asteroid, ship↔asteroid), and level transition
7. **`draw()`** — clears canvas, draws all entities, HUD, and overlays
8. **Game loop** — `requestAnimationFrame` loop, dt capped at 50 ms to avoid tunneling on tab blur

## Key constants

| Symbol | Value | Where |
|--------|-------|-------|
| `W`, `H` | 800, 600 | canvas dimensions |
| `RADII` | `[0, 16, 30, 50]` | asteroid radius by size (1=small, 3=large) |
| `SPEEDS` | `[0, 85, 55, 32]` | base speed by size |
| `POINTS` | `[0, 100, 50, 20]` | score by size |
| `THRUST` | 260 px/s² | ship acceleration |
| `DRAG` | 0.987 | per-frame velocity multiplier |

## Controls

`←`/`→` rotate · `↑` thrust · `Space` shoot / restart after game over
