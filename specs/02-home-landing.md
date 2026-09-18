# SPEC 02 — Landing de inicio y reubicación de la Biblioteca

**Estado:** Implementado
**Depende de:** SPEC 01
**Fecha:** 2026-09-17

**Objetivo:** Portar la landing de `references/templates/home-about/home.jsx` a la ruta `/`, moviendo el catálogo a `/biblioteca` y ampliando el nav a cuatro enlaces.

---

## 1. Alcance

### Dentro

- **Landing en `/`** (Server Component) con las siete secciones del prototipo:
  | Bloque | Contenido |
  |---|---|
  | Hero | Eyebrow «▸ INSERTA UNA MONEDA\_», título de tres líneas, subtítulo, dos CTAs y el indicador «DESLIZA ▼», sobre ocho siluetas SVG flotantes |
  | `// 01` | «¿POR QUÉ ARCADE VAULT?» — cuatro tarjetas con icono pixel (GAMEPAD · FREE · TROPHY · ROCKET) |
  | `// 02` | «JUEGOS DISPONIBLES AHORA» — rail de seis `MiniCard` + botón «VER TODOS LOS JUEGOS →» |
  | Stats | Tres bloques (12+ / MILES / GLOBAL) sobre banda con borde superior e inferior |
  | `// 03` | «ACTIVIDAD EN VIVO» — ticker de últimas puntuaciones + top 5 de jugadores con barra de progreso |
  | `// 04` | «PRECIOS» — tarjeta de plan único $0 con sello «FREE PLAY» + tres preguntas frecuentes |
  | CTA final | «¿LISTO PARA JUGAR?» + «INSERTAR MONEDA →» |
- **Traslado del catálogo** de `/` a `/biblioteca`, conservando intactos su hero, sus filtros en la URL (`?q=`, `?cat=`) y su grid.
- **Nav de cuatro enlaces**: Inicio · Biblioteca · Salón de la Fama · Acerca de, en la barra de escritorio y en el cajón móvil.
- **Actualización de todos los enlaces** que hoy tratan `/` como «el Vault» (detalle, 404, salón, reproductor, game over, acceso).
- **Datos de escaparate** en `lib/home-data.ts`, tipados, con los valores literales del prototipo.
- **Efecto `reveal`**: las secciones entran al hacer scroll mediante un `IntersectionObserver` encapsulado en un componente cliente.
- **Metadata propia** para `/` y para `/biblioteca`.

### Fuera (explícitamente)

- **La pantalla «Acerca de».** `about.jsx` (misión, destacados, formulario de contacto y terminal de éxito) es un spec aparte. El enlace del nav existe y apunta a `/acerca-de`, que **devolverá el 404 tematizado** hasta entonces.
- **Datos reales de actividad.** El ticker y el top de jugadores son constantes fijas; no se leen de `localStorage`, ni de `seededScores`, ni de ningún backend. No hay refresco en vivo: las filas se pintan una vez.
- **Planes de pago reales.** La sección de precios es copy; no hay pasarela, ni cuentas de pago, ni comparativa de planes.
- **Ajustar las cifras de marketing al catálogo real.** «12+ JUEGOS» y «MILES DE PARTIDAS» se portan tal cual aunque `GAMES` tenga ocho entradas.
- **Redirecciones de compatibilidad.** No se añade ningún `redirect()` de `/` al catálogo: los enlaces antiguos se actualizan en el código, no se reescriben en runtime.
- **Tests.** Sigue sin haber runner configurado.
- Edición del prototipo en `references/templates/`. Se porta desde él, no se toca.

---

## 2. Modelo de datos

No hay persistencia nueva. Todo son constantes estáticas renderizadas en servidor.

### `lib/home-data.ts` — contenido de escaparate

```ts
import type { GameColor } from "@/lib/data";

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export type HomeFeature = {
  icon: FeatureIconKind;
  title: string; // "JUEGOS CLÁSICOS"
  desc: string;
  color: GameColor; // cyan | yellow | magenta | green
};

export type ActivityRow = {
  player: string; // "NEONFOX"
  game: string; // "Caída" — texto libre, no un Game["id"]
  score: number;
  when: string; // "hace 2 min", ya formateado
  color: GameColor;
};

export type TopPlayerRow = {
  rank: number; // 1..5
  player: string;
  score: number;
};

export type HomeStat = {
  n: string; // "12+"
  unit: string; // "JUEGOS"
  sub: string; // "Y CONTANDO"
};

export type FaqItem = { q: string; a: string };

export const FEATURES: readonly HomeFeature[]; // 4
export const HOME_STATS: readonly HomeStat[]; // 3
export const ACTIVITY: readonly ActivityRow[]; // 7
export const TOP_PLAYERS: readonly TopPlayerRow[]; // 5
export const PLAN_FEATURES: readonly string[]; // 6 líneas del plan $0
export const FAQ: readonly FaqItem[]; // 3
```

