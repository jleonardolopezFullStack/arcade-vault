# La forma del spec de un juego

Lo lee `/spec-game` en la Fase 3. **No es texto para copiar literalmente**: es la forma que el spec tiene que respetar. Los specs que ya existen en `specs/` mandan sobre esta plantilla si alguna vez discrepan.

Hay **dos formas**, según la bifurcación de la Fase 1:

| Forma                   | Cuándo                              | Secciones                                        |
| ----------------------- | ----------------------------------- | ------------------------------------------------ |
| **Spec de motor**       | Caso MOTOR, y SPEC N del caso nuevo | 6, empezando en `## 1. Alcance`                  |
| **Spec de leaderboard** | SPEC N+1 del caso concepto nuevo    | 7, empezando en `## 1. Por qué existe este spec` |

El spec de leaderboard tiene una sección más porque hay una historia de base de datos que justificar antes de entrar en el alcance.

---

## Cabecera (las dos formas)

Cuatro líneas en negrita **sin blockquote** —el repositorio divergió aquí de la plantilla genérica de `/spec`—, y una regla horizontal:

```markdown
# SPEC 07 — «SERPENTINA» jugable: la serpiente de referencia dentro del reproductor

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06
**Fecha:** 2026-09-29

**Objetivo:** Portar el juego de `references/.../03-snake/game.js` a un motor TypeScript que el reproductor monte en `/juegos/serpentina/jugar`.

---
```

- El H1 es `# SPEC NN — <título>: <frase que lo concreta>`. El título del juego va entre comillas angulares y en mayúsculas cuando es el nombre de la ficha.
- `**Estado:** Borrador` siempre. Nunca `Aprobado`.
- `**Depende de:**` lleva los specs reales, comprobados. `—` si no hay ninguno.
- El `**Objetivo:**` es **una sola frase**. Si no cabe en una, el spec es demasiado grande y hay que partirlo.

---

## Spec de motor, sección por sección

### `## 1. Alcance`

Dos subsecciones. `### Dentro` con viñetas cuya primera parte va en negrita, concretas y con rutas reales:

> - **Motor portado** a `lib/games/<concepto>/`, en TypeScript estricto y **sin globals**: nada de `document.getElementById`, ni variables de módulo con el estado de la partida, ni `requestAnimationFrame` al cargar el fichero. El comportamiento se porta **1:1**: <enumera aquí lo que define al juego>.
> - **Registro** en `lib/games/registry.ts`: una línea, `<slug>: create<Concepto>Engine`.
> - **Repintado con la paleta del Vault**: <qué elemento en qué color>.
> - **Escalado 4:3**: el canvas sigue siendo de 800×600 por dentro y se estira por CSS.
> - **Controles**: <teclas>. `P` y `Escape` siguen siendo de la plataforma.
> - **Fin de partida**: al <condición> manda el `GameOverModal` de la plataforma.
> - **Limpieza al desmontar**: se cancela el bucle, se retiran los oyentes y se descarta el estado.

`### Fuera (explícitamente)` es igual de importante y debe incluir siempre: los otros motores que siguen sin hacerse; **editar el juego de referencia**; controles táctiles; sonido, si se decidió que no; cambios de balance; y, en el caso concepto nuevo, **el guardado de marcas**, con la consecuencia dicha en voz alta (`submit_score` levanta `42P01` y el modal enseña su estado de error).

### `## 2. Modelo de datos`

Si el juego no introduce datos nuevos, **dilo explícitamente** en una frase en lugar de omitir la sección. Subsecciones numeradas, con TypeScript y SQL de verdad en bloques cercados:

