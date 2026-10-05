# Juegos de Arcade Vault

Fuente: `public.games` + vista `game_stats` en Supabase (proyecto `ekcduxcscntnisfhbiqc`), consultado el 2026-10-05. Motor jugable según `lib/games/registry.ts`.

**8 juegos en el catálogo · 4 jugables · 4 «PRÓXIMAMENTE».**

## Resumen

| #   | Id              | Título        | Categoría | Color   | Motor (`lib/games/`) | Spec | Partidas | Mejor marca |
| --- | --------------- | ------------- | --------- | ------- | -------------------- | ---- | -------: | ----------: |
| 1   | `bloque-buster` | BLOQUE BUSTER | ARCADE    | cyan    | `ladrillos`          | 08   |        2 |         580 |
| 2   | `caida`         | CAÍDA         | PUZZLE    | magenta | `piezas`             | 07   |        1 |         592 |
| 3   | `serpentina`    | SERPENTINA    | ARCADE    | green   | `serpiente`          | 09   |        1 |         940 |
| 4   | `gloton`        | GLOTÓN        | ARCADE    | yellow  | —                    | —    |        0 |           — |
| 5   | `invasores`     | INVASORES     | SHOOTER   | green   | —                    | —    |        0 |           — |
| 6   | `rocas`         | ROCAS         | SHOOTER   | yellow  | `asteroides`         | 05   |        1 |         130 |
| 7   | `ranaria`       | RANARIA       | ARCADE    | green   | —                    | —    |        0 |           — |
| 8   | `duelo-pixel`   | DUELO PIXEL   | VERSUS    | cyan    | —                    | —    |        0 |           — |

Todos comparten configuración de marcador: orden `desc`, rótulo `PUNTOS`, ranking de 12 posiciones y `max_score` de 10 000 000.

## Jugables

### BLOQUE BUSTER · `bloque-buster`

> Rebota la pelota y destruye muros de neón.

Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?

- Categoría: ARCADE · Portada: `cover-bricks` · Tabla: `scores_bloque_buster`
- Motor: `lib/games/ladrillos/` · Spec: `specs/08-juego-bloque-buster-arkanoid.md`

### CAÍDA · `caida`

> Encaja las piezas antes de que el techo te aplaste.

Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.

- Categoría: PUZZLE · Portada: `cover-tetro` · Tabla: `scores_caida`
- Motor: `lib/games/piezas/` · Spec: `specs/07-juego-caida-tetris.md`

### SERPENTINA · `serpentina`

> Crece sin morder tu propia cola.

Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.

- Categoría: ARCADE · Portada: `cover-snake` · Tabla: `scores_serpentina`
- Motor: `lib/games/serpiente/` · Spec: `specs/09-juego-serpentina-snake.md`

### ROCAS · `rocas`

> Pulveriza asteroides en gravedad cero.

Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.

- Categoría: SHOOTER · Portada: `cover-rocas` · Tabla: `scores_rocas`
- Motor: `lib/games/asteroides/` · Spec: `specs/05-juego-rocas-asteroides.md`

## En catálogo, sin motor (PRÓXIMAMENTE)

### GLOTÓN · `gloton`

> Devora puntos y escapa de los fantasmas.

Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.

- Categoría: ARCADE · Portada: `cover-glot` · Tabla: `scores_gloton`

### INVASORES · `invasores`

> Defiende el planeta de filas alienígenas.

Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.

- Categoría: SHOOTER · Portada: `cover-invaders` · Tabla: `scores_invasores`

### RANARIA · `ranaria`

> Cruza la autopista de pixeles.

Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.

- Categoría: ARCADE · Portada: `cover-rana` · Tabla: `scores_ranaria`

### DUELO PIXEL · `duelo-pixel`

> Dos paletas. Una pelota. Reflejos máximos.

El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.

- Categoría: VERSUS · Portada: `cover-duelo` · Tabla: `scores_duelo_pixel`
