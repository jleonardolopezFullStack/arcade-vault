---
name: spec-game
description: Diseña el spec de un juego para Arcade Vault —el motor en lib/games/ y, si el concepto es nuevo, su leaderboard independiente en Supabase—. Pregunta antes de proponer estructura, detecta el estado real del catálogo y escribe specs/NN-<nombre>.md listo para /spec-impl. No escribe código ni toca la base de datos.
disable-model-invocation: true
argument-hint: '<juego a añadir> (p. ej. "el tetris de references/03-tetris" o "un buscaminas desde cero")'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(git status:*), mcp__supabase__list_tables, mcp__supabase__list_migrations, mcp__supabase__execute_sql
---

# /spec-game — Diseñador guiado de specs de juego

## Contexto de sesión

Fecha de hoy (úsala en la cabecera del spec; **nunca la inventes**):
!`date +%F`

Specs que ya existen:
!`ls specs/ 2>/dev/null || echo "la carpeta specs/ no existe"`

Migraciones y reversiones versionadas:
!`ls supabase/migrations/ supabase/rollback/ 2>/dev/null || echo "sin carpeta supabase/"`

Juegos de referencia disponibles para portar:
!`ls references/RRO5vePTlqkYrGHjYdtf_started-games/ 2>/dev/null || echo "sin carpeta references/"`

Motores que ya existen:
!`ls lib/games/ 2>/dev/null || echo "sin lib/games/"`

Registro de motores —qué juegos son jugables hoy:
!`cat lib/games/registry.ts 2>/dev/null || echo "sin registry.ts"`

Árbol de trabajo:
!`git status --short`

---

Esta skill produce **el spec de un juego** para Arcade Vault: el motor que se monta en el reproductor y, cuando el concepto es nuevo, su tabla de marcas en Supabase. **Aquí no escribes código ni tocas la base de datos.** Tu único producto son ficheros en `specs/`. La implementación es otro paso y la hace `/spec-impl`.

Añadir un juego a este proyecto es conocimiento repartido entre dos specs largos —SPEC 05 definió el contrato de motores, SPEC 06 el leaderboard— y tiene una trampa cuyo olvido **no falla**: si un juego nuevo entra en el catálogo pero no se añade su rama a la vista `leaderboard`, el juego existe, se juega, `submit_score` escribe correctamente… y su ranking sale vacío para siempre sin que nada dé error. Tu trabajo es que el spec que escribes no deje caer ninguna de esas piezas.

## Filosofía

Un spec no es documentación decorativa: es el contrato que dirige la ejecución. Este flujo es **deliberadamente lento al definir y rápido al escribir**.

Tres ficheros acompañan a esta skill. **No los leas todos de entrada** — cada uno tiene su momento:

| Fichero             | Cuándo lo lees                             | Qué contiene                                                            |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `contrato-motor.md` | Fase 2, antes de la ronda D                | El contrato de motores, el checklist de porte y los huecos del contrato |
| `migracion.md`      | Fase 3, **solo** en el caso concepto nuevo | Las plantillas SQL, el protocolo MCP y el orden de la reversión         |
| `plantilla-spec.md` | Fase 3, al redactar                        | La forma exacta de los dos tipos de spec, sección por sección           |

## Flujo

Cuatro fases en orden. **Nunca te saltes la Fase 2**: las preguntas son el valor de esta skill. Responde en el idioma del prompt inicial, pero **el spec se escribe siempre en español** —los specs que ya existen lo están y el fichero nuevo tiene que encajar con ellos—.

### Fase 1 — Contexto y detección

Lee, en este orden. Una ausencia también es información: anótala en vez de suponer.

1. `CLAUDE.md`. **Aviso:** su sección sobre el flujo de specs puede estar desactualizada sobre qué skills hay instaladas. Manda el listado del contexto de sesión, no su prosa.
2. `specs/06-leaderboards-y-catalogo-en-supabase.md` — sus apartados de alcance, las ocho tablas, las vistas, `submit_score` y los ficheros de migración. Es el contrato que hereda tu spec.
3. `specs/05-juego-rocas-asteroides.md` completo. Es el modelo de la mitad del motor y de la voz de la casa.
4. `lib/games/types.ts` y `lib/games/registry.ts`.
5. `supabase/migrations/*_vistas_y_funciones.sql` — el bloque comentado **«PLANTILLA — añadir el noveno juego»** del final y la definición de la vista `leaderboard`.
6. `supabase/README.md` y `supabase/rollback/002_siembra_catalogo.down.sql` —el `delete` acotado, nunca `truncate`—.
7. `components/player/game-player.tsx` y `lib/catalog.ts`.
8. `lib/games/asteroides/constants.ts` — el precedente de `PALETTE` y `FONT_*`.
9. Las clases de portada, con **grep y no Read** sobre `app/globals.css`: `^\s*\.cover-[a-z-]+\s*\{`.

