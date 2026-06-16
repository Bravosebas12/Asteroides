import { ctx } from "../canvas.js";
import { W, H } from "../constants.js";
import { rand } from "../utils.js";

export class PowerUp {
  constructor() {
    this.x = rand(60, W - 60);
    this.y = rand(60, H - 60);
    this.radius = 14;
    this.rot = 0;
    this.ttl = 12;
    this.dead = false;
  }

  update(dt) {
    this.rot += dt * 1.8;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.min(1, this.ttl * 0.8);
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.006);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = alpha * pulse;

    // Círculo exterior
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#fa0";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#fa0";
    ctx.stroke();

    // 3 puntos en abanico
    const offsets = [-0.45, 0, 0.45];
    for (const o of offsets) {
      const bx = Math.cos(o) * 7;
      const by = Math.sin(o) * 7;
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fa0";
      ctx.fill();
    }

    ctx.restore();
  }
}
