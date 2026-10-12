# Arcade Vault — Matriz de skins

> Mantenido por el agente `skin-designer`. Última actualización: 2026-10-12
> Skins obligatorias: `clasico` (default) · `neon` · `retro`, cada una en `dark` y `light`.

## Infraestructura

- [x] Contrato `SkinId`/`ColorMode`, selector en el reproductor y modo claro/oscuro — 2026-10-12

Piezas:

- `lib/games/types.ts`: `SkinId`, `ColorMode`, `Appearance`, `Palettes<P>`. La fábrica recibe `appearance` como tercer argumento y el motor expone `setAppearance(appearance)`, que cambia la paleta y repinta a mano si el bucle está parado (pausa o fin). El resto del contrato no cambia.
- `lib/games/appearance.ts`: catálogo de skins (`SKINS`, `DEFAULT_SKIN = "clasico"`) y clave `localStorage['av_skin_<id>']` por juego.
- `components/player/skin-picker.tsx`: grupo de radios CLÁSICO · NEÓN · RETRO junto a PAUSA/FIN/SALIR. No escucha teclas; `onMouseDown` evita que el foco se quede en el botón y el espacio del juego lo vuelva a pulsar.
- `components/player/game-player.tsx`: lee la skin guardada solo en `useEffect`; el motor se monta cuando se conocen skin y modo, y los cambios le llegan por `setAppearance` sin remontar.
- `components/theme-toggle.tsx`: `useColorMode()` (lee `data-theme` de `<html>` y lo observa) y el conmutador NOCHE/DÍA de la nav (`localStorage['av_theme']`).
- `app/layout.tsx`: script en línea antes del primer pintado (guía `preventing-flash-before-hydration` de Next 16): preferencia guardada o, si no hay, `prefers-color-scheme`. `<html data-theme="dark" suppressHydrationWarning>`.
- `app/globals.css`: tokens bajo `:root[data-theme="light"]` y ajustes de `.av-bg`, `.av-noise`, `.neon-*`, `.crt*` en claro.

Tokens del modo claro (todos los acentos medidos sobre `--bg #eef0f7`, `--bg-2 #e4e7f1` y `--bg-3 #d9ddea`; el peor de cada uno):

| Token         | Claro     | Peor ratio   |
| ------------- | --------- | ------------ |
| `--ink`       | `#11131f` | 13,62 (bg-3) |
| `--ink-dim`   | `#454a6b` | 6,33 (bg-3)  |
| `--ink-faint` | `#585d80` | 4,70 (bg-3)  |
| `--cyan`      | `#00666f` | 4,95 (bg-3)  |
| `--magenta`   | `#bc0057` | 4,73 (bg-3)  |
| `--yellow`    | `#615d00` | 5,04 (bg-3)  |
| `--green`     | `#00703d` | 4,57 (bg-3)  |
| `--gold`      | `#7a5700` | 4,85 (bg-3)  |
| `--silver`    | `#4f586b` | 5,26 (bg-3)  |
| `--bronze`    | `#9a4a16` | 4,60 (bg-3)  |

## Matriz

| Juego (`id`)    | Motor        | clasico dark | clasico light | neon dark | neon light | retro dark | retro light | Revisado   |
| --------------- | ------------ | ------------ | ------------- | --------- | ---------- | ---------- | ----------- | ---------- |
| `rocas`         | `asteroides` | ✅           | ✅            | ✅        | ✅         | ✅         | ✅          | 2026-10-12 |
| `caida`         | `piezas`     | ✅           | ✅            | ✅        | ✅         | ✅         | ✅          | 2026-10-12 |
| `bloque-buster` | `ladrillos`  | ✅           | ✅            | ✅        | ✅         | ✅         | ✅          | 2026-10-12 |
| `serpentina`    | `serpiente`  | ✅           | ✅            | ✅        | ✅         | ✅         | ✅          | 2026-10-12 |
| `ranaria`       | `rana`       | ✅           | ✅            | ✅        | ✅         | ✅         | ✅          | 2026-10-12 |

Segunda ejecución (2026-10-12): la rama se rebasó sobre `main` con RANARIA ya en `registry.ts`. Los cuatro primeros juegos y la infraestructura se recomprobaron sobre esa base (`tsc`, `lint` y `build` limpios) sin cambios; `ranaria` se añadió.

