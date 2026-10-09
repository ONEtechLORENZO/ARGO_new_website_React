/* Le cinque piccole scene animate delle card "Come funziona" (viewBox 300×180).
   Lo stato di riposo è quello finale; le animazioni partono quando la card riceve la classe
   "play" (in sequenza all'ingresso, di nuovo al passaggio del mouse) — vedi app/how.css. */

import type { Dict } from "@/lib/i18n";

type S = Dict["how"]["scene"];
const k = (n: number) => ({ "--k": n }) as React.CSSProperties;

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg className="scene" viewBox="0 0 300 180" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/* 01 — il cliente invia il documento in chat */
export function SceneChat({ s }: { s: S }) {
  return (
    <Svg>
      {/* segnale in uscita */}
      <g className="s1-sig">
        {[0, 1, 2].map((n) => (
          <path key={n} style={k(n)} className="ac" d={`M${216 + n * 9} ${78 - n * 6}q${8 + n * 3} ${12 + n * 6} 0 ${24 + n * 12}`} />
        ))}
      </g>
      <g className="s1-phone">
        <rect x="102" y="4" width="96" height="172" rx="16" className="pp" />
        <rect x="108" y="10" width="84" height="160" rx="11" className="sc-screen" />
        <rect x="136" y="13" width="28" height="5" rx="2.5" className="ink" />
        <circle cx="118" cy="30" r="5" className="soft" />
        <text x="127" y="33" className="tx sm">{s.chatName}</text>
        <path d="M108 40h84" className="ln thin" />
        <rect x="112" y="150" width="62" height="14" rx="7" className="inp" />
        <circle cx="184" cy="157" r="7" className="acf" />
        <path d="M181 157h6M185 154l2.5 3-2.5 3" className="wt-ln" />
      </g>
      <g className="s1-in">
        <rect x="113" y="48" width="62" height="20" rx="6" className="bub-in" />
        <path d="M119 55h46M119 61h30" className="ln lt" />
      </g>
      <circle cx="184" cy="157" r="7" className="s1-tap" />
      <g className="s1-out">
        <rect x="118" y="76" width="70" height="38" rx="7" className="bub-out" />
        <path d="M124 81h9l4 4v12h-13z" className="acf" />
        <path d="M141 85h38M141 91h26" className="ln lt" />
        <text x="124" y="108" className="tx sm">{s.file}</text>
      </g>
      <path className="s1-ticks" pathLength={1} d="M166 121l3 3 5-6M172 121l3 3 5-6" />
    </Svg>
  );
}

/* 02 — riconosce che è una busta paga */
export function SceneScan({ s }: { s: S }) {
  return (
    <Svg>
      <defs>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f9d5a" stopOpacity="0" />
          <stop offset="1" stopColor="#1f9d5a" stopOpacity=".28" />
        </linearGradient>
      </defs>
      <g className="s2-doc">
        <rect x="100" y="12" width="100" height="150" rx="4" className="pp" />
        <rect x="108" y="20" width="13" height="16" rx="2" className="acf" />
        <text x="127" y="32" className="tx b">{s.docTitle}</text>
        <path d="M108 44h84M108 92h84" className="ln thin" />
        <path d="M110 56h30M152 56h38M110 66h30M152 66h38M110 76h30M152 76h38M110 104h30M160 104h30M110 114h30M160 114h30M110 124h30M160 124h30" className="ln lt" />
        <rect x="108" y="136" width="84" height="16" rx="2" className="soft" />
        <path d="M113 144h30M166 144h21" className="ln" />
      </g>
      <path className="s2-br ac w2" d="M88 26V6h20M192 6h20v20M212 148v20h-20M108 168H88v-20" />
      <g className="s2-beam">
        <rect x="92" y="0" width="116" height="16" fill="url(#beamGrad)" />
        <path d="M92 16h116" className="ac w2" />
      </g>
      <path className="s2-link" pathLength={1} d="M212 86h10" />
      <g className="s2-chip">
        <rect x="222" y="74" width="76" height="24" rx="12" className="sc-chip" />
        <path d="M232 86l3 3 5-6" className="wt-ln" />
        <text x="245" y="89" className="tx wt">{s.detected}</text>
      </g>
    </Svg>
  );
}