La carpeta de `references/` elegida se lee **solo después** de la ronda A, nunca antes: son cientos de líneas y todavía no sabes cuál hace falta.

Después, tres lecturas de Supabase:

```
mcp__supabase__list_migrations
mcp__supabase__list_tables (schemas: ["public"])
mcp__supabase__execute_sql:
  select id, title, cat, color, cover, sort_order, scores_table,
         score_order, score_label, leaderboard_size, max_score
    from public.games order by sort_order;
  select pg_get_viewdef('public.leaderboard'::regclass, true);
```

**`execute_sql` solo para `select`.** Jamás `insert`, `update`, `create`, `alter` ni `drop`: estás leyendo el estado del catálogo, no cambiándolo.

**Deduce todo esto; no lo preguntes:**

| Dato                                     | De dónde sale                                            |
| ---------------------------------------- | -------------------------------------------------------- |
| Próximo número de spec                   | el mayor de `ls specs/` + 1                              |
| Próximo `sort_order`                     | `max(sort_order) + 1` de la consulta                     |
| Slugs, `cover` y `scores_table` ocupados | la misma consulta                                        |
| Reparto de `cat` y `color`               | la misma consulta, para recomendar el color menos usado  |
| Clases `.cover-*` existentes             | el grep sobre `globals.css`                              |
| Ramas actuales de la vista               | `pg_get_viewdef`                                         |
| Referencias ya portadas                  | cruce de `ls lib/games/` con las claves de `registry.ts` |
| Semáforo de SPEC 06                      | ver **Semáforo** más abajo                               |
| Trabajo sin commitear                    | `git status --short` del contexto de sesión              |

#### La bifurcación

Cruza la descripción del usuario contra el `id`, el `title` y el `long` de las filas de `public.games`. El catálogo se sembró con ocho fichas y **varias describen juegos clásicos que aún no tienen motor**: un tetris, un breakout, una serpiente, unos invasores, una rana, un pong. Portar un juego de `references/` casi nunca es añadir una ficha nueva: suele ser darle motor a una que ya existe.

- **Caso MOTOR** — hay cruce. **Un solo spec**, con la forma de seis secciones de SPEC 05 y **sin SQL**. Anuncia en voz alta la fila que cruzó, con su `id`, su `scores_table` y sus reglas, para que el usuario pueda corregirte. Si al redactar resulta que solo cambian las _reglas de puntuación_ (`score_label`, `max_score`), el spec gana un paso de micro-migración (`update public.games set …`) con su reversión y el mismo protocolo MCP.
- **Caso CONCEPTO NUEVO** — ningún cruce. **Dos specs encadenados**, el del motor primero:
  - **SPEC N — el motor jugable.** El motor en `lib/games/<concepto>/`, la línea del registro, **más la fila de `games` y la clase `.cover-*`**. Esas dos viajan aquí porque sin fila de catálogo no existe la ruta `/juegos/<slug>` donde montar el canvas: `generateStaticParams` sale de `listGameIds()`. `scores_table` se rellena con `'scores_<slug>'` aunque la tabla no exista todavía —es una columna `text` sin clave ajena—. En `### Fuera` queda explícito que **el guardado de marcas no entra**: `submit_score` levantará `42P01` y el modal de fin de partida enseñará su estado de error. El ranking sale vacío con «SÉ EL PRIMERO» y `game_stats` da `plays = 0`, porque esa vista hace `left join` desde `games`.
  - **SPEC N+1 — el leaderboard.** La tabla `scores_<slug>` con su índice, su RLS y su política, el `create or replace view` de `leaderboard`, la reversión, los tipos regenerados y los asesores. Aquí el guardado empieza a funcionar.

  Di al usuario esa consecuencia —un juego que se juega pero cuya marca no se guarda— y ofrécele invertir el par en la ronda A. **No lo decidas por tu cuenta.**

### Fase 2 — Preguntas

Rondas de **tres o cuatro preguntas**, nunca de una en una. Usa `AskUserQuestion`; si el agente que te ejecuta no lo tiene, cae a una lista numerada en markdown. Pon tu recomendación primero y etiquétala. Espera la respuesta de cada ronda antes de seguir.

**Ronda A — origen y alcance.** La fuente (cada carpeta de `references/`, marcando «(ya portado)» las que ya tienen motor; desde cero a partir de una descripción; otro origen). La fidelidad: porte 1:1 con repintado de la paleta —lo que hizo SPEC 05— frente a reajuste de dificultad o reinterpretación libre. La confirmación de la bifurcación que detectaste, mostrando la fila. Y si se toca el reproductor: reutilizar `GamePlayer` tal cual, ampliarlo, o una rama nueva.

