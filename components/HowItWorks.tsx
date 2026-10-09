"use client";

import { useEffect, useRef } from "react";
import { decode } from "@/lib/decode";
import { onFirstView } from "@/lib/inView";
import { useT } from "./I18n";
import MatrixRain from "./MatrixRain";
import { SCENES } from "./StepScenes";

const SCENE_GAP = 0.65; /* secondi fra una scena e la successiva all'ingresso */
const SCENE_LEN = 2400; /* ms: durata di una scena, per non farla ripartire a metà */

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const t = useT().how;

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const undo: (() => void)[] = [];
    const run = (els: HTMLElement[], opts?: Parameters<typeof decode>[1]) => { if (!reduce) undo.push(decode(els, opts)); };
    const steps = ref.current!;
    const cards = [...steps.querySelectorAll<HTMLElement>(".step")];
    const busyUntil = new WeakMap<HTMLElement, number>();

    /* avvia (o riavvia) la scena di una card: togliere e rimettere "play" fa ripartire le animazioni CSS */
    const play = (card: HTMLElement, delay: number) => {
      card.classList.remove("play");
      card.style.setProperty("--sd", `${delay}s`);
      void card.offsetWidth;
      card.classList.add("play");
      busyUntil.set(card, performance.now() + delay * 1000 + SCENE_LEN);
    };

    /* all'ingresso: titoli che si decodificano e scene in sequenza, come un racconto */
    undo.push(onFirstView(steps, 0.12, () => {
      run([...steps.querySelectorAll<HTMLElement>(".step h3 span")]);
      if (!reduce) cards.forEach((c, i) => play(c, 0.3 + i * SCENE_GAP));
    }));

    /* passando sopra (o toccando) una card, la sua scena si ripete */
    if (!reduce) {
      const replay = (e: PointerEvent) => {
        const card = e.currentTarget as HTMLElement;
        if ((busyUntil.get(card) ?? 0) > performance.now()) return;
        play(card, 0);
      };
      const onEnter = (e: PointerEvent) => { if (e.pointerType === "mouse") replay(e); };
      const onTap = (e: PointerEvent) => { if (e.pointerType !== "mouse") replay(e); };
      cards.forEach((c) => { c.addEventListener("pointerenter", onEnter); c.addEventListener("pointerup", onTap); });
      undo.push(() => cards.forEach((c) => { c.removeEventListener("pointerenter", onEnter); c.removeEventListener("pointerup", onTap); }));
    }
    return () => undo.forEach((u) => u());
  }, []);

  return (
    <section className="how" id="come-funziona" aria-labelledby="how-title" ref={ref}>
      <header className="how-head">
        <h2 id="how-title">{t.title}</h2>
      </header>

      <div className="how-grid">
        <ol className="steps">
          {t.steps.map(([title, text], i) => {
            const Scene = SCENES[i];
            const cut = title.indexOf(" ");
            const first = cut > 0 ? title.slice(0, cut) : title, rest = cut > 0 ? title.slice(cut) : "";
            return (
              <li className="step" key={i} style={{ "--i": i } as React.CSSProperties}>
                <MatrixRain className="step-rain" variant="mono" once={2200} delay={i * 120} />
                <span className="big-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div className="step-meta">
                  <span className="num" aria-hidden="true">{String(i + 1).padStart(2, "0")} / {String(t.steps.length).padStart(2, "0")}</span>
                  <span className="kick">{t.kickers[i]}</span>
                </div>
                {/* la scena poggia su un "palco": alone verde dietro, piattaforma tratteggiata sotto */}
                <div className="stage"><Scene s={t.scene} /></div>
                {/* come in "Perché conviene": la prima parola in verde */}
                <h3 aria-label={title}>
                  <span className="hl" data-text={first} aria-hidden="true">{first}</span>
                  <span data-text={rest} aria-hidden="true">{rest}</span>
                </h3>
                <p>{text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
