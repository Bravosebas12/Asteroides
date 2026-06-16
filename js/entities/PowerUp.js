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
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    const sides =
      this.type === "tripleShot"
        ? 3
        : this.type === "slowmo"
          ? 6
          : this.type === "hyperDrive"
            ? 4
            : 8;
    const r = 11;

    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      i === 0
        ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
        : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}
