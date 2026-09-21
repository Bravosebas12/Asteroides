'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Sprite del asteroide especial: engranaje de neón sobre fondo negro (JPEG sin alfa).
const bossAsteroidImage = new Image();
bossAsteroidImage.src = 'asteroid-boss.jpg';

// Recorte del engranaje dentro del lienzo original (2816x1536). El resto de la imagen
// es fondo y el marco hexagonal azul, que no deben verse en el juego.
// Medido sobre el propio archivo: el engranaje ocupa 492x482 px centrado en (1478, 749);
// el margen extra deja respirar el halo de neón sin llegar al marco hexagonal.
const BOSS_SPRITE_CROP = { sx: 1188, sy: 459, sw: 580, sh: 580 };

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  // speed queda en null salvo que quien dispara imponga el suyo (la nave enemiga
  // escala la velocidad de sus balas con el nivel).
  constructor(x, y, angle, owner = 'player', speed = null) {
    this.x = x;
    this.y = y;
    const SPEED = speed !== null ? speed : (owner === 'enemy' ? 380 : 520);
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.owner = owner;                                    // 'player' | 'enemy'
    this.color = owner === 'enemy' ? '#ff5a5a' : '#fff';
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];     // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];     // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];    // puntos por tamaño
const BOSS_POINTS = 500;            // puntos por destruir el boss

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Boss Asteroid ─────────────────────────────────────────────────────────────
class BossAsteroid {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 90;
    this.health = 4;        // Requiere 4 disparos (3 adicionales)
    this.maxHealth = 4;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = 25;       // Más lento que asteroides regulares
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-0.3, 0.3);
    this.rot = rand(0, Math.PI * 2);
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) this.dead = true;
  }

  draw() {
    if (bossAsteroidImage.complete && bossAsteroidImage.naturalHeight !== 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = this.health / this.maxHealth * 0.8 + 0.2;
      // Composición aditiva: sobre el fondo negro del juego, el negro del JPEG no aporta
      // nada, así que el sprite no tapa lo que pase por detrás y el neón conserva su brillo.
      ctx.globalCompositeOperation = 'lighter';
      const c = BOSS_SPRITE_CROP;
      ctx.drawImage(bossAsteroidImage, c.sx, c.sy, c.sw, c.sh,
                    -this.radius, -this.radius, this.radius * 2, this.radius * 2);
      ctx.restore();
    } else {
      // Fallback si la imagen no carga
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.health, 0, 0);
      ctx.restore();
    }
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
// Silueta compartida por la nave del jugador y la nave enemiga.
// Se traza en el espacio local de la nave (origen en su centro, nariz hacia +x).
function shipSilhouettePath() {
  ctx.beginPath();
  ctx.moveTo( 20,  0);   // nariz
  ctx.lineTo(-12, -9);   // ala izquierda
  ctx.lineTo( -7,  0);   // muesca trasera
  ctx.lineTo(-12,  9);   // ala derecha
  ctx.closePath();
}

