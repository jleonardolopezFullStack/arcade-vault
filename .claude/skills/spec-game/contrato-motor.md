# El contrato de motores, el checklist de porte y sus huecos

Lo lee `/spec-game` en la Fase 2, antes de la ronda D. **No es texto para copiar al spec**: es lo que necesitas saber para formular las preguntas correctas y para redactar bien el apartado del motor.

---

## 1. El contrato, tal como está hoy

`lib/games/types.ts`, íntegro. Es todo lo que el reproductor conoce de un juego:

```ts
/** Lo que el motor publica hacia el HUD de React. */
export type GameSnapshot = {
  score: number;
  lives: number;
  level: number;
};

export type GameEngine = {
  /** Arranca el bucle y engancha el teclado. */
  start(): void;
  /** Congela el bucle sin perder la partida. */
  pause(): void;
  resume(): void;
  /** Vuelve a empezar de cero (lo llama el modal de game over). */
  restart(): void;
  /** Cancela el bucle, retira oyentes y libera el canvas. */
  destroy(): void;
};

export type GameEngineHooks = {
  /** Solo se invoca cuando alguno de los tres valores cambia. */
  onSnapshot(snapshot: GameSnapshot): void;
  /** Vidas agotadas. El reproductor abre el modal. */
  onGameOver(finalScore: number): void;
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
) => GameEngine;
```

Registrar un juego es **una línea** en `lib/games/registry.ts`:

```ts
const ENGINES: Record<string, GameEngineFactory> = {
  rocas: createAsteroidesEngine,
};
```

La clave es el `id` del catálogo. Un `id` ausente del mapa muestra «PRÓXIMAMENTE» en el reproductor, lo cual es un estado válido y deseado: los juegos sin motor deben verse, con su ficha y su ranking vacío.

`lib/games/input.ts` aporta la única regla compartida entre el motor y el reproductor:

```ts
export function isTypingTarget(target: EventTarget | null): boolean;
```

Devuelve `true` para `INPUT`, `TEXTAREA`, `SELECT` y `contentEditable`. Sin esa guarda, el modal de fin de partida no deja teclear un espacio —el motor lo captura— y la `P` pausaría mientras se escriben las iniciales.

---

## 2. La forma de una carpeta de motor

El precedente es `lib/games/asteroides/`, cuatro ficheros:

| Fichero        | Contenido                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `constants.ts` | `W`/`H`, las tablas de ajuste portadas sin cambiar un número, `PALETTE`, `INK_RGB`, `FONT_MONO`, `FONT_PIXEL` |
| `utils.ts`     | Utilidades puras del juego (`wrap`, `dist`, `rand`, `randInt`)                                                |
| `entities.ts`  | Las clases, cada una con `update(dt)`, `draw(ctx)` y una bandera `dead`; los arrays se filtran por `!dead`    |
| `index.ts`     | La fábrica `create<Concepto>Engine(canvas, hooks): GameEngine`, con **todo el estado dentro de la clausura**  |

**La carpeta se nombra por el concepto en español, no por el slug.** `asteroides` para el slug `rocas`, a propósito: la ficha del catálogo puede renombrarse sin tocar el motor.

### Invariantes que todo motor nuevo hereda