**Ronda B — identidad en el catálogo** (solo en el caso concepto nuevo). El `id` en kebab-case: dos o tres propuestas **en español**, cada una mostrando el `scores_table` que implica, descartando antes las que colisionen. La `cat`. El `color`, recomendando el menos usado. Y el `cover`: dos o tres ideas de arte CSS, cada una con el nombre de clase que implica, recordando que **el valor de la columna `cover` debe coincidir exactamente con una clase de `globals.css` y que nada lo valida en ninguno de los dos lados**.

El `title`, el `short` y el `long` **no son opción múltiple**: redáctalos tú en la voz de la casa —título en mayúsculas de recreativa, `short` de una línea, `long` de un párrafo—, enséñalos juntos y pregunta si quedan así. Hacerle teclear tres campos es fricción inútil.

**Ronda C — reglas de puntuación.** El `score_order`: `desc` por defecto; si es `asc` («menos es mejor»), pregunta **la unidad entera** en la misma ronda, porque la columna es `integer` con `check (score >= 0)` y eso obliga a centésimas o golpes, no a segundos con decimales. El `score_label`, que debe rotular lo que el motor emite de verdad en `score`. El `leaderboard_size`, 12 como los demás. Y el `max_score`, explicando que `submit_score` rechaza con `22003` por encima.

**Ronda D — huecos del contrato.** Lee `contrato-motor.md` antes de formularla, y pregunta solo lo que aplique: la métrica extra que el juego tenga y el contrato no exprese, el estado de victoria, los assets y el audio, y la entrada por ratón.

Dos cosas de esta ronda son **afirmaciones, no preguntas**. Dilas, no las ofrezcas:

> `P` y `Escape` son de la plataforma: pausan y salen. El juego de referencia que las use las pierde en el porte; si su función hace falta, se le busca otra tecla.

> `references/` es de solo lectura. Un porte copia hacia fuera; no edita, no mueve y no formatea el original.

**Ronda E — cierre.** El nombre de la carpeta del motor, `lib/games/<x>/`: dos o tres nombres del **concepto en español**, con el precedente de que `asteroides` no coincide con su slug `rocas` a propósito. El `sort_order`, avisando de que la columna es `UNIQUE` y colocar en medio exige recolocar filas. Y la confirmación del copy que redactaste.

**Deja de preguntar** cuando puedas responder estas tres sin suponer nada: qué ficheros aparecen o cambian, cuál es el primer paso ejecutable y cuál el último, y cómo se verifica que está terminado. Si te falta una, sigue preguntando.

### Fase 3 — Redactar

Si puedes responder esas tres preguntas sin inventar nada, **escribe el spec completo de una vez** y pasa a la Fase 4. No vayas sección por sección y no pidas aprobación de un borrador: el usuario ya respondió en la Fase 2 y volver a preguntar es fricción. Sección a sección es el respaldo para cuando falta información, no el modo normal.

Antes de redactar lee `plantilla-spec.md`, y `migracion.md` **solo** si estás en el caso concepto nuevo.

### Fase 4 — Guardar y parar

1. Escribe en `specs/NN-<slug>.md`. En el caso concepto nuevo son **dos** ficheros: `NN-juego-<slug>-<concepto>.md` y `NN+1-leaderboard-<slug>.md`.
2. La `**Fecha:**` sale del contexto de sesión.
3. `**Estado:** Borrador`. Este repositorio solo usa `Aprobado` e `Implementado`, así que la palabra de borrador se fija aquí en vez de improvisarse distinta cada vez. **Nunca escribas `Aprobado`**: eso lo hace el humano después de releer.
4. Comprueba que cada spec citado en `**Depende de:**` existe de verdad en `specs/`.
5. **No toques `specs/.spec-config.yml`.** Ya existe.
6. Cierra diciendo: las rutas creadas; que están en `Borrador` y que pasarlas a `Aprobado` es cosa del humano; el veredicto del semáforo si salió ámbar; que `supabase/` y la capa de catálogo pueden estar sin commitear y la rama que cree `/spec-impl` se los llevará; y el comando siguiente, `/spec-impl NN-<slug>`.
7. **Para ahí.** No ofrezcas implementarlo.

## Reglas duras

