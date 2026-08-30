# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Clon del arcade clásico **Asteroids**, implementado en HTML5 Canvas puro. Sin dependencias, sin bundler, sin build step. Todo el juego vive en un único archivo `game.js` (~420 líneas), cargado directamente por `index.html`.

## Running / developing

No hay build ni test runner. Para iterar:

- Abrir `index.html` directamente en el navegador (doble clic), o
- Servir el directorio con `npx serve .` y visitar `http://localhost:3000`

Los cambios en `game.js` se ven recargando la página (no hay hot-reload).

## Architecture

Todo el estado y la lógica están en `game.js`, organizado en secciones delimitadas por comentarios `// ── Nombre ──`:

- **Input**: `keys` (estado continuo por tecla) y `justPressed`/`pressed()` (edge-detection para disparo único por pulsación) se llenan vía listeners globales de `keydown`/`keyup`.
- **Utils**: `wrap` (envolvimiento toroidal de coordenadas en los bordes del canvas), `dist`, `rand`, `randInt`.
- **Entidades** (`Bullet`, `Asteroid`, `Ship`, `Particle`): cada una es una clase con `constructor`, `update(dt)` y `draw()`. No hay clase base ni sistema de entidades genérico — es intencional, dado el tamaño del proyecto.
- **Estado global del juego**: variables de módulo (`ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`, `deadTimer`) reasignadas por `initGame()` / `nextLevel()`. `state` es una máquina de estados simple: `'playing' | 'dead' | 'gameover'`.
- **Loop principal**: `requestAnimationFrame(loop)` clásico con delta time en segundos, clamped a 0.05s máx (`loop` → `update(dt)` → `draw()`).

### Puntos clave de la lógica de juego

- **Coordenadas toroidales**: todas las entidades móviles usan `wrap(v, max)` para envolver X/Y en los límites `W`/`H` (800×600) — el "espacio" no tiene bordes reales.
- **División de asteroides**: `Asteroid.split()` genera dos asteroides de `size - 1` en la misma posición; tamaño 1 no se divide más. `RADII`, `SPEEDS` y `POINTS` son arrays indexados por tamaño (1/2/3).
- **Colisiones**: se resuelven por fuerza bruta (`O(bullets × asteroids)`) usando distancia entre centros (`dist`) contra la suma de radios — sin spatial partitioning, aceptable al volumen actual de entidades.
- **Ciclo de vida de entidades**: cada entidad tiene un flag `dead`; los arrays se depuran cada frame con `.filter(e => !e.dead)`. Al modificar colisiones o splits, mantener este patrón (marcar `dead`, filtrar después) en vez de mutar arrays mientras se iteran.
- **Progresión de nivel**: al vaciarse `asteroids`, `nextLevel()` incrementa `level` y spawnea `3 + level` asteroides grandes.
- **Invencibilidad tras respawn**: `ship.invincible` (segundos restantes) bloquea colisiones nave-asteroide y produce el parpadeo visual en `Ship.draw()`.

Nota: el `README.md` menciona power-ups y tipos especiales de asteroide (p. ej. "estrella fugaz") como parte de la descripción del juego, pero esas features no existen en `game.js` actualmente.