Los seis juegos del rail **no** se duplican aquí: salen de `GAMES.slice(0, 6)` de `lib/data.ts`.

### Formato de puntuaciones

El prototipo usa `score.toLocaleString("es-ES")`. Se sustituye por el `formatScore()` ya existente en `lib/format.ts`, por la misma razón que en SPEC 01: no depender del ICU del runtime y eliminar el riesgo de desajuste servidor/cliente.

---

## 3. Plan de implementación

Cada paso deja la aplicación compilando y navegable.

### Paso 1 — Mover el catálogo a `/biblioteca`

- `app/page.tsx` → `app/biblioteca/page.tsx`, sin cambios de contenido salvo el nombre del componente (`Home` → `Library`) y su `metadata`.
- Actualizar los destinos que significan «volver al catálogo»:
  - `app/not-found.tsx` — botón «VOLVER AL VAULT».
  - `app/juegos/[id]/page.tsx` — botón «VOLVER AL VAULT».
  - `components/hall/hall-of-fame.tsx` — botón inferior.
  - `components/player/game-player.tsx` — `onExit` del modal de game over.
  - `components/auth/auth-form.tsx` — los dos `router.push("/")` (envío del formulario y «JUGAR COMO INVITADO»).
- `app/page.tsx` queda temporalmente como un placeholder mínimo para que la ruta no falte.
- El logo del nav sigue apuntando a `/`, que ahora es la landing — igual que en el prototipo.
- Verificación: `/biblioteca?q=serp` filtra como antes y ningún botón de la app lleva a una página vacía.

### Paso 2 — Nav de cuatro enlaces

- En `components/nav.tsx`, `LINKS` pasa a `Inicio /` · `Biblioteca /biblioteca` · `Salón de la Fama /salon` · `Acerca de /acerca-de`.
- `isActive` cambia de regla: `/` deja de absorber `/juegos/*` y pasa a coincidencia exacta; `/biblioteca` es quien marca activo en `/juegos/*`.
- El cajón móvil lista los mismos cuatro enlaces más la fila de sesión que ya tenía.
- Verificación: en `/` solo se ilumina Inicio; en `/juegos/caida` solo Biblioteca; en `/acerca-de` se ilumina Acerca de y se ve el 404 tematizado.

### Paso 3 — `lib/home-data.ts`

- Crear el archivo con los tipos y las constantes del apartado 2, copiando los valores literales del prototipo.
- Verificación: `npm run build` pasa; el archivo aún no lo consume nadie.

### Paso 4 — Capa CSS de la landing

Se añade a `app/globals.css` **solo** lo que Tailwind no expresa con comodidad:

- `.reveal` / `.reveal.in` (opacidad + `translateY`), con el bloque `@media (prefers-reduced-motion: reduce)` que deja las secciones visibles y sin transición.
- `@keyframes float` (siluetas), `bounce` (flecha «DESLIZA»), `tickin` (filas del ticker).
- `.home-silos .s1` … `.s8`: posición, tamaño, color y `animation-delay` de cada silueta. Incluye los tres colores que **no** son tokens del tema (`#aa00ff`, `#ff3060`, `#00d4ff`); se dejan como literales aquí, no se añaden a `@theme inline` porque son decorativos y de un solo uso.
- Los dos degradados recortados sobre texto (título del hero y el «$0» de la tarjeta de precios), que necesitan `background-clip: text`.

Todo lo demás —rejillas, tipografía, bordes, colores, resplandores de hover— se escribe con utilidades, reutilizando `Button`/`buttonStyles` de `components/ui/button.tsx` y `Panel` de `components/ui/panel.tsx` en lugar de repetir las composiciones.

Puntos de ruptura a respetar, tomados del prototipo: features 4→2 a 980 px y 2→1 a 520 px; rail 6→3 a 1100 px y 3→2 a 600 px; stats 3→1 a 720 px (con el borde pasando de izquierdo a superior); actividad y precios 2→1 a 900 px; filas del ticker a dos líneas a 520 px.

### Paso 5 — `components/home/reveal.tsx`

