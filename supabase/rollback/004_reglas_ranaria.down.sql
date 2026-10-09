-- GAME JAM «RANARIA» · SPEC 1/3 · Reversión de migrations/20261009035917_reglas_ranaria.sql
--
-- NO se aplica en el camino feliz. Devuelve el tope de RANARIA al valor
-- sembrado en SPEC 06. No toca la tabla, ni la vista, ni ninguna marca:
-- solo un número.

update public.games
   set max_score = 10000000
 where id = 'ranaria';
