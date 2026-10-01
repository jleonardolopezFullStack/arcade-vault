-- SPEC 06 · Reversión de migrations/20260926091607_siembra_catalogo.sql
--
-- Vacía el catálogo y deja la tabla `games` en pie.
--
-- CUIDADO: `game_stats` hace left join desde `games`, así que tras esto la
-- biblioteca se queda sin juegos. Las marcas NO se borran —viven en sus ocho
-- tablas y no tienen clave foránea a `games`—, quedan huérfanas hasta que se
-- vuelva a sembrar.
--
-- Solo borra las ocho filas sembradas, no un `truncate`: si alguien añadió un
-- juego después, no es cosa de esta reversión llevárselo por delante.

delete from public.games
where id in (
  'bloque-buster', 'caida', 'serpentina', 'gloton',
  'invasores', 'rocas', 'ranaria', 'duelo-pixel'
);