- Componente cliente que envuelve a sus hijos, observa su propio nodo con `IntersectionObserver` (`threshold: 0.12`), añade la clase `in` al entrar y hace `unobserve` de inmediato.
- Si `matchMedia("(prefers-reduced-motion: reduce)")` coincide, no observa nada y marca el contenido como visible desde el primer pintado.
- Verificación: al bajar por la página las secciones aparecen una a una; con movimiento reducido activado se ven todas de entrada.

### Paso 6 — Secciones de la landing

Bajo `components/home/`, todas Server Components salvo donde se indique:

- `hero.tsx` + `floating-silhouettes.tsx` (SVG estáticos, `aria-hidden`): eyebrow, título de tres líneas, subtítulo, CTAs «▶ EXPLORAR JUEGOS» → `/biblioteca` y «✦ CREAR CUENTA» → `/acceso`, e indicador de scroll.
- `feature-grid.tsx` + `feature-icon.tsx`: las cuatro tarjetas de `FEATURES`, con retardo escalonado de 80 ms.
- `game-rail.tsx` + `mini-card.tsx`: `GAMES.slice(0, 6)`, cada tarjeta un `<Link>` a `/juegos/[id]` con su portada `cover-bg cover-*`; debajo, «VER TODOS LOS JUEGOS →» → `/biblioteca`.
- `stats-band.tsx`: los tres bloques de `HOME_STATS`.
- `activity.tsx`: tarjeta «▸ ÚLTIMAS PUNTUACIONES» con las filas de `ACTIVITY` y tarjeta «▸ TOP JUGADORES · HOY» con `TOP_PLAYERS`, su barra de relleno (`100 - i * 16`%), el realce de los tres primeros puestos y el enlace «VER SALÓN →» → `/salon`.
- `pricing.tsx`: tarjeta del plan único con `PLAN_FEATURES` y el sello rotado «FREE PLAY», más las tres entradas de `FAQ`. CTA «EMPEZAR GRATIS →» → `/acceso`.
- `final-cta.tsx`: «¿LISTO PARA JUGAR?» + «INSERTAR MONEDA →» → `/biblioteca`.

`app/page.tsx` los compone en orden, envolviendo en `<Reveal>` las secciones que en el prototipo llevan la clase `reveal` (todas menos el hero).

### Paso 7 — Metadata

- `/` — título de la home y descripción con el reclamo del hero.
- `/biblioteca` — su propio título, para que deje de heredar el de la raíz.
- Verificación: `<title>` distinto en ambas rutas.

### Paso 8 — Cierre

- `npm run lint` y `npm run build` limpios.
- Repaso lado a lado de `/` contra `references/templates/home-about/arcade-vault-standalone.html` a 1440 px, 900 px y 390 px.
- Commit de `AGENTS.md` si `next dev` lo regeneró.

---

## 4. Criterios de aceptación

- [ ] `npm run build` termina sin errores ni warnings de tipos.
- [ ] `npm run lint` no reporta errores.
- [ ] `/` renderiza la landing con sus siete bloques en el orden del prototipo.
- [ ] `/biblioteca` renderiza el catálogo completo, y `/biblioteca?q=serp` sigue dejando una sola tarjeta y `/biblioteca?cat=PUZZLE` exactamente una.
- [ ] Ningún archivo de `app/` o `components/` enlaza ya a `/` esperando encontrar el catálogo.
- [ ] Desde el detalle, el salón, el 404, el modal de game over y el formulario de acceso se llega a `/biblioteca`, no a la landing.
- [ ] El nav muestra cuatro enlaces en escritorio y los mismos cuatro en el cajón móvil.
- [ ] Inicio se marca activo **solo** en `/`; Biblioteca se marca activa en `/biblioteca` y en `/juegos/*`.
- [ ] `/acerca-de` muestra el 404 tematizado de `app/not-found.tsx`.
- [ ] Las secciones por debajo del hero empiezan invisibles y aparecen al entrar en el viewport.
- [ ] Con `prefers-reduced-motion: reduce` todas las secciones son visibles sin hacer scroll y no hay transición.
- [ ] El rail muestra seis juegos y cada uno navega a su detalle.
- [ ] Las puntuaciones de la home se muestran con separador de millares `.` y coinciden con las del prototipo.
- [ ] Las ocho siluetas del hero se ven, flotan y no capturan clics.
- [ ] `<title>` de `/` y de `/biblioteca` son distintos.
- [ ] A 1440, 900 y 390 px ninguna sección desborda horizontalmente.
- [ ] La consola del navegador no muestra ningún error de hidratación en `/` ni en `/biblioteca`.
- [ ] Ningún archivo de `references/templates/` ha sido modificado.

---

## 5. Decisiones tomadas y descartadas

