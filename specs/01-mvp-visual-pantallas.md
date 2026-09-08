# SPEC 01 — MVP visual: las cinco pantallas de Arcade Vault

**Estado:** Implementado
**Depende de:** —
**Fecha:** 2026-09-07

**Objetivo:** Portar las cinco pantallas del prototipo `references/templates/` a rutas reales del App Router de Next 16, únicamente en su capa visual y de interacción, sin ningún juego jugable ni backend.

---

## 1. Alcance

### Dentro

- **Cinco rutas** con la estética del prototipo, en español:
  | Ruta | Pantalla | Origen |
  |---|---|---|
  | `/` | Biblioteca (hero + buscador + chips + grid) | `biblioteca.jsx` |
  | `/juegos/[id]` | Detalle del juego | `detalle.jsx` |
  | `/juegos/[id]/jugar` | Reproductor (marco CRT + HUD) | `reproductor.jsx` |
  | `/salon` | Salón de la Fama | `salon.jsx` |
  | `/acceso` | Acceso / crear cuenta | `auth.jsx` |
- **Shell global** en `app/layout.tsx`: nav superior con cajón móvil, `<main class="av-main">` y footer, visibles en todas las rutas incluida `/acceso`.
- **Sesión falsa** en cliente (`SessionProvider` + `localStorage['av_user']`) que alimenta el botón del nav y la fila «TU MEJOR MARCA» del salón.
- **Simulación del reproductor**: `setInterval` que sube la puntuación, HUD vivo, pausa, fin de partida y modal de game over con guardado en `localStorage['av_scores']`.
- **Filtros de la biblioteca en la URL** (`/?q=serp&cat=ARCADE`), renderizados en servidor.
- **Datos mock** portados a `lib/data.ts` (`GAMES`, `CATS`, `PLAYERS`, `seededScores`), tipados en TypeScript estricto.
- **Reescritura del marcado a utilidades Tailwind**, conservando en `globals.css` solo la capa de efectos que Tailwind no expresa bien.
- **404 tematizado** (`app/not-found.tsx`) y `notFound()` para ids de juego desconocidos.
- **Metadata por juego** vía `generateMetadata` en el detalle.

### Fuera (explícitamente)

- **Juegos jugables reales.** No hay motor, canvas ni lógica de juego. El reproductor es una simulación visual.
- **Backend y autenticación reales.** Sin base de datos, sin API, sin validación de credenciales. Los botones Google/GitHub son cosméticos y no hacen nada.
- **Tests.** No hay runner configurado y este spec no añade ninguno.
- **Accesibilidad y SEO avanzados.** Solo lo básico: `lang="es"`, `aria-label` en el botón de menú, `aria-current` en el nav, metadata por ruta. Sin auditoría a11y, sin `og:image`, sin sitemap.
- Edición del prototipo en `references/templates/`. Es la fuente de verdad: se porta desde él, no se toca.
- Panel de usuario, ajustes, créditos gastables, multijugador.

---

## 2. Modelo de datos

Todo vive en cliente/memoria. No hay servidor de datos.

### `lib/data.ts` — catálogo estático

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string; // "bloque-buster"
  title: string; // "BLOQUE BUSTER"
  short: string; // texto de la tarjeta
  long: string; // texto del detalle
  cat: GameCategory;
  cover: string; // clase CSS: "cover-bricks" | "cover-tetro" | …
  color: GameColor; // variante del botón JUGAR
  best: number;
  plays: string; // "12.4K", ya formateado
};

export const GAMES: Game[]; // los 8 del prototipo, sin cambios
export const CATS: readonly ["TODOS", ...GameCategory[]];
export const PLAYERS: readonly string[]; // 18 nicks
export function getGame(id: string): Game | undefined;
```

### `lib/scores.ts` — puntuaciones

```ts
export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string; // "dd/mm/2026"
};

// Puro y determinista: mismo seed → mismas filas. Portado 1:1 del prototipo.
export function seededScores(seed: number, count?: number): ScoreRow[];

// Semillas del prototipo, centralizadas para no repetir la aritmética:
export function detailSeed(id: string): number; // id.length * 17 + 3  → 10 filas
export function hallSeed(id: string): number; // id.length * 23 + 7  → 12 filas
```

### `lib/session-context.tsx` — sesión falsa

```ts
export type SessionUser = { name: string }; // "PX_KAI", máx. 10 chars, mayúsculas

