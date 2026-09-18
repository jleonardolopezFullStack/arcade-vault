"use client";

import { useEffect, useRef } from "react";

/**
 * Sección que entra al hacer scroll. Observa su propio nodo y, al asomar,
 * le añade la clase `in` que dispara la transición de `.reveal` en
 * globals.css.
 *
 * Es el único componente cliente de la landing: en el prototipo el efecto
 * vivía en un hook que barría todo el documento con querySelectorAll.
 *
 * Con movimiento reducido no se observa nada. El @media de globals.css ya
 * deja `.reveal` visible desde el primer pintado, así que la degradación es
 * a «todo visible» aunque el JS no llegue a ejecutarse.
 */

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </section>
  );
}
