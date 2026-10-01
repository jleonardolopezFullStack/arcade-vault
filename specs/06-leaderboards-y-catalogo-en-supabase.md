# SPEC 06 — Catálogo y marcadores en Supabase: tabla `games` y ocho leaderboards independientes

**Estado:** Aprobado
**Depende de:** SPEC 01, SPEC 04, SPEC 05
**Fecha:** 2026-09-25

**Objetivo:** Crear en Supabase la base de datos de los juegos —tabla `games`, ocho tablas de marcas independientes y una función `security definer` como única puerta de escritura— y hacer que todas las pantallas lean de ella en lugar de `lib/data.ts`, `seededScores()` y `localStorage`.

---

## 1. Por qué existe este spec

SPEC 04 conectó la aplicación con Supabase y dejó el esquema `public` vacío a propósito. SPEC 05 puso un juego real en marcha, y con él la primera puntuación que merece sobrevivir a un vaciado de caché. Hoy conviven tres ficciones que ya no se sostienen: un catálogo hardcodeado (`lib/data.ts`), unos rankings inventados (`seededScores()`) y unas marcas que solo existen en el navegador que las creó (`localStorage['av_scores']`). Este spec las sustituye por datos de verdad.

**Este spec no trae autenticación.** El alias del jugador sigue siendo el de `localStorage['av_user']`: un nombre de recreativa que cualquiera puede escribir. Es una decisión consciente y temporal, y condiciona todo lo que sigue —especialmente el índice único por alias y la ausencia de un bloque «tu marca» fiable—.

---

## 2. Alcance

### Dentro

- **Las tablas se crean de verdad**, no se dejan escritas para más tarde. `/spec-impl` ejecuta `mcp__supabase__apply_migration` contra el proyecto Supabase que ya usa la aplicación —`ekcduxcscntnisfhbiqc`, el de `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`—, que hoy tiene **0 tablas y 0 migraciones**. No hay rama de Supabase de por medio (es una función de pago y este proyecto está en el plan Free): se aplica directamente sobre él. Todo lo que sigue es gratuito en ese plan.
- **Copia versionada del SQL** en `supabase/migrations/`, un fichero por migración con el mismo nombre que registre Supabase (`NNNNNNNNNNNNNN_nombre.sql`), más su reversión (§3.9). Es documentación ejecutable y revisable en el PR; **no** se instala el CLI, ni Docker, ni se usa `db push`.
- **Esquema nuevo en Supabase**, aplicado con esas migraciones:
  - Tres enums: `game_category`, `game_color`, `score_order`.
  - Tabla **`games`**: los 8 juegos de `lib/data.ts` sembrados en la misma migración, más las columnas de reglas por juego (`score_order`, `score_label`, `leaderboard_size`, `max_score`) y el nombre de su tabla de marcas (`scores_table`).
  - **Ocho tablas físicas de marcas**, una por juego: `scores_bloque_buster`, `scores_caida`, `scores_serpentina`, `scores_gloton`, `scores_invasores`, `scores_rocas`, `scores_ranaria`, `scores_duelo_pixel`. Idénticas en forma, independientes en datos: el alias `PX_KAI` de ROCAS y el de CAÍDA no son la misma persona.
  - **RLS activo en las nueve tablas**: `SELECT` para `anon` y `authenticated`; **ninguna política de `INSERT`, `UPDATE` o `DELETE`**.
  - Vista **`leaderboard`** (`union all` de las ocho tablas con su `game_id`) y vista **`game_stats`** (`plays` y `best` derivados), ambas `security_invoker`.
  - Función de lectura **`top_scores(p_game)`**, que aplica el orden y el tamaño de ranking de cada juego.
  - Función de escritura **`submit_score(p_game, p_name, p_score)`**, `security definer`: la única puerta por la que entra una marca.
- **Tipos regenerados** en `lib/database.types.ts` con `mcp__supabase__generate_typescript_types`.
- **Cliente de lectura sin cookies** en `lib/supabase/read.ts`, para datos públicos y para `generateStaticParams`.
- **Capa de acceso** en `lib/catalog.ts` (tipos del catálogo + lecturas de `games` y `game_stats`) y `lib/leaderboard.ts` (lecturas de `top_scores`).
- **Server Action** `submitScore` en `app/juegos/[id]/jugar/actions.ts`, con validación y límite por IP reutilizando `lib/rate-limit.ts`.
- **Todas las pantallas que hoy leen `GAMES` pasan a leer la base**: home, biblioteca, detalle, reproductor y Salón de la Fama.
- **`best` y `plays` reales**: el máximo y el recuento de marcas de cada juego, no los números del prototipo. Sin marcas, «—» y `0`.
- **Estado de error tematizado** («SEÑAL PERDIDA») cuando la base no responde, en biblioteca, detalle y salón.
- **Fila propia resaltada** en los rankings: si el alias de `av_user` aparece en la tabla, su fila se destaca.
- **Retirada de tres ficheros**: `lib/data.ts`, `lib/scores.ts` (`seededScores`, `detailSeed`, `hallSeed`, `PLAYERS`) y `lib/local-scores.ts` (`av_scores`).

