"use client";

import { useEffect, useRef } from "react";
import { startReader } from "@/lib/argoReader";
import { DEMO_HASH } from "./DemoModal";
import { useT } from "./I18n";

const nsw = { vectorEffect: "non-scaling-stroke" as const };

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const t = useT().hero;

  useEffect(() => {
    if (!root.current) return;
    return startReader(root.current, { docs: t.docs, pause: t.pause, resume: t.resume });
  }, [t]);

  return (
    <div className="page" id="hero" ref={root}>
      <div className="glow" aria-hidden="true" />

      <div className="hero-body">
        <section className="reader" id="contenuto" aria-label={t.readerLabel}>
          <div className="reader-in">
            <div className="now" aria-live="off">
              <svg viewBox="0 0 30 38" aria-hidden="true" focusable="false">
                <path d="M1 1h20l8 8v28H1z" fill="#fbfdfb" stroke="#8fa89a" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M21 1v8h8" fill="none" stroke="#8fa89a" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M7 18h16M7 24h16" stroke="#b9cbc0" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M7 30h9" stroke="#1f9d5a" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{t.reading}</span>
              <b id="docname">{t.docs[0][0]}</b>
            </div>

            <svg className="mark" id="mark" viewBox="0 0 3406 801" role="img" aria-labelledby="mark-title">
              <title id="mark-title">ARGO</title>
              <defs>
                <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#1f9d5a" stopOpacity="0" />
                  <stop offset="1" stopColor="#1f9d5a" stopOpacity=".2" />
                </linearGradient>
              </defs>
              <g data-x="0">
                <path className="facet d" data-id="a2" data-p="a1" data-s="1" data-h="629,3,508,261" d="M629,3 L826,383 L579,383 L508,261 Z" />
                <path className="facet d" data-id="a3" data-p="a1" data-s="2" data-h="414,450,331,619" d="M414,450 L606,450 L690,620 L331,619 Z" />
                <path className="facet l" data-id="a1" data-s="0" data-h="0,801,100,801" d="M366.5,69.1 Q400,2 475.0,1.4 L638,0 L279.9,732.6 Q247,800 172.0,800.3 L1,801 Z" />
                <path className="facet l" data-id="a4" data-p="a3" data-s="3" data-h="606,450,690,620" d="M607,449 L859,449 L1031,800 L855.0,800.0 Q780,800 746.9,732.7 L693,623 Z" />
              </g>
              <g data-x="1161" transform="translate(1161,0)">
                <path className="facet l" data-id="r1" data-s="0" data-h="0,800,100,800" d="M0.0,70.0 Q0,0 70.0,0.0 L165,0 L165,800 L0,800 Z" />
                <path className="facet d" data-id="r2" data-p="r1" data-s="1" data-h="165,0,165,165" d="M165,0 L500,0 L403,165 L165,165 Z" />
                <path className="facet l" data-id="r3" data-p="r2" data-s="2" data-h="500,0,403,165" d="M500,0 L595.0,0.0 Q665,0 629.4,60.3 L405,440 L240,440 Z" />
                <path className="facet d" data-id="r4" data-p="r3" data-s="3" data-h="240,440,405,440" d="M240,440 L405,440 L605,800 L510.0,800.0 Q440,800 406.0,738.8 Z" />
              </g>
              <g data-x="1956" transform="translate(1956,0)">
                <path className="facet l" data-id="g1" data-s="0" data-h="0,800,100,800" d="M0.0,70.0 Q0,0 70.0,0.0 L165,0 L165,635 L0,800 Z" />
                <path className="facet d" data-id="g2" data-p="g1" data-s="1" data-h="165,0,165,165" d="M165,0 L590.0,0.0 Q660,0 610.5,49.5 L495,165 L165,165 Z" />
                <path className="facet d" data-id="g3" data-p="g1" data-s="2" data-h="0,800,165,635" d="M0,800 L165,635 L660,635 L660,800 Z" />
                <path className="facet l" data-id="g4" data-p="g3" data-s="3" data-h="495,800,660,635" d="M495,380 L660,380 L660,635 L495,800 Z" />
                <path className="facet l" data-id="g5" data-p="g4" data-s="4" data-h="660,380,660,545" d="M400.0,450.0 Q400,380 470.0,380.0 L660,380 L660,545 L400,545 Z" />
              </g>
              <g data-x="2746" transform="translate(2746,0)">
                <path className="facet l" data-id="o1" data-s="0" data-h="0,800,100,800" d="M0.0,70.0 Q0,0 70.0,0.0 L165,0 L165,635 L0,800 Z" />
                <path className="facet d" data-id="o2" data-p="o1" data-s="1" data-h="165,0,165,165" d="M165,0 L660,0 L495,165 L165,165 Z" />
                <path className="facet d" data-id="o3" data-p="o1" data-s="2" data-h="0,800,165,635" d="M0,800 L165,635 L496,635 L496,800 Z" />
                <path className="facet l" data-id="o4" data-p="o2" data-s="3" data-h="660,0,495,165" d="M495,165 L660,0 L660.0,730.0 Q660,800 590.0,800.0 L495,800 Z" />
              </g>
              <g className="sheet" id="sheet" aria-hidden="true">
                <g transform="scale(3)">
                  <path d="M-38-48h60l16 16V48H-38z" fill="#fbfdfb" stroke="#8fa89a" strokeWidth="1.2" style={nsw} strokeLinejoin="round" />
                  <path d="M22-48v16h16" fill="none" stroke="#8fa89a" strokeWidth="1.2" style={nsw} strokeLinejoin="round" />
                  <path d="M-26-18h44M-26-4h44M-26 10h30" fill="none" stroke="#b9cbc0" strokeWidth="1.4" style={nsw} strokeLinecap="round" />
                  <path d="M-26 26h22" fill="none" stroke="#1f9d5a" strokeWidth="1.8" style={nsw} strokeLinecap="round" />
                </g>
              </g>
              <g className="beam" id="beam" aria-hidden="true">
                <rect x="-300" y="-70" width="300" height="941" fill="url(#trail)" />
                <line x1="0" y1="-70" x2="0" y2="871" stroke="#1f9d5a" strokeWidth="3" style={nsw} strokeLinecap="round" />
                <line x1="0" y1="-70" x2="0" y2="871" stroke="#d6f5e4" strokeWidth="1" style={nsw} />
              </g>
            </svg>

            <dl className="fields" aria-label={t.fieldsLabel}>
              {[0, 1, 2, 3].map((i) => (
                <div className="field" key={i}>
                  <dt />
                  <dd />
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="copy" aria-labelledby="titolo">
          <h1 id="titolo">
            <span className="sr-only">{t.srTitle}</span>
            <span className="ln ln1"><i>{t.lines[0]}</i></span>
            <span className="ln ln2 half"><i>{t.lines[1]}</i></span>
            <span className="ln ln3 half"><i>{t.lines[2]}</i></span>
          </h1>
          <div className="side">
            <p>{t.side}</p>
            <div className="actions">
              <a className="cta" href={DEMO_HASH}>{t.cta}</a>
              <a className="more" href="#come-funziona">{t.more}</a>
            </div>
          </div>
        </section>
      </div>

      <div className="lower">
        <p>{t.tagline}</p>
        <p className="lower-claim">{t.claim}</p>
      </div>
    </div>
  );
}