Umbrales: objetos ≥ 3:1 sobre el fondo del tablero; texto del canvas ≥ 4,5:1; pares que el juego distingue ≥ 1,5:1 o distinguidos además por forma. Medido con `node -e` (luminancia relativa WCAG 2.x) importando el `constants.ts` real de cada motor. Los alfas del original van ya mezclados en hex; los velos (`overlay`, `highlight`) van en hex de 8 cifras.

## Decisiones comunes

- **Fondos oscuros**: `#0a0a0f` (`--bg`) en todas las skins salvo `clasico` de CAÍDA (`#1a1a25`, el `--canvas-bg` de su original) y `retro`, que tiñe el negro hacia su fósforo (`#050c07`, `#0b130b`, `#0f0a04`, `#0d140f`, `#0b0d14`).
- **Fondos claros**: `neon` usa el `--bg` claro del Vault (`#eef0f7`); `clasico` un blanco de papel (`#f4f5f7`) o el tema claro del original si lo tiene; `retro` el papel o el cristal LCD de su fósforo.
- **Glow**: solo `neon.dark` usa `shadowBlur` (SERPENTINA, RANARIA). `neon.light` lo apaga (sobre papel se lee como borrón), `clasico` y `retro` son planos. En la app clara, `.neon-*` cambia el halo por una sombra de 1 px.
- **`--ink-faint` como rótulo del canvas** (`#4a4f70`, 2,49:1) no llegaba a 4,5:1 en `neon.dark` de CAÍDA, BLOQUE BUSTER, SERPENTINA y RANARIA: pasa a `--ink-dim` `#8a8fb5`. Es el único cambio repetido sobre la paleta actual.
- **Contrastes de pares por debajo de 1,5:1** que no son información de juego (pelota frente a paleta, colores de bloque entre sí, cabeza frente a cuerpo) se aceptan porque los separa la forma; están listados en cada juego.
- **Partículas**: el alfa variable pasa a `globalAlpha`; la paleta guarda el color en hex.

## Decisiones por juego

### rocas

- `clasico`: el vectorial blanco de `02-asteroids/game.js`: todo `#fff`, power-up `#0ff`, propulsor `rgba(255,130,0,.85)` mezclado → `#da7002`, subtítulo blanco al 65 % → `#a9a9ab`. En claro, tinta `#111111` sobre `#f4f5f7`.
- `neon`: `neon.dark` es la `PALETTE` de SPEC 05 sin cambios. Nueva clave `hudDim` (= `rock`, como antes) y `particle` (= `--ink`).
- `retro`: fósforo verde P1, tres luminancias. Nave y balas al máximo, rocas un escalón por debajo; el power-up se reconoce por su rombo y su «3x».
- Pares por forma: nave/rocas y balas/rocas en `clasico` (todo blanco, 1:1, como el original) y en `neon.light` (1,26–1,28): triángulo, punto y polígono irregular.
- Peores: clasico.dark thrust 5,93 · texto hudDim 8,42 — clasico.light powerUp 5,22 — neon.dark thrust 5,15 — neon.light thrust 5,63 — retro.dark rock 5,82 — retro.light rock 5,46.

### caida

- `clasico`: `PIECE_COLORS` de `03-tetris/game.js` y los dos temas de su `style.css`. En oscuro, el `--label` original `#555570` (2,4:1) se aclara a `#8a8aa8` (5,16). En claro, los pasteles no llegan a 3:1 sobre `#e4e4f0` y se oscurecen en su tono (I `#00838f`, O `#8d6e00`, T `#8e24aa`, S `#2e7d32`, Z `#c62828`, J `#1565c0`, L `#b85600`, N `#616161`).
- `neon`: **cambios medidos sobre la paleta actual**: Z `#8c003c` → `#bd0052` (2,05 → 3,09; sigue a 1,67 de la T) y `hudLabel` → `--ink-dim`. La rejilla `--line` al 18 % queda mezclada en `#08343a`.
- `retro`: LCD de Game Boy, fondo + dos tonos (`#9bbc0f`/`#5f8a2a` en oscuro, `#0f380f`/`#306230` sobre `#c7d4a0` en claro), sin brillo. Las ocho piezas se distinguen por **tono × marca** (`marks`: liso, agujero, hueco, hueco con punto), como el tetris de Game Boy: ninguna repite las dos cosas.
- Pares de piezas por debajo de 1,5:1 en `clasico` y `neon` (p. ej. I/O 1,24 en neon.dark): se distinguen por tono y, sobre todo, por la forma de la pieza. La pieza fantasma (alfa 0,2) es una ayuda, no un objeto: no se mide.
- Peores: clasico.dark T 4,84 · rótulo 5,16 — clasico.light I 3,59 · rótulo 4,53 — neon.dark Z 3,09 — neon.light S 4,41 — retro.dark tono 2 4,64 — retro.light tono 2 4,58 · rótulo 4,58.

