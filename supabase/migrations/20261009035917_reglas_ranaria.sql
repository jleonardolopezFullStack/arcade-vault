-- GAME JAM «RANARIA» · SPEC 1/3 — Reglas de RANARIA.
--
-- La ficha, su tabla scores_ranaria y su rama en la vista leaderboard existen
-- desde SPEC 06. Lo único que cambia es el tope de marca: el motor de
-- lib/games/rana/ satura su contador en 999 999 (SCORE_CAP), y max_score se
-- alinea con él para que submit_score rechace con 22003 cualquier marca que
-- el juego no pueda producir.

-- 1) Guarda: no se baja el tope por debajo de una marca ya guardada.
do $$
begin
  if exists (select 1 from public.scores_ranaria where score > 999999) then
    raise exception 'scores_ranaria tiene marcas por encima de 999999'
      using errcode = '23514';
  end if;
end
$$;

-- 2) El tope nuevo.
update public.games
   set max_score = 999999
 where id = 'ranaria';
