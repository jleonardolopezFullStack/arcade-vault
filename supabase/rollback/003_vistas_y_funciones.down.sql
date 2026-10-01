-- SPEC 06 · Reversión de migrations/20260926091843_vistas_y_funciones.sql
--
-- NO se aplica en el camino feliz. Está escrita de antemano para que, si algo
-- falla, la marcha atrás no se improvise sobre la base.
--
-- Orden: primero las funciones, luego las vistas (game_stats depende de
-- leaderboard). No toca ninguna tabla ni ningún dato.

drop function if exists public.submit_score(text, text, integer);
drop function if exists public.top_scores(text);

drop view if exists public.game_stats;
drop view if exists public.leaderboard;