### bloque-buster

- `clasico`: colores muestreados con `sharp` del `spritesheet-breakout.png`. Los nombres del original no son lo que pinta su hoja (`green` es azul `#44aaf3`, `magenta` violeta `#632ff4`, `hotpink` naranja `#fc7d1c`); manda lo que se veía. Paleta plateada `#babac5`, pelota `#f6f2f2`, «GAME OVER» en el rojo de los remates de la paleta `#ff4545`.
- `neon`: **cambios medidos**: `red` `#8c003c` → `#bd0052` (2,05 → 3,09) y `hudLabel` → `--ink-dim`.
- `retro`: fósforo ámbar P3 en tres luminancias; paleta y pelota al máximo para no perderse entre bloques.
- Pares por forma: pelota/paleta (1,02–1,24 en neon, 1 en retro: cuadrado de 16 frente a barra de 81). Los colores de bloque no llevan información (todos valen 10 y caen de un golpe).
- Peores: clasico.dark violeta 3,05 — clasico.light teal 4,65 · texto win 4,65 — neon.dark red 3,09 — neon.light hotpink 4,03 — retro.dark tono bajo 3,87 — retro.light tono bajo 3,62.

### serpentina

- `clasico`: no hay original en `references/`; convención del snake de siempre: serpiente verde, manzana roja (`#e53935`), rara dorada (`#fdd835`), sin halo.
- `neon`: **cambios medidos**: `frame` (la pared que mata) `--green` al 35 % → 45 % (`#067845`, 2,41 → 3,32 sobre el tablero) y `hudLabel` → `--ink-dim`. `boardFill`, `frame` y `grid` quedan mezclados en hex. `neon.light` baja la común a magenta hondo `#8a0040` para separarla 1,71:1 de la rara `#6e6900`.
- `retro`: LCD de móvil de los 2000 en tres luminancias. Invariante «el color dice el valor»: común un escalón por debajo de la rara (2,15 en oscuro, 2,53 en claro), y la rara conserva su anillo de caducidad.
- `fruit`/`fruitRare` ≥ 1,5:1 en las seis paletas (peor: neon.light 1,71).
- Pares por forma: cabeza/cuerpo (los ojos) y cuerpo/cola (el degradado solo marca dónde acaba).
- Peores: clasico.dark cola 3,85 · gameOver 4,67 — clasico.light rara 3,90 · win 4,70 — neon.dark marco 3,32 — neon.light marco 3,43 — retro.dark 7,00 — retro.light común y marco 3,85.

### ranaria

