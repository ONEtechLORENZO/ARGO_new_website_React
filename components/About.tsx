"use client";

import { useEffect, useRef } from "react";
import { decode } from "@/lib/decode";
import { onFirstView } from "@/lib/inView";
import { SITE } from "@/lib/site";
import { useT } from "./I18n";
import LogoMatrix from "./LogoMatrix";

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const t = useT().about;

  useEffect(() => {
    const el = ref.current!;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    let undo = () => {};
    /* il testo nasce dal codice che attraversa la linea: si decodifica dopo che il logo si è composto */
    const stop = onFirstView(el.querySelector<HTMLElement>(".about-card")!, 0.3, () => {
      el.classList.add("seen");
      if (!reduce) undo = decode([...el.querySelectorAll<HTMLElement>(".about-text [data-text]")], { delay: 1300, stagger: 0, dur: 1600 });
    });
    return () => { stop(); undo(); };
  }, []);

  return (
    <section className="about" id="chi-siamo" aria-labelledby="about-title" ref={ref}>
      <header className="about-head">
        <h2 id="about-title">{t.title}</h2>
      </header>

      <div className="about-card">
        <div className="about-copy">
          <p className="about-text">
            <span data-text={t.before}>{t.before}</span>
            <a href={`mailto:${SITE.email}`}><span data-text={SITE.email}>{SITE.email}</span></a>
            <span data-text={t.after}>{t.after}</span>
          </p>
        </div>
        <div className="about-line" aria-hidden="true" />
        <div className="about-art">
          <LogoMatrix className="about-logo" label={t.logo} />
        </div>
      </div>
    </section>
  );
}
