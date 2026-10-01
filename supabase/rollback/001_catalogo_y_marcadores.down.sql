-- SPEC 06 · Reversión de migrations/20260926091434_catalogo_y_marcadores.sql
--
-- DESTRUCTIVA: borra las nueve tablas y con ellas TODAS LAS MARCAS GUARDADAS.
-- Aplicar solo si la reversión ocurre antes de que nadie haya jugado.
--
-- Deja el esquema `public` como estaba antes de SPEC 06: 0 tablas, 0 vistas,
-- 0 funciones, 0 enums.
--
-- Requiere haber aplicado antes 003_vistas_y_funciones.down.sql: las vistas
-- dependen de estas tablas. Sin ese paso previo, los `drop table` fallan (y es
-- bueno que fallen: avisan de que la reversión va en mal orden).

-- 1. Las ocho tablas de marcas. Mismo bucle que las creó.
do $$
declare
  slug text;
begin
  foreach slug in array array[
    'bloque_buster', 'caida', 'serpentina', 'gloton',
    'invasores', 'rocas', 'ranaria', 'duelo_pixel'
  ]
  loop
    execute format('drop table if exists public.scores_%1$s;', slug);
  end loop;
end;
$$;

-- 2. El catálogo.
drop table if exists public.games;

-- 3. Los enums, ya sin columnas que los usen.
drop type if exists public.score_order;
drop type if exists public.game_color;
drop type if exists public.game_category;