/* 03 — estrae i dati: dal documento partono i dati verso le loro schede */
const CARDS = [
  { x: 6, y: 10, wire: "M128 74C104 74 116 30 100 30" },
  { x: 200, y: 10, wire: "M172 74C196 74 184 30 200 30" },
  { x: 6, y: 130, wire: "M128 104C104 104 116 150 100 150" },
  { x: 200, y: 130, wire: "M172 104C196 104 184 150 200 150" },
];
export function SceneExtract({ s }: { s: S }) {
  return (
    <Svg>
      {CARDS.map((c, n) => (
        <g key={n}>
          <path d={c.wire} className="s3-wire" style={k(n)} />
          <path d={c.wire} className="s3-pk" pathLength={1} style={k(n)} />
        </g>
      ))}
      <g className="s3-doc">
        <rect x="128" y="60" width="44" height="58" rx="3" className="pp" />
        <path d="M134 72h32M134 80h32M134 88h22M134 96h28M134 104h18" className="ln lt" />
      </g>
      {CARDS.map((c, n) => (
        <g key={n} transform={`translate(${c.x} ${c.y})`}>
          <g className="s3-card" style={k(n)}>
            <rect width="94" height="40" rx="6" className="sc-card" />
            <circle cx="10" cy="11" r="2.5" className="acf" />
            <text x="17" y="14" className="tx sm mut">{s.fields[n]}</text>
            <text x="8" y="30" className="tx b">{s.values[n]}</text>
          </g>
        </g>
      ))}
    </Svg>
  );
}

/* 04 — controlla cosa manca: tre dati confermati, uno segnalato */
export function SceneCheck({ s }: { s: S }) {
  const ROW = (n: number) => 40 + n * 30;
  return (
    <Svg>
      <g transform="translate(14 46) rotate(-8)">
        <g className="s4-g" style={k(0)}>
          <rect width="44" height="56" rx="6" className="glass" />
          <path d="M8 14h28M8 24h22M8 34h26" className="ln lt" />
        </g>
      </g>
      <g transform="translate(244 70) rotate(9)">
        <g className="s4-g" style={k(1)}>
          <rect width="44" height="56" rx="6" className="glass" />
          <path d="M8 14h28M8 24h22M8 34h26" className="ln lt" />
        </g>
      </g>
      <g className="s4-panel">
        <rect x="74" y="8" width="152" height="164" rx="8" className="pp" />
        <path d="M86 22h40M86 28h24" className="ln" />
        <circle cx="212" cy="24" r="5" className="soft" />
        {s.checks.map((c, n) => (
          <g key={c}>
            <rect x="86" y={ROW(n)} width="14" height="14" rx="3" className={"cb" + (n === 3 ? " miss" : "")} />
            <text x="108" y={ROW(n) + 10} className="tx">{c}</text>
            {n < 3 ? <path d={`M172 ${ROW(n) + 7}h42`} className="ln lt" /> : null}
          </g>
        ))}
      </g>
      <rect className="s4-scan" x="78" y="35" width="144" height="24" rx="4" />
      {[0, 1, 2].map((n) => (
        <path key={n} className="s4-tick" style={k(n)} pathLength={1} d={`M89.5 ${ROW(n) + 7}l3 3 5.5-6`} />
      ))}
      <g className="s4-miss">
        <path d={`M93 ${ROW(3) + 3.5}v4.5M93 ${ROW(3) + 10.5}v.2`} className="amb-ln" />
      </g>
      <g className="s4-flag">
        <rect x="158" y={ROW(3) - 3} width="60" height="20" rx="10" className="sc-flag" />
        <text x="166" y={ROW(3) + 10} className="tx amb">{s.missing}</text>
      </g>
    </Svg>
  );
}

/* 05 — consegna: i dati entrano nel gestionale, riga per riga */
export function SceneDeliver({ s }: { s: S }) {
  const ROW = (n: number) => 62 + n * 23;
  return (
    <Svg>
      <g className="s5-tab">
        <rect x="36" y="22" width="228" height="150" rx="12" className="pp" />
        <rect x="44" y="30" width="212" height="134" rx="6" className="sc-screen" />
        <text x="54" y="47" className="tx b">{s.system}</text>
        <path d="M50 53h200" className="ln thin" />
      </g>
      <g className="s5-drop">
        <rect x="140" y="-8" width="20" height="20" rx="3" className="acf" />
        <path d="M144 -2h12M144 3h12M144 8h8" className="wt-ln" />
      </g>
      <circle cx="150" cy="40" r="8" className="s5-rip" />
      {s.fields.map((f, n) => (
        <g key={f} className="s5-row" style={{ "--r": n } as React.CSSProperties}>
          <text x="54" y={ROW(n) + 11} className="tx mut">{f}</text>
          <rect x="132" y={ROW(n)} width="114" height="16" rx="3" className="s5-val" />
          <text x="138" y={ROW(n) + 11} className="tx">{s.values[n]}</text>
        </g>
      ))}
      <g className="s5-status">
        <circle cx="206" cy="43" r="3" className="acf" />
        <text x="213" y="46" className="tx grn">{s.ready}</text>
      </g>
    </Svg>
  );
}

export const SCENES = [SceneChat, SceneScan, SceneExtract, SceneCheck, SceneDeliver];