- **Mundo interno 800×600.** `W = 800`, `H = 600`. El escalado a pantalla lo hace el CSS; ninguna coordenada se recalcula. El canvas del reproductor es `width={800} height={600}` estirado al 100 % dentro de `.crt-screen`, que también es 4:3.
- **`dt` en segundos**, capado: `MAX_DT = 0.05`. Un salto de pestaña no debe teleportar nada. Si el original mide en milisegundos y sin tope —lo hace el tetris de referencia—, se convierte.
- **`lastTime = null` como centinela**, para que el primer fotograma tras `start()` o `resume()` avance 0.
- **Teclado por `e.code`**, no por `e.key`. Registros `keys` y `justPressed`, un `CAPTURED_KEYS` con `preventDefault()` para que las teclas de juego no hagan scroll, la guarda `isTypingTarget` en el `keydown`, y el `keyup` que **siempre** libera la tecla aunque el foco haya saltado a un campo —si no, se queda pegada—. Un `clearInput()` que vacía ambos registros se llama en `pause()`, `restart()` y `destroy()`.
- **`emitSnapshot()` deduplicado** contra el último emitido: solo se invoca el hook cuando algo cambia de verdad, y en el mismo fotograma en que cambia, nunca con un temporizador aparte. Así el HUD de React y el del canvas no se desfasan.
- **Oyentes enganchados una sola vez** —bandera `listening`— y retirados en `destroy()`. Guardas sobre una bandera `destroyed` en `start`, `restart` y `destroy`.
- **Importar el módulo no tiene efectos.** Ni `requestAnimationFrame` al cargar, ni `document.getElementById`, ni estado en variables de módulo: dos pantallas montadas a la vez no se pisan, y el doble montaje de React en modo estricto no arranca dos bucles. Es el fallo más probable de todo el porte.
- **Los dos HUD conviven.** El canvas conserva el suyo y además alimenta el de React por `onSnapshot`. La misma cifra aparece dos veces: es una decisión tomada en SPEC 05, no un descuido.
- **El fin de partida pasa por `hooks.onGameOver(score)`.** El overlay del canvas puede quedarse de fondo, pero **sin** su «pulsa espacio para reiniciar»: quien reinicia es el modal de la plataforma.
- **Repintado con la paleta del Vault**, con literales hex y el nombre del token en un comentario, porque `ctx` no entiende variables CSS y leerlas con `getComputedStyle` en cada fotograma sería caro:

```ts
export const PALETTE = {
  bg: "#0a0a0f", // --bg
  ship: "#00f5ff", // --cyan
  bullet: "#f5ff00", // --yellow
  rock: "#8a8fb5", // --ink-dim
  thrust: "#ff006e", // --magenta
  powerUp: "#ff006e", // --magenta
  hud: "#e6e9ff", // --ink
} as const;
```

---

## 3. Checklist de desglobalización

Los juegos de `references/` son HTML+JS sin empaquetador: **todo es global**. Portar es, sobre todo, quitar eso. Comprueba una por una:

- [ ] El `ctx` se pasa como argumento a `draw(ctx)`; no hay `ctx` de módulo.
- [ ] Las teclas pulsadas se pasan a `update(dt, keys)`; no hay `keys` global.
- [ ] Todo el estado de la partida vive en la clausura de la fábrica, no en `let` de módulo.
- [ ] Nada de `document.getElementById`, `document.querySelector` ni `document.body.classList`.
- [ ] Se borra el HUD en DOM del original y su `updateHUD()`; lo sustituye `emitSnapshot()`.
- [ ] Se borra su overlay propio y su botón de reinicio; los sustituyen el modal y `restart()`.
- [ ] Se borra su pausa propia; la de la plataforma es `P`.
- [ ] Se borra su `localStorage` (temas, récords, preferencias).
- [ ] Se borra el `requestAnimationFrame(loop)` del ámbito de módulo; arranca `start()`.
- [ ] Los oyentes se enganchan en `window`, no en `document`, y se retiran en `destroy()`.
- [ ] `e.key` se traduce a `e.code`.
- [ ] Los colores del original se sustituyen por `PALETTE`.

**`references/` no se edita nunca.** Se lee y se traduce hacia fuera. Que la carpeta quede sin cambios es un criterio de aceptación del spec.

---

## 4. Las dos teclas de la plataforma

`components/player/game-player.tsx` se queda con **`P`** (pausa/reanuda) y **`Escape`** (salir al detalle), ambas con `preventDefault()` y ambas tras la guarda `isTypingTarget`. Además expone los botones PAUSA / FIN / SALIR.

Esto choca de frente con dos referencias:

- el **tetris** liga `KeyP` a su propia pausa, que reutiliza su overlay;
- el **arkanoid** liga `Escape` a su propia pausa, y además usa `p`/`P` por `e.key`.

Las dos pierden esa tecla en el porte. Dilo como un hecho en la ronda D, y si la función hace falta, búscale otra tecla y anótalo en la tabla de decisiones.

---

## 5. Los huecos del contrato

El contrato se escribió para un juego —asteroides— y hay cuatro cosas que **no sabe expresar**. Cada una es una pregunta de la ronda D. La recomendación por defecto es siempre la que **no toca `lib/games/asteroides/`**.

### 5.1 Métricas más allá de `score`, `lives` y `level`

`GameSnapshot` son tres números fijos. Un tetris lleva **líneas** y **no tiene vidas**; un juego de tiempo lleva un cronómetro.

