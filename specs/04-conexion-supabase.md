# SPEC 04 — Conexión de la aplicación Next con Supabase

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-09-23

**Objetivo:** Conectar la aplicación Next 16 con el proyecto Supabase ya existente —dependencias, variables de entorno, clientes de navegador y servidor, refresco de sesión en `proxy.ts` y tipos generados— sin tocar ninguna pantalla ni crear ninguna tabla.

---

## 1. Alcance

### Dentro

- **Dependencias**: `@supabase/supabase-js` y `@supabase/ssr`.
- **Variables de entorno** con el esquema actual de claves de Supabase:
  | Fichero         | Estado en git                                    | Contenido                                                                                                                               |
  | --------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
  | `.env.local`    | Ignorado (`.gitignore` ya cubre `.env*`)         | **Ya contiene** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reales: la implementación las verifica, no las crea |
  | `.env.template` | Versionado (`!.env.template` ya está exceptuado) | **Ya existe** en la raíz y ya lista las dos variables con valor vacío: solo se verifica y se comenta de dónde sacarlas                  |
- **Lector de entorno** `lib/supabase/env.ts`: falla con un mensaje explícito (`Falta NEXT_PUBLIC_SUPABASE_URL...`) la primera vez que se crea un cliente sin configuración. No se valida en tiempo de build.
- **Tres clientes** en `lib/supabase/`, todos tipados con el genérico `Database`:
  | Fichero     | Función                                                                             | Uso                                                |
  | ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
  | `client.ts` | `createClient()` sobre `createBrowserClient`                                        | Componentes cliente                                |
  | `server.ts` | `createClient()` `async` sobre `createServerClient` + `cookies()` de `next/headers` | Server Components, Server Actions y route handlers |
  | `proxy.ts`  | `updateSession(request)`                                                            | Solo para el `proxy.ts` de la raíz                 |
- **`proxy.ts` en la raíz** del proyecto (el fichero que en Next ≤15 se llamaba `middleware.ts`), que refresca la cookie de sesión en cada petición navegable. **No redirige a nadie**: no hay pantallas protegidas todavía.
- **Tipos generados** en `lib/database.types.ts`, producidos con el MCP/CLI de Supabase. Hoy salen prácticamente vacíos (el esquema `public` tiene 0 tablas); fijan la convención y el comando de regeneración.
- **Ruta de diagnóstico permanente** `GET /api/supabase/health`: comprueba contra el proyecto real que las credenciales sirven y devuelve `{ ok: true, ... }` o el error. Sin enlace desde la UI.
- **Nota en `CLAUDE.md`** con las variables necesarias y el comando de regeneración de tipos.

### Fuera (explícitamente)

- **Autenticación real.** El método de acceso (email + contraseña, OAuth, magic link), la confirmación de correo y la reescritura de `/acceso` son un spec posterior. `SessionProvider` y `localStorage['av_user']` **siguen funcionando igual** y no se tocan.
- **Persistencia de puntuaciones.** No se crea la tabla `scores` ni ninguna otra: `lib/local-scores.ts` (`av_scores`) y `seededScores` siguen siendo la fuente de las marcas y de los rankings.
- **Tablas, RLS, políticas y migraciones.** Este spec no ejecuta ningún SQL contra el proyecto. La base de datos queda exactamente como está.
- **Supabase CLI y stack local.** No se instala `supabase` como dependencia, no hay `supabase/config.toml`, ni carpeta `supabase/migrations/`, ni Docker, ni `db push`. Cuando haya esquema que crear, se hará con `mcp__supabase__apply_migration` contra el proyecto remoto. Por eso `SUPABASE_DB_PASSWORD` queda sin uso (ver Modelo de datos).
- **Migración de datos locales.** Nada de lo guardado en `localStorage` se sube a Supabase, ni ahora ni como rutina preparada para después.
- **Clave secreta de servidor.** No se define `SUPABASE_SECRET_KEY` ni se usa `service_role`. Todo el acceso va con la publishable key y, cuando existan tablas, con RLS.
- **Realtime, Storage y Edge Functions.** Fuera de alcance aunque el cliente los exponga.
- **Redirecciones o rutas protegidas.** El `proxy.ts` refresca la sesión y devuelve la respuesta tal cual; la lógica de «sin sesión → `/acceso`» llega con el spec de auth.
- **Cambios visuales.** Ninguna pantalla, componente o estilo se modifica. La única ruta nueva es un endpoint JSON.
- **Tests.** Sigue sin haber runner configurado.
- Edición del prototipo en `references/templates/`.

