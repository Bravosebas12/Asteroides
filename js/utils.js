export const wrap = (v, max) => ((v % max) + max) % max;
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
