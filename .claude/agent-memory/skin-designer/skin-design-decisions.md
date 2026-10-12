---
name: skin-design-decisions
description: Decisiones de diseño de skins repetidas entre juegos de Arcade Vault (retro por juego, glow, rótulos, mezcla de alfas, cómo medir)
metadata:
  type: project
---

Ejecuciones 2026-10-12 en rama `skins-juegos` (la 2.ª, tras rebasar sobre `main`, añadió ranaria). Estado completo en specs/skins/README.md.

- Retro por juego, para que no se repitan: rocas fósforo verde, caida LCD Game Boy (tono × marca `marks`), bloque-buster ámbar, serpentina LCD móvil 3 tonos, ranaria LCD 4 tonos gris azulado (no verde: el verde es de la rana).
- Solo `neon.dark` lleva `shadowBlur` (flag `glow` en la paleta); `neon.light` lo apaga (borrón sobre papel).
- `--ink-faint` como rótulo de canvas (2,49:1) → `--ink-dim` en neon.dark: cambio repetido a la paleta actual. Marcos/bordes que matan suben hasta ≥3:1 (serpentina, ranaria).
- Alfas del original: a hex (mezclado) o hex de 8 cifras si se componen sobre varias franjas; partículas con `globalAlpha`.
- Si un alfa del dibujo impide 3:1 (tortugas en aviso), se mueve a la paleta (`warnAlpha`) y neon.dark conserva el valor del spec.
- Objeto pequeño sobre fondo de luminancia parecida (mosca sobre nenúfar): contorno en color de paleta (`flyEdge`) antes que cambiar el color de neon.dark.
- Pares <1,5 aceptados por forma solo en la paleta actual (neon.dark); en las paletas que diseño, ≥1,5.

**Why:** el humano aún no ha revisado nada; son elecciones del agente, no preferencias confirmadas.
**How to apply:** mantenerlas en juegos nuevos salvo que la matriz o el humano digan lo contrario. Medir importando el `constants.ts` real con `node --no-warnings` + `import('file:///…/constants.ts')` (Node 22.19 quita tipos); los constants solo pueden tener `import type`. Scripts largos de edición: a fichero en el scratchpad (no `node -e` con backticks en bash). Algunos ficheros del repo vienen con CRLF: normalizar antes de reemplazar; `prettier --write` sobre una carpeta reescribe EOL de ficheros no tocados (revertirlos con `git checkout`).
