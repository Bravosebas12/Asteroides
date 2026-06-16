export const keys = {};
const justPressed = {};

window.addEventListener("keydown", (e) => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (
    [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyS",
    ].includes(e.code)
  )
    e.preventDefault();
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

export function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}
