import { ctx } from "./canvas.js";
import { W, H } from "./constants.js";
import { gs } from "./state.js";

function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "15px monospace";

  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${gs.score}`, 14, 26);

  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${gs.level}`, W / 2, 26);

  for (let i = 0; i < gs.lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
}

function drawOverlay(title, sub) {
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 46px monospace";
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font = "18px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

export function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  gs.particles.forEach((p) => p.draw());
  gs.asteroids.forEach((a) => a.draw());
  gs.bullets.forEach((b) => b.draw());
  gs.powerups.forEach((pu) => pu.draw());
  gs.ship.draw();

  drawHUD();

  if (gs.status === "gameover")
    drawOverlay(
      "GAME OVER",
      `PUNTAJE: ${gs.score}   —   ESPACIO PARA REINICIAR`,
    );
}
