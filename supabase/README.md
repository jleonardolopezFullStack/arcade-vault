# supabase/

**Esta carpeta es una copia de lo que ya se aplicó, no la herramienta que lo aplica.**

El esquema vive en el proyecto Supabase `ekcduxcscntnisfhbiqc` (el de
`NEXT_PUBLIC_SUPABASE_URL` en `.env.local`). Las migraciones se aplican con el
MCP de Supabase —`apply_migration`—, y acto seguido se copia aquí el mismo SQL
para que quede revisable en el PR y para que un `git clone` diga qué esquema
corresponde a cada commit.

**El CLI de Supabase no interviene.** No hay `config.toml`, ni Docker, ni stack
local, ni `db push`. Ejecutar `supabase db reset` contra esta carpeta no es
parte de ningún flujo del proyecto (decisión de SPEC 04, matizada en SPEC 06).

## Contenido

| Carpeta       | Qué es                                                              |
| ------------- | ------------------------------------------------------------------- |
| `migrations/` | El SQL aplicado, en orden. Un fichero por migración                 |
| `rollback/`   | La reversión de cada migración. **No se aplica en el camino feliz** |

## Aplicar una migración nueva

1. Escribe el `.sql` en `migrations/` **y su reversión** en `rollback/`, antes
   de tocar la base.
2. Aplícalo con `apply_migration` del MCP de Supabase.
3. Comprueba con `list_migrations` el nombre con el que quedó registrado y
   renombra el fichero para que coincida.
4. Regenera los tipos: `generate_typescript_types` → `lib/database.types.ts`.
5. Pasa `get_advisors` (seguridad y rendimiento) antes de dar el cambio por
   bueno.

## Si algo va mal

Aplica las reversiones **en orden inverso** al de las migraciones
(`004` → `003` → `002` → `001`). `004` solo restaura el `max_score` de
`ranaria` a `10000000`; `003` es inocua; `001` borra las nueve tablas y con
ellas todas las marcas guardadas.

## Lo que hay que saber del esquema

- **Ocho tablas de marcas, una por juego** (`scores_rocas`, `scores_caida`…).
  Es una decisión explícita de SPEC 06: cada juego es independiente. Las vistas
  `leaderboard` y `game_stats` las presentan como si fueran una sola.
- **Añadir un juego son tres cosas**, no una: la tabla, **la rama de la vista
  `leaderboard`** y la fila en `games`. Olvidar la segunda no da ningún error:
  el juego funciona y su ranking sale vacío para siempre. La plantilla completa
  está al final de `migrations/20260926091843_vistas_y_funciones.sql`.
- **Nadie puede escribir marcas directamente.** RLS solo concede `SELECT`. La
  única puerta es `submit_score()`, que es `security definer` y valida juego,
  alias y rango antes de guardar.

## Contrastar repositorio y base

`list_migrations` del MCP debe devolver exactamente los ficheros de
`migrations/`. Si no coinciden, alguien ejecutó SQL desde el panel de Supabase
sin copiarlo aquí: el repositorio está mintiendo sobre el esquema.

## Avisos esperados del linter

`get_advisors` no sale limpio, y no debe salirlo. Estos tres avisos están
revisados y aceptados; **cualquier otro que aparezca sí hay que mirarlo**.

### 1. «Public Can Execute SECURITY DEFINER Function» — `submit_score` · WARN

**Es el diseño, no un fallo.** RLS deniega `INSERT` a todo el mundo, así que la
única forma de guardar una marca es esta función, y para eso `anon` tiene que
poder ejecutarla. Las tres salidas que propone el linter son incompatibles con
lo que hace:

| Sugerencia del linter        | Por qué no                                                               |
| ---------------------------- | ------------------------------------------------------------------------ |
| Revocar `EXECUTE`            | Nadie podría guardar una marca                                           |
| Pasarla a `SECURITY INVOKER` | Correría como `anon`, a quien RLS le deniega el `INSERT`                 |
| Sacarla del esquema expuesto | PostgREST solo publica `public`; fuera de ahí no se puede llamar por RPC |

Lo que sostiene la decisión es que la función **valida antes de escribir**:
comprueba que el juego existe, normaliza el alias (mayúsculas, 10 caracteres),
exige que la puntuación esté entre 0 y `games.max_score`, y solo guarda si
mejora la marca previa de ese alias. Va con `search_path = ''` y todo
cualificado con `public.` para que no se la pueda secuestrar con un esquema
propio.

Lo que **no** hace es comprobar identidad, porque en SPEC 06 todavía no hay
auth: el alias es un nombre de recreativa. Cuando llegue el spec de auth, esta
función es el primer sitio que hay que revisar.

### 2. El mismo aviso sobre `rls_auto_enable` — WARN

**No es nuestra.** Es la función del event trigger `ensure_rls`, que activa RLS
automáticamente en cada tabla nueva de `public`. Es endurecimiento, no un
agujero, y además no se puede llamar por RPC: devuelve `event_trigger` y
Postgres rechaza invocarla directamente (comprobado con `set role anon`). El
linter solo mira los permisos, no el tipo de retorno.

### 3. «Unused Index» en los `scores_*_score_idx` — INFO

Les falta tráfico, no corrección: las tablas están vacías. El de `scores_rocas`
ya desapareció de la lista en cuanto las pruebas lo usaron. **No borrarlos**: son
justo los índices que sostienen el `order by score` de cada ranking.
