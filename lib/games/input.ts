// Regla compartida por el motor y el reproductor: mientras se escribe en un
// campo, el teclado es del campo. Sin esto, el modal de fin de partida no deja
// teclear un espacio (el motor lo captura) y la «P» pausaría al escribir.

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}
