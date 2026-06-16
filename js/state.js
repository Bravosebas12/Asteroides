import { rand } from "./utils.js";
import { W, H } from "./constants.js";
import { Ship } from "./entities/Ship.js";
import { Asteroid } from "./entities/Asteroid.js";
import { Particle } from "./entities/Particle.js";
import { PowerUp } from "./entities/PowerUp.js";

export const gs = {
  ship: null,
  bullets: [],
  asteroids: [],
  particles: [],
  powerups: [],
  powerupTimer: 15,
  slowmoTimer: 0,
  score: 0,
  lives: 3,
  level: 1,
  status: "playing",
  deadTimer: 0,
};

export function spawnPowerUp() {
  if (gs.powerups.length === 0) gs.powerups.push(new PowerUp());
}

export function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    gs.asteroids.push(new Asteroid(x, y, 3));
  }
}

export function initGame() {
  gs.ship = new Ship();
  gs.bullets = [];
  gs.asteroids = [];
  gs.particles = [];
  gs.powerups = [];
  gs.powerupTimer = 15;
  gs.slowmoTimer = 0;
  gs.score = 0;
  gs.lives = 3;
  gs.level = 1;
  gs.status = "playing";
  spawnAsteroids(4);
}

export function nextLevel() {
  gs.level++;
  gs.bullets = [];
  gs.particles = [];
  gs.powerups = [];
  gs.powerupTimer = 10;
  gs.slowmoTimer = 0;
  gs.ship.reset();
  spawnAsteroids(3 + gs.level);
}

export function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) gs.particles.push(new Particle(x, y));
}

export function killShip() {
  explode(gs.ship.x, gs.ship.y, 14);
  gs.ship.dead = true;
  gs.lives--;
  if (gs.lives <= 0) {
    gs.status = "gameover";
  } else {
    gs.status = "dead";
    gs.deadTimer = 2;
  }
}
