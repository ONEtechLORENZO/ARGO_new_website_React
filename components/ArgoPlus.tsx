"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ARGO_PLUS, ARGO_PLUS_TONES } from "@/lib/argoLogo";
import { useT } from "./I18n";
import MatrixRain from "./MatrixRain";

/* barre isometriche sullo schermo: x, altezza */
const BARS: [number, number][] = [[418, 74], [478, 138], [538, 208]];
const BASE = 330, FW = 46, DX = 22, DY = 12;


export default function ArgoPlus() {
  const ref = useRef<HTMLElement>(null);
  const t = useT().plus;

  useEffect(() => {
    const el = ref.current!;
    /* .seen: ingresso una volta sola (logo, barre, chip) · .run: animazioni dello schermo solo se visibile */
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.classList.add("seen");
        el.classList.toggle("run", e.isIntersecting);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="plus" id="argo-plus" aria-labelledby="plus-title" ref={ref}>
      {/* sottotitolo fra "Come funziona" e ARGO+: non solo lettura */}
      <p className="plus-intro">
        <b>{t.intro[0]} <span>{t.intro[1]}</span></b>
      </p>
      <div className="plus-card">
        <MatrixRain className="rain" />
        <div className="plus-glow" aria-hidden="true" />

        <ul className="plus-feats" aria-label={t.featuresLabel}>
          {t.features.map((f, i) => (
            <li key={f} style={{ "--i": i } as React.CSSProperties}>
              <span className="idx" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <span className="txt">
                {f}
                <span className="chip" aria-hidden="true">{t.ready}</span>
              </span>
              <span className="wire" aria-hidden="true"><i /></span>
            </li>
          ))}
        </ul>

        <div className="rig" aria-hidden="true">
          <div className="monitor">
            <svg className="screen" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#0d2117" />
                  <stop offset="1" stopColor="#050c08" />
                </linearGradient>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M32 0H0V32" fill="none" stroke="#1f9d5a" strokeOpacity=".1" />
                </pattern>
                <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#1f9d5a" stopOpacity="0" />
                  <stop offset="1" stopColor="#1f9d5a" stopOpacity=".28" />
                </linearGradient>
              </defs>
              <rect width="640" height="400" fill="url(#scr)" />
              <rect width="640" height="400" fill="url(#grid)" />

              {/* il marchio ARGO+ come nel logo (public/argo-plus.png), ridisegnato in vettoriale */}
              <g className="scr-logo" transform="translate(44,156) scale(.082)">
                {ARGO_PLUS.map(([x, paths], n) => (
                  <g key={x} transform={`translate(${x},0)`} className={n === ARGO_PLUS.length - 1 ? "scr-plus" : undefined}>
                    {paths.map(([tone, d]) => <path key={d} d={d} fill={ARGO_PLUS_TONES[tone]} />)}
                  </g>
                ))}
              </g>

              <path d={`M400 ${BASE}H620`} stroke="#1f9d5a" strokeOpacity=".35" />
              {BARS.map(([x, hgt], i) => (
                <g className="bar" key={x} style={{ "--i": i } as React.CSSProperties}>
                  <path d={`M${x + FW} ${BASE - hgt}l${DX} ${-DY}V${BASE - DY}l${-DX} ${DY}z`} fill="#0f6b3d" />
                  <path d={`M${x} ${BASE - hgt}h${FW}V${BASE}H${x}z`} fill={i === 2 ? "#2fbf72" : "#1f9d5a"} />
                  <path d={`M${x} ${BASE - hgt}l${DX} ${-DY}h${FW}l${-DX} ${DY}z`} fill="#8de8b4" />
                </g>
              ))}
              <g className="gem">
                <path d="M550 36h22v58l-22-18z" fill="#d4f25a" />
                <path d="M572 36h22v40l-22 18z" fill="#a8c93c" />
              </g>

              <text className="scr-tag" x="44" y="292">{t.screenTag}</text>
              {/* il cursore segue la fine della scritta (font monospaziato: ~9,2 unità per carattere) */}
              <rect className="scr-cursor" x={Math.round(44 + t.screenTag.length * 9.2)} y="282" width="7" height="12" fill="#d4f25a" />
              <g className="scr-sweep"><rect x="-120" width="120" height="400" fill="url(#sweep)" /><path d="M0 0V400" stroke="#c9f7dc" strokeOpacity=".7" /></g>
            </svg>
          </div>
          <div className="neck" />
          <div className="plinth" />
        </div>

        <div className="plus-copy">
          <h2 id="plus-title">
            <Image className="plus-logo" src="/argo-plus.png" alt="ARGO+" width={2172} height={724} sizes="(max-width:640px) 70vw, 380px" />
          </h2>
          <p className="plus-lead">{t.lead}</p>
          <p className="plus-text">{t.text}</p>
        </div>
      </div>
      <p className="plus-cap">{t.caption}</p>
    </section>
  );
}