### Fuera (explícitamente)

- **Autenticación.** Nada de `supabase.auth`, ni pantalla `/acceso` reescrita, ni `user_id` en las marcas. `localStorage['av_user']` sigue siendo la sesión y `SessionProvider` no se toca.
- **Reclamar marcas antiguas.** Lo guardado hoy en `localStorage['av_scores']` **se pierde**. No hay migración, ni aviso, ni botón de importar: son datos de una demo.
- **Panel de administración.** El catálogo se siembra por migración. No hay CRUD de juegos en la aplicación, ni formulario, ni ruta protegida.
- **Historial de partidas.** Solo se guarda la mejor marca por alias y juego. Quien mejora su récord pisa el anterior; no queda rastro del viejo.
- **Realtime.** Los rankings no se actualizan solos: se ven al cargar la página.
- **Reglas de juego distintas de las tres columnas acordadas.** `score_order`, `score_label` y `leaderboard_size` existen desde el día uno; hoy los ocho juegos se siembran con los mismos valores (`desc`, `PUNTOS`, `12`). No se inventa ningún juego que use otra cosa.
- **Nuevos motores de juego.** Los siete «PRÓXIMAMENTE» de SPEC 05 siguen igual. Tendrán leaderboard vacío y visible, que es precisamente lo que se quiere.
- **La banda de estadísticas y el ticker de la home** (`lib/home-data.ts`): siguen siendo contenido de escaparate fijo. Lo único que la home pasa a leer de la base es el rail de juegos.
- **Clave secreta de servidor.** Se mantiene la prohibición de SPEC 04: no se define `SUPABASE_SECRET_KEY` ni se usa `service_role`. Por eso la escritura va por `security definer`.
- **Supabase CLI, stack local y `db push`.** No se instala `supabase` como dependencia, no hay `supabase/config.toml` ni Docker. La carpeta `supabase/migrations/` **sí** aparece, pero solo como copia versionada de lo que se aplicó por MCP: nadie la ejecuta con el CLI. Esto matiza el «fuera de alcance» de SPEC 04, que descartó la carpeta por ir unida al CLI.
- **Ramas de Supabase** (`create_branch` / `merge_branch`). Son de plan de pago y el proyecto está en Free: se trabaja directamente sobre `ekcduxcscntnisfhbiqc`.
- **Un segundo proyecto de Supabase** para desarrollo. Hay uno solo y es el que se usa.
- **Tests.** Sigue sin haber runner configurado.
- **Edición del prototipo** en `references/templates/`.

---

## 3. Modelo de datos

### 3.1 Enums

```sql
create type public.game_category as enum ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS');
create type public.game_color    as enum ('cyan', 'magenta', 'yellow', 'green');
create type public.score_order   as enum ('asc', 'desc');
```

Son enums y no `text` con `check` para que los tipos generados salgan como uniones de TypeScript y sustituyan literalmente a las que hoy declara `lib/data.ts`.

### 3.2 `public.games`

| Columna            | Tipo            | Notas                                                 |
| ------------------ | --------------- | ----------------------------------------------------- |
| `id`               | `text` PK       | El id del prototipo: `rocas`, `bloque-buster`…        |
| `title`            | `text` not null |                                                       |
| `short`            | `text` not null | Frase de la tarjeta                                   |
| `long`             | `text` not null | Copy del detalle                                      |
| `cat`              | `game_category` |                                                       |
| `cover`            | `text` not null | Clase CSS `cover-*` ya existente en `globals.css`     |
| `color`            | `game_color`    |                                                       |
| `sort_order`       | `int` not null  | Conserva el orden del array `GAMES`; único            |
| `scores_table`     | `text` not null | Único. `check (scores_table ~ '^scores_[a-z0-9_]+$')` |
| `score_order`      | `score_order`   | Default `'desc'`                                      |
| `score_label`      | `text` not null | Default `'PUNTOS'`                                    |
| `leaderboard_size` | `int` not null  | Default `12`. `check between 3 and 50`                |
| `max_score`        | `int` not null  | Default `10000000`. Tope que valida `submit_score`    |
| `created_at`       | `timestamptz`   | Default `now()`                                       |

**No hay columna `best` ni `plays`.** Eran números inventados del prototipo; ahora se derivan de las marcas (§3.4).

Siembra (misma migración), respetando el contenido actual de `lib/data.ts` palabra por palabra:

