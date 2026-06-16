import { pressed } from "./input.js";
import { dist } from "./utils.js";
import { POINTS } from "./constants.js";
import {
  gs,
  initGame,
  nextLevel,
  explode,
  killShip,
  spawnPowerUp,
} from "./state.js";

export function update(dt) {
  if (gs.status === "gameover") {
    if (pressed("Space")) initGame();
    gs.particles.forEach((p) => p.update(dt));
    gs.particles = gs.particles.filter((p) => !p.dead);
    return;
  }

  if (gs.status === "dead") {
    gs.deadTimer -= dt;
    gs.particles.forEach((p) => p.update(dt));
    gs.particles = gs.particles.filter((p) => !p.dead);
    gs.asteroids.forEach((a) => a.update(dt));
    if (gs.deadTimer <= 0) {
      gs.status = "playing";
      gs.ship.reset();
    }
    return;
  }

  if (pressed("Space")) gs.bullets.push(...gs.ship.tryShoot());
  if (pressed("KeyS") && gs.ship.shield === 0) gs.ship.shield = 5;

  // Spawn power-up periódico
  gs.powerupTimer -= dt;
  if (gs.powerupTimer <= 0) {
    spawnPowerUp();
    gs.powerupTimer = 15;
  }

  if (gs.slowmoTimer > 0) gs.slowmoTimer -= dt;

  gs.ship.update(dt);
  gs.bullets.forEach((b) => b.update(dt));
  const asteroidDt = gs.slowmoTimer > 0 ? dt * 0.5 : dt;
  gs.asteroids.forEach((a) => a.update(asteroidDt));
  gs.particles.forEach((p) => p.update(dt));
  gs.powerups.forEach((pu) => pu.update(dt));

  gs.bullets = gs.bullets.filter((b) => !b.dead);
  gs.particles = gs.particles.filter((p) => !p.dead);
  gs.powerups = gs.powerups.filter((pu) => !pu.dead);

  // Nave vs power-up
  for (const pu of gs.powerups) {
    if (dist(gs.ship, pu) < gs.ship.radius + pu.radius) {
      pu.dead = true;
      if (pu.type === "tripleShot") gs.ship.tripleShot = 10;
      if (pu.type === "slowmo") gs.slowmoTimer = 6;
      if (pu.type === "novaBomb") {
        for (const a of gs.asteroids) {
          gs.score += POINTS[a.size];
          explode(a.x, a.y, a.size * 6);
        }
        gs.asteroids = [];
      }
      gs.powerupTimer = 15;
    }
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of gs.bullets) {
    for (const a of gs.asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        gs.score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
  }
  gs.asteroids = gs.asteroids.filter((a) => !a.dead).concat(newAsteroids);
  gs.bullets = gs.bullets.filter((b) => !b.dead);

  // Nave vs asteroide
  if (gs.ship.invincible <= 0) {
    for (const a of gs.asteroids) {
      if (dist(gs.ship, a) < gs.ship.radius + a.radius * 0.82) {
        if (gs.ship.shield > 0) {
          gs.ship.shield = 0;
          explode(a.x, a.y, a.size * 3);
          a.dead = true;
          gs.asteroids = gs.asteroids.filter((x) => !x.dead);
        } else {
          killShip();
        }
        break;
      }
    }
  }

  if (gs.asteroids.length === 0) nextLevel();
}
