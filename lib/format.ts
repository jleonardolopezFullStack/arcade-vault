// Separador de millares con "." insertado manualmente.
// NO usa toLocaleString: evita depender del ICU del runtime y elimina
// cualquier riesgo de desajuste servidor/cliente al hidratar.
//
// Como el español (y por tanto el es-ES del prototipo), no separa los números
// de cuatro cifras: 7820 → "7820", pero 12345 → "12.345".
export function formatScore(n: number): string {
  const neg = n < 0;
  const digits = String(Math.trunc(Math.abs(n)));
  let out = "";

  if (digits.length <= 4) {
    out = digits;
  } else {
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 === 0) out += ".";
      out += digits[i];
    }
  }

  return neg ? `-${out}` : out;
}

// dd/mm/yyyy, mismo formato que `ScoreRow["date"]`. Por el mismo motivo que
// formatScore, se construye a mano en vez de con toLocaleDateString.
export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}