| `id`            | `scores_table`         | `sort_order` |
| --------------- | ---------------------- | ------------ |
| `bloque-buster` | `scores_bloque_buster` | 1            |
| `caida`         | `scores_caida`         | 2            |
| `serpentina`    | `scores_serpentina`    | 3            |
| `gloton`        | `scores_gloton`        | 4            |
| `invasores`     | `scores_invasores`     | 5            |
| `rocas`         | `scores_rocas`         | 6            |
| `ranaria`       | `scores_ranaria`       | 7            |
| `duelo-pixel`   | `scores_duelo_pixel`   | 8            |

Los guiones del id se convierten en guion bajo en el nombre de la tabla, y `scores_table` guarda la correspondencia exacta para que `submit_score` no tenga que adivinarla.

### 3.3 Las ocho tablas de marcas

Todas idénticas. Plantilla (sustituyendo `<slug>`):

```sql
create table public.scores_<slug> (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  score      integer not null,
  created_at timestamptz not null default now(),
  constraint scores_<slug>_name_len   check (char_length(name) between 1 and 10),
  constraint scores_<slug>_score_sane check (score >= 0),
  constraint scores_<slug>_name_uniq  unique (name)
);

create index scores_<slug>_score_idx on public.scores_<slug> (score desc, created_at asc);
```

- **`unique (name)`** es lo que implementa «solo la mejor por alias y juego»: `submit_score` hace `on conflict (name) do update` y solo pisa la fila si la nueva marca es mejor según el `score_order` del juego.
- Un solo índice sirve para los dos órdenes: Postgres lo recorre hacia atrás cuando el juego ordena ascendente.
- El tope superior de `score` no va en el `check` sino en `submit_score`, porque es por juego (`games.max_score`) y una tabla no puede consultar otra desde una restricción.

### 3.4 Vistas derivadas

```sql
create view public.leaderboard with (security_invoker = on) as
  select 'bloque-buster'::text as game_id, id, name, score, created_at from public.scores_bloque_buster
  union all
  select 'caida'::text,        id, name, score, created_at from public.scores_caida
  union all
  -- … las ocho, en el orden de sort_order
  select 'duelo-pixel'::text,  id, name, score, created_at from public.scores_duelo_pixel;

create view public.game_stats with (security_invoker = on) as
  with raw as (
    select game_id, count(*)::int as plays, max(score) as high, min(score) as low
    from public.leaderboard
    group by game_id
  )
  select
    g.id as game_id,
    coalesce(r.plays, 0) as plays,
    case when g.score_order = 'asc' then r.low else r.high end as best
  from public.games g
  left join raw r on r.game_id = g.id;
```

`leaderboard` es la costura que devuelve la comodidad que las ocho tablas físicas quitan: la aplicación consulta un sitio, la base guarda en ocho. `game_stats` devuelve una fila por juego **siempre**, con `plays = 0` y `best = null` si nadie ha jugado —así la biblioteca no tiene que distinguir «juego sin marcas» de «juego inexistente»—.

### 3.5 Lectura de rankings: `top_scores`

```sql
create function public.top_scores(p_game text default null)
returns table (game_id text, rank int, name text, score int, created_at timestamptz)
language sql stable security invoker
set search_path = ''
as $$
  select t.game_id, t.rank::int, t.name, t.score, t.created_at
  from (
    select
      l.game_id, l.name, l.score, l.created_at, g.leaderboard_size,
      row_number() over (
        partition by l.game_id
        order by
          case when g.score_order = 'asc'  then l.score end asc,
          case when g.score_order = 'desc' then l.score end desc,
          l.created_at asc
      ) as rank
    from public.leaderboard l
    join public.games g on g.id = l.game_id
    where p_game is null or l.game_id = p_game
  ) t
  where t.rank <= t.leaderboard_size
  order by t.game_id, t.rank;
$$;
```

Un solo mecanismo para las dos pantallas: el detalle pide `top_scores('rocas')` y el Salón pide `top_scores()` —los ocho rankings de una vez, ya recortados y ordenados según las reglas de cada juego—. El empate se rompe por antigüedad: quien llegó antes va primero.

### 3.6 Escritura: `submit_score`

```sql
create function public.submit_score(p_game text, p_name text, p_score int)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  g public.games%rowtype;
  v_name text;
begin
  select * into g from public.games where id = p_game;
  if not found then
    raise exception 'juego desconocido: %', p_game using errcode = '22023';
  end if;

  v_name := left(upper(btrim(coalesce(p_name, ''))), 10);
  if v_name = '' then
    raise exception 'alias vacío' using errcode = '22023';
  end if;

  if p_score is null or p_score < 0 or p_score > g.max_score then
    raise exception 'puntuación fuera de rango' using errcode = '22003';
  end if;

  execute format(
    'insert into public.%I (name, score) values ($1, $2)
     on conflict (name) do update
       set score = excluded.score, created_at = now()
       where %I.score %s excluded.score',
    g.scores_table, g.scores_table,
    case when g.score_order = 'asc' then '>' else '<' end
  ) using v_name, p_score;
end;
$$;

revoke all on function public.submit_score(text, text, int) from public;
grant execute on function public.submit_score(text, text, int) to anon, authenticated;
```