---

## 2. Modelo de datos

**No se crea ninguna tabla.** Los únicos «datos» de este spec son la configuración y el fichero de tipos.

### Variables de entorno

| Variable                               | Obligatoria | Origen                                                                                                                                 | Uso                                    |
| -------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Sí          | Ya presente en `.env.local`. Contraste: `mcp__supabase__get_project_url`                                                               | URL del proyecto, en los tres clientes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí          | Ya presente en `.env.local`. Contraste: `mcp__supabase__get_publishable_keys` (la moderna `sb_publishable_...`, no la `anon` heredada) | Clave pública, en los tres clientes    |

Ambas llevan prefijo `NEXT_PUBLIC_` porque el cliente de navegador las necesita; son públicas por diseño y la protección real la dará RLS cuando existan tablas.

**`SUPABASE_DB_PASSWORD` no se usa.** Está en `.env.local` y figura en `.env.template`, pero es la contraseña de conexión directa a Postgres, pensada para el CLI o un cliente SQL, no para la aplicación: ningún fichero de este spec la lee y no se menciona en `CLAUDE.md`. Se queda donde está, ignorada.

### `lib/supabase/env.ts`

```ts
// Lee y valida la configuración. Se invoca al crear cada cliente, no al cargar
// el módulo: la app sigue compilando y sirviendo /, /biblioteca y /acerca-de
// aunque no exista .env.local.
export function supabaseEnv(): { url: string; publishableKey: string };
// Lanza Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local — ver .env.template")
```

### `lib/database.types.ts`

Fichero **generado**, nunca editado a mano. Hoy exporta un `Database` con `public.Tables` vacío. Cabecera obligatoria:

```ts
// Generado por el MCP de Supabase (generate_typescript_types). No editar a mano.
// Regenerar tras cada migración que cambie el esquema.
export type Database = {/* ... */};
```

Los tres clientes se tipan con él: `createBrowserClient<Database>(...)`, `createServerClient<Database>(...)`.

### Respuesta de `/api/supabase/health`

```ts
type HealthOk = { ok: true; hasSession: boolean };
type HealthError = { ok: false; error: string };
// 200 + HealthOk | 503 + HealthError
```

Nunca devuelve la URL del proyecto, la clave ni datos del usuario: solo si la conexión responde y si la petición traía sesión.

---

## 3. Plan de implementación

Cada paso deja el proyecto compilando y la aplicación actual intacta.

1. **Instalar dependencias.** `npm i @supabase/supabase-js @supabase/ssr`. Verificar que `npm run build` sigue pasando sin usarlas todavía.

2. **Verificar el entorno.** `.env.local` ya trae las dos variables: contrastar su valor con el MCP de Supabase (`get_project_url`, `get_publishable_keys`; la clave debe ser la `sb_publishable_...` cuyo `disabled` sea falso) y corregirlo solo si no coinciden. Verificar que `.env.template` (ya versionable, `!.env.template` en `.gitignore`) lista las dos claves con valor vacío y añadirle un comentario de dónde sacarlas. Confirmar con `git status` que `.env.local` **no** aparece.

3. **Lector de entorno** `lib/supabase/env.ts` con `supabaseEnv()` y sus mensajes de error en español.

4. **Generar tipos.** `mcp__supabase__generate_typescript_types` → `lib/database.types.ts`, con la cabecera de «no editar a mano».

5. **Cliente de navegador** `lib/supabase/client.ts`: `createBrowserClient<Database>(url, publishableKey)`.

6. **Cliente de servidor** `lib/supabase/server.ts`: `createServerClient<Database>` con `cookies()` de `next/headers` y el par `getAll` / `setAll`; el `setAll` va envuelto en `try/catch` porque desde un Server Component no se pueden escribir cookies y ahí el refresco lo hace el proxy. La función es `async` (en Next 16 `cookies()` se espera).

