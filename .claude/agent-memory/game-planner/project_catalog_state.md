---
name: project-catalog-state
description: Estado del catálogo Arcade Vault en la última ejecución (2026-10-06) y fuente alternativa si Supabase no responde
metadata:
  type: project
---

A 2026-10-06: 8 fichas sembradas en `public.games`; 4 con motor (rocas, caida, bloque-buster, serpentina) y 4 sin motor (gloton, invasores, ranaria, duelo-pixel). Ninguna referencia sin portar (las 3 de `references/` ya portadas); solo hay sprites de snake en `references/Assets/`.

**Why:** las 4 fichas sin motor ya tienen tabla `scores_*` y rama en `leaderboard`, así que son caso MOTOR (sin migración) y los candidatos más baratos.

**How to apply:** si `execute_sql` está denegado (pasó el 2026-10-06), leer el catálogo de `supabase/migrations/*_siembra_catalogo.sql` y avisar de que puede no reflejar cambios posteriores. Ver [[user-preferences]].
