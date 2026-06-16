import { ctx } from "../canvas.js";
import { W, H } from "../constants.js";
import { rand } from "../utils.js";

export class PowerUp {
  constructor(
    type = (() => {
      const r = Math.random();
      if (r < 0.15) return "novaBomb";
      if (r < 0.3) return "hyperDrive";
      if (r < 0.65) return "tripleShot";
      return "slowmo";
    })(),
  ) {
    this.type = type;
    this.color =
      type === "tripleShot"
        ? "#fa0"
        : type === "slowmo"
          ? "#0ef"
          : type === "hyperDrive"
            ? "#0f8"
            : "#f0f";
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

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.stroke();

    if (this.type === "tripleShot") {
      const offsets = [-0.45, 0, 0.45];
      for (const o of offsets) {
        const bx = Math.cos(o) * 7;
        const by = Math.sin(o) * 7;
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    } else if (this.type === "slowmo") {
      // Dos barras verticales (símbolo pausa)
      ctx.fillStyle = this.color;
      ctx.fillRect(-5, -6, 3, 12);
      ctx.fillRect(2, -6, 3, 12);
    } else if (this.type === "hyperDrive") {
      // Rayo: flecha hacia la derecha
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(5, 0);
      ctx.moveTo(2, -4);
      ctx.lineTo(7, 0);
      ctx.lineTo(2, 4);
      ctx.stroke();
    } else {
      // Nova bomb: starburst 8 líneas
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