const SHIP_NOSE = 21;    // distancia del centro al punto de salida de las balas

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.hyper         = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt, mods = {}) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    this.hyper = !!mods.hyper;

    const ROT    = 3.5;                            // rad/s
    const THRUST = this.hyper ? 560 : 260;         // px/s²
    const DRAG   = this.hyper ? 0.994 : 0.987;     // menos drag => mayor velocidad punta

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(triple = false) {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const ox = this.x + Math.cos(this.angle) * SHIP_NOSE;
    const oy = this.y + Math.sin(this.angle) * SHIP_NOSE;
    const spread = triple ? [-0.17, 0, 0.17] : [0];
    return spread.map(offset => new Bullet(ox, oy, this.angle + offset));
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    shipSilhouettePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - (this.hyper ? rand(16, 30) : rand(6, 14)), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.hyper ? 'rgba(255, 190, 60, 0.9)' : 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Nave enemiga ──────────────────────────────────────────────────────────────
const ENEMY_FIRST_LEVEL   = 5;    // primer nivel con nave enemiga; desde aquí, todos
const ENEMY_PEAK_LEVEL    = 20;   // nivel en el que la dificultad llega al máximo
const ENEMY_MAX_COUNT     = 2;    // naves por nivel a partir de ENEMY_PEAK_LEVEL
const ENEMY_RESPAWN_DELAY = 2;    // segundos de respiro antes de que entre la siguiente
const ENEMY_POINTS = 300;
const ENEMY_DRAG   = 0.99;

// Rangos [nivel 5, nivel 20+]. El primer encuentro entra bastante por debajo de la
// antigua configuración fija (rot 1.8, empuje 120, disparo 1.4 s, bala 380) y sube
// desde ahí, de modo que el nivel 5 deja de ser el pico de dificultad.
const ENEMY_ROT_RANGE    = [1.15, 2.20];   // rad/s: giro máximo hacia el jugador
const ENEMY_THRUST_RANGE = [85,   165];    // px/s²
const ENEMY_FIRE_RANGE   = [2.40, 1.00];   // segundos entre disparos (menos = peor)
const ENEMY_BULLET_RANGE = [300,  430];    // px/s

const lerp = (a, b, t) => a + (b - a) * t;

// 0 en el primer nivel con enemigo, 1 desde ENEMY_PEAK_LEVEL en adelante.
function enemyDifficulty(level) {
  const span = ENEMY_PEAK_LEVEL - ENEMY_FIRST_LEVEL;
  return Math.max(0, Math.min(1, (level - ENEMY_FIRST_LEVEL) / span));
}

// Cuántas naves enemigas toca derribar en este nivel. Nunca coinciden en pantalla:
// la siguiente entra solo cuando cae la anterior.
function enemiesForLevel(level) {
  if (level < ENEMY_FIRST_LEVEL) return 0;
  return level >= ENEMY_PEAK_LEVEL ? ENEMY_MAX_COUNT : 1;
}

// Distancia con signo más corta en un eje toroidal (el campo envuelve por los bordes).
function wrappedDelta(from, to, max) {
  let d = to - from;
  if (d >  max / 2) d -= max;
  if (d < -max / 2) d += max;
  return d;
}

// Diferencia angular normalizada a [-PI, PI] para girar siempre por el lado corto.
function angleDiff(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d >  Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

class EnemyShip {
  // La dificultad se congela al nacer: cada nave conserva los valores del nivel que
  // la generó, así que no cambia de comportamiento a mitad de combate.
  constructor(level) {
    const SAFE_DIST = 220;
    do {
      this.x = rand(0, W);
      this.y = rand(0, H);
    } while (Math.hypot(this.x - W / 2, this.y - H / 2) < SAFE_DIST);

    const t = enemyDifficulty(level);
    this.rot          = lerp(ENEMY_ROT_RANGE[0],    ENEMY_ROT_RANGE[1],    t);
    this.thrust       = lerp(ENEMY_THRUST_RANGE[0], ENEMY_THRUST_RANGE[1], t);
    this.fireInterval = lerp(ENEMY_FIRE_RANGE[0],   ENEMY_FIRE_RANGE[1],   t);
    this.bulletSpeed  = lerp(ENEMY_BULLET_RANGE[0], ENEMY_BULLET_RANGE[1], t);

    this.angle  = rand(0, Math.PI * 2);
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    // El primer disparo tarda algo más: da margen para reaccionar a su entrada.
    this.shootCooldown = this.fireInterval * 1.5;
    this.dead   = false;
  }

  // Persigue al objetivo y devuelve una bala cuando el cañón está listo, o null.
  update(dt, target) {
    const dx = wrappedDelta(this.x, target.x, W);
    const dy = wrappedDelta(this.y, target.y, H);
    const aimAngle = Math.atan2(dy, dx);

    // Giro limitado hacia el jugador
    const diff = angleDiff(this.angle, aimAngle);
    const step = this.rot * dt;
    this.angle += Math.abs(diff) < step ? diff : Math.sign(diff) * step;

    // Empuje solo cuando ya apunta razonablemente hacia el objetivo
    if (Math.abs(diff) < 0.6) {
      this.vx += Math.cos(this.angle) * this.thrust * dt;
      this.vy += Math.sin(this.angle) * this.thrust * dt;
    }
    this.vx *= ENEMY_DRAG;
    this.vy *= ENEMY_DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);

    this.shootCooldown -= dt;
    if (this.shootCooldown > 0 || target.dead) return null;

    this.shootCooldown = this.fireInterval;
    const ox = this.x + Math.cos(aimAngle) * SHIP_NOSE;
    const oy = this.y + Math.sin(aimAngle) * SHIP_NOSE;
    return new Bullet(ox, oy, aimAngle, 'enemy', this.bulletSpeed);
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#ff5a5a';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    shipSilhouettePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
// duration: 0 => efecto instantáneo (se consume al recogerlo)
const POWERUP_TYPES = {
  SHIELD: { key: 'SHIELD', label: 'ESCUDO',  glyph: 'E', duration: 5,  color: '#4de2ff', sides: 6 },
  TRIPLE: { key: 'TRIPLE', label: 'TRIPLE',  glyph: 'T', duration: 10, color: '#7dff6b', sides: 3 },
  SLOW:   { key: 'SLOW',   label: 'SLOW-MO', glyph: 'S', duration: 6,  color: '#9b8cff', sides: 4 },
  NOVA:   { key: 'NOVA',   label: 'NOVA',    glyph: 'N', duration: 0,  color: '#ff5db1', sides: 8 },
  HYPER:  { key: 'HYPER',  label: 'HIPER',   glyph: 'H', duration: 8,  color: '#ffa23d', sides: 5 },
  // LIFE queda fuera de POWERUP_ORDER a propósito: no entra en el pool de drops
  // aleatorios (tiene su propia regla) ni en el cronómetro del HUD (no tiene duración).
  LIFE:   { key: 'LIFE',   label: 'VIDA',    glyph: '+', duration: 0,  color: '#ff4d6d', sides: 12 },
};
const POWERUP_ORDER   = ['SHIELD', 'TRIPLE', 'SLOW', 'NOVA', 'HYPER'];
const POWERUP_TTL     = 9;      // segundos que el ítem permanece en pantalla
const POWERUP_CHANCE  = 0.18;   // probabilidad de drop al destruir un asteroide
const POWERUP_MAX     = 2;      // ítems simultáneos en pantalla

// Recuperación de vida: solo se ofrece cuando al jugador le queda la última vida.
const LIVES_START      = 3;     // vidas iniciales, y también el tope
const LIFE_DROP_LIVES  = 1;     // vidas restantes que habilitan el drop
const LIFE_DROP_CHANCE = 0.12;  // probabilidad por asteroide destruido

function polygonPath(sides, radius) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (i / sides) * Math.PI * 2;
    const px = Math.cos(a) * radius;
    const py = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 11;
    this.ttl = POWERUP_TTL;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(10, 25);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rot = 0;
    this.rotSpeed = rand(-0.9, 0.9);
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en los últimos segundos antes de expirar
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    polygonPath(this.type.sides, this.radius);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.type.color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.glyph, 0, 0.5);
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let enemy;              // EnemyShip en pantalla, o null (nunca hay más de una)
let enemiesPending;     // naves que aún faltan por entrar en este nivel
let enemyRespawnTimer;  // cuenta atrás hasta que entra la siguiente
let effects;          // { SHIELD: segundos restantes, ... }
let tripleShotUsed;   // TRIPLE solo puede aparecer una vez por partida
let novaFlash;        // temporizador del destello de la Bomba Nova
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let paused = false;   // congela la simulación sin tocar la máquina de estados

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
  // Boss asteroid aparece con 50% de probabilidad en cada nivel
  if (Math.random() < 0.5) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new BossAsteroid(x, y));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  resetEnemyWave(0);
  effects        = {};
  tripleShotUsed = false;
  novaFlash      = 0;
  score  = 0;
  lives  = LIVES_START;
  level  = 1;
  state  = 'playing';
  setPaused(false);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];   // los efectos activos se mantienen entre niveles
  resetEnemyWave(enemiesForLevel(level));
  spawnNextEnemy();                       // la primera entra junto con el nivel
  ship.reset();
  spawnAsteroids(3 + level);
}