- Contrato: `createRanaEngine(canvas, hooks, appearance)` y `setAppearance`, igual que los otros cuatro. Ningún cambio en `frog.ts` ni `lanes.ts` (lógica).
- `clasico`: no hay frogger en `references/`; convención del Frogger de 1981: río azul marino `#000047`, aceras moradas, troncos marrones, tortugas rojas, rana verde. El cocodrilo y el tractor del original eran verdes: por «verde solo la rana y su destino», lomo gris y cabeza en el rosa de lo que mata (`#ff3cb4`). Orilla en verde muy oscuro: es el destino.
- `neon`: `neon.dark` es la `PALETTE` de SPEC 2/3 y 3/3; los `rgba()` pasan a hex de ocho cifras (mismo compuesto). **Cambios medidos**: `frame` `--line` (cian al 18 %, 1,47) → cian al 42 % `#066d74` (3,24: es el borde que mata al ser arrastrado); `hudLabel` → `--ink-dim` (2,49 → 6,28). Claves nuevas: `wheel` (= `--bg`), `headlight` (= `--ink`), `timeTrack` (era el `rgba(INK_RGB, 0.06)` suelto de `draw.ts`; `INK_RGB` desaparece), `flyEdge`, `warnAlpha`, `glow`.
- Cambios de dibujo (todas las skins, sin tocar lógica): nenúfar ocupado al 30 % de alfa (era 50 %; la rana cian encima daba 2,71 → 4,53); la mosca lleva contorno de 2 px en `flyEdge` (amarillo sobre nenúfar verde daba 1,76; con el contorno `--bg` queda en 10,24); tortugas en aviso a `warnAlpha` (0,5 en neon.dark como el spec; 0,65–0,9 en el resto, donde media alfa no llegaba a 3:1 sobre el agua); halo de la rana y de la rana a salvo solo con `glow` (neon.dark).
- `neon.light`: acentos claros del Vault; rana un punto más honda (`#00562f`) y troncos/lomo más claros para separarse ≥ 1,5 de ella; cabeza del cocodrilo `#8a0040` (1,99 frente al lomo); la mosca conserva `--yellow` vivo sobre el nenúfar oscuro.
- `retro`: LCD de cuatro tonos en gris azulado (no verde, para no robarle el papel a la rana, ni el ámbar de BLOQUE BUSTER). Invariantes adaptados: **el tono extremo es solo de la rana y los nenúfares**; coches y plataformas un escalón por debajo (rana frente a plataforma 2,18 / 1,81); **lo que mata** (cabeza del cocodrilo) un escalón por debajo de su lomo (1,82 / 1,67) además de ojo y mandíbula; la mosca va en tono bajo con contorno sobre el nenúfar.
- Medidos además: tortugas en aviso ya mezcladas sobre el agua (≥ 3 en las seis), anillo bajo el agua al 30 % como pista (≥ 1,5: 1,53–2,30), marcadores de muerte sobre carretera, aceras, agua y bahía (≥ 3), rana a salvo sobre nenúfar ocupado (≥ 3).
- Pares por forma en `neon.dark` (paleta actual, no se cambia): rana/tortuga 1,10 (verde frente a oro, ojos, patas y halo) y cabeza/lomo del cocodrilo 1,22 (magenta frente a gris, ojo y mandíbula). En las otras cinco, ≥ 1,5.
- Peores: clasico.dark tortuga en aviso 3,43 · texto 6,17 — clasico.light tortuga en aviso 3,04 · banner 5,56 — neon.dark marco 3,24 · timeWarn 5,15 — neon.light nenúfar 3,05 · timeWarn 5,63 — retro.dark tortuga en aviso 3,88 · rótulo 7,97 — retro.light tortuga en aviso 3,66 · rótulo 7,07.

## Pendiente para el humano

- Probar a mano en el navegador: las seis paletas de los cinco juegos, el cambio de skin en caliente (también en pausa y con el cartel final) y el conmutador NOCHE/DÍA con el reproductor abierto. No se ha visto ninguna paleta renderizada: solo se midieron.
- RANARIA en el navegador: rana sobre tortugas en neon.dark (par 1,10, separadas solo por tono y forma), tortugas en aviso con el `warnAlpha` subido, mosca con contorno y nenúfar ocupado al 30 %. Revertir `warnAlpha` o el 30 % solo si se acepta perder el 3:1.
- App en oscuro: `--ink-faint` `#4a4f70` da 2,49:1 sobre `--bg` y se usa en rótulos HTML (HUD del reproductor, `.crt-bottom`). No se tocó (los tokens oscuros de la app no son de esta tarea).
- El modo claro solo redefine tokens y los efectos de fondo/CRT/nav. Los componentes con colores neón fijos en `rgba(...)` (sombras de botones, portadas `.cover-*`, siluetas del hero) siguen igual y conviene revisarlos con la app en claro.
- El hook de formato quitó las líneas en blanco de `app/globals.css` al editarlo: el diff de ese fichero es más grande de lo que cambió.
