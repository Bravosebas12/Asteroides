# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Asteroids** is a faithful clone of the classic arcade Asteroids game built with vanilla HTML5 Canvas, requiring no build tools, bundler, or external dependencies. The entire game logic is contained in a single 423-line `game.js` file (ES6+).

## Running the Game

**Option 1: Direct browser** — Open `index.html` directly in your browser (double-click or drag to browser).

**Option 2: Local server** — From the project root:
```bash
npx serve .
```
Then visit `http://localhost:3000`.

## Code Architecture

The entire game lives in `game.js` and is organized into logical sections marked with ASCII dividers. The architecture is:

### Core Classes
- **Bullet** — Projectiles with speed, lifetime (TTL), and wrapping physics
- **Asteroid** — Polygonal objects with size (1–3), rotation, irregular vertices, and split behavior
- **Ship** — Player-controlled vessel with rotation, thrust, invincibility frames, and shoot cooldown
- **Particle** — Explosion debris with velocity, fade-out, and lifetime

### Game State Management
- Global arrays: `ship`, `bullets`, `asteroids`, `particles`
- Game state: `score`, `lives`, `level`, `state` ('playing' | 'dead' | 'gameover')
- State machine: `state` controls branching in `update()` and `draw()`

### Main Loop (`loop` function)
Uses `requestAnimationFrame` for smooth 60 FPS. Each frame:
1. Calculate delta time (`dt`) clamped to 50ms max to prevent large jumps
2. Call `update(dt)` — physics, collision, state transitions
3. Call `draw()` — render all entities and HUD

## Key Game Mechanics

### Scoring
- Small asteroid (size 1): 100 points
- Medium asteroid (size 2): 50 points
- Large asteroid (size 3): 20 points

Constants in `game.js`:
```javascript
const RADII  = [0, 16, 30, 50];   // visual radius by size
const SPEEDS = [0, 85, 55, 32];   // base velocity by size
const POINTS = [0, 100, 50, 20];  // points by size (note: reversed index)
```

### Physics & Constants
All values are in pixels/seconds or radians/seconds. Key tuning constants:
- **Ship rotation**: `ROT = 3.5` rad/s
- **Ship thrust**: `THRUST = 260` px/s²
- **Ship drag**: `DRAG = 0.987` (velocity decay per frame)
- **Bullet speed**: `SPEED = 520` px/s
- **Bullet lifetime**: `ttl = 1.1` seconds
- **Ship invincibility**: `invincible = 3` seconds after respawn (with visual blink at 8 Hz)
- **Shoot cooldown**: `shootCooldown = 0.2` seconds

### Wrapping Physics
The playfield is toroidal — objects wrap around edges using the `wrap(v, max)` utility:
```javascript
const wrap = (v, max) => ((v % max) + max) % max;
```

### Collision Detection
- **Bullet vs Asteroid**: Simple circle collision using `dist(b, a) < a.radius`
- **Ship vs Asteroid**: Same, but uses a 0.82 radius reduction factor on asteroids for gameplay feel

### Level Progression
- Start with 4 large asteroids
- Each level spawns `3 + level` asteroids
- Ship resets to center and gains invincibility
- Bullets and particles are cleared

## Rendering Details

### Canvas Setup
- 800×600px canvas, 1.5px stroke width for entities
- Black background, white strokes (retro arcade style)
- Entities use `ctx.save()/restore()` for independent transforms

### Asteroid Generation
- Irregular polygons with 8–13 random vertices
- Each vertex radius randomized 0.6–1.0× the base radius
- Gives unique, organic appearance to each asteroid

### Particle System
- Small line segments that fade out (alpha from full to 0)
- Burst velocity random 30–130 px/s in random direction
- Lifetime 0.4–1.1 seconds

### HUD
- Score (top-left), level (top-center), lives (top-right as ship icons)
- Game-over overlay centered with final score

## Input Handling

Input is tracked in two ways:
- `keys` — continuous state (true while held)
- `justPressed` — one-shot state (consumed by `pressed()` function)

This allows both "hold for continuous rotation" and "press Space to shoot once per frame."

## Boss Asteroid

A special "boss" asteroid variant appears randomly (50% chance per level, starting from level 1):
- **Size**: Much larger (radius 90 vs regular 50)
- **Health**: Requires 4 shots to destroy (3 additional shots beyond normal)
- **Points**: Awards 500 points when destroyed
- **Visual**: Rendered from `asteroid-boss.png` image file with rotation
- **Behavior**: Moves slowly (speed 25 px/s) and does not split into smaller asteroids
- **Fallback**: If image fails to load, displays as a golden circle with health number

The boss asteroid health reduces with each bullet hit and is tracked visually (image opacity decreases). When destroyed, it triggers an enhanced explosion effect (30 particles vs 8–20 for regular asteroids).

## Notes for Future Work

- The canvas size is hardcoded as 800×600 (`W` and `H` constants) — both the canvas HTML element and the physics use these values.
- All randomness uses `Math.random()`. For determinism/testing, you could inject a PRNG.
- The game loop is tied to the browser refresh rate and uses delta-time scaling for frame-rate independence.
- Particles are purely visual and do not affect gameplay (no collision).
- The `asteroid-boss.png` image is loaded at startup; if missing, the boss renders with fallback styling.
- The README describes removed features (power-ups, shooting stars); commit history shows what was removed if restoration is needed.

## Testing & Validation

To manually test after changes:
1. Open in browser and play through multiple levels
2. Check edge wrapping (shoot/move near boundaries)
3. Verify collision detection (especially ship near asteroid edges)
4. Confirm score increments correctly for each size
5. Validate invincibility flicker and respawn behavior