- **`security definer` + `search_path = ''`**: la función corre con los permisos de su dueño (por eso puede escribir donde RLS no deja) y todos los objetos van cualificados con `public.` para que nadie pueda secuestrarla con un esquema propio.
- El nombre de tabla se interpola con **`%I`** y sale de nuestra propia columna `scores_table`, que además tiene un `check` de formato: no hay superficie de inyección.
- La cláusula `where … score < excluded.score` es lo que hace que una partida peor **no** borre tu récord. Para un juego `asc` la comparación se invierte.

### 3.7 RLS

```sql
alter table public.games enable row level security;
create policy games_read on public.games for select to anon, authenticated using (true);

-- y, para cada una de las ocho:
alter table public.scores_<slug> enable row level security;
create policy scores_<slug>_read on public.scores_<slug> for select to anon, authenticated using (true);
```

Sin políticas de escritura, RLS deniega `INSERT`, `UPDATE` y `DELETE` a todo el mundo. La consola del navegador puede leer el ranking; no puede tocarlo. La única grieta —deliberada— es `submit_score`, que valida antes de escribir.

### 3.8 Capa de TypeScript

| Fichero                            | Contenido                                                                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/supabase/read.ts`             | `createReadClient()`: `createClient<Database>` de `@supabase/supabase-js`, **sin cookies**. Para datos públicos y para `generateStaticParams` (que no tiene petición) |
| `lib/catalog.ts`                   | Tipos `Game`, `GameCategory`, `GameColor`, `CatFilter`, la constante `CATS`, y `listGames()`, `listGamesWithStats()`, `getGame(id)`, `listGameIds()`                  |
| `lib/leaderboard.ts`               | `type ScoreRow = { rank, name, score, at }`, `topScores(gameId)`, `allTopScores()`                                                                                    |
| `app/juegos/[id]/jugar/actions.ts` | Server Action `submitScore`                                                                                                                                           |
| `lib/rate-limit.ts`                | Se le añade `allowScore(ip)`: cubo propio, 20 envíos por 10 minutos                                                                                                   |
| `components/ui/signal-lost.tsx`    | Panel de error tematizado, reutilizado por las tres pantallas                                                                                                         |

`lib/catalog.ts` hereda los tipos que hoy exporta `lib/data.ts`, así que `lib/home-data.ts`, `lib/about-data.ts` y los componentes que solo importan `GameColor` o `Game` cambian **únicamente la ruta del import**.

Resultado de la Server Action, en la línea de `ContactState` de SPEC 03:

```ts
export type SubmitScoreState =
  | { status: "ok" }
  | {
      status: "error";
      code: "validation" | "rate_limit" | "provider";
      message: string;
    };
```

El detalle del error de Postgres se queda en el servidor (`console.error`); al cliente solo va un mensaje en español.

### 3.9 Los ficheros de migración

Tres migraciones, aplicadas en este orden con `mcp__supabase__apply_migration` sobre `ekcduxcscntnisfhbiqc` y copiadas acto seguido al repositorio:

| Nombre                      | Contenido                                                       |
| --------------------------- | --------------------------------------------------------------- |
| `001_catalogo_y_marcadores` | Enums, `games`, las ocho tablas, índices, RLS y las 9 políticas |
| `002_siembra_catalogo`      | Los ocho `insert` en `games`                                    |
| `003_vistas_y_funciones`    | `leaderboard`, `game_stats`, `top_scores`, `submit_score`       |

```
supabase/
  migrations/
    <timestamp>_catalogo_y_marcadores.sql
    <timestamp>_siembra_catalogo.sql
    <timestamp>_vistas_y_funciones.sql
  rollback/
    001_catalogo_y_marcadores.down.sql
    002_siembra_catalogo.down.sql
    003_vistas_y_funciones.down.sql
  README.md
