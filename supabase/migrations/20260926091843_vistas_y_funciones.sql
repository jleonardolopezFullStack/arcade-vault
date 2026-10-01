-- SPEC 06 · Migración 3/3 — vistas_y_funciones
--
-- Las costuras que devuelven la comodidad que las ocho tablas físicas quitan:
-- la aplicación consulta un sitio, la base guarda en ocho.
--
--   leaderboard   vista · union all de las ocho tablas, con su game_id
--   game_stats    vista · plays y best derivados, una fila por juego SIEMPRE
--   top_scores()  lectura · aplica el orden y el tamaño de ranking de cada juego
--   submit_score() escritura · la única puerta por la que entra una marca
--
-- Reversión: supabase/rollback/003_vistas_y_funciones.down.sql

-- ---------------------------------------------------------------------------
-- 1. Vista unificada de marcas
-- ---------------------------------------------------------------------------
-- security_invoker: la vista respeta el RLS del que consulta, no el de quien la
-- creó. Sin esto, una vista sobre tablas con RLS sería un agujero.

create view public.leaderboard with (security_invoker = on) as
  select 'bloque-buster'::text as game_id, id, name, score, created_at from public.scores_bloque_buster
  union all
  select 'caida'::text,         id, name, score, created_at from public.scores_caida
  union all
  select 'serpentina'::text,    id, name, score, created_at from public.scores_serpentina
  union all
  select 'gloton'::text,        id, name, score, created_at from public.scores_gloton
  union all
  select 'invasores'::text,     id, name, score, created_at from public.scores_invasores
  union all
  select 'rocas'::text,         id, name, score, created_at from public.scores_rocas
  union all
  select 'ranaria'::text,       id, name, score, created_at from public.scores_ranaria
  union all
  select 'duelo-pixel'::text,   id, name, score, created_at from public.scores_duelo_pixel;

comment on view public.leaderboard is
  'Las ocho tablas de marcas vistas como una sola. Añadir un juego exige añadir su rama aquí.';

-- ---------------------------------------------------------------------------
-- 2. Estadísticas derivadas
-- ---------------------------------------------------------------------------
-- El left join es deliberado: devuelve fila para los ocho juegos aunque nadie
-- haya jugado (plays = 0, best = null). Así la biblioteca no tiene que
-- distinguir «juego sin marcas» de «juego inexistente».

create view public.game_stats with (security_invoker = on) as
  with raw as (
    select
      game_id,
      count(*)::integer as plays,
      max(score) as high,
      min(score) as low
    from public.leaderboard
    group by game_id
  )
  select
    g.id as game_id,
    coalesce(r.plays, 0) as plays,
    case when g.score_order = 'asc' then r.low else r.high end as best
  from public.games g
  left join raw r on r.game_id = g.id;

comment on view public.game_stats is
  'plays = nº de marcas, best = la mejor según el score_order del juego. Sustituye a las columnas inventadas del prototipo.';

-- ---------------------------------------------------------------------------
-- 3. Lectura de rankings
-- ---------------------------------------------------------------------------
-- Un solo mecanismo para las dos pantallas: el detalle pide top_scores('rocas')
-- y el Salón pide top_scores() —los ocho rankings de una vez, ya recortados y
-- ordenados—. El empate se rompe por antigüedad: quien llegó antes va primero.

create function public.top_scores(p_game text default null)
returns table (game_id text, rank integer, name text, score integer, created_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.game_id, t.rank::integer, t.name, t.score, t.created_at
  from (
    select
      l.game_id,
      l.name,
      l.score,
      l.created_at,
      g.leaderboard_size,
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

comment on function public.top_scores(text) is
  'Ranking recortado y ordenado según las reglas de cada juego. Sin argumento, los ocho.';

-- ---------------------------------------------------------------------------
-- 4. Escritura: la única puerta
-- ---------------------------------------------------------------------------
-- security definer + search_path = '': la función corre con los permisos de su
-- dueño (por eso puede escribir donde RLS no deja) y todos los objetos van
-- cualificados con public. para que nadie pueda secuestrarla con un esquema
-- propio.
--
-- No comprueba identidad porque en SPEC 06 todavía no hay auth: el alias es un
-- nombre de recreativa y cualquiera puede escribirlo. Lo que sí hace es validar
-- juego, alias y rango, que es lo que impide que la consola del navegador
-- inserte filas arbitrarias.
--
-- El nombre de tabla se interpola con %I y sale de games.scores_table, que
-- tiene un check de formato: no hay superficie de inyección.

create function public.submit_score(p_game text, p_name text, p_score integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g      public.games%rowtype;
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

  -- El `where` es lo que hace que una partida peor NO borre tu récord.
  -- Para un juego 'asc' la comparación se invierte.
  execute format(
    'insert into public.%1$I (name, score) values ($1, $2)
     on conflict (name) do update
       set score = excluded.score, created_at = now()
       where %1$I.score %2$s excluded.score',
    g.scores_table,
    case when g.score_order = 'asc' then '>' else '<' end
  ) using v_name, p_score;
end;
$$;

comment on function public.submit_score(text, text, integer) is
  'Única puerta de escritura de marcas. Valida juego, alias y rango; guarda solo si mejora la marca previa del alias.';

revoke all on function public.submit_score(text, text, integer) from public;
grant execute on function public.submit_score(text, text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PLANTILLA — añadir el noveno juego
-- ---------------------------------------------------------------------------
-- Ocho tablas físicas se pagan aquí. Crear un juego nuevo son TRES cosas, y
-- olvidar la segunda no falla: el juego existiría, se podría jugar,
-- submit_score escribiría bien… y su ranking saldría vacío para siempre.
--
--   1) La tabla, su índice, su RLS y su política:
--
--      create table public.scores_<slug> (
--        id         uuid primary key default gen_random_uuid(),
--        name       text not null,
--        score      integer not null,
--        created_at timestamptz not null default now(),
--        constraint scores_<slug>_name_len   check (char_length(name) between 1 and 10),
--        constraint scores_<slug>_score_sane check (score >= 0),
--        constraint scores_<slug>_name_uniq  unique (name)
--      );
--      create index scores_<slug>_score_idx on public.scores_<slug> (score desc, created_at asc);
--      alter table public.scores_<slug> enable row level security;
--      create policy scores_<slug>_read on public.scores_<slug>
--        for select to anon, authenticated using (true);
--
--   2) LA RAMA DE LA VISTA (esto es lo que se olvida):
--
--      create or replace view public.leaderboard with (security_invoker = on) as
--        ... las ocho de siempre ...
--        union all
--        select '<id-con-guiones>'::text, id, name, score, created_at from public.scores_<slug>;
--
--   3) La fila del catálogo:
--
--      insert into public.games (id, title, short, long, cat, cover, color, sort_order, scores_table)
--      values ('<id-con-guiones>', ..., 9, 'scores_<slug>');
