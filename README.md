# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

# Instrucciones

## Objetivo

Sobrevive el mayor número de niveles eliminando todos los asteroides del campo. Cada asteroide destruido suma puntos y, al limpiar el campo, se avanza al siguiente nivel.

## Cómo se juega ???

1. Usa las flechas para mover la nave: `←`/`→` rotan y `↑` propulsa (con inercia).
2. Pulsa `Espacio` para disparar; las balas salen del morro de la nave y tienen cadencia propia.
3. El espacio es **toroidal** (envolvente): si sales por un borde, reapareces por el opuesto. Úsalo para escapar o atacar desde el otro lado.

## Mecánica de asteroides

Al destruir un asteroide grande, se parte en **dos medianos**; al destruir un mediano, en **dos pequeños**. El puntaje aumenta conforme son más pequeños:

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

La división aumenta la cantidad de objetos en pantalla, así que planifica qué asteroide golpear primero.

## Vidas y niveles

- Dispones de **3 vidas**. Al chocar con un asteroide pierdes una y la nave reaparece con **3 segundos de invencibilidad** (parpadea).
- Primer nivel con 4 asteroides. Cada nivel siguiente genera `3 + nivel` asteroides, aumentando la dificultad.

## Fin de partida y reinicio

- Al perder las 3 vidas aparece **GAME OVER** con tu puntaje final.
- Pulsa `Espacio` para reiniciar la partida desde cero.

## Consejos

- Deja asteroides pequeños fuera de tu trayectoria: al dividirlos generan más objetos que dificultan el esquivado.
- Mantén siempre un borde libre hacia donde escapar mientras recargas el disparo.
- Los asteroides medianos y pequeños son los de mayor puntaje; priorízalos cuando el campo esté despejado.

## Demo:

[Asteroids demo](https://klerith.github.io/claude-asteroids/)

## Descripción del juego

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz...

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
