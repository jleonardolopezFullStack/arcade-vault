# SPEC 03 — Pantalla «Acerca de» y formulario de contacto con Resend

**Estado:** Aprobado
**Depende de:** SPEC 01, SPEC 02
**Fecha:** 2026-09-18

**Objetivo:** Portar `references/templates/home-about/about.jsx` a la ruta `/acerca-de` y convertir su formulario de contacto —hoy puramente cosmético— en un envío real de correo mediante Resend desde una Server Action.

---

## 1. Alcance

### Dentro

- **Pantalla `/acerca-de`** con los tres bloques del prototipo:
  | Bloque | Contenido |
  |---|---|
  | Hero | Eyebrow «▸ ACERCA DE», título «ACERCA DE ARCADE VAULT», párrafo de misión y la fila de tres destacados (HEART · BROWSER · PLANT) con icono pixel |
  | Divisor | Banda decorativa: barra + 24 píxeles parpadeantes escalonados + barra |
  | `Contacto` | Columna izquierda (eyebrow «▸ CONTACTO», título, subtítulo y tres «tips» con LED) + formulario a la derecha |
- **Formulario de contacto funcional**: campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE, con validación en cliente (shake) y en servidor (Zod).
- **Envío real por Resend** desde una Server Action (`app/acerca-de/actions.ts`), con la plantilla del correo escrita con `react-email`.
- **Cuatro estados de la vista del formulario**: `idle` → `enviando` → `éxito` (terminal verde) | `error` (terminal rojo con «REINTENTAR»).
- **Modo simulación** cuando falta `RESEND_API_KEY`: no se llama a Resend, el mensaje se vuelca por consola del servidor y el terminal de éxito añade una línea «MODO SIMULACIÓN».
- **Anti-spam**: campo honeypot oculto y límite de envíos por IP en memoria del proceso.
- **`.env.example`** documentando las tres variables (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`), con `patrickplanvideos91@gmail.com` como buzón de destino real.
- **Metadata propia** de `/acerca-de`.
- **Nuevas dependencias**: `resend`, `react-email`, `@react-email/components`, `zod`.

### Fuera (explícitamente)

- **Autorespuesta al visitante.** Solo se envía un correo, al buzón del equipo. El prototipo no promete acuse de recibo y un segundo envío duplica los modos de fallo.
- **Persistencia de los mensajes.** No hay base de datos, ni fichero, ni panel de administración: el correo es el único registro.
- **Adjuntos, captcha y verificación de dominio.** La configuración del dominio remitente en Resend es tarea de despliegue, no de este spec.
- **Rate limit distribuido.** El contador vive en memoria del proceso: se pierde al reiniciar y no se comparte entre instancias. Ver Riesgos.
- **Autorespuesta, plantilla de marca en varios idiomas o editor de plantillas.** El correo es uno y en español.
- **Cambios en el nav.** El enlace «Acerca de» ya existe desde SPEC 02; solo deja de caer en el 404.
- **Reutilizar el formulario en otras pantallas.** El de `/acceso` sigue siendo la maqueta sin backend de SPEC 01.
- **Tests.** Sigue sin haber runner configurado.
- Edición del prototipo en `references/templates/`. Se porta desde él, no se toca.

---

## 2. Modelo de datos

No hay persistencia. Los únicos «datos» son el payload del formulario, el contenido estático de la pantalla y el contador anti-abuso en memoria.

### `lib/contact.ts` — esquema y tipos compartidos

```ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  msg: z.string().trim().min(10).max(2000),
  // Honeypot: debe llegar vacío. Si trae algo, es un bot.
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string; simulated: boolean }
  | { status: "error"; code: ContactErrorCode; message: string };

export type ContactErrorCode =
  | "validation" // algún campo no pasa el esquema
  | "rate_limit" // demasiados envíos desde la misma IP
  | "provider" // Resend respondió con error
  | "unknown";
```

`ContactState` es el valor que devuelve la Server Action y el que consume `useActionState` en el cliente. El honeypot descartado devuelve `{ status: "ok" }` fingido: el bot no distingue el rechazo del éxito.

### `lib/about-data.ts` — contenido estático

```ts
import type { GameColor } from "@/lib/data";

export type HighlightIconKind = "HEART" | "BROWSER" | "PLANT";

export type AboutHighlight = {
  icon: HighlightIconKind;
  text: string; // "HECHO CON ❤️ PARA JUGADORES"
  color: Extract<GameColor, "magenta" | "cyan" | "green">;
};

export type ContactTip = { text: string; led: "green" | "yellow" | "magenta" };

