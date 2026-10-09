/* Grafiche a linea, bianco e nero, per "Perché conviene". Animazioni in app/why.css. */

const ICONS = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  building: <path d="M4 21V5l8-2v18M12 21h8V9l-8-2M8 8v.01M8 12v.01M8 16v.01M16 12v.01M16 16v.01" />,
  phone: <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2" />,
  mail: <><rect x="3" y="5" width="18" height="14" /><path d="M3 7l9 6 9-6" /></>,
  pin: <><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  id: <><rect x="3" y="5" width="18" height="14" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 13h4" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h7" /></>,
  chart: <path d="M4 20h16M4 16l5-5 4 3 7-8" />,
  bars: <path d="M5 20V11M10 20V6M15 20v-8M20 20V9" />,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  bolt: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};
export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={"wi" + (className ? " " + className : "")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

/* spunta che si disegna */
export function Tick() {
  return (
    <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" pathLength={1} />
      <path d="M8 12.2l2.8 2.8 5.2-6" pathLength={1} />
    </svg>
  );
}

/* ---------- 01: schema esploso a tre piani ---------- */
const CX = 165;
const PLATES = [
  { cy: 110, n: "01" },
  { cy: 300, n: "02" },
  { cy: 490, n: "03" },
];
/* un quadrato 140×140 proiettato sul piano isometrico del piano */
const iso = (cy: number) => `matrix(1 .5 -1 .5 ${CX} ${cy - 70})`;
const LIT = [2, 7, 9, 14, 15, 20, 22, 27, 28, 33]; /* celle del gestionale che si accendono */
const A_MARK = [
  ["d", "M629,3 L826,383 L579,383 L508,261 Z"],
  ["d", "M414,450 L606,450 L690,620 L331,619 Z"],
  ["l", "M366.5,69.1 Q400,2 475.0,1.4 L638,0 L279.9,732.6 Q247,800 172.0,800.3 L1,801 Z"],
  ["l", "M607,449 L859,449 L1031,800 L855.0,800.0 Q780,800 746.9,732.7 L693,623 Z"],
];

function Plate({ cy, i, children }: { cy: number; i: number; children: React.ReactNode }) {
  return (
    <g className="plate" style={{ "--i": i } as React.CSSProperties}>
      {/* spessore */}
      <path d={`M${CX - 140} ${cy}L${CX} ${cy + 70}V${cy + 78}L${CX - 140} ${cy + 8}z`} className="pl-side" />
      <path d={`M${CX} ${cy + 70}L${CX + 140} ${cy}V${cy + 8}L${CX} ${cy + 78}z`} className="pl-side2" />
      <g transform={iso(cy)}>
        <rect width="140" height="140" className="pl-top" />
        <rect x="6" y="6" width="128" height="128" className="pl-in" />
        {children}
      </g>
    </g>
  );
}

export function ExplodedStack({ labels }: { labels: string[] }) {
  /* connettori verticali fra i piani, a sinistra, al centro, a destra */
  const links: string[] = [];
  [0, 1].forEach((k) => {
    const a = PLATES[k].cy, b = PLATES[k + 1].cy;
    [-70, 0, 70].forEach((dx) => {
      const off = 70 - Math.abs(dx) / 2;
      links.push(`M${CX + dx} ${a + off + 8}V${b - off}`);
    });
  });

  return (
    <svg className="stack" viewBox="0 0 440 600" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="stackGlow">
          <stop offset="0" stopColor="#2fbf72" stopOpacity=".35" />
          <stop offset="1" stopColor="#2fbf72" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={CX} cy="300" rx="190" ry="110" fill="url(#stackGlow)" className="stack-glow" />

      {links.map((d, k) => (
        <g key={d} className="link" style={{ "--k": k } as React.CSSProperties}>
          <path d={d} className="link-line" />
          <path d={d} className="packet" pathLength={1} />
        </g>
      ))}

      <Plate cy={490} i={2}>
        {Array.from({ length: 36 }, (_, c) => (
          <rect
            key={c}
            x={10 + (c % 6) * 20.5}
            y={10 + Math.floor(c / 6) * 20.5}
            width="16"
            height="16"
            className={"cell" + (LIT.includes(c) ? " lit" : "")}
            style={{ "--c": LIT.indexOf(c) } as React.CSSProperties}
          />
        ))}
      </Plate>

      <Plate cy={300} i={1}>
        <g transform="translate(26 32) scale(.085)">
          {A_MARK.map(([t, d]) => <path key={d} d={d} className={t === "l" ? "a-l" : "a-d"} />)}
        </g>
        <text x="70" y="124" className="pl-word">ARGO</text>
      </Plate>

      <Plate cy={110} i={0}>
        {["PDF", "DOC", "XLS", "MAIL"].map((f, k) => {
          const x = 16 + (k % 2) * 58, y = 16 + Math.floor(k / 2) * 58;
          return (
            <g key={f} className="file" style={{ "--f": k } as React.CSSProperties}>
              <path d={`M${x} ${y}h36l12 12v38H${x}z M${x + 36} ${y}v12h12`} />
              <text x={x + 24} y={y + 36}>{f}</text>
            </g>
          );
        })}
      </Plate>

      {PLATES.map((p, k) => (
        <g key={p.n} className="tag" style={{ "--i": k } as React.CSSProperties}>
          <path d={`M${CX + 140} ${p.cy}H${CX + 165}l14 -14H436`} />
          <circle cx={CX + 140} cy={p.cy} r="2.5" />
          <text x={CX + 182} y={p.cy - 20} className="tag-n">{p.n}</text>
          <text x={CX + 182} y={p.cy + 2} className="tag-l">{labels[k].toUpperCase()}</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- 04: i lead convergono sull'operatore ---------- */
const LEADS = [[44, 34], [20, 96], [8, 158], [30, 220]];
const TOOLS: IconName[] = ["doc", "check", "bars", "clock"];

export function OperatorHub() {
  return (
    <svg className="hub" viewBox="0 0 560 300" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hubGlow">
          <stop offset="0" stopColor="#2fbf72" stopOpacity=".55" />
          <stop offset=".45" stopColor="#2fbf72" stopOpacity=".12" />
          <stop offset="1" stopColor="#2fbf72" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="streak" x1="0" x2="1">
          <stop offset="0" stopColor="#2fbf72" stopOpacity="0" />
          <stop offset=".5" stopColor="#c9f7dc" stopOpacity=".9" />
          <stop offset="1" stopColor="#2fbf72" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* scie di luce dietro al nodo */}
      {[118, 132, 142, 150, 158, 168, 182].map((y, k) => (
        <rect key={y} className="streak" x={210 + (k % 3) * 14} y={y} width={240 - (k % 3) * 40} height="1" fill="url(#streak)" style={{ "--k": k } as React.CSSProperties} />
      ))}
      <circle cx="330" cy="150" r="120" fill="url(#hubGlow)" className="hub-glow" />

      {LEADS.map(([x, y], k) => (
        <g key={k} className="lead" style={{ "--k": k } as React.CSSProperties}>
          <path className="beam" pathLength={1} d={`M${x + 156} ${y + 20}C${x + 210} ${y + 20} 250 150 290 150`} />
          {/* luce che scorre lungo il raggio, in continuo */}
          <path className="beam-flow" pathLength={1} d={`M${x + 156} ${y + 20}C${x + 210} ${y + 20} 250 150 290 150`} />
          <rect x={x} y={y} width="156" height="40" className="card-box" />
          <circle cx={x + 20} cy={y + 20} r="10" className="ln" />
          <circle cx={x + 20} cy={y + 17} r="3" className="ln" />
          <path d={`M${x + 14} ${y + 26}c1.5-3 3.5-4 6-4s4.5 1 6 4`} className="ln" />
          <path d={`M${x + 40} ${y + 16}h56M${x + 40} ${y + 25}h36`} className="ln dim" />
          <circle cx={x + 136} cy={y + 20} r="8" className="ok" />
          <path d={`M${x + 132} ${y + 20}l3 3 5-6`} className="ok" />
        </g>
      ))}

      <g className="node">
        <circle cx="330" cy="150" r="46" className="node-pulse" />
        <circle cx="330" cy="150" r="46" className="node-ring" pathLength={1} />
        <circle cx="330" cy="150" r="36" className="node-core" />
        <circle cx="330" cy="140" r="9" className="node-ic" />
        <path d="M314 168c3-8 9-12 16-12s13 4 16 12" className="node-ic" />
      </g>

      <path d="M376 150H410" className="ln" />
      <g className="tools">
        <rect x="410" y="34" width="132" height="232" className="card-box" />
        {TOOLS.map((t, k) => (
          <g key={t} className="tool" style={{ "--k": k } as React.CSSProperties} transform={`translate(426 ${58 + k * 54})`}>
            <svg width="22" height="22" viewBox="0 0 24 24" className="tool-ic">{ICONS[t]}</svg>
            <path d="M36 7h56M36 16h38" className="ln dim" />
          </g>
        ))}
      </g>
    </svg>
  );
}