7. **Refresco de sesión.** `lib/supabase/proxy.ts` con `updateSession(request)` siguiendo la receta oficial de Supabase: crear `NextResponse.next({ request })`, construir el cliente con `getAll` desde `request.cookies` y un `setAll` que reescribe petición y respuesta, y **nada de código entre `createServerClient` y `supabase.auth.getClaims()`** (saltárselo provoca cierres de sesión aleatorios). Devolver el `supabaseResponse` tal cual, **sin redirigir**.

8. **`proxy.ts` en la raíz** del repositorio, al mismo nivel que `app/`:

   ```ts
   export async function proxy(request: NextRequest) {
     return await updateSession(request);
   }

   export const config = {
     matcher: [
       "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
     ],
   };
   ```

   **No se llama `middleware.ts`**: en Next 16 esa convención está obsoleta y renombrada a `proxy` (ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). El export debe llamarse `proxy` o ser el default, y el fichero corre en runtime Node por defecto; fijar `runtime` ahí lanza error.

9. **Ruta de salud** `app/api/supabase/health/route.ts`: `export const dynamic = "force-dynamic"`, crea el cliente de servidor, llama a `supabase.auth.getClaims()` —prueba de conectividad que no necesita ninguna tabla— y responde `{ ok: true, hasSession }` (200) o `{ ok: false, error }` (503), capturando también el error de configuración de `supabaseEnv()`.

10. **Documentar** en `CLAUDE.md`: las dos variables, que el fichero de sesión es `proxy.ts` y no `middleware.ts`, y que `lib/database.types.ts` se regenera tras cada migración.

11. **Cierre.** `npm run lint` y `npm run build` limpios; `npm run dev` y `curl http://localhost:3000/api/supabase/health` devolviendo `{"ok":true,...}`; navegar `/`, `/biblioteca`, `/acerca-de`, `/salon` y `/juegos/[id]/jugar` comprobando que el proxy no ha roto nada.

---

## 4. Criterios de aceptación

- [ ] `package.json` lista `@supabase/supabase-js` y `@supabase/ssr`.
- [ ] `.env.template` está versionado con las dos variables y sus valores vacíos; `.env.local` mantiene sus valores reales y **no** aparece en `git status`.
- [ ] No existe carpeta `supabase/` en el repositorio ni el CLI entre las dependencias.
- [ ] `lib/supabase/env.ts` lanza un error que nombra la variable que falta cuando se borra del entorno.
- [ ] `lib/database.types.ts` existe, exporta `Database`, y los tres clientes lo usan como genérico.
- [ ] `lib/supabase/client.ts`, `lib/supabase/server.ts` y `lib/supabase/proxy.ts` existen y compilan bajo TypeScript estricto.
- [ ] Existe `proxy.ts` en la raíz con el export `proxy` y el `matcher`; **no** existe ningún `middleware.ts`.
- [ ] `GET /api/supabase/health` responde `200 {"ok":true,"hasSession":false}` con la app arrancada y sin sesión.
- [ ] Con `NEXT_PUBLIC_SUPABASE_URL` vacía, esa misma ruta responde `503` con un mensaje que nombra la variable, y el resto de pantallas sigue cargando.
- [ ] La respuesta de la ruta de salud no contiene la URL del proyecto ni la clave.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.
- [ ] `/`, `/biblioteca`, `/acerca-de`, `/salon`, `/juegos/[id]` y `/juegos/[id]/jugar` se comportan igual que antes del spec, incluidos el acceso falso y el guardado de marcas en `localStorage`.
- [ ] El esquema `public` del proyecto Supabase sigue con 0 tablas.

---

## 5. Decisiones tomadas y descartadas

