# La migración de un juego nuevo: plantillas, protocolo y reversión

Lo lee `/spec-game` en la Fase 3, **solo en el caso concepto nuevo**. Si el juego ya está en el catálogo, su tabla, su rama de la vista y su fila existen desde SPEC 06 y este fichero no hace falta.

El SQL de aquí va **dentro del spec**, en su apartado de modelo de datos. **No lo escribes a ningún `.sql`**: esta skill no crea ficheros fuera de `specs/`.

---

## 1. Las tres piezas, y por qué se cuentan

Añadir un juego al leaderboard son **tres cosas**, y la migración ya aplicada lo avisa tres veces porque olvidar la segunda **no falla**:

1. La **tabla de marcas** `scores_<slug>`, con su índice, su RLS y su política de lectura.
2. La **rama de la vista `leaderboard`**. Esto es lo que se olvida. Sin ella el juego existe, se puede jugar, `submit_score` escribe la fila correctamente… y su ranking sale vacío **para siempre**, sin ningún error en ninguna capa.
3. La **fila del catálogo** en `public.games`.

El `slug` de la tabla usa **guion bajo** donde el `id` lleva guion: `bloque-buster` → `scores_bloque_buster`. La columna `games.scores_table` guarda la correspondencia exacta, y tiene un `check (scores_table ~ '^scores_[a-z0-9_]+$')` que es el segundo cerrojo de la interpolación `%I` de `submit_score`.

**Una sola migración transaccional** con las tres: `apply_migration` es atómico, así que o entran las tres o ninguna. Separarlas en varias hace más probable exactamente el fallo del que avisa el código.

---

## 2. Plantilla de la migración

Sustituye `<slug>` por el nombre con guiones bajos y `<id>` por el id con guiones. Son el mismo juego escrito de dos maneras y confundirlos es el error más fácil de cometer.

```sql
-- 1) La tabla de marcas, idéntica en forma a las ocho de SPEC 06.
create table public.scores_<slug> (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  score      integer not null,
  created_at timestamptz not null default now(),

  constraint scores_<slug>_name_len   check (char_length(name) between 1 and 10),
  constraint scores_<slug>_score_sane check (score >= 0),
  constraint scores_<slug>_name_uniq  unique (name)
);

-- Un solo índice sirve para los dos órdenes: Postgres lo recorre hacia atrás
-- cuando el juego ordena ascendente.
create index scores_<slug>_score_idx
  on public.scores_<slug> (score desc, created_at asc);

alter table public.scores_<slug> enable row level security;

-- Solo lectura. Sin política de insert/update/delete, RLS deniega la escritura
-- a todo el mundo: la única puerta es public.submit_score.
create policy scores_<slug>_read on public.scores_<slug>
  for select to anon, authenticated
  using (true);

comment on table public.scores_<slug> is
  'Marcas de un único juego (SPEC NN). Escritura solo vía public.submit_score.';

-- 2) LA RAMA DE LA VISTA. Hay que reescribirla entera: no existe forma
-- incremental. Las ramas existentes se copian del paso 1 del plan.
create or replace view public.leaderboard with (security_invoker = on) as
  select '<primer-id>'::text as game_id, id, name, score, created_at from public.scores_<primer_slug>
  union all
  -- … todas las ramas que ya había, en el orden en que estaban …
  union all
  select '<id>'::text, id, name, score, created_at from public.scores_<slug>;

-- 3) La fila del catálogo.
insert into public.games (
  id, title, short, long, cat, cover, color, sort_order, scores_table,
  score_order, score_label, leaderboard_size, max_score
) values (
  '<id>', '<TÍTULO>', '<frase de la tarjeta>', '<copy del detalle>',
  '<ARCADE|PUZZLE|SHOOTER|VERSUS>', 'cover-<x>', '<cyan|magenta|yellow|green>',
  <sort_order>, 'scores_<slug>',
  '<desc|asc>', '<ETIQUETA>', <leaderboard_size>, <max_score>
);
```

Notas que el spec debe recoger como prosa, no solo como SQL:

- **`security_invoker = on` es obligatorio** en la vista. Sin él la vista saltaría el RLS de las tablas que une.
- Solo la **primera** rama del `union all` lleva el alias `as game_id`; las demás son posicionales.
- `sort_order` y `scores_table` son **`UNIQUE`**. Colocar el juego en medio del catálogo exige recolocar filas, así que por defecto va al final.
- `leaderboard_size` tiene `check between 3 and 50`; `max_score`, `check (max_score > 0)`.

---

## 3. Lo que NO se toca

Dilo explícitamente en el spec, para que nadie lo edite por iniciativa propia:

- **`public.submit_score`** resuelve la tabla desde `games.scores_table` con `format(..., %1$I, ...)` e invierte el comparador según `score_order`. Un juego nuevo no la cambia.
- **`public.top_scores(p_game)`** ordena, rompe empates por antigüedad y recorta por `games.leaderboard_size`. Un juego nuevo no la cambia. El JavaScript no reordena nada.
- **`public.game_stats`** hace `left join` desde `games`, así que devuelve fila para el juego nuevo en cuanto exista su fila de catálogo, con `plays = 0` y `best` nulo. Un juego nuevo no la cambia.

Los tres son dirigidos por el catálogo. Que no haya que tocarlos es el beneficio que pagan las ocho tablas físicas.

---

## 4. Protocolo MCP, paso a paso

