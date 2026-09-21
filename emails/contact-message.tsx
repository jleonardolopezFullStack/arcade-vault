import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

/**
 * Correo que recibe el equipo cuando alguien escribe desde /acerca-de.
 *
 * Todo va en estilos inline porque el HTML de correo no tiene otra: Gmail
 * recorta las hojas de estilo y Outlook renderiza con el motor de Word. Por lo
 * mismo la tipografía es una pila de fuentes del sistema, no `Press Start 2P`:
 * las webfonts del sitio no cargan en la mayoría de clientes.
 *
 * Solo se renderiza en servidor, desde la Server Action. No lo importes desde
 * un componente cliente.
 */

export type ContactMessageProps = {
  name: string;
  email: string;
  msg: string;
  sentAt: Date;
};

const BG = "#0a0a0f";
const PANEL = "#12121a";
const LINE = "#262633";
const CYAN = "#00f5ff";
const INK = "#e8e8f0";
const INK_DIM = "#9a9ab0";
const MONO =
  "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

/**
 * dd/mm/yyyy HH:mm en la hora del servidor, construido a mano por el mismo
 * motivo que lib/format.ts: no depender del ICU del runtime.
 */
function formatSentAt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ContactMessage({ name, email, msg, sentAt }: ContactMessageProps) {
  return (
    <Html lang="es">
      <Head />
      <Body
        style={{
          backgroundColor: BG,
          margin: 0,
          padding: "24px 0",
          fontFamily: MONO,
        }}
      >
        <Container
          style={{
            backgroundColor: PANEL,
            border: `1px solid ${LINE}`,
            maxWidth: "560px",
            margin: "0 auto",
            padding: 0,
          }}
        >
          <Section
            style={{
              backgroundColor: BG,
              borderBottom: `1px solid ${CYAN}`,
              padding: "16px 24px",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: CYAN,
                fontFamily: MONO,
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.14em",
              }}
            >
              ARCADE VAULT // NUEVO MENSAJE
            </Text>
          </Section>

          <Section style={{ padding: "24px" }}>
            <Field label="NOMBRE" value={name} />
            <Field label="CORREO ELECTRÓNICO" value={email} />
            <Field label="MENSAJE" value={msg} multiline />
          </Section>

          <Hr style={{ borderColor: LINE, margin: 0 }} />

          <Section style={{ padding: "14px 24px" }}>
            <Text
              style={{
                margin: 0,
                color: INK_DIM,
                fontFamily: MONO,
                fontSize: "11px",
                letterSpacing: "0.08em",
              }}
            >
              Enviado desde el formulario de /acerca-de · {formatSentAt(sentAt)}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <Section style={{ marginBottom: "18px" }}>
      <Text
        style={{
          margin: "0 0 6px",
          color: INK_DIM,
          fontFamily: MONO,
          fontSize: "10px",
          letterSpacing: "0.16em",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          margin: 0,
          color: INK,
          fontFamily: MONO,
          fontSize: "14px",
          lineHeight: "1.7",
          // El mensaje conserva los saltos de línea que escribió el visitante.
          whiteSpace: multiline ? "pre-wrap" : "normal",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Text>
    </Section>
  );
}

export default ContactMessage;