- **Nunca escribes código.** Los únicos ficheros que produces son los `.md` de `specs/`. Ni `.ts`, ni `.sql`, ni `.css`, ni siquiera «de ejemplo, aparte».
- **Nunca aplicas una migración.** `apply_migration`, `generate_typescript_types` y `get_advisors` no están en tus herramientas a propósito: eso lo prescribe el spec y lo ejecuta `/spec-impl`.
- **`execute_sql` solo para `select`.** Nunca DDL, nunca DML.
- **`references/` es de solo lectura, siempre.** Lo prohíbe SPEC 05 y debe quedar como criterio de aceptación del spec que escribas.
- **La fecha se lee del contexto de sesión**, nunca se deduce.
- **La rama de la vista `leaderboard` no es opcional.** Un spec de leaderboard sin su `create or replace view` completo está mal escrito. El fallo es silencioso y permanente.
- **Una sola migración transaccional**, no varias: el modo de fallo documentado es olvidar una de las piezas, y separarlas lo hace más probable.
- **La reversión se escribe antes de aplicar**, y deshace en orden inverso.
- **`P` y `Escape` son de la plataforma.** Ningún motor las reclama.
- **No propongas tocar `submit_score`, `top_scores` ni `game_stats`.** Están dirigidos por el catálogo y un juego nuevo no los cambia. Dilo dentro del spec para que nadie los edite por iniciativa propia.
- **No reabres en la Fase 3 lo que se cerró en la Fase 2.**
- **Si el usuario quiere saltarse las preguntas**, recuérdale una vez que preguntar ahora ahorra horas después. Si insiste, respétalo y anótalo en la tabla de decisiones del spec («definición rápida, sin aclaración detallada»).
- **Tu trabajo acaba al escribir el fichero.**

## Semáforo de SPEC 06

El leaderboard de un juego se apoya entero en lo que montó SPEC 06. Antes de redactar, calcula el semáforo con cuatro sondas: el `**Estado:**` de `specs/06-…md`; si `lib/data.ts` sigue existiendo; si existe `app/juegos/[id]/jugar/actions.ts`; y si `allowScore` aparece en `lib/rate-limit.ts`.

**🔴 Rojo — las migraciones de SPEC 06 no están aplicadas** (`list_migrations` vacío o incompleto, o `public.games` no existe). **Rechaza y no escribas nada.** La tabla `games`, la vista y `submit_score` que tu spec extiende no existen. Di exactamente qué falta y que el camino es `/spec-impl 06-leaderboards-y-catalogo-en-supabase`.

**🟡 Ámbar — migraciones aplicadas, pero la migración del código a medias** (quedan pantallas leyendo el catálogo estático, o falta la Server Action de guardado). **Avisa una vez y no rechaces**; ofrece tres salidas:

- **Esperar** a rematar SPEC 06. Recomiéndala si el usuario quiere jugar al juego nuevo pronto.
- **Escribir el spec igualmente.** Entonces: `**Depende de:** SPEC 05, SPEC 06 (pendiente de terminar)`; un bloque `## 0. Requisito previo` justo tras la cabecera, listando los pasos concretos que faltan y **qué criterios de aceptación de este spec son inverificables hasta entonces**; el paso 0 del plan convertido en «verificar que esos pasos están hechos; si no, parar»; una línea en `### Fuera` diciendo que SPEC 06 no se remata aquí; y un riesgo numerado.
- **Rematar SPEC 06 dentro de este spec.** Ofrécela y **desaconséjala**: es volver a alcanzar un spec cuyo plan ya está escrito.

No rechaces en ámbar: el entregable es un documento, y escribir la dependencia dentro del fichero es precisamente para que el implementador no la pueda ignorar.

**🟢 Verde.** `**Depende de:** SPEC 05, SPEC 06`, sin bloque previo y sin riesgo extra.

## Tono al preguntar

Sé directo y concreto. No te disculpes por preguntar: el usuario invocó esta skill precisamente para eso. Preguntas cerradas, no abiertas.

- ❌ «¿Cómo imaginas la puntuación?» → ✅ «¿Más es mejor (`desc`) o menos es mejor (`asc`)? Si es `asc`, ¿en qué unidad entera: centésimas de segundo, movimientos, golpes?»
- ❌ «¿Qué te parece el contrato?» → ✅ «Tetris emite líneas y no tiene vidas. ¿Añadimos `lines?: number` opcional a `GameSnapshot`, o las líneas se quedan solo en el HUD del canvas?»

Cuando ofrezcas opciones, da dos a cuatro, marca la recomendada y di por qué en una línea.

## Argumentos

`$ARGUMENTS` es **la descripción del juego**, no el nombre del fichero: el punto de partida de la Fase 1 y la semilla de la recomendación de la ronda A. Si menciona una carpeta de `references/`, úsala como fuente recomendada. Si viene vacío, empieza preguntando qué juego se quiere añadir y de dónde sale.
