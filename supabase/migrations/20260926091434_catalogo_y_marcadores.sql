-- SPEC 06 · Migración 1/3 — catalogo_y_marcadores
--
-- Crea el catálogo (`games`) y las ocho tablas de marcas, una por juego.
-- Ocho tablas físicas es una decisión explícita del spec (§6): cada juego es
-- independiente del otro. La comodidad de consultar un solo sitio la devuelven
-- las vistas de la migración 3.
--
-- Esta migración NO inserta datos: la siembra es la migración 2.
-- Reversión: supabase/rollback/001_catalogo_y_marcadores.down.sql

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
-- Son enums y no `text` con `check` para que los tipos generados salgan como
-- uniones de TypeScript y sustituyan a las que declaraba lib/data.ts.

create type public.game_category as enum ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS');
create type public.game_color    as enum ('cyan', 'magenta', 'yellow', 'green');
create type public.score_order   as enum ('asc', 'desc');

-- ---------------------------------------------------------------------------
-- 2. Catálogo
-- ---------------------------------------------------------------------------
-- Sin columnas `best` ni `plays`: eran números inventados del prototipo y
-- ahora se derivan de las marcas (vista `game_stats`, migración 3).

create table public.games (
  id               text primary key,
  title            text not null,
  short            text not null,
  long             text not null,
  cat              public.game_category not null,
  cover            text not null,
  color            public.game_color not null,
  sort_order       integer not null,
  scores_table     text not null,
  score_order      public.score_order not null default 'desc',
  score_label      text not null default 'PUNTOS',
  leaderboard_size integer not null default 12,
  max_score        integer not null default 10000000,
  created_at       timestamptz not null default now(),

  constraint games_sort_order_uniq   unique (sort_order),
  constraint games_scores_table_uniq unique (scores_table),
  -- El nombre de tabla se interpola con %I dentro de submit_score. El check es
  -- la segunda cerradura: sin él, una fila con un nombre raro sería la vía de
  -- entrada a esa interpolación.
  constraint games_scores_table_fmt  check (scores_table ~ '^scores_[a-z0-9_]+$'),
  constraint games_lb_size_range     check (leaderboard_size between 3 and 50),
  constraint games_max_score_pos     check (max_score > 0)
);

comment on table public.games is
  'Catálogo de juegos. Fuente de verdad desde SPEC 06; sustituye a lib/data.ts.';
comment on column public.games.scores_table is
  'Tabla de marcas de este juego. Los guiones del id pasan a guion bajo: bloque-buster -> scores_bloque_buster.';
comment on column public.games.max_score is
  'Tope que valida submit_score. No es un check de la tabla de marcas porque es por juego.';

alter table public.games enable row level security;

create policy games_read on public.games
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 3. Las ocho tablas de marcas
-- ---------------------------------------------------------------------------
-- Todas idénticas. Se generan en bucle para que sean literalmente iguales: una
-- divergencia entre ellas rompería la vista `leaderboard` y submit_score.
--
-- `unique (name)` es lo que implementa «solo la mejor marca por alias y juego».
-- Un solo índice (score desc, created_at asc) sirve para los dos órdenes:
-- Postgres lo recorre hacia atrás cuando el juego ordena ascendente.
--
-- PLANTILLA PARA EL NOVENO JUEGO: añadir su slug a esta lista NO basta —esta
-- migración ya está aplicada—. Hay que escribir una migración nueva con el
-- mismo bloque para un solo slug, y además añadir su rama a la vista
-- `leaderboard` (ver el aviso al final de 20260926091843_vistas_y_funciones.sql).

do $$
declare
  slug text;
begin
  foreach slug in array array[
    'bloque_buster', 'caida', 'serpentina', 'gloton',
    'invasores', 'rocas', 'ranaria', 'duelo_pixel'
  ]
  loop
    execute format($fmt$
      create table public.scores_%1$s (
        id         uuid primary key default gen_random_uuid(),
        name       text not null,
        score      integer not null,
        created_at timestamptz not null default now(),

        constraint scores_%1$s_name_len   check (char_length(name) between 1 and 10),
        constraint scores_%1$s_score_sane check (score >= 0),
        constraint scores_%1$s_name_uniq  unique (name)
      );

      create index scores_%1$s_score_idx
        on public.scores_%1$s (score desc, created_at asc);

      alter table public.scores_%1$s enable row level security;

      create policy scores_%1$s_read on public.scores_%1$s
        for select to anon, authenticated
        using (true);

      comment on table public.scores_%1$s is
        'Marcas de un único juego (SPEC 06). Escritura solo vía public.submit_score.';
    $fmt$, slug);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Nota sobre permisos
-- ---------------------------------------------------------------------------
-- RLS queda activo en las nueve tablas con UNA SOLA política cada una: SELECT.
-- Sin políticas de INSERT/UPDATE/DELETE, RLS las deniega a anon y a
-- authenticated. La única puerta de escritura es submit_score (migración 3),
-- que es `security definer` y por eso sí puede escribir.
