"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_HASH } from "./DemoModal";
import { useT } from "./I18n";
import MatrixRain from "./MatrixRain";

/* fasi: 0 vuoto · 1 file in chat · 2 ARGO sta leggendo · 3 riconosciuto · 4–8 righe · 9 consegnato.
   Si recita una volta sola, al primo ingresso, poi resta sullo stato finale. */
const DUR = [1000, 900, 900, 600, 420, 420, 420, 420, 650];
const DONE = 9;

export default function DemoPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT().demo;
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
      setStill(true);
      setStage(DONE);
      return;
    }
    const el = ref.current!;
    let visible = false;
    const sync = () => setRunning(visible && !document.hidden);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.25 });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);

  useEffect(() => {
    if (!running || still || stage >= DONE) return;
    const id = window.setTimeout(() => setStage(stage + 1), DUR[stage]);
    return () => clearTimeout(id);
  }, [running, stage, still]);

  /* quattro dati trovati + uno mancante, segnalato invece di inventato */
  const rows = [...t.rows.map(([label, value]) => ({ label, value, flag: "" })), { label: t.missingLabel, value: "", flag: t.missing }];

  return (
    <div className="demo" id="demo" ref={ref}>
      <p className="sr-only">{t.sr}</p>
      <MatrixRain className="demo-rain" variant="night" once={1800} />
      <div className="demo-screen" aria-hidden="true" data-stage={stage}>
        <div className="demo-label"><span className="demo-live" />{t.chat}</div>

        <div className="chat">
          <div className={"bub me" + (stage >= 1 ? " on" : "")}>
            <svg viewBox="0 0 16 16" className="clip"><path d="M10.5 4.5l-5 5a1.8 1.8 0 0 0 2.5 2.5l5.5-5.5a3 3 0 0 0-4.2-4.2L3.6 8a4.2 4.2 0 0 0 6 6l4-4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            {t.file}
          </div>
          <div className={"bub argo" + (stage === 2 ? " on typing" : stage >= 3 ? " on" : "")}>
            {stage === 2 ? (
              <span className="dots"><i /><i /><i /></span>
            ) : (
              <><b className="ok" />{t.recognised}</>
            )}
          </div>
        </div>

        <div className={"sheet-ui" + (stage >= 4 ? " on" : "")}>
          <div className="sheet-head">
            <span>{t.system}</span>
            <span className={"status" + (stage >= DONE ? " on" : "")}>{stage >= DONE ? t.ready : t.filling}</span>
          </div>
          <dl>
            {rows.map((r, i) => (
              <div key={r.label} className={"row" + (stage >= 4 + i ? " on" : "") + (r.flag ? " miss" : "")}>
                <dt>{r.label}</dt>
                <dd>{r.flag ? <span className="flag">{r.flag} · {t.toRequest}</span> : r.value}</dd>
              </div>
            ))}
          </dl>
          <p className={"note" + (stage >= DONE ? " on" : "")}>{t.note(t.missingLabel)}</p>
        </div>
      </div>

      <a className="demo-cta" href={DEMO_HASH}>
        <span>{t.cta}</span>
        <span className="arrow" aria-hidden="true">
          <svg viewBox="0 0 20 20"><path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </a>
    </div>
  );
}
