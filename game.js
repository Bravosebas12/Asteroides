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

// Cargar imagen del asteroid boss
const bossAsteroidImage = new Image();
bossAsteroidImage.src = 'asteroid-boss.png';

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
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
      ctx.drawImage(bossAsteroidImage, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
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
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
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
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
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
};
const POWERUP_ORDER   = ['SHIELD', 'TRIPLE', 'SLOW', 'NOVA', 'HYPER'];
const POWERUP_TTL     = 9;      // segundos que el ítem permanece en pantalla
const POWERUP_CHANCE  = 0.18;   // probabilidad de drop al destruir un asteroide
const POWERUP_MAX     = 2;      // ítems simultáneos en pantalla

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
let effects;          // { SHIELD: segundos restantes, ... }
let tripleShotUsed;   // TRIPLE solo puede aparecer una vez por partida
let novaFlash;        // temporizador del destello de la Bomba Nova
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

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
  effects        = {};
  tripleShotUsed = false;
  novaFlash      = 0;
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];   // los efectos activos se mantienen entre niveles
  ship.reset();
  spawnAsteroids(3 + level);
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
          }
        } else {
          // Asteroide regular
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          maybeDropPowerUp(a.x, a.y, POWERUP_CHANCE);
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

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

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
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

  drawPowerUpTimers();
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
  ship.draw();
  drawShieldAura();

  if (novaFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(novaFlash / 0.25 * 0.5).toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
