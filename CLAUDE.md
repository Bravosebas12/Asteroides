# CLAUDE.md

Este archivo provee guía a Claude Code (claude.ai/code) al trabajar en este repositorio.

## Ejecución

Sin build. Abre `index.html` directo en navegador, o:

```bash
npx serve .
# → http://localhost:3000
```

Sin package.json, sin bundler, sin tests.

## Arquitectura

Juego en un solo archivo (`game.js`) con canvas fijo 800×600. Toda la lógica en módulo plano — sin imports, sin frameworks.

**Clases de entidad** — cada una tiene `update(dt)`, `draw()` y flag `dead`:

- `Bullet` — wrapping de bordes, expira por `ttl`
- `Asteroid` — polígono irregular con verts aleatorios; `split()` devuelve dos más pequeños (tamaño 3→2→1, tamaño 1 devuelve `[]`)
- `Ship` — física thrust/drag, cooldown de disparo, timer de invencibilidad al reaparecer
- `Particle` — sparks de explosión, alpha fade por `ttl/life`

**Estado del juego** — vars a nivel módulo: `ship`, `bullets[]`, `asteroids[]`, `particles[]`, `score`, `lives`, `level`, `state` (`'playing'|'dead'|'gameover'`), `deadTimer`.

**Loop** — `requestAnimationFrame` → `loop(ts)` → `update(dt)` + `draw()`. `dt` limitado a 50 ms para evitar tunneling al despertar tab oculto.

**Colisión** — círculo–círculo vía `dist()`. Bala vs asteroide primero cada frame; nave vs asteroide solo cuando `ship.invincible <= 0`. Objetos golpeados ponen `.dead = true` y se filtran al final del frame.

**Wrapping** — `wrap(v, max)` maneja bordes toroidales para nave, balas y asteroides.

**Constantes** (inicio del archivo):

- `RADII[1,2,3]` = `[16, 30, 50]`
- `SPEEDS[1,2,3]` = `[85, 55, 32]`
- `POINTS[1,2,3]` = `[100, 50, 20]`

## Controles

`←`/`→` rotar, `↑` propulsar, `Space` disparar / reiniciar tras game over.