| Opción                                                                                                 | Coste                                                                              |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| ★ Ampliar `GameSnapshot` con campos **opcionales** (`lines?: number`) y que el HUD pinte lo que llegue | Aditivo: `asteroides` compila sin cambios. Toca el HUD compartido, que es cliente. |
| Dejar la métrica extra solo en el HUD del canvas                                                       | Cero cambios de contrato. El HUD de React miente por omisión.                      |
| Sustituir un hueco (`lives` → `lines`)                                                                 | Obliga a rotular el HUD por juego para los nueve. Desaconsejada.                   |

Si el juego no tiene vidas, `lives` puede emitirse como `0` y el HUD pintar «—», que es lo que ya hace cuando no hay partida.

### 5.2 Estado de victoria

El arkanoid tiene un estado `win` —se acaban los niveles— que `onGameOver` no distingue de morir.

| Opción                                                                          | Coste                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ★ Tratar la victoria como fin de partida: `onGameOver(score)` y el modal normal | Cero cambios. La marca se guarda igual, que es lo que importa al ranking. |
| Añadir `onWin?(finalScore)` al contrato y una pantalla de victoria              | Contrato más ancho y diseño nuevo en el reproductor.                      |
| Niveles infinitos: no hay victoria                                              | Cambia el contenido del juego; sale del porte 1:1.                        |

### 5.3 Assets y audio

`start()` es sincrónico: **no hay sitio para cargar nada**. El arkanoid arranca con `loadSpritesheet(cb)` y suena con `new Audio()` en el ámbito de módulo.

| Opción                                                                                   | Coste                                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ★ Sin binarios: todo se redibuja con primitivas de canvas y la paleta, como hizo SPEC 05 | Más trabajo de dibujo, cero infraestructura. Integra el juego con el resto.      |
| Assets copiados a `public/games/<slug>/` y `start()` admitiendo carga asíncrona          | Toca el contrato y el reproductor necesita un estado de carga que hoy no existe. |
| Audio sintetizado con WebAudio, sin ficheros                                             | Ningún motor tiene sonido hoy; no hay concepto de silencio ni de volumen.        |

Si entra audio en cualquier forma, pregunta obligatoriamente si arranca **silenciado** y quién expone el conmutador: el reproductor no tiene ninguno.

### 5.4 Entrada por ratón

El arkanoid mueve la paleta con `mousemove` sobre el canvas, corrigiendo con `getBoundingClientRect()`. **Eso es imprescindible aquí**, porque la plataforma escala el canvas por CSS: un `offsetX` crudo estaría desplazado en cualquier ancho que no sea 800.

| Opción                                    | Coste                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| ★ Solo teclado, por `e.code`              | Coherente con el único motor existente y con el aviso «REQUIERE TECLADO».  |
| Teclado + ratón, con corrección de escala | El ratón es un extra; el aviso táctil sigue teniendo sentido.              |
| El ratón es obligatorio para jugar        | Hay que reescribir el aviso «REQUIERE TECLADO», que dejaría de ser cierto. |

El puntero táctil se rechaza de entrada: `matchMedia("(pointer: coarse)")` se comprueba **después de montar**, nunca durante el render del servidor, y muestra el aviso en lugar de arrancar el motor. Los controles táctiles son diseño nuevo y merecen su propio spec.

---

## 6. Criterios de aceptación que el motor impone siempre

Estos salen en todo spec de motor, redactados para el juego concreto:

- El HUD de React cambia a la vez que el del canvas, sin desfase perceptible.
- `P` pausa y reanuda; `Escape` y SALIR llevan al detalle; FIN abre el modal.
- El motor no reclama `P` ni `Escape`.
- Las teclas del juego no hacen scroll de la página, y escribir en un campo no mueve el juego.
- Al salir de la ruta no queda bucle ni oyentes vivos, y el doble montaje en modo estricto no arranca dos bucles.
- El canvas mantiene 4:3 a cualquier ancho y no desborda el marco CRT en móvil.
- Con puntero táctil aparece «REQUIERE TECLADO» y el motor no arranca.
- `getEngineFactory('<slug>')` devuelve la fábrica; los juegos sin motor siguen mostrando «PRÓXIMAMENTE».
- El juego se pinta con la paleta del Vault, no con los colores del original.
- `references/<carpeta>/` no tiene ningún cambio.
- Si se amplió `GameSnapshot`, los campos nuevos son opcionales y `lib/games/asteroides/` está intacto.
- `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.