| Decisión                  | Elegido                                                  | Descartado                                                                               | Motivo                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alcance                   | Solo la landing y el nav                                 | Portar también `about.jsx` en este spec                                                  | Dos pantallas nuevas con un formulario de estados propios no caben en un spec verificable; «Acerca de» tendrá el suyo.                                            |
| Rutas                     | `/` landing, `/biblioteca` catálogo                      | Landing en `/inicio` dejando `/` como catálogo; catálogo en `/juegos`                    | Fidelidad al prototipo: el logo y el enlace Inicio apuntan a la landing. `/juegos` se reserva como segmento padre del detalle.                                    |
| Compatibilidad de enlaces | Actualizar los `href` en el código                       | `redirect()` de `/` al catálogo                                                          | No hay usuarios ni enlaces externos que preservar; una redirección permanente sobre la nueva home sería un error difícil de revertir.                             |
| Enlace «Acerca de»        | Presente en el nav apuntando a `/acerca-de`              | Omitirlo hasta que exista la pantalla                                                    | Elegido por el usuario: el nav queda en su forma definitiva y la ruta faltante cae en el 404 tematizado, que ya comunica el estado.                               |
| Datos de la home          | Constantes tipadas en `lib/home-data.ts`                 | Derivarlos de `GAMES` + `seededScores`; dejarlos incrustados en el JSX como el prototipo | Un único sitio que tocar cuando haya datos reales, sin inventar una lógica de agregación que el prototipo no define.                                              |
| Copy de marketing         | Port 1:1, incluidas «12+ JUEGOS» y la sección de precios | Ajustar las cifras a los ocho juegos reales; eliminar precios                            | Elegido por el usuario: fidelidad visual total. Se deja constancia aquí de que son cifras de escaparate.                                                          |
| Efecto de entrada         | `IntersectionObserver` en un componente cliente          | `animation-timeline: view()` sin JS; secciones siempre visibles                          | `view()` no está soportado en Safari ni Firefox, donde las secciones quedarían sin animar. El observador cuesta un componente cliente y funciona en todas partes. |
| Movimiento reducido       | `prefers-reduced-motion` desactiva el reveal             | Ignorarlo, como hace el prototipo                                                        | Un reveal basado en JS que no comprueba la preferencia puede dejar contenido invisible; aquí el degradado es a «todo visible».                                    |
| Siluetas del hero         | Ocho SVG inline en el servidor                           | Imagen única; sprite externo                                                             | Se colorean con `currentColor` y tokens, escalan sin pérdida y no añaden ninguna petición.                                                                        |
| Formato de números        | `formatScore()` de `lib/format.ts`                       | `toLocaleString("es-ES")` del prototipo                                                  | Coherencia con SPEC 01: sin dependencia del ICU del runtime.                                                                                                      |
| Estilos                   | Mismo híbrido de SPEC 01: utilidades + capa de efectos   | Copiar las ~200 líneas de `home-*` del prototipo tal cual                                | Mantiene una sola forma de escribir estilos en el proyecto; la capa CSS se queda con lo que Tailwind no expresa bien.                                             |

---

## 6. Riesgos identificados

1. **Enlaces huérfanos al mover el catálogo.** Cambiar `/` de significado rompe en silencio cualquier `href` que se escape; el fallo no es un error de compilación, sino un botón que lleva a la landing. Mitigación: el Paso 1 enumera los seis puntos afectados y hay un criterio de aceptación explícito de que no queda ninguno.
2. **`/acerca-de` en 404 durante un tiempo indefinido.** Es una decisión consciente, pero si el siguiente spec se retrasa el nav queda con un enlace muerto. Mitigación: el 404 está tematizado y ofrece volver; el spec de «Acerca de» es el siguiente de la cola.
3. **Peso y ruido visual del hero.** Ocho SVG animados con `drop-shadow` animan en el hilo principal en equipos modestos. Mitigación: son transformaciones (`translate`/`rotate`) compositables, sin animar layout, y el hero no lleva reveal.
4. **Contenido invisible si falla el reveal.** Si el `IntersectionObserver` no se ejecuta (error de JS, navegador antiguo), las secciones se quedan en `opacity: 0`. Mitigación: la rama de movimiento reducido ya prueba el camino «visible por defecto», y el criterio de aceptación exige verificarlo.
5. **Promesas del copy por encima del producto.** La home anuncia «12+ juegos» y «miles de partidas» sobre un catálogo de ocho juegos no jugables. Mitigación: queda registrado aquí como decisión deliberada de escaparate; revisarlo antes de cualquier despliegue público.
