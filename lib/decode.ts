import { GLYPHS } from "@/components/MatrixRain";

/* Fa "decodificare" il testo di ogni elemento (dataset.text) da binario e lettere,
   da sinistra a destra, uno dopo l'altro. Restituisce una funzione che annulla e ripristina. */
export function decode(els: HTMLElement[], { delay = 0, stagger = 160, dur = 750 } = {}) {
  let raf = 0;
  const t0 = performance.now() + delay;
  const tick = (now: number) => {
    let busy = false;
    els.forEach((s, i) => {
      const text = s.dataset.text!, p = (now - t0 - i * stagger) / dur;
      const done = Math.floor(Math.max(0, p) * text.length);
      if (done < text.length) busy = true;
      s.textContent = text.split("").map((c, k) => (k < done || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
    });
    if (busy) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); els.forEach((s) => (s.textContent = s.dataset.text!)); };
}