- `### 2.1 Lo que la base ya tiene` (caso MOTOR) — la tabla `scores_<slug>`, su rama de la vista y su fila de catálogo existen desde SPEC 06, con sus reglas actuales citadas. **Este spec no toca Supabase.**
- `### 2.1 La fila del catálogo` (caso concepto nuevo) — el `insert` literal en `public.games` y la clase `.cover-<x>`, con el recordatorio de que el valor de la columna y el nombre de la clase deben coincidir exactamente y nada lo valida.
- `### 2.2 Las constantes portadas` — tabla de constante y valor, copiadas del original **sin cambiar un número**, con una nota de dónde salen.
- `### 2.3 La paleta del canvas` — el objeto `PALETTE` con el token en comentario.
- `### 2.4 El contrato` — **solo si la ronda D lo amplió.** El `types.ts` nuevo íntegro, con los campos nuevos **opcionales**, y la frase de que `lib/games/asteroides/` compila sin tocarse.
- `### 2.5 Estado interno de la partida` — qué vive dentro de la instancia que devuelve la fábrica, y la frase de que nunca en variables de módulo porque dos pantallas montadas a la vez no se pisan.

### `## 3. Plan de implementación`

Abre con «Cada paso deja el proyecto compilando». Pasos numerados; el orden que funciona es:

1. **Contrato**, solo si se amplía: `lib/games/types.ts` con los campos opcionales nuevos. Nadie los usa todavía.
2. **Constantes.** `lib/games/<concepto>/constants.ts`: `W`/`H`, tablas de ajuste, `PALETTE`, `INK_RGB`, `FONT_MONO`/`FONT_PIXEL`.
3. **Entidades y utilidades.** `entities.ts` y `utils.ts`: clases con `update(dt)` / `draw(ctx)` / `dead`. Sin bucle, sin teclado, sin efectos al importar: solo lógica.
4. **Fábrica y bucle.** `index.ts`: `start` / `pause` / `resume` / `restart` / `destroy`, `requestAnimationFrame` con `dt` en segundos capado a `MAX_DT`, `lastTime = null` como centinela, teclado por `e.code` con `CAPTURED_KEYS` y `preventDefault`, guarda `isTypingTarget`, `clearInput()` en pausa/reinicio/destrucción, `emitSnapshot()` deduplicado, `onGameOver(score)` al terminar, oyentes enganchados una sola vez y retirados en `destroy()`, guardas sobre `destroyed`. **Sin reclamar `P` ni `Escape`.**
5. **Repintado.** Los colores del original por `PALETTE`; el HUD del canvas con los tokens del tema; el overlay de fin de partida **sin** su línea de reinicio con espacio.
6. **Portada**, caso concepto nuevo: el bloque `.cover-<x>` en `app/globals.css`, dentro de `@layer components`, con los tokens del tema.
7. **Catálogo**, caso concepto nuevo: la fila de `games` por migración, siguiendo el protocolo MCP (escribir la reversión antes, aplicar, renombrar la copia, verificar).
8. **Registrar.** Una línea en `lib/games/registry.ts`.
9. **Reproductor**, solo si se decidió tocarlo. Si no, dilo: `components/player/game-player.tsx` no se toca.
10. **Cierre.** `npm run lint` y `npm run build` limpios, y el recorrido de partida real descrito paso a paso.

### `## 4. Criterios de aceptación`

Lista de `- [ ]`, de veinte en adelante, **booleanos y verificables a mano**. Nada de «que funcione bien». Nombra rutas, teclas y cadenas exactas. Incluye siempre los del apartado 6 de `contrato-motor.md`, los de la mecánica concreta del juego, y el que se olvida:

> - [ ] `/juegos/<slug>` resuelve **después de un `npm run build`**: `generateStaticParams` con `dynamicParams = false` significa que la ruta no existe hasta la siguiente compilación.

### `## 5. Decisiones tomadas y descartadas`

Tabla de tres columnas: `Decisión` · `Alternativa descartada` · `Motivo`. Una fila por pregunta respondida en la Fase 2. Donde la razón sea la voluntad del usuario, escríbelo así —«Decisión del usuario»— y añade el coste que acepta. Filas que casi siempre existen: el nombre de la carpeta del motor frente al slug, cómo se resolvió cada hueco del contrato, qué se hizo con la tecla que el original reclamaba, y el porte 1:1 frente a reinterpretar.

### `## 6. Riesgos identificados`

