"use client";

import { useEffect, useRef } from "react";
import { decode } from "@/lib/decode";
import { onFirstView } from "@/lib/inView";
import { useT } from "./I18n";
import MatrixRain from "./MatrixRain";
import { ExplodedStack, Icon, IconName, OperatorHub, Tick } from "./WhyGraphics";

/* icone e avanzamento: i testi (dati dimostrativi) sono nel dizionario */
const FIELD_ICONS: IconName[] = ["user", "building", "phone", "mail", "pin", "id"];
const PIPELINE: [IconName, number][] = [["user", 18], ["shield", 42], ["doc", 66], ["chart", 86], ["check", 100]];

/* titolo con una parte evidenziata; per la decodifica ogni pezzo è uno span */
function Title({ hl, rest }: { hl: string; rest: string }) {
  return (
    <h3 aria-label={hl + rest}>
      <span className="hl" data-text={hl} aria-hidden="true">{hl}</span>
      <span data-text={rest} aria-hidden="true">{rest}</span>
    </h3>
  );
}

function Meta({ n, children }: { n: string; children?: React.ReactNode }) {
  return (
    <div className="why-meta">
      <span aria-hidden="true">{n} / 04</span>
      {children}
    </div>
  );
}

export default function WhyArgo() {
  const ref = useRef<HTMLElement>(null);
  const t = useT().why;

  useEffect(() => {
    const root = ref.current!;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const undo: (() => void)[] = [];

    root.querySelectorAll<HTMLElement>(".why-card").forEach((card) => {
      undo.push(
        onFirstView(card, 0.3, () => {
          if (reduce) return;
          undo.push(decode([...card.querySelectorAll<HTMLElement>("h3 span")], { stagger: 260, dur: 700 }));
          const vals = [...card.querySelectorAll<HTMLElement>(".why-row .val")];
          if (vals.length) undo.push(decode(vals, { delay: 400, stagger: 200, dur: 650 }));
          /* contatore 0 → 100% dei dati validati */
          const count = card.querySelector<HTMLElement>(".count");
          if (count) {
            let raf = 0;
            const t0 = performance.now() + 1900;
            const tick = (now: number) => {
              const p = Math.min(1, Math.max(0, (now - t0) / 900));
              count.textContent = String(Math.round(100 * (1 - Math.pow(1 - p, 3))));
              if (p < 1) raf = requestAnimationFrame(tick);
            };
            count.textContent = "0";
            raf = requestAnimationFrame(tick);
            undo.push(() => { cancelAnimationFrame(raf); count.textContent = "100"; });
          }
        }),
      );
    });
    /* le grafiche si animano in continuo solo mentre la sezione è a schermo */
    if (!reduce) {
      const io = new IntersectionObserver(([e]) => root.classList.toggle("run", e.isIntersecting));
      io.observe(root);
      undo.push(() => io.disconnect());
    }
    return () => undo.forEach((u) => u());
  }, []);

  return (
    <section className="why" id="perche-conviene" aria-labelledby="why-title" ref={ref}>
      <header className="why-head">
        <h2 id="why-title">{t.title}</h2>
        <p className="why-index" aria-hidden="true">
          <span>01</span><span>02</span><span>03</span><span>04</span>
        </p>
      </header>

      <div className="why-grid">
        {/* 01 — zero data entry */}
        <article className="why-card why-zero">
          <MatrixRain className="why-rain" variant="mono" once={2200} />
          <div className="why-copy">
            <Meta n="01" />
            <Title hl={t.zero[0]} rest={t.zero[1]} />
            <ul className="why-slash" aria-label={t.formats}>
              {t.formatList.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
          <ExplodedStack labels={t.plates} />
          <p className="why-foot"><Icon name="shield" />{t.foot}</p>
        </article>

        {/* 02 — meno errori */}
        <article className="why-card why-err">
          <MatrixRain className="why-rain" variant="mono" once={2000} delay={150} />
          <Meta n="02"><span className="why-chip"><Icon name="shield" />{t.errChip}</span></Meta>
          <Title hl={t.err[0]} rest={t.err[1]} />
          <p className="why-sub">{t.errSub}</p>
          <div className="why-table" aria-hidden="true">
            {t.fields.map(([label, value], i) => (
              <div className="why-row" key={label} style={{ "--i": i } as React.CSSProperties}>
                <Icon name={FIELD_ICONS[i]} />
                <span className="lab">{label}</span>
                <span className="val" data-text={value}>{value}</span>
                <Tick />
              </div>
            ))}
          </div>
          <div className="why-box" aria-hidden="true">
            <svg className="ring" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="19" className="ring-bg" />
              <circle cx="22" cy="22" r="19" className="ring-fg" pathLength={1} />
              <path d="M15 22.5l4.5 4.5 9-10" className="ring-ok" pathLength={1} />
            </svg>
            <div>
              <small>{t.quality}</small>
              <strong>{t.qualityTitle}</strong>
              <em>{t.qualityErrors} · <span className="count">100</span>{t.qualityValid}</em>
            </div>
          </div>
        </article>

        {/* 03 — lead più veloci */}
        <article className="why-card why-fast">
          <MatrixRain className="why-rain" variant="mono" once={2000} delay={300} />
          <Meta n="03" />
          <Title hl={t.fast[0]} rest={t.fast[1]} />
          <p className="why-sub">{t.fastSub}</p>
          <ol className="why-pipe" aria-hidden="true">
            {PIPELINE.map(([ic, p], i) => (
              <li key={ic} style={{ "--i": i, "--p": p + "%" } as React.CSSProperties}>
                <span className="ib"><Icon name={ic} /></span>
                <span className="lab">{t.pipeline[i]}</span>
                <span className="track"><i /></span>
                <Tick />
              </li>
            ))}
          </ol>
          <div className="why-box" aria-hidden="true">
            <span className="bolt"><Icon name="bolt" /></span>
            <div>
              <strong>{t.fastBox}</strong>
              <em className="plain">{t.fastBoxText}</em>
            </div>
          </div>
        </article>

        {/* 04 — operatori */}
        <article className="why-card why-ops">
          <MatrixRain className="why-rain" variant="mono" once={2200} />
          <div className="why-copy">
            <Meta n="04" />
            <Title hl={t.ops[0]} rest={t.ops[1]} />
          </div>
          <OperatorHub />
        </article>
      </div>
    </section>
  );
}
