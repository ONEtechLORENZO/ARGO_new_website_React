"use client";

import { useEffect, useRef, useState } from "react";
import { decode } from "@/lib/decode";
import { onFirstView } from "@/lib/inView";
import { PLANS, perPage } from "@/lib/plans";
import { DEMO_HASH } from "./DemoModal";
import { useT } from "./I18n";
import { Tick } from "./WhyGraphics";

/* il piano messo in evidenza, come nel riferimento */
const FEATURED = "business";
const MAX_PER_PAGE = 0.24;
/* riquadro Enterprise ("Su richiesta"): nascosto per ora, true per mostrarlo di nuovo */
const SHOW_ENTERPRISE = true;

function Cross() {
  return (
    <svg className="cross" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7l10 10M17 7L7 17" pathLength={1} />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const { prices: t, form: f, num } = useT();
  /* su telefono i piani scorrono di lato: questo è il piano in vista */
  const [active, setActive] = useState(0);
  const tiersRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = tiersRef.current!;
    const card = el.querySelector<HTMLElement>(".tier");
    if (!card) return;
    setActive(Math.min(PLANS.length - 1, Math.round(el.scrollLeft / (card.offsetWidth + 10))));
  };
  const goTo = (i: number) => {
    const el = tiersRef.current!;
    const card = el.querySelectorAll<HTMLElement>(".tier")[i];
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" });
  };

  useEffect(() => {
    const root = ref.current!;
    const table = root.querySelector<HTMLElement>(".tiers")!;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    let undoDecode = () => {};
    /* unico tocco "Matrix": i prezzi si decodificano una volta all'ingresso */
    const stop = onFirstView(table, 0.2, () => {
      root.classList.add("seen");
      if (!reduce) undoDecode = decode([...root.querySelectorAll<HTMLElement>(".t-amt [data-text]")], { delay: 300, stagger: 120, dur: 650 });
    });
    return () => { stop(); undoDecode(); };
  }, []);

  return (
    <section className="prices" id="prezzi" aria-labelledby="prices-title" ref={ref}>
      <header className="prices-head">
        <h2 id="prices-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      <div className="tiers" ref={tiersRef} onScroll={onScroll}>
        {/* intestazioni di riga (solo desktop; su mobile ogni valore ha la sua etichetta) */}
        <div className="t-labels" aria-hidden="true">
          <span />
          {t.rows.map((r) => <span key={r}>{r}</span>)}
          <span />
        </div>

        {PLANS.map((p, i) => {
          const featured = p.id === FEATURED;
          const ppp = perPage(p);
          const onboarding = p.onboarding !== null ? t.onboardingFee(p.onboarding) : null;
          const orchestrator = t.orchestrator(p.orchestrator);
          return (
            <article key={p.id} className={"tier" + (featured ? " featured" : "")} style={{ "--i": i } as React.CSSProperties}>
              <header className="t-head">
                <h3>{p.name}</h3>
                <p className="t-amt" aria-label={t.priceAria(p.price)}>
                  <span aria-hidden="true">€</span>
                  <b data-text={num(p.price)} aria-hidden="true">{num(p.price)}</b>
                  <small aria-hidden="true">{t.perMonth}</small>
                </p>
              </header>
              <dl>
                <div className="t-row">
                  <dt>{t.rows[0]}</dt>
                  <dd>
                    <ul className="t-list">
                      <li style={{ "--k": 0 } as React.CSSProperties}><Tick /><span>{t.pages(p.pages)}</span></li>
                      <li style={{ "--k": 1 } as React.CSSProperties}>
                        <Tick />
                        <span>
                          {t.perPage(ppp)}
                          <span className="ppp-bar" aria-hidden="true"><i style={{ width: (ppp / MAX_PER_PAGE) * 100 + "%" }} /></span>
                        </span>
                      </li>
                      {onboarding ? (
                        <li className="no" style={{ "--k": 2 } as React.CSSProperties}>
                          <Cross /><span><s>{t.onboardingFree}</s><span className="sr-only">{t.notIncluded}</span></span>
                        </li>
                      ) : (
                        <li style={{ "--k": 2 } as React.CSSProperties}><Tick /><span>{t.onboardingFree}</span></li>
                      )}
                    </ul>
                  </dd>
                </div>
                <div className="t-row">
                  <dt>{t.rows[1]}</dt>
                  <dd>
                    <ul className="t-extra">
                      {onboarding && <li>+ {onboarding[0]} <span className="nw">{onboarding[1]}</span></li>}
                      <li>+ {orchestrator[0]} <span className="nw">{orchestrator[1]}</span></li>
                    </ul>
                  </dd>
                </div>
              </dl>
              <a className="t-cta" href={DEMO_HASH} data-plan={p.id} data-interest={f.plan(p.name)} aria-label={t.ctaAria(p.name)}>
                {t.cta} <Arrow />
              </a>
            </article>
          );
        })}
      </div>
      <div className="t-dots">
        {PLANS.map((p, i) => (
          <button key={p.id} type="button" className={i === active ? "on" : undefined} aria-label={p.name} aria-current={i === active || undefined} onClick={() => goTo(i)} />
        ))}
      </div>

      {SHOW_ENTERPRISE && (
      <article className="ent">
        <div className="ent-main">
          <h3>Enterprise</h3>
          <p className="ent-price">{t.enterprise.price}</p>
          <p className="ent-lead">{t.enterprise.lead}</p>
        </div>
        <ul>
          {t.enterprise.features.map((f) => <li key={f}>{f}</li>)}
        </ul>
        <a className="t-cta" href={DEMO_HASH} data-plan="enterprise" data-interest={f.plan("Enterprise")} aria-label={t.ctaAria("Enterprise")}>
          {t.cta} <Arrow />
        </a>
      </article>
      )}

      <p className="prices-note">{t.note}</p>
    </section>
  );
}