Lista numerada de párrafos `**Riesgo en negrita.** Explicación. **Mitigación:** …`. Los que se repiten: el doble montaje en modo estricto —el fallo más probable de cualquier porte—, el secuestro del teclado si un oyente sobrevive al desmontaje, la deriva respecto al original al repintar y reestructurar, la nitidez al escalar 800×600, y el rendimiento dentro del marco CRT con scanlines y filtros.

---

## Spec de leaderboard, sección por sección

### `## 1. Por qué existe este spec`

Uno o dos párrafos: SPEC 06 montó ocho tablas y avisó de que la novena se paga en una migración; esta es esa migración. **Nombra aquí, una vez, el fallo silencioso de la rama olvidada.**

### `## 2. Alcance`

`### Dentro`: la migración **se aplica de verdad** por MCP sobre el proyecto real; copia versionada en `supabase/migrations/` y reversión en `supabase/rollback/` escrita **antes**; la tabla idéntica en forma a las ocho; **la rama nueva en `leaderboard`**; los tipos regenerados; los asesores revisados.

`### Fuera`: no se toca `submit_score`, `top_scores` ni `game_stats` —son dirigidos por el catálogo—; no se instala el CLI de Supabase ni Docker ni se usa `db push`; no hay ramas de Supabase, que son de plan de pago; no hay autenticación; no se remata SPEC 06 aquí si estaba a medias.

### `## 3. Modelo de datos`

Las subsecciones de `migracion.md`, con el SQL ya sustituido: `### 3.1 La tabla de marcas`, `### 3.2 La rama de la vista` (con **todas** las ramas, las de hoy leídas con `pg_get_viewdef` más la nueva), `### 3.3 Lo que no cambia` —y por qué, para que nadie lo edite—, `### 3.4 Los ficheros de migración` con el árbol y la regla de que el nombre del fichero debe coincidir con el que registre Supabase, y `### 3.5 La reversión` con los tres pasos en orden inverso y la explicación de por qué ese orden.

### `## 4. Plan de implementación`

El protocolo del apartado 4 de `migracion.md`, con el aviso de que los pasos modifican el proyecto Supabase real y que antes de empezar hay que confirmar con `list_tables` que `scores_<slug>` no existe. Incluye el aviso sobre el `allowed-tools` de `/spec-impl`.

### `## 5. Criterios de aceptación`

Los del apartado 5 de `migracion.md` convertidos en casillas, más: la tabla aparece en `list_tables` con RLS activo y **una sola** política de `select`; `list_migrations` y `supabase/migrations/` coinciden en nombre; la reversión existe y deshace en orden inverso; `get_advisors` no añade avisos nuevos salvo el «Unused Index» ya documentado; `lib/database.types.ts` incluye la tabla y conserva su cabecera; y un `insert` directo desde la consola del navegador es rechazado por RLS mientras el `select` funciona.

### `## 6. Decisiones tomadas y descartadas` y `## 7. Riesgos identificados`

Igual que en el spec de motor. Riesgos propios de esta mitad: la rama olvidada y su fallo silencioso; que no hay entorno de pruebas y se trabaja sobre la base que usa la aplicación; que la copia del repositorio puede quedarse atrás si alguien ejecuta SQL desde el panel; que `unique (name)` sin autenticación significa que el primero que escriba un alias se lo queda; y que el ranking sale vacío el primer día, que es honesto pero parece un retroceso.

---

## Reglas sobre el documento entero

- **Español**, siempre, aunque la conversación vaya en otro idioma.
- **Rutas, claves y cadenas en `backticks`**, nunca descritas de memoria.
- **Comillas angulares** «así» para el copy de interfaz, y rayas —así— para los apartes. Es la tipografía de los specs que ya existen.
- **Negrita para la cláusula operativa** de cada viñeta, no para frases enteras.
- No alinees las tablas a mano: el hook de Prettier del repositorio lo hace al guardar.
- Nada de criterios de aceptación aspiracionales, nada de pasos del plan que no estén en el alcance, y nada de nombres de fichero que el usuario no haya confirmado.
- La sección de decisiones es la que más valor tiene a los seis meses. No la dejes coja.