// ── Oleada de naves enemigas ──────────────────────────────────────────────────
function resetEnemyWave(count) {
  enemy             = null;
  enemiesPending    = count;
  enemyRespawnTimer = 0;
}

function spawnNextEnemy() {
  if (enemy || enemiesPending <= 0) return;
  enemiesPending--;
  enemy = new EnemyShip(level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function maybeDropPowerUp(x, y, chance) {
  if (powerups.length >= POWERUP_MAX) return;
  if (Math.random() >= chance) return;

  const pool = POWERUP_ORDER.filter(k => k !== 'TRIPLE' || !tripleShotUsed);
  const type = POWERUP_TYPES[pool[randInt(0, pool.length - 1)]];
  powerups.push(new PowerUp(x, y, type));
}

// Suelta un ítem de vida solo con la última vida en juego y nunca más de uno a la vez.
// No cuenta contra POWERUP_MAX: tener dos power-ups en pantalla no debe bloquear la
// única vía de recuperación justo en el momento en que hace falta.
function maybeDropLife(x, y) {
  if (lives !== LIFE_DROP_LIVES || lives >= LIVES_START) return;
  if (powerups.some(p => p.type.key === 'LIFE')) return;
  if (Math.random() >= LIFE_DROP_CHANCE) return;
  powerups.push(new PowerUp(x, y, POWERUP_TYPES.LIFE));
}

function detonateNova() {
  for (const a of asteroids) {
    if (a.dead) continue;
    a.dead = true;
    if (a instanceof BossAsteroid) {
      score += BOSS_POINTS;
      explode(a.x, a.y, 30);
    } else {
      score += POINTS[a.size];   // sin división: la nova los pulveriza
      explode(a.x, a.y, a.size * 5);
    }
  }
  asteroids = asteroids.filter(a => !a.dead);
  novaFlash = 0.25;
}

function activatePowerUp(type) {
  if (type.key === 'LIFE') { lives = Math.min(lives + 1, LIVES_START); return; }
  if (type.key === 'NOVA') { detonateNova(); return; }
  if (type.key === 'TRIPLE') tripleShotUsed = true;
  effects[type.key] = type.duration;   // recogerlo de nuevo refresca la duración
}

function updateEffects(dt) {
  for (const key of Object.keys(effects)) {
    effects[key] -= dt;
    if (effects[key] <= 0) delete effects[key];
  }
  if (novaFlash > 0) novaFlash -= dt;
}

function killEnemy() {
  if (!enemy) return;
  explode(enemy.x, enemy.y, 20);
  score += ENEMY_POINTS;
  enemy = null;
  // Si quedan naves por entrar, el jugador tiene unos segundos de respiro.
  if (enemiesPending > 0) enemyRespawnTimer = ENEMY_RESPAWN_DELAY;
}

// Impacto sobre la nave: el escudo lo absorbe, si no el jugador pierde una vida.
// Devuelve true si la nave murió.
function shipTakesHit() {
  if (effects.SHIELD > 0) {
    delete effects.SHIELD;
    ship.invincible = 1;
    return false;
  }
  killShip();
  return true;
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  powerups = [];
  effects  = {};
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Pausa ─────────────────────────────────────────────────────────────────────
const pauseButton = document.getElementById('btn-pause');

function setPaused(value) {
  paused = value;
  if (pauseButton) pauseButton.textContent = paused ? '▶ REANUDAR' : '❘❘ PAUSA';
}

function togglePause() {
  if (state === 'gameover') return;   // no tiene sentido pausar la pantalla final
  setPaused(!paused);
}

if (pauseButton) {
  pauseButton.addEventListener('click', () => {
    togglePause();
    pauseButton.blur();   // si conserva el foco, Espacio volvería a pulsar el botón
  });
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (novaFlash > 0 && state !== 'playing') novaFlash -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (enemy) enemy.update(dt, ship);   // sigue maniobrando, pero no dispara a una nave muerta
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  updateEffects(dt);
  const timeScale = effects.SLOW > 0 ? 0.5 : 1;   // Slow motion: solo asteroides

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot(effects.TRIPLE > 0));
  }

  ship.update(dt, { hyper: effects.HYPER > 0 });

  // El enemigo usa dt normal: el slow-motion solo afecta a los asteroides
  if (enemy) {
    const shot = enemy.update(dt, ship);
    if (shot) bullets.push(shot);
  } else if (enemiesPending > 0) {
    enemyRespawnTimer -= dt;
    if (enemyRespawnTimer <= 0) spawnNextEnemy();
  }

  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt * timeScale));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    if (b.owner !== 'player') continue;   // las balas enemigas no rompen asteroides
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;

        // Manejar boss asteroid con salud
        if (a instanceof BossAsteroid) {
          a.takeDamage();
          explode(a.x, a.y, 10);
          if (a.dead) {
            score += BOSS_POINTS;
            explode(a.x, a.y, 30);
            maybeDropPowerUp(a.x, a.y, 1);   // el boss siempre suelta un power-up
            maybeDropLife(a.x, a.y);
          }
        } else {
          // Asteroide regular
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          maybeDropPowerUp(a.x, a.y, POWERUP_CHANCE);
          maybeDropLife(a.x, a.y);
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala del jugador vs nave enemiga
  if (enemy) {
    for (const b of bullets) {
      if (b.owner === 'player' && !b.dead && dist(b, enemy) < enemy.radius) {
        b.dead = true;
        killEnemy();
        break;
      }
    }
    bullets = bullets.filter(b => !b.dead);
  }

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      activatePowerUp(p.type);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      const radiusFactor = (a instanceof BossAsteroid) ? 1.0 : 0.82;
      if (dist(ship, a) < ship.radius + a.radius * radiusFactor) {
        if (effects.SHIELD > 0) {
          // El escudo absorbe un impacto y pulveriza el asteroide (sin puntos)
          delete effects.SHIELD;
          ship.invincible = 1;
          explode(a.x, a.y, 12);
          if (a instanceof BossAsteroid) a.takeDamage();
          else a.dead = true;
        } else {
          killShip();
        }
        break;
      }
    }
    asteroids = asteroids.filter(a => !a.dead);
  }

  // Bala enemiga vs nave, y choque directo contra la nave enemiga
  if (state === 'playing' && ship.invincible <= 0) {
    for (const b of bullets) {
      if (b.owner === 'enemy' && !b.dead && dist(b, ship) < ship.radius) {
        b.dead = true;
        explode(ship.x, ship.y, 8);
        shipTakesHit();
        break;
      }
    }
    bullets = bullets.filter(b => !b.dead);

    if (enemy && state === 'playing' && dist(ship, enemy) < ship.radius + enemy.radius) {
      killEnemy();          // el choque destruye siempre a la nave enemiga
      shipTakesHit();
    }
  }

  // Nivel completado: hay que derribar toda la oleada enemiga, incluidas las naves
  // que todavía no han entrado en pantalla.
  // El chequeo de estado evita avanzar de nivel en el mismo frame en el que
  // la nave acaba de morir (killShip() ya cambió el estado a 'dead'/'gameover').
  if (state === 'playing' && asteroids.length === 0 && !enemy && enemiesPending === 0)
    nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y, color = '#fff') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  drawEnemyCounter();
  drawPowerUpTimers();
}

