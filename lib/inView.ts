/* Aggiunge "seen" la prima volta che l'elemento entra a schermo e lancia l'animazione d'ingresso.
   Restituisce la funzione di pulizia. */
export function onFirstView(el: HTMLElement, threshold: number, start: () => void) {
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      el.classList.add("seen");
      start();
      io.disconnect();
    },
    { threshold },
  );
  io.observe(el);
  return () => io.disconnect();
}