| Decisión                                            | Alternativa descartada                                                        | Motivo                                                                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spec **solo de conexión**: sin auth ni puntuaciones | Un único spec «Supabase» con auth + marcas                                    | Tres dominios a la vez (cimientos, sesión, persistencia) obligan a decidir método de acceso y modelo de datos antes de tener nada funcionando. Los cimientos no dependen de esas decisiones, así que se cierran primero. |
| `proxy.ts` en la raíz                               | `middleware.ts`                                                               | Next 16 deprecó la convención `middleware` y la renombró a `proxy`. Casi toda la documentación que circula sigue mostrando `middleware.ts`; aquí no vale.                                                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`              | `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                               | La clave `anon` (JWT) es el esquema heredado. La publishable se rota de forma independiente y es la recomendación actual de Supabase.                                                                                    |
| Sin clave secreta de servidor                       | `SUPABASE_SECRET_KEY` / `service_role`                                        | Nada en este spec necesita saltarse RLS. Una clave que no existe no se filtra.                                                                                                                                           |
| Fallo explícito al crear el cliente                 | Validar al cargar el módulo (revienta el build) o degradar en silencio        | El build no debe caer por una integración que ninguna pantalla usa todavía; y un degradado silencioso deja pasar credenciales mal escritas. El error salta justo donde importa.                                          |
| `auth.getClaims()` como prueba de vida              | Un `SELECT` contra una tabla                                                  | No hay tablas. `getClaims()` verifica que URL y clave son válidas sin depender del esquema, y es además la llamada que Supabase exige dentro del proxy.                                                                  |
| Ruta de salud permanente y sin UI                   | Pantalla de diagnóstico tematizada, o ninguna verificación                    | Comprobable con `curl` tras cada despliegue, cero superficie visual que portar al estilo neon-retro o borrar después.                                                                                                    |
| Tipos generados ya, aunque salgan vacíos            | Esperar a que existan tablas                                                  | Fija el genérico en los tres clientes desde el principio; añadirlo más tarde sería un cambio transversal de tipado.                                                                                                      |
| Esquema vía MCP (`apply_migration`) cuando toque    | Supabase CLI con `supabase/migrations/` versionadas, o stack local con Docker | Hoy no hay ninguna tabla que migrar: montar CLI, `config.toml` y flujo `link`/`db push` sería infraestructura sin contenido. Se reconsidera en el spec que cree el primer esquema.                                       |
| Se conserva `localStorage` (`av_user`, `av_scores`) | Retirarlo o migrarlo a Supabase                                               | Sin auth ni tabla de marcas, retirarlo dejaría la app peor que antes. La retirada corresponde al spec que lo sustituya.                                                                                                  |

---

## 6. Riesgos identificados

1. **Credenciales reales en el árbol de trabajo.** `.env.local` ya guarda la publishable key y, además, `SUPABASE_DB_PASSWORD`, que da acceso directo a Postgres. `.gitignore` ya ignora `.env*`, pero conviene confirmarlo con `git status` antes de commitear, y nunca pegar esos valores en un spec, un README o un mensaje de commit.
2. **El proxy corre en casi todas las peticiones.** Crea un cliente y llama a `getClaims()` por petición navegable. Sin sesión el coste es bajo, pero es latencia añadida a pantallas que hoy no usan Supabase. Si molesta, el `matcher` se estrecha en el spec de auth, cuando se sepa qué rutas la necesitan de verdad.
3. **Orden frágil dentro de `updateSession`.** Meter código entre `createServerClient` y `getClaims()`, o devolver una respuesta distinta de `supabaseResponse` sin copiar sus cookies, provoca cierres de sesión intermitentes y difíciles de depurar. El fichero lleva el comentario de aviso.
4. **Proyecto pausado por inactividad.** En el plan gratuito, un proyecto sin uso se suspende y la ruta de salud pasa a devolver `503`. No es un fallo del código.
5. **Tipos que envejecen.** `lib/database.types.ts` es una foto del esquema. Cada spec que cree o cambie tablas debe regenerarlo, o el tipado mentirá.
6. **Documentación desalineada.** Las guías de Supabase que circulan siguen mostrando `middleware.ts` y `anon key`. Al implementar hay que contrastar con `node_modules/next/dist/docs/` y con la documentación viva vía MCP, no con la memoria.

---

## 7. Lo que **no** entra en este spec

Ni una pantalla cambia. Al terminar, la aplicación se ve y se comporta exactamente igual que antes: el acceso sigue siendo falso, las marcas siguen en el navegador y el Salón de la Fama sigue inventando rankings. Lo único nuevo es que existe un camino probado entre Next y Supabase, y una URL que lo demuestra.