type SessionValue = {
  user: SessionUser | null;
  ready: boolean; // false hasta hidratar localStorage
  signIn: (name: string) => void;
  signOut: () => void;
};

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element;
export function useSession(): SessionValue;
```

Persistencia: `localStorage['av_user']` = `{"name":"PX_KAI"}`. Lectura **solo dentro de `useEffect`**, nunca en el inicializador de estado, para no romper la hidratación.

### `lib/local-scores.ts` — marcas guardadas del usuario

```ts
export type SavedScore = {
  game: string; // Game["id"]
  name: string;
  score: number;
  at: number; // Date.now()
};

export function saveScore(entry: Omit<SavedScore, "at">): void; // append a av_scores
export function readScores(): SavedScore[]; // [] si falla el parseo
export function bestScoreFor(gameId: string): SavedScore | null; // máximo por juego
```

Persistencia: `localStorage['av_scores']` = array de `SavedScore`. Sin versionado de esquema: si el `JSON.parse` falla, se trata como lista vacía (los datos son desechables).

### `lib/format.ts`

```ts
// Separador de millares con "." insertado manualmente.
// NO usa toLocaleString: evita depender del ICU del runtime y elimina
// cualquier riesgo de desajuste servidor/cliente al hidratar.
export function formatScore(n: number): string; // 184220 → "184.220"
```

---

## 3. Plan de implementación

Cada paso deja la aplicación compilando y navegable.

### Paso 1 — Fundaciones de datos

- Crear `lib/data.ts`, `lib/scores.ts`, `lib/format.ts` portando `references/templates/data.jsx` con los tipos de arriba. Sin `window.*`, con `export`.
- Añadir `lib/session-context.tsx` (`"use client"`) y `lib/local-scores.ts`.
- Envolver el árbol con `<SessionProvider>` en `app/layout.tsx`.
- Verificación: `npm run build` pasa; la home sigue mostrando el hero placeholder.

### Paso 2 — Primitivas de UI reutilizables

Encapsulan las composiciones de utilidades que se repiten en todas las pantallas, para que el JSX no cargue cadenas de 20 clases.

- `components/ui/button.tsx` — variantes `cyan` (por defecto) · `magenta` · `yellow` · `ghost`; tamaños `md` · `lg` · `xl`; modificador `pulse`. Incluye el barrido `::before` y el resplandor de hover mediante valores arbitrarios, concentrados aquí.
- `components/ui/chip.tsx` — píldora de categoría/pestaña con estado `active`.
- `components/ui/panel.tsx` — caja `bg-bg-2 / border-line` con esquinas recortadas, base de tarjetas, leaderboard y modal.
- Verificación: los tres componentes se renderizan en una página de prueba temporal o directamente en el siguiente paso.

### Paso 3 — Adelgazar `globals.css`

Reducir de ~1650 a ~400 líneas. **Se conserva**: `@import "tailwindcss"`, los tokens de `:root`, el bloque `@theme inline`, los estilos base de `body`, `.av-shell`, `.av-bg`, `.av-noise`, `.neon-*`, `.flicker`, `.blink`, `.pulse`, `.fade-in`, `.slide-in`, `.rise`, `.spinner`, `.cover-bg` + las 8 clases `.cover-*`, todo el bloque CRT (`.crt`, `.crt-screen`, `.crt-bottom`, `.crt-content`, `.game-arena`, `.grid-floor`, `.enemy`, `.player-ship`, `.led`) y todos los `@keyframes`.

**Se elimina** (su equivalente pasa a utilidades en el JSX de los pasos 4-8): `.av-nav`, `.links`, `.logo*`, `.coin-counter`, `.av-mobile-*`, `.btn` y variantes, `.chip`, `.av-main`, `.av-hero`, `.av-filters`, `.av-search`, `.av-grid`, `.card`/`.cover`/`.meta`/`.title`/`.desc`/`.row`/`.score-badge`/`.label`, `.av-detail`/`.detail-*`/`.stat-strip`/`.leaderboard`/`.lb-row`, `.av-player`/`.player-hud`/`.hud-*`, `.modal*`/`.final*`/`.input-row`/`.toast-saved`, `.av-auth-wrap`/`.auth-*`/`.field`/`.social`/`.divider`, `.av-hall`/`.hall-*`/`.podium*`/`.th`/`.tr`/`.rk`/`.pl`/`.sc`/`.dt`/`.you*`, `.pixel` y `.mono` (sustituidas por las utilidades `font-pixel` / `font-mono` que ya expone `@theme inline`).

Este paso se ejecuta **junto al 4** en la práctica: no se borra una regla hasta que su pantalla está reescrita.

### Paso 4 — Shell: nav + footer

- `components/nav.tsx` (`"use client"`): logo, enlaces Biblioteca / Salón de la Fama con `usePathname` para el estado activo (`/juegos/*` marca Biblioteca como activa), contador «CRÉDITOS · 03», botón de sesión (`user ? "NOMBRE ▾" → signOut() : "Iniciar Sesión" → /acceso`) y hamburguesa con cajón lateral + backdrop.
- `components/site-footer.tsx`: `© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`.
- `app/layout.tsx`: montar `<Nav />`, `<main>` y `<footer>` dentro de `.av-shell`.
- Verificación: el nav aparece en todas las rutas y el cajón móvil abre/cierra por debajo de 900 px.

### Paso 5 — Biblioteca (`/`)

- `app/page.tsx`, Server Component. Lee `searchParams` (Promise en Next 16, hay que `await`), filtra `GAMES` por `q` y `cat`, y renderiza el hero, los filtros y el grid.
- `components/library/library-filters.tsx` (`"use client"`): input de búsqueda con debounce de 250 ms y chips de categoría; ambos hacen `router.replace(url, { scroll: false })` sobre los `searchParams` actuales. Un valor `cat=TODOS` o `q` vacío se omite de la URL.
- `components/library/game-card.tsx` (`"use client"`, necesita el tilt con el ratón): `<Link>` a `/juegos/[id]`, portada `cover-bg cover-*`, etiqueta de categoría, título, descripción corta, insignia de mejor puntuación y botón JUGAR con el color del juego.
- Estado vacío: «NO HAY RESULTADOS · Intenta otra búsqueda o categoría.»
- Verificación: `/?q=serp` deja una sola tarjeta; `/?cat=PUZZLE` deja CAÍDA; el botón atrás del navegador deshace el filtro.

### Paso 6 — Detalle (`/juegos/[id]`)

- `app/juegos/[id]/page.tsx`, Server Component. `await params`, `getGame(id)`, `notFound()` si no existe.
- `generateStaticParams()` con los 8 ids y `generateMetadata()` → `${game.title} · Arcade Vault` + `game.short` como descripción.
- Portada grande, tags (`{cat}`, `1 JUGADOR`, `TECLADO / TÁCTIL`, `RETRO 1985`), título neón, texto largo, tira de estadísticas (Partidas / Mejor global / Dificultad ★★★☆☆) y acciones `▶ JUGAR AHORA` → `/juegos/[id]/jugar` y `VOLVER AL VAULT` → `/`.
- `components/detail/leaderboard.tsx`: 10 filas de `seededScores(detailSeed(id), 10)` calculadas en servidor, con destacado de las tres primeras.
- `app/not-found.tsx`: pantalla «GAME OVER · ERROR 404 · CARTUCHO NO ENCONTRADO» con botón a `/`.
- Verificación: `/juegos/caida` renderiza; `/juegos/no-existe` muestra el 404 tematizado.

### Paso 7 — Reproductor (`/juegos/[id]/jugar`)

- `app/juegos/[id]/jugar/page.tsx`, Server Component fino: resuelve el juego, `notFound()` si falta, y monta `<GamePlayer game={game} />`.
- `components/player/game-player.tsx` (`"use client"`): estado `score` / `lives` / `level` / `paused` / `over`; `setInterval` de 220 ms que suma `10 + random*90` mientras no esté en pausa ni terminado; el nivel sube cada 2500 puntos. HUD con Jugador · Puntuación · Vidas ♥ · Nivel. Botones PAUSA/REANUDAR, FIN y SALIR (→ `/juegos/[id]`). Marco CRT con arena animada y barra inferior `SEÑAL OK · {título} · CRT-83 · 60 HZ · CARGA · 1MB`. Overlay «EN PAUSA».
- `components/player/game-over-modal.tsx`: puntuación final, input de nombre (mayúsculas, 10 chars, prellenado con el usuario o `INVITADO`), `GUARDAR PUNTUACIÓN` → `saveScore()` + toast `▸ PUNTUACIÓN GUARDADA_`, y acciones JUGAR DE NUEVO / VOLVER AL VAULT.
- Verificación: la puntuación sube, PAUSA la congela, FIN abre el modal y tras guardar aparece una entrada nueva en `localStorage['av_scores']`.

### Paso 8 — Salón de la Fama (`/salon`) y Acceso (`/acceso`)

- `app/salon/page.tsx` → `components/hall/hall-of-fame.tsx` (`"use client"`, las pestañas son estado local): encabezado, pestañas por juego, podio de 3 huecos (plata / oro / bronce) y tabla de 12 filas con `animationDelay` escalonado de 50 ms.
- Fila del usuario: si hay sesión **y** `bestScoreFor(tabId)` devuelve algo, se añade `▸ TU MEJOR MARCA EN {título}` con esa puntuación real y su fecha; si no hay marca guardada, no se muestra ninguna fila.
- `app/acceso/page.tsx` → `components/auth/auth-form.tsx` (`"use client"`): pestañas INICIAR SESIÓN / CREAR CUENTA (la segunda añade el campo de correo con `slide-in`), campos usuario y contraseña sin validación, submit → `signIn(nombre || "PLAYER1")` + `router.push("/")`, `JUGAR COMO INVITADO` → `signOut()` + `router.push("/")`, separador «O CONTINÚA CON» y los dos botones sociales inertes (`type="button"`, sin handler).
- Verificación: tras entrar, el nav muestra el nombre; el salón muestra la fila propia solo en el juego donde se guardó una marca.

### Paso 9 — Cierre

- `npm run lint` y `npm run build` limpios.
- Repaso lado a lado de las cinco pantallas contra `references/templates/Arcade Vault.html` a 1440 px, 900 px y 390 px.
- Commit de `AGENTS.md` si `next dev` lo regeneró.

---

## 4. Criterios de aceptación

- [ ] `npm run build` termina sin errores ni warnings de tipos.
- [ ] `npm run lint` no reporta errores.
- [ ] Existen y renderizan `/`, `/juegos/bloque-buster`, `/juegos/bloque-buster/jugar`, `/salon` y `/acceso`.
- [ ] `/juegos/id-inexistente` muestra `app/not-found.tsx`, no el 404 por defecto de Next.
- [ ] El nav y el footer aparecen en las cinco rutas, y el enlace activo se marca según la ruta (`/juegos/*` marca Biblioteca).
- [ ] Por debajo de 900 px el nav colapsa en hamburguesa y el cajón lateral abre y cierra.
- [ ] `/?q=serp` muestra exactamente una tarjeta y `/?cat=PUZZLE` exactamente una; el botón atrás del navegador revierte el filtro.
- [ ] Escribir en el buscador actualiza la URL sin saltar el scroll al principio de la página.
- [ ] Sin resultados, la biblioteca muestra el bloque «NO HAY RESULTADOS».
- [ ] Las tarjetas se inclinan al mover el ratón y vuelven a su posición al salir.
- [ ] El detalle muestra las 10 filas de `seededScores` con las tres primeras destacadas, y el mismo id produce siempre las mismas filas.
- [ ] `<title>` del detalle es `{TÍTULO} · Arcade Vault`.
- [ ] En el reproductor la puntuación sube sola, PAUSA la detiene, REANUDAR la reanuda y SALIR vuelve al detalle.
- [ ] FIN abre el modal; GUARDAR muestra el toast y añade una entrada a `localStorage['av_scores']`.
- [ ] Tras enviar el formulario de `/acceso`, el nav pasa a mostrar el nombre en mayúsculas (máx. 10 caracteres) y sobrevive a un recargado de página.
- [ ] Pulsar el botón de usuario en el nav cierra la sesión y devuelve el botón a «Iniciar Sesión».
- [ ] El salón cambia de tabla al pulsar cada pestaña y el podio refleja las tres primeras filas de esa pestaña.
- [ ] Con sesión iniciada y una marca guardada en un juego, el salón muestra la fila «TU MEJOR MARCA» en ese juego y **no** en los demás.
- [ ] La consola del navegador no muestra ningún error de hidratación en ninguna de las cinco rutas.
- [ ] `globals.css` ya no contiene las clases de layout listadas en el Paso 3 y sigue conteniendo `.cover-*`, el bloque CRT y los `@keyframes`.
- [ ] Ningún archivo de `references/templates/` ha sido modificado.

---

## 5. Decisiones tomadas y descartadas

| Decisión               | Elegido                                                                                                             | Descartado                                                                       | Motivo                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Estructura de rutas    | Español anidada: `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/acceso`                                     | Rutas planas; `/` redirigiendo a `/biblioteca`                                   | Mapea 1:1 los nombres del prototipo y hace natural que SALIR vuelva al detalle padre.                                                            |
| Sesión                 | Contexto cliente + `localStorage['av_user']`                                                                        | Estado en memoria; sin sesión                                                    | Mantiene vivos los estados condicionales del nav y del salón, que son parte de lo que hay que demostrar visualmente.                             |
| Reproductor            | Simulación con `setInterval`, igual que el prototipo                                                                | Pantalla estática «PRÓXIMAMENTE»; simulación sin guardado                        | Exhibe todos los estados visuales (HUD vivo, pausa, game over) sin implementar ningún juego.                                                     |
| Generación de rankings | `seededScores` determinista: en servidor en el detalle, en cliente en las pestañas del salón                        | Todo en cliente; JSON precalculado y commiteado                                  | La función es pura, así que el servidor puede renderizarla sin desajuste de hidratación.                                                         |
| Shell                  | Nav y footer en el layout raíz, visibles también en `/acceso`                                                       | Route group sin nav para `/acceso`                                               | Fidelidad al prototipo.                                                                                                                          |
| Home                   | La Biblioteca reemplaza el hero placeholder de `app/page.tsx`                                                       | Conservar el hero como landing y mover la biblioteca a `/juegos`                 | La Biblioteca ya trae su propio hero; una landing extra es una pantalla que el prototipo no tiene.                                               |
| Filtros                | `searchParams` en la URL, grid renderizado en servidor                                                              | `useState` local como el prototipo                                               | Elegido por el usuario: filtros compartibles y navegables con el botón atrás. Coste: un componente cliente extra con debounce.                   |
| `av_scores`            | Se escribe al guardar **y** se lee en el salón para la fila «TU MEJOR MARCA»                                        | Portar la incoherencia del prototipo (escribir y nunca leer, con fila fabricada) | Cierra el circuito visual sin backend; la fila deja de ser un número inventado.                                                                  |
| Estilos                | Híbrido: utilidades Tailwind para layout/tipografía/color + capa CSS para efectos (CRT, neón, `cover-*`, keyframes) | Vaciar `globals.css` por completo; mantener el puerto 1:1 de clases globales     | Los efectos neón y CRT en valores arbitrarios harían el JSX ilegible; el resto gana consistencia con los tokens ya expuestos en `@theme inline`. |
| Formato de números     | `formatScore()` propio con separador `.`                                                                            | `toLocaleString("es-ES")`                                                        | Elimina la dependencia del ICU del runtime y con ella el riesgo de desajuste servidor/cliente.                                                   |
| 404                    | `notFound()` + `app/not-found.tsx` tematizado                                                                       | 404 por defecto; `redirect('/')` silencioso                                      | Coherencia estética y feedback explícito al usuario.                                                                                             |

---

## 6. Riesgos identificados

1. **Desajuste de hidratación por `localStorage`.** El nav depende de `av_user`, que solo existe en el navegador. Mitigación: `SessionProvider` arranca siempre con `user: null` / `ready: false` y lee `localStorage` dentro de `useEffect`; el nav renderiza el estado de invitado en el primer pintado. Criterio de aceptación explícito de «cero errores de hidratación».
2. **Pérdida de efectos visuales al reescribir a utilidades.** Los resplandores, barridos `::before` y sombras internas del prototipo son fáciles de perder por el camino. Mitigación: concentrar esos efectos en `components/ui/button.tsx` y `panel.tsx` en vez de repetirlos, y hacer el repaso lado a lado del Paso 9 antes de dar el spec por cerrado.
3. **Borrado prematuro de reglas CSS.** El Paso 3 elimina clases que las pantallas aún usan si se ejecuta antes que los pasos 4-8. Mitigación: no borrar una regla hasta que su pantalla esté reescrita; el paso está descrito como concurrente con el 4.
4. **`searchParams` es una Promise en Next 16.** Tratarla como objeto plano compila pero rompe en runtime. Mitigación: `await searchParams` en `app/page.tsx` y consultar `node_modules/next/dist/docs/` ante cualquier duda de API, como exige `AGENTS.md`.
5. **La simulación del reproductor puede leerse como un juego real.** El HUD vivo es convincente. Mitigación: el spec y el commit dejan constancia de que es un placeholder; el texto de la barra CRT (`CRT-83 · 60 HZ`) es decorativo y no promete funcionalidad.
