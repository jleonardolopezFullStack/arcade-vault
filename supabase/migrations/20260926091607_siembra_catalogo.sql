-- SPEC 06 · Migración 2/3 — siembra_catalogo
--
-- Los ocho juegos, copiados de lib/data.ts sin cambiar una coma. El fichero se
-- borra en el paso 14 del plan: a partir de aquí, este insert es el origen del
-- texto que se ve en pantalla.
--
-- `best` y `plays` del prototipo NO se migran: eran inventados y ahora se
-- derivan de las marcas reales (vista `game_stats`).
-- `score_order`, `score_label` y `leaderboard_size` se dejan en sus valores por
-- defecto ('desc', 'PUNTOS', 12) para los ocho: hoy ningún juego necesita otra
-- cosa, pero las columnas existen para que el primero que la necesite no
-- obligue a una migración con datos dentro.
--
-- Reversión: supabase/rollback/002_siembra_catalogo.down.sql

insert into public.games (id, title, short, long, cat, cover, color, sort_order, scores_table) values
  (
    'bloque-buster',
    'BLOQUE BUSTER',
    'Rebota la pelota y destruye muros de neón.',
    'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?',
    'ARCADE',
    'cover-bricks',
    'cyan',
    1,
    'scores_bloque_buster'
  ),
  (
    'caida',
    'CAÍDA',
    'Encaja las piezas antes de que el techo te aplaste.',
    'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.',
    'PUZZLE',
    'cover-tetro',
    'magenta',
    2,
    'scores_caida'
  ),
  (
    'serpentina',
    'SERPENTINA',
    'Crece sin morder tu propia cola.',
    'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.',
    'ARCADE',
    'cover-snake',
    'green',
    3,
    'scores_serpentina'
  ),
  (
    'gloton',
    'GLOTÓN',
    'Devora puntos y escapa de los fantasmas.',
    'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.',
    'ARCADE',
    'cover-glot',
    'yellow',
    4,
    'scores_gloton'
  ),
  (
    'invasores',
    'INVASORES',
    'Defiende el planeta de filas alienígenas.',
    'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.',
    'SHOOTER',
    'cover-invaders',
    'green',
    5,
    'scores_invasores'
  ),
  (
    'rocas',
    'ROCAS',
    'Pulveriza asteroides en gravedad cero.',
    'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.',
    'SHOOTER',
    'cover-rocas',
    'yellow',
    6,
    'scores_rocas'
  ),
  (
    'ranaria',
    'RANARIA',
    'Cruza la autopista de pixeles.',
    'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.',
    'ARCADE',
    'cover-rana',
    'green',
    7,
    'scores_ranaria'
  ),
  (
    'duelo-pixel',
    'DUELO PIXEL',
    'Dos paletas. Una pelota. Reflejos máximos.',
    'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.',
    'VERSUS',
    'cover-duelo',
    'cyan',
    8,
    'scores_duelo_pixel'
  );