// Naves enemigas que faltan por derribar en el nivel, bajo el contador de vidas.
// Sin esto, con una segunda nave aún sin entrar el jugador se queda dando vueltas
// en un campo vacío sin saber por qué no avanza el nivel.
function drawEnemyCounter() {
  const remaining = (enemy ? 1 : 0) + enemiesPending;
  if (remaining === 0) return;

  for (let i = 0; i < remaining; i++)
    drawLifeIcon(W - 16 - i * 22, 44, '#ff5a5a');
}

// Cronómetro de power-ups activos (esquina inferior izquierda)
function drawPowerUpTimers() {
  const active = POWERUP_ORDER.filter(k => effects[k] > 0);
  const ROW_H  = 26;
  let y = H - 16 - (active.length - 1) * ROW_H;

  for (const key of active) {
    const type      = POWERUP_TYPES[key];
    const remaining = effects[key];
    const ratio     = Math.max(0, Math.min(1, remaining / type.duration));

    // Parpadeo en el último segundo y medio
    if (!(remaining < 1.5 && Math.floor(remaining * 8) % 2 === 0)) {
      ctx.save();
      ctx.strokeStyle = type.color;
      ctx.fillStyle   = type.color;
      ctx.lineWidth   = 1.5;

      // Icono: el mismo polígono del ítem recogible
      ctx.save();
      ctx.translate(24, y);
      polygonPath(type.sides, 8);
      ctx.stroke();
      ctx.restore();

      // Reloj: arco que se vacía a medida que expira el efecto
      ctx.beginPath();
      ctx.arc(48, y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();

      ctx.font = '13px monospace';
      ctx.textAlign   = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${type.label}  ${remaining.toFixed(1)}s`, 64, y + 1);
      ctx.restore();
    }

    y += ROW_H;
  }

  if (tripleShotUsed) {
    ctx.save();
    ctx.fillStyle = 'rgba(125,255,107,0.35)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('TRIPLE USADO', W - 14, H - 14);
    ctx.restore();
  }

  ctx.textBaseline = 'alphabetic';
}

// Círculo de energía pulsante mientras el escudo está activo
function drawShieldAura() {
  if (!(effects.SHIELD > 0) || ship.dead) return;
  const pulse = 0.55 + 0.35 * Math.sin(effects.SHIELD * 9);
  ctx.save();
  ctx.strokeStyle = `rgba(77,226,255,${pulse.toFixed(2)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  if (enemy) enemy.draw();
  ship.draw();
  drawShieldAura();

  if (novaFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(novaFlash / 0.25 * 0.5).toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawHUD();

  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    drawOverlay('PAUSA', 'P O EL BOTÓN PARA CONTINUAR');
  }

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ═══ DEBUG CONTROLS — testing only, remove this whole block before release ════
// También hay que quitar el <span id="debug-controls"> de index.html y su regla CSS.
// Poniendo DEBUG_CONTROLS en false el botón se oculta y la tecla N queda inerte.
const DEBUG_CONTROLS = true;

function skipLevel() {
  if (state !== 'playing') return;
  if (paused) setPaused(false);
  asteroids = [];
  resetEnemyWave(0);   // nextLevel() vuelve a armar la oleada del nivel siguiente
  nextLevel();
}

const skipButton = document.getElementById('btn-skip');
if (DEBUG_CONTROLS) {
  if (skipButton) {
    skipButton.addEventListener('click', () => {
      skipLevel();
      skipButton.blur();
    });
  }
} else {
  const debugBox = document.getElementById('debug-controls');
  if (debugBox) debugBox.style.display = 'none';
}
// ═══ END DEBUG CONTROLS ═══════════════════════════════════════════════════════

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  // La pausa se lee aquí, no en update(): estando en pausa update() no se ejecuta
  if (pressed('KeyP')) togglePause();
  if (DEBUG_CONTROLS && pressed('KeyN')) skipLevel();

  if (!paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