export const ABOUT_MISSION: string;
export const HIGHLIGHTS: readonly AboutHighlight[]; // 3
export const CONTACT_TIPS: readonly ContactTip[]; // 3
```

### Rate limit en memoria — `lib/rate-limit.ts`

```ts
// Map<ip, number[]> con las marcas de tiempo de los envíos aceptados.
// Ventana: 10 minutos. Máximo: 3 envíos por IP.
// Las entradas caducadas se purgan en cada consulta; no hay temporizador.
export function allowContact(ip: string): boolean;
```

La IP se lee de la cabecera `x-forwarded-for` (primer valor) vía `headers()`; si no existe, se usa la clave literal `"unknown"`, que comparte cubo para todo el tráfico sin cabecera.

### Variables de entorno

| Variable             | Obligatoria   | Valor de partida                       | Uso                                            |
| -------------------- | ------------- | -------------------------------------- | ---------------------------------------------- |
| `RESEND_API_KEY`     | En producción | —                                      | Cliente de Resend. Si falta → modo simulación. |
| `CONTACT_TO_EMAIL`   | En producción | `patrickplanvideos91@gmail.com`        | Buzón que recibe los mensajes del formulario.  |
| `CONTACT_FROM_EMAIL` | En producción | `Arcade Vault <onboarding@resend.dev>` | Remitente. Ver nota.                           |

Ninguna lleva prefijo `NEXT_PUBLIC_`: se leen solo en servidor. Si falta `RESEND_API_KEY` se entra en simulación aunque las otras dos estén puestas.

**Nota sobre el remitente.** Resend **no permite enviar desde una dirección `@gmail.com`**: el `from` tiene que ser un dominio verificado en la cuenta o el remitente de pruebas `onboarding@resend.dev`. Por eso `patrickplanvideos91@gmail.com` es el **destinatario** (`CONTACT_TO_EMAIL`), no el remitente. Mientras no haya dominio propio verificado se usa `onboarding@resend.dev`, que en cuentas sin dominio **solo entrega al correo dueño de la cuenta de Resend**: `patrickplanvideos91@gmail.com` debe ser esa cuenta para que los correos lleguen de verdad. Los valores por defecto están en el código como constantes de respaldo, de forma que la aplicación envía correos reales en cuanto se define `RESEND_API_KEY`, sin más configuración. Cuando exista dominio propio, basta con cambiar `CONTACT_FROM_EMAIL`.

---

## 3. Plan de implementación

Cada paso deja la aplicación compilando y navegable.

### Paso 1 — Dependencias y configuración

- `npm i resend react-email @react-email/components zod`.
- Crear `.env.example` con las tres variables, sus valores de partida (`CONTACT_TO_EMAIL=patrickplanvideos91@gmail.com`, `CONTACT_FROM_EMAIL=Arcade Vault <onboarding@resend.dev>`) y un comentario de una línea cada una, incluida la advertencia de que el `from` no puede ser una dirección de Gmail.
- Crear `.env.local` con esas dos direcciones y `RESEND_API_KEY=` vacía, a la espera de la clave.
- Verificar que `.env*` está cubierto por `.gitignore` (el scaffold de Next ya lo incluye); añadirlo si no.
- Verificación: `npm run build` pasa con las dependencias instaladas y sin consumirlas todavía.

### Paso 2 — `lib/about-data.ts` y `lib/contact.ts`

- Contenido estático con los textos literales del prototipo (misión, tres destacados, tres tips).
- Esquema Zod, tipos `ContactState` / `ContactErrorCode` y los mensajes de error en español que verá el terminal rojo.
- Verificación: `npm run build` y `npm run lint` limpios; nadie los consume aún.

### Paso 3 — Capa CSS de «Acerca de»

Se añade a `app/globals.css` **solo** lo que Tailwind no expresa con comodidad, siguiendo el híbrido de SPEC 01 y 02:

- `@keyframes shake` (traslación horizontal de 0.4 s del formulario inválido) y `@keyframes pxblink` (píxeles del divisor).
- `@keyframes termline`: entrada de cada línea del terminal, con `animation-delay` escalonado de 180 ms aplicado por `:nth-child`, y su `@media (prefers-reduced-motion: reduce)` que deja todas las líneas visibles sin animación.
- El degradado recortado sobre el título `about-title` (`background-clip: text`).

`@keyframes blink` (el caret) y la clase `.reveal` ya existen de SPEC 02: se reutilizan. Rejillas, bordes, LEDs, marco interior discontinuo del formulario y resplandores se escriben con utilidades, reutilizando `Button` y `Panel`.

Puntos de ruptura a respetar, tomados de `styles.css`: destacados 3→1 a 820 px; `contact-grid` de `1fr 1.2fr` a una columna a 900 px.

### Paso 4 — `lib/rate-limit.ts`

- `allowContact(ip)` con ventana de 10 min y máximo 3, purgando marcas caducadas en cada llamada.
- El `Map` se guarda en un `globalThis` con símbolo propio para sobrevivir al hot reload de `next dev`.
- Verificación: cuatro envíos seguidos desde la misma IP → el cuarto responde `rate_limit`.

### Paso 5 — Plantilla del correo

- `emails/contact-message.tsx`: componente de `react-email` con `Html`/`Head`/`Body`/`Container`/`Section`/`Text`/`Hr`, estilos inline oscuros con acento cian, encabezado «ARCADE VAULT // NUEVO MENSAJE», los tres campos y un pie con la fecha.
- Props: `{ name, email, msg, sentAt }`.
- Verificación: renderiza sin errores desde la acción del paso siguiente.

### Paso 6 — Server Action `app/acerca-de/actions.ts`

`"use server"`; firma `sendContactMessage(prev: ContactState, formData: FormData): Promise<ContactState>`.

Orden de comprobaciones:

1. Honeypot `website` no vacío → devolver `{ status: "ok", name, simulated: false }` sin enviar nada.
2. `contactSchema.safeParse` → si falla, `{ status: "error", code: "validation", … }` con el primer mensaje.
3. `allowContact(ip)` → si no, `code: "rate_limit"`.
4. Sin `RESEND_API_KEY` → `console.info` con el mensaje y devolver `{ status: "ok", simulated: true }`.
5. `resend.emails.send({ from: CONTACT_FROM_EMAIL, to: CONTACT_TO_EMAIL, replyTo: email, subject: "[Arcade Vault] Mensaje de <nombre>", react: <ContactMessage … /> })`.
6. Error del proveedor → `console.error` del detalle y `code: "provider"` con un mensaje genérico. **Nunca** se filtra al cliente el texto crudo del proveedor ni la configuración.

El cliente de Resend se instancia perezosamente dentro de la acción, no en el módulo, para que el import no falle en build sin variables.

Verificación: con la clave puesta llega el correo; sin ella, la consola del servidor muestra el volcado y la UI da éxito simulado.

### Paso 7 — `components/about/contact-form.tsx` (único cliente)

- `useActionState(sendContactMessage, { status: "idle" })` + `useFormStatus` (o el `isPending` del propio hook) para el estado de envío.
- **Validación previa en cliente**: si algún campo está vacío al enviar, se aplica la clase `shake` durante 400 ms y no se dispara la acción — es el comportamiento del prototipo.
- **Enviando**: el botón pasa a «▶ TRANSMITIENDO…», se deshabilita, y los tres campos quedan `readOnly`.
- **Éxito**: el formulario se sustituye por `<Terminal variant="ok">` con la barra de tres puntos, las líneas `[OK]` escalonadas, el mensaje final con el nombre en mayúsculas y caret parpadeante, la línea extra «[SIM] MODO SIMULACIÓN — NO SE ENVIÓ NINGÚN CORREO» si `simulated`, y el botón fantasma «ENVIAR OTRO MENSAJE» que vuelve a `idle` limpiando los campos.
- **Error**: `<Terminal variant="error">` con las mismas piezas en rojo (`[ERROR]`), el mensaje según `code`, y el botón «REINTENTAR» que vuelve a `idle` **conservando lo escrito**.
- El honeypot es un `<input name="website">` fuera de pantalla, con `tabIndex={-1}`, `autoComplete="off"` y `aria-hidden`.
- El terminal vive en `components/about/terminal.tsx`, parametrizado por variante para no duplicar el marcado.

### Paso 8 — Pantalla `app/acerca-de/page.tsx`

- Server Component que compone `components/about/about-hero.tsx` (con `highlight-icon.tsx`), `about-divider.tsx` y `contact-section.tsx`; este último renderiza la columna de texto en servidor y el `<ContactForm />` cliente.
- El divisor y la sección de contacto van envueltos en el `<Reveal>` de SPEC 02; el hero no, igual que en el prototipo.
- Metadata propia (título y descripción de la pantalla).
- Verificación: `/acerca-de` deja de mostrar el 404 y el enlace «Acerca de» del nav se marca activo.

### Paso 9 — Cierre

- `npm run lint` y `npm run build` limpios.
- Repaso lado a lado contra `references/templates/home-about/arcade-vault-standalone.html` a 1440 px, 900 px y 390 px.
- Commit de `AGENTS.md` si `next dev` lo regeneró.

---

## 4. Criterios de aceptación

- [ ] `npm run build` termina sin errores ni warnings de tipos.
- [ ] `npm run lint` no reporta errores.
- [ ] `/acerca-de` renderiza hero, divisor y contacto en el orden del prototipo, y ya no cae en `app/not-found.tsx`.
- [ ] El nav marca «Acerca de» como activo en `/acerca-de`.
- [ ] Enviar con cualquier campo vacío agita el formulario, no llama al servidor y no cambia de estado.
- [ ] Un correo con formato inválido (`hola@`) devuelve el terminal rojo con el mensaje de validación.
- [ ] Un mensaje de menos de 10 caracteres es rechazado por el servidor aunque se sortee el cliente.
- [ ] Durante el envío el botón dice «TRANSMITIENDO…», está deshabilitado y los campos no son editables.
- [ ] Con `RESEND_API_KEY` configurada, un envío válido llega de verdad a la bandeja de `patrickplanvideos91@gmail.com` (revisando también spam), con `replyTo` igual al correo del visitante y el asunto `[Arcade Vault] Mensaje de <nombre>`.
- [ ] Con las variables sin definir salvo `RESEND_API_KEY`, el correo se sigue enviando a `patrickplanvideos91@gmail.com` desde `onboarding@resend.dev` gracias a los valores de partida del código.
- [ ] Sin `RESEND_API_KEY`, el envío no llama a Resend, vuelca el mensaje por consola del servidor y el terminal de éxito muestra la línea «MODO SIMULACIÓN».
- [ ] Un fallo del proveedor muestra el terminal rojo con «REINTENTAR» y el formulario conserva lo escrito al volver.
- [ ] «ENVIAR OTRO MENSAJE» devuelve al formulario con los tres campos vacíos.
- [ ] Rellenar el campo honeypot produce respuesta de éxito y **ningún** correo enviado.
- [ ] El cuarto envío desde la misma IP en 10 minutos devuelve el terminal rojo por límite de envíos.
- [ ] Ningún mensaje de error mostrado al usuario contiene texto crudo del proveedor, nombres de variables de entorno ni direcciones de correo de configuración.
- [ ] `RESEND_API_KEY` no aparece en ningún bundle de cliente (`grep` sobre `.next/static`).
- [ ] `.env.example` existe con las tres variables y ningún `.env` real está versionado.
- [ ] Las líneas del terminal entran escalonadas; con `prefers-reduced-motion: reduce` se ven todas de inmediato y sin animación.
- [ ] Los 24 píxeles del divisor parpadean con retardo creciente.
- [ ] A 1440, 900 y 390 px ninguna sección desborda horizontalmente (destacados a 1 columna bajo 820 px, contacto a 1 columna bajo 900 px).
- [ ] La consola del navegador no muestra errores de hidratación en `/acerca-de`.
- [ ] Ningún archivo de `references/templates/` ha sido modificado.

---

## 5. Decisiones tomadas y descartadas

| Decisión                 | Elegido                                                                  | Descartado                                                   | Motivo                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transporte del envío     | Server Action en `app/acerca-de/actions.ts`                              | Route Handler `POST /api/contacto` con `fetch` desde cliente | Patrón nativo de Next 16: sin endpoint público que endurecer, sin `fetch` manual y la clave nunca cruza al cliente.                                                                           |
| Configuración            | Tres variables de entorno con valores de partida en código               | Direcciones solo en el entorno, sin respaldo                 | Cambiar el buzón no exige tocar código, y los valores de partida (`patrickplanvideos91@gmail.com` + `onboarding@resend.dev`) hacen que baste con poner la API key para enviar correos reales. |
| Destinatario y remitente | `to` = `patrickplanvideos91@gmail.com`, `from` = `onboarding@resend.dev` | Usar el Gmail también como remitente                         | Elegido por el usuario para el destinatario. Resend rechaza cualquier `from` en un dominio no verificado, y `@gmail.com` nunca lo estará: el Gmail solo puede ser el destino.                 |
| Validación               | Zod                                                                      | Validación manual tipada sin dependencias                    | Elegido por el usuario: esquema único para cliente y servidor, errores por campo y tipos inferidos, a cambio de una dependencia de runtime.                                                   |
| Plantilla del correo     | `react-email` + `@react-email/components`                                | HTML inline a mano; solo texto plano                         | Elegido por el usuario: compatibilidad probada entre clientes de correo y plantilla mantenible en JSX.                                                                                        |
| Autorespuesta            | No hay: un solo correo, al equipo                                        | Acuse de recibo al visitante                                 | Duplica los modos de fallo (¿qué hacer si el primero va y el segundo no?) y el prototipo no la promete.                                                                                       |
| Falta de API key         | Modo simulación con aviso visible en el terminal                         | Fallar con terminal rojo; reventar en el arranque            | Permite trabajar la pantalla sin credenciales —la clave llega más tarde— y la línea «MODO SIMULACIÓN» impide confundirlo con un envío real.                                                   |
| Estado de error          | Terminal rojo con «REINTENTAR», conservando lo escrito                   | Banner inline; solo el shake del prototipo                   | Reutiliza el componente terminal y mantiene la estética; perder el mensaje escrito tras un fallo de red sería el peor resultado posible.                                                      |
| Estado de carga          | Botón «TRANSMITIENDO…» + campos bloqueados                               | Solo botón atenuado; terminal progresivo desde el clic       | El prototipo era instantáneo y no cubre la espera; bloquear los campos evita dobles envíos con un mínimo de piezas móviles.                                                                   |
| Líneas del terminal      | Escalonadas con `animation-delay` en CSS                                 | Todas de golpe como el prototipo                             | Elegido por el usuario: más sabor a terminal sin estado en React ni temporizadores, y degrada a «todo visible» con movimiento reducido.                                                       |
| Anti-spam                | Honeypot + rate limit en memoria (3 / 10 min / IP)                       | Solo honeypot; nada; Upstash Redis                           | Corta el abuso trivial sin añadir servicios externos ni variables. El límite distribuido puede llegar en un spec de hardening.                                                                |
| Respuesta al honeypot    | Éxito fingido, sin enviar correo                                         | Devolver error explícito                                     | Un error le dice al bot qué campo evitar; el éxito silencioso no.                                                                                                                             |
| Arquitectura             | Solo `contact-form.tsx` es cliente                                       | Toda la pantalla como componente cliente                     | Hero, destacados y divisor son estáticos: enviarlos como JS no aporta nada. Coherente con SPEC 01 y 02.                                                                                       |
| Persistencia             | Ninguna: el correo es el registro                                        | Guardar los mensajes en disco o en base de datos             | No hay backend en el proyecto y montarlo para tres campos abriría un spec entero.                                                                                                             |
| Estilos                  | Mismo híbrido de SPEC 01 y 02: utilidades + capa de efectos              | Copiar el bloque `about-*` de `styles.css` tal cual          | Una sola forma de escribir estilos en el proyecto; la capa CSS se queda con lo que Tailwind no expresa bien.                                                                                  |

---

## 6. Riesgos identificados

1. **Rate limit que no limita.** El contador vive en la memoria del proceso: se reinicia con cada despliegue o hot reload y no se comparte entre instancias serverless, donde cada invocación puede arrancar en frío. En ese escenario la protección real es solo el honeypot. Mitigación: queda registrado aquí; migrar a un almacén compartido si el formulario recibe abuso.
2. **Límites del remitente de pruebas.** Con `onboarding@resend.dev` como `from`, Resend **solo entrega al correo dueño de la cuenta**. Si la cuenta de Resend no es `patrickplanvideos91@gmail.com`, el envío será aceptado pero el correo no llegará a ese buzón. Y cualquier otro `from` en un dominio sin verificar hace fallar `resend.emails.send`, con terminal rojo genérico para el usuario. Mitigación: la nota del apartado 2 lo deja escrito, el detalle del fallo se registra con `console.error` en servidor y hay un criterio de aceptación que exige comprobar la recepción real.
3. **Secretos en el bundle.** Un import descuidado de la acción o de la plantilla desde un componente cliente arrastraría código de servidor. Mitigación: el cliente de Resend se instancia dentro de la acción y hay un criterio de aceptación que exige comprobar `.next/static`.
4. **Entregabilidad.** Aunque Resend acepte el envío, el correo puede acabar en spam del buzón del equipo. El éxito en la UI significa «aceptado por el proveedor», no «leído». Mitigación: asunto con prefijo fijo y `replyTo` del visitante; revisar la carpeta de spam en la primera prueba real.
5. **Éxito simulado tomado por real.** Si producción se despliega sin `RESEND_API_KEY`, la pantalla sigue diciendo que todo fue bien. Mitigación: la línea «MODO SIMULACIÓN» es visible en el terminal y el criterio de aceptación la exige; aun así, verificar la variable antes de cualquier despliegue público.
6. **Datos personales en logs.** El volcado por consola del modo simulación contiene nombre, correo y mensaje del visitante. Mitigación: solo ocurre sin API key, es decir, en desarrollo; no se registra nada del cuerpo en la rama de error del proveedor.