Así se redacta el plan de implementación del spec de leaderboard. Los pasos que escriben van contra el proyecto Supabase real.

**Paso 0 — escribir antes de aplicar.** `supabase/migrations/<nombre>.sql` y `supabase/rollback/NNN_<nombre>.down.sql`, los dos, **antes** de tocar la base. Si la aplicación falla, la marcha atrás ya está escrita y leída.

**Paso 1 — contrastar la vista con la realidad.**

```sql
select pg_get_viewdef('public.leaderboard'::regclass, true);
```

Copia de ahí las ramas existentes al `create or replace view` del fichero. **Nunca des por buena una lista de ramas memorizada ni copiada de un spec anterior**: cada juego añadido la cambia.

**Paso 2 — comprobar que no pisas nada.** `mcp__supabase__list_tables` debe mostrar las tablas de SPEC 06 y **no** `scores_<slug>`. Si ya existiera, parar y avisar en vez de aplicar encima.

**Paso 3 — aplicar.** `mcp__supabase__apply_migration` con nombre `juego_<slug>`, una sola migración con las tres piezas.

> **Aviso para quien implemente:** el `allowed-tools` de `/spec-impl` no incluye los MCP de Supabase ni `Bash(npm:*)`. Si la herramienta queda bloqueada, este paso y los de verificación se ejecutan en una sesión normal, y después se vuelve a `/spec-impl` para el resto del plan.

**Paso 4 — renombrar la copia.** `mcp__supabase__list_migrations` y renombrar el fichero del repositorio al `<timestamp>_juego_<slug>.sql` exacto que devuelva. Es lo que permite contrastar repositorio y base de un vistazo.

**Paso 5 — verificar de verdad**, con `mcp__supabase__execute_sql`:

```sql
select count(*) from public.games;                                  -- subió en uno
select * from public.top_scores('<id>');                            -- 0 filas, sin error
select public.submit_score('<id>', 'TEST', 1234);
select * from public.leaderboard where game_id = '<id>';             -- ← atrapa la rama olvidada
select * from public.game_stats where game_id = '<id>';              -- plays = 1, best = 1234
select public.submit_score('<id>', 'test', 999);                     -- no baja la marca
select public.submit_score('<id>', 'TEST', 5000);                    -- sí la sube
select public.submit_score('<id>', 'TEST', <max_score> + 1);         -- error 22003
select public.submit_score('<id>', '   ', 10);                       -- error 22023
delete from public.scores_<slug>;                                    -- limpiar la prueba
```

La cuarta consulta es **la comprobación que justifica todo este fichero**: es la única que falla cuando falta la rama de la vista. Debe aparecer también como criterio de aceptación, no solo como paso del plan.

La prueba del alias en minúsculas confirma de paso que `submit_score` lo guarda en mayúsculas y recortado a 10 caracteres.

**Paso 6 — asesores.** `mcp__supabase__get_advisors` de seguridad y de rendimiento. El único aviso nuevo aceptable es el **«Unused Index» de `scores_<slug>_score_idx`**: es informativo, el índice **no se borra**, y se añade a la lista de avisos aceptados de `supabase/README.md`.

**Paso 7 — tipos.** `mcp__supabase__generate_typescript_types` sobre `lib/database.types.ts`, **conservando sus dos líneas de cabecera** («Generado por el MCP de Supabase… No editar a mano»). El fichero gana una entrada `scores_<slug>` en `Tables` y nada más estructural.

---

## 5. La reversión, y por qué su orden no es obvio

`supabase/rollback/NNN_juego_<slug>.down.sql` deshace **en orden inverso**:

```sql
-- 1) Primero la vista, dejándola en las ramas que tenía antes.
create or replace view public.leaderboard with (security_invoker = on) as
  select '<primer-id>'::text as game_id, id, name, score, created_at from public.scores_<primer_slug>
  union all
  -- … las ramas anteriores, SIN la del juego que se retira …
  select '<ultimo-id>'::text, id, name, score, created_at from public.scores_<ultimo_slug>;

-- 2) Después la fila del catálogo. delete acotado, nunca truncate: si alguien
-- añadió otro juego después, no es cosa de esta reversión llevárselo por delante.
delete from public.games where id = '<id>';

-- 3) Por último la tabla, que ya no tiene dependientes.
drop table if exists public.scores_<slug>;
```

**Al revés falla.** La vista `leaderboard` depende de la tabla, así que un `drop table` con la rama puesta da error, y un `drop table ... cascade` se llevaría la vista entera por delante —y con ella `game_stats` y `top_scores`—. Esa es la razón de que la vista se rehaga primero.

La reversión **no se aplica en el camino feliz.** Existe para no improvisar `drop` sueltos sobre la base si la verificación falla.

---

## 6. Si solo cambian las reglas de un juego que ya existe

Caso MOTOR en el que el porte revela que `score_label` debe ser otra cosa, o que `max_score` está mal calibrado. Es una micro-migración con el mismo protocolo —fichero, reversión, `apply_migration`, renombrar, verificar—, pero sin tabla y sin vista:

```sql
update public.games
   set score_label = '<ETIQUETA>',
       max_score   = <nuevo>
 where id = '<id>';
```

Y su reversión, con los valores anteriores leídos de la consulta de la Fase 1:

```sql
update public.games
   set score_label = '<etiqueta anterior>',
       max_score   = <anterior>
 where id = '<id>';
```

No hay que regenerar tipos: el esquema no cambia, solo los datos.