```

- El nombre del fichero de `migrations/` debe coincidir con el que devuelva `mcp__supabase__list_migrations` tras aplicarla: es lo que permite contrastar repositorio y base.
- **`rollback/` no se aplica nunca en el camino feliz.** Cada fichero deshace exactamente su migración, en orden inverso (`drop function`, `drop view`, `delete from games`, `drop table`, `drop type`). Si los asesores del paso 4 o las pruebas del paso 3 fallan, se revierte ejecutando esos ficheros en vez de improvisar `drop` sueltos sobre la base.
- `supabase/README.md`: cuatro líneas diciendo que esta carpeta es una **copia** de lo aplicado por MCP, que el CLI no interviene, y cómo se aplica una migración nueva.
- La plantilla comentada para crear el noveno juego (tabla + índice + RLS + rama de la vista `leaderboard`) vive al final de `003_vistas_y_funciones.sql` (riesgo 1).

---

## 4. Plan de implementación

Cada paso deja el proyecto compilando. Hasta el 6 la aplicación se ve exactamente como hoy.

Los pasos 1 a 3 **modifican el proyecto Supabase real** (`ekcduxcscntnisfhbiqc`). Antes de empezar, confirmar con `mcp__supabase__list_tables` que sigue vacío; si ya hubiera tablas, parar y avisar en vez de aplicar nada encima.

0. **Carpeta y reversiones.** Crear `supabase/migrations/`, `supabase/rollback/` y `supabase/README.md` (§3.9). Escribir las tres migraciones y sus tres reversiones **antes** de aplicar nada: si el paso 3 falla, la marcha atrás ya está escrita y probada de lectura.

1. **Migración del esquema.** Aplicar `catalogo_y_marcadores` con `mcp__supabase__apply_migration`: los tres enums, `games`, las ocho tablas con sus índices y restricciones, RLS activo y las nueve políticas de lectura. Verificar con `mcp__supabase__list_tables` que aparecen las nueve tablas y con `mcp__supabase__list_migrations` que la migración quedó registrada; renombrar el fichero del repositorio con el nombre exacto que devuelva.

2. **Siembra del catálogo.** Aplicar `siembra_catalogo`: los ocho `insert` en `games`, copiando `title`, `short`, `long`, `cat`, `cover` y `color` de `lib/data.ts` sin cambiar una coma, y fijando `sort_order`, `scores_table` y las tres columnas de reglas con sus valores por defecto. Verificar con `select count(*) from public.games` → 8.

3. **Vistas y funciones.** Aplicar `vistas_y_funciones`: `leaderboard`, `game_stats`, `top_scores` y `submit_score`, con el `revoke`/`grant` de la última. Comprobar con `mcp__supabase__execute_sql` que `select * from public.top_scores()` devuelve cero filas sin error y que `select public.submit_score('rocas','TEST',1234)` inserta, que repetirla con `999` **no** baja la marca y que con `5000` sí la sube. Borrar la fila de prueba al terminar y confirmar que las ocho tablas vuelven a estar vacías.

4. **Asesores.** `mcp__supabase__get_advisors` (seguridad y rendimiento) y resolver lo que señale antes de seguir. Es la comprobación de que el `security definer` y las vistas quedaron como se quería.

5. **Tipos.** `mcp__supabase__generate_typescript_types` → `lib/database.types.ts`, conservando la cabecera de «no editar a mano».

6. **Cliente de lectura y capa de acceso.** `lib/supabase/read.ts`, `lib/catalog.ts` y `lib/leaderboard.ts`. Todavía no los usa nadie: el build debe seguir pasando.

7. **Biblioteca.** `app/biblioteca/page.tsx` pasa a `listGamesWithStats()`; el filtro por categoría y la búsqueda se resuelven en la consulta (`eq('cat', …)`, `ilike('title', …)`) en lugar de en memoria. `components/library/game-card.tsx` y `library-filters.tsx` cambian el import de tipos a `@/lib/catalog` y la tarjeta pinta `best`/`plays` derivados, con «—» si `best` es nulo.

8. **Detalle.** `app/juegos/[id]/page.tsx`: `generateStaticParams` usa `listGameIds()` (cliente de lectura, sin cookies), se añade `export const dynamicParams = false` para que un id desconocido sea 404 sin consultar la base, el juego sale de `getGame(id)` y el ranking de `topScores(id)`. `components/detail/leaderboard.tsx` recibe las filas nuevas, muestra la cabecera con `score_label` y pinta el estado vacío «SÉ EL PRIMERO» cuando no hay marcas.

9. **Reproductor.** `app/juegos/[id]/jugar/page.tsx` lee el juego de la base con el mismo `generateStaticParams`; `components/player/game-player.tsx` cambia el import de `Game` y sustituye la llamada a `saveScore()` por la Server Action. El `GameOverModal` pasa a tener tres estados visibles: guardando, guardado y error con reintento —hasta ahora guardar era instantáneo porque era `localStorage`—.

10. **Server Action.** `app/juegos/[id]/jugar/actions.ts` con `submitScore`: recorta el alias, comprueba que la puntuación es un entero finito, aplica `allowScore(clientIp())` —el mismo helper de IP que usa el contacto— y llama a `rpc('submit_score', …)` con el cliente de servidor. En caso de éxito, `revalidatePath('/salon')` y `revalidatePath('/juegos/[id]', 'page')`.

11. **Salón de la Fama.** `app/salon/page.tsx` pasa a ser `async` y llama a `allTopScores()`; `components/hall/hall-of-fame.tsx` sigue siendo cliente (las pestañas son interacción) pero recibe los ocho rankings ya cargados por props: cambiar de pestaña no va a la red. Se retira el bloque «TU MEJOR MARCA» y en su lugar se resalta la fila cuyo `name` coincide con el alias de `useSession()`, con scroll hasta ella. Podio y medallas, intactos.

12. **Home.** `app/page.tsx` obtiene los seis primeros juegos con `listGames()` y se los pasa a `GameRail`; `mini-card.tsx` y los componentes que solo importaban tipos cambian la ruta del import. `lib/home-data.ts` no se toca.

13. **Estado de error.** `components/ui/signal-lost.tsx` y su uso en biblioteca, detalle y salón: si la consulta devuelve error, panel «SEÑAL PERDIDA» con el lenguaje visual del Vault y un enlace de reintento. Probar de verdad, apagando la red o falseando la URL en `.env.local`.

14. **Retirada.** Borrar `lib/data.ts`, `lib/scores.ts` y `lib/local-scores.ts`. `grep -rn "local-scores\|seededScores\|@/lib/data" app components lib` debe salir vacío.

15. **Cierre.** `npm run lint` y `npm run build` limpios. Recorrido completo: jugar a ROCAS, morir, guardar la marca, verla en el detalle y en el salón, repetir con peor puntuación y comprobar que no pisa el récord, repetir con mejor y comprobar que sí. Verificar desde la consola del navegador que un `insert` directo en `scores_rocas` es rechazado por RLS.

---

## 5. Criterios de aceptación

- [ ] Las tablas existen **en el proyecto real**: `mcp__supabase__list_tables` sobre `ekcduxcscntnisfhbiqc` muestra `games` y las ocho tablas `scores_*`, todas con RLS activo, donde antes no había ninguna.
- [ ] `mcp__supabase__list_migrations` devuelve las tres migraciones, y `supabase/migrations/` contiene un `.sql` por cada una **con el mismo nombre**.
- [ ] `supabase/rollback/` tiene las tres reversiones y `supabase/README.md` explica que la carpeta es una copia de lo aplicado por MCP, sin CLI.
- [ ] Ejecutar las tres reversiones en orden inverso deja el esquema `public` igual que estaba (0 tablas, 0 vistas, 0 funciones, 0 enums). Comprobado en seco o dejado por escrito, nunca sobre la base con datos.
- [ ] `games` tiene los 8 juegos con el mismo título, copy, categoría, portada y color que tenía `lib/data.ts`.
- [ ] La biblioteca, el detalle, el reproductor, el salón y el rail de la home pintan datos venidos de Supabase; no queda ningún import de `@/lib/data`.
- [ ] `lib/data.ts`, `lib/scores.ts` y `lib/local-scores.ts` ya no existen en el repositorio.
- [ ] Al terminar una partida de ROCAS y guardar, la marca aparece en `/juegos/rocas` y en la pestaña ROCAS de `/salon` **tras recargar**, y sigue ahí al vaciar el `localStorage` del navegador.
- [ ] Guardar con el mismo alias una puntuación **peor** no cambia la fila existente; una **mejor** la sustituye, y en ningún caso hay dos filas con el mismo alias en el mismo juego.
- [ ] El mismo alias en dos juegos distintos produce dos filas independientes.
- [ ] Desde la consola del navegador, `supabase.from('scores_rocas').insert(...)` es rechazado, y `select` sobre la misma tabla funciona.
- [ ] `submit_score` con un `p_game` inexistente, con alias vacío o con una puntuación mayor que `max_score` lanza error y no inserta nada.
- [ ] El alias se guarda siempre en mayúsculas y con 10 caracteres como máximo, aunque se envíe en minúsculas y largo.
- [ ] Un juego sin ninguna marca muestra el ranking vacío con «SÉ EL PRIMERO», `plays` a 0 y `best` como «—», sin errores en consola.
- [ ] Los siete juegos sin motor siguen mostrando «PRÓXIMAMENTE» y ahora también su leaderboard (vacío).
- [ ] Con el alias de `av_user` presente en un ranking, su fila aparece resaltada; sin sesión o sin marca, no se resalta nada y no hay hueco en el diseño.
- [ ] Con la URL de Supabase falseada en `.env.local`, biblioteca, detalle y salón muestran «SEÑAL PERDIDA» y no una pantalla en blanco ni el error de Next.
- [ ] El cambio de pestaña en el Salón de la Fama es inmediato: no dispara ninguna petición de red.
- [ ] `mcp__supabase__get_advisors` no reporta ningún aviso de seguridad nuevo sobre las tablas, vistas o funciones creadas.
- [ ] Enviar 21 marcas seguidas desde la misma IP en menos de 10 minutos devuelve el error de límite en la número 21.
- [ ] Una ruta `/juegos/no-existe` devuelve 404 sin consultar la base.
- [ ] `lib/home-data.ts`, `lib/about-data.ts`, `lib/session-context.tsx`, el motor de `lib/games/` y las pantallas de `/acerca-de` y `/acceso` no cambian de comportamiento.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.

---

## 6. Decisiones tomadas y descartadas

| Decisión                                                  | Alternativa descartada                                     | Motivo                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ocho tablas físicas** de marcas                         | Una sola `scores` con columna `game_id`                    | Decisión explícita del usuario: cada juego debe ser independiente del otro. Se le presentó el coste (migración, RLS y código por cada juego nuevo) y lo aceptó. Las vistas `leaderboard` y `game_stats` devuelven la comodidad de consultar un solo sitio. |
| `games` como **fuente de verdad**                         | Mantener `lib/data.ts` y usar la tabla solo como FK        | Decisión del usuario. Dos catálogos que hay que mantener sincronizados a mano divergen el primer día que alguien edita uno.                                                                                                                                |
| **Todo migra en este spec** (incluida la home)            | Dividir en dos specs, o dejar la home con el catálogo fijo | Decisión del usuario. Evita un estado intermedio en el que la home miente y la biblioteca no.                                                                                                                                                              |
| Escritura por **`security definer`**                      | `SUPABASE_SECRET_KEY`, o política de `INSERT` para `anon`  | La clave secreta contradice una decisión explícita de SPEC 04; el `INSERT` abierto convierte la validación de la Server Action en decoración. La función es la única opción que valida de verdad sin añadir secretos.                                      |
| **Solo la mejor marca** por alias y juego                 | Guardar todas las partidas                                 | Decisión del usuario. El ranking nunca repite nombre y la tabla no crece sin sentido. Coste: se pierde el historial, que era la ventaja de la alternativa.                                                                                                 |
| Alias **escrito por el jugador**                          | Alias generado por el servidor, o alias + UUID anónimo     | Decisión del usuario: es un alias de recreativa, no una cuenta. El UUID anónimo se descartó por ser infraestructura para un auth que llegará con su propio spec.                                                                                           |
| `seededScores()` **se retira**                            | Sembrar sus filas en la base como datos de arranque        | Decisión del usuario. Un ranking vacío es honesto; uno poblado de nombres inventados indistinguibles de los reales, no.                                                                                                                                    |
| `localStorage['av_scores']` **se retira sin migrar**      | Mantenerlo como respaldo, o subir lo guardado              | Decisión del usuario: una sola fuente de verdad. Lo que había era de una demo y su pérdida es aceptable.                                                                                                                                                   |
| **Tres columnas de reglas** por juego desde el día uno    | Sin columnas; añadirlas cuando haga falta                  | Decisión del usuario. `score_order`, `score_label` y `leaderboard_size` cuestan tres columnas hoy y evitan una migración con datos dentro mañana. Hoy los ocho juegos comparten valores.                                                                   |
| `best` y `plays` **derivados**                            | Columnas estáticas migradas, o desnormalizadas             | Los valores del prototipo eran inventados. Derivarlos no puede desincronizarse; una columna que la Server Action actualiza, sí.                                                                                                                            |
| **Nombres con guion bajo** (`scores_bloque_buster`)       | El id literal entre comillas (`"scores_bloque-buster"`)    | Decisión del usuario. Identificadores sin comillas en todo el SQL; la columna `scores_table` guarda la correspondencia exacta.                                                                                                                             |
| **Enums de Postgres** para `cat`, `color` y `score_order` | `text` con `check`                                         | Los tipos generados salen como uniones de TypeScript y sustituyen exactamente a las que declaraba `lib/data.ts`. Coste: ampliar un enum es una migración.                                                                                                  |
| Lectura en **Server Components, sin caché**               | Cliente con `useEffect`, o SSR cacheado 60s                | Decisión del usuario. Datos siempre frescos, cero JS de consulta en el navegador y ningún estado de carga que diseñar.                                                                                                                                     |
| **Fila propia resaltada** en lugar de «TU MEJOR MARCA»    | Consultar el bloque propio por alias, o quitarlo sin más   | Decisión del usuario. Sin auth, «tuyo» solo significa «coincide con tu alias»: resaltar es proporcional a esa certeza, y no cuesta ninguna consulta extra.                                                                                                 |
| **Estado de error tematizado**                            | Respaldo al catálogo estático, o `error.tsx` de Next       | Decisión del usuario. El respaldo obligaría a mantener para siempre el `lib/data.ts` que este spec elimina.                                                                                                                                                |
| **Límite por IP** reutilizando `lib/rate-limit.ts`        | Solo validación, o nada                                    | Decisión del usuario. Es el mismo limitador de SPEC 03 con otro cubo: corta el abuso trivial sin añadir servicios.                                                                                                                                         |
| `dynamicParams = false` en `/juegos/[id]`                 | Aceptar cualquier id y resolverlo contra la base           | Un id desconocido se responde con 404 sin tocar la red. Coste: un juego añadido a la base después del build no existe hasta el siguiente despliegue (riesgo 4).                                                                                            |
| **`/spec-impl` aplica las migraciones de verdad**         | Dejar el SQL escrito y aplicarlo a mano desde el panel     | Decisión del usuario: el objetivo del spec es que la base de datos de los juegos exista en Supabase al terminar. Dejar el SQL sin aplicar deja la aplicación rota hasta que alguien se acuerde.                                                            |
| Directo sobre **`ekcduxcscntnisfhbiqc`**, sin rama        | Rama de desarrollo con `create_branch` y `merge_branch`    | Las ramas de Supabase son de plan de pago y este es un proyecto de estudio en Free. El riesgo es asumible: la base está vacía y hay reversiones escritas.                                                                                                  |
| **Copia del SQL en `supabase/migrations/`**               | Solo la base como fuente de verdad, o un `schema.sql`      | Decisión del usuario. Sin copia, un `git clone` no basta para reconstruir el proyecto y el SQL nunca pasa por revisión. El volcado único se descartó por perder el historial migración a migración.                                                        |
| **Reversiones escritas antes de aplicar**                 | Improvisar `drop` a mano si algo falla                     | Decisión del usuario. Cuesta tres ficheros y evita tocar la base bajo presión, que es cuando se borra lo que no se debía.                                                                                                                                  |

---

## 7. Riesgos identificados

1. **Ocho tablas es una decisión que se paga en el futuro, no hoy.** Añadir el noveno juego no es insertar una fila en `games`: es una migración nueva (tabla, índice, restricciones, RLS, política) más una rama nueva en la vista `leaderboard`. Y hay que acordarse de las dos cosas: si se siembra el juego en `games` y se olvida la vista, el juego existe, se puede jugar, `submit_score` escribe correctamente… y su ranking sale vacío para siempre sin que nada falle. **Mitigación:** dejar la plantilla SQL completa comentada en la última migración, para que crear el siguiente juego sea copiar y sustituir el slug.

2. **`security definer` mal escrito es una puerta trasera.** Es el objeto más sensible de este spec. Sin `set search_path = ''` y sin cualificar todo con `public.`, un atacante que pueda crear objetos en otro esquema podría desviar lo que la función ejecuta. **Mitigación:** el paso 4 (asesores de seguridad) no es opcional, y la función no debe crecer con lógica nueva sin revisarla entera.

3. **El alias es de quien lo escriba primero.** `unique (name)` sin auth significa que el primero que guarde como `PX_KAI` en ROCAS se queda ese alias, y el siguiente que lo use solo podrá pisar esa fila si la supera. No es un fallo: es la consecuencia directa de no tener cuentas. Habrá que rediseñarlo en el spec de auth, y probablemente migrar los datos de entonces.

4. **Prerrenderizado contra base.** `generateStaticParams` consulta Supabase en build: sin `.env.local` o sin red, el build falla, y con `dynamicParams = false` un juego añadido después del despliegue devuelve 404 hasta la siguiente compilación. Es el precio de enumerar las rutas desde la base.

5. **Pérdida de datos irreversible.** El paso 14 borra `lib/local-scores.ts` y con él el acceso a `av_scores`. Lo guardado en los navegadores sigue ahí, huérfano, hasta que alguien limpie el almacenamiento. Está aceptado, pero conviene no descubrirlo después de enseñar el proyecto con marcas dentro.

6. **Rankings vacíos el primer día.** Al retirar `seededScores()`, las ocho pestañas del Salón de la Fama y las ocho tablas de detalle salen vacías hasta que alguien juegue —y solo hay un juego jugable—. La plataforma se verá más pobre que ahora. Es lo pedido y es honesto, pero es un retroceso visual que hay que anticipar.

7. **El límite en memoria no limita gran cosa.** `lib/rate-limit.ts` ya avisa de ello en SPEC 03: el contador se pierde en cada reinicio y no se comparte entre instancias serverless. Contra un abuso real hay que moverlo a un almacén compartido o a la propia base.

8. **No hay entorno de pruebas: se trabaja sobre el proyecto que usa la aplicación.** Sin rama de Supabase, cada `apply_migration` va a la base real y un error de SQL se corrige sobre ella. Hoy da igual —está vacía—, pero en cuanto haya marcas de verdad esto deja de ser aceptable y habrá que plantear una rama de pago o un segundo proyecto. **Mitigación:** las reversiones del paso 0, y verificar con `list_tables` que la base está vacía antes de empezar.

9. **La copia del repositorio puede quedarse atrás.** `supabase/migrations/` no se aplica ni se comprueba automáticamente: si alguien ejecuta SQL desde el panel de Supabase y no lo copia, el repositorio miente sobre el esquema y nadie se entera. **Mitigación:** contrastar `list_migrations` con el contenido de la carpeta cada vez que se toque el esquema; es la primera comprobación que debería hacer el siguiente spec que migre algo.

10. **Dos clientes de Supabase que es fácil confundir.** `lib/supabase/server.ts` (con cookies, obliga a render dinámico) y `lib/supabase/read.ts` (sin cookies). Usar el primero en `generateStaticParams` rompe el build; usar el segundo cuando haya sesión de verdad leerá como anónimo. **Mitigación:** una cabecera de comentario en cada fichero diciendo para qué es y para qué no.
