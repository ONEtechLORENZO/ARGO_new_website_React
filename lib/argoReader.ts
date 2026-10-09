/* Motore dell'animazione "il logo che legge".
   Port fedele dello script originale: la root deve contenere #mark, #beam, #sheet,
   #docname, .field, #replay, #pause. Restituisce una funzione di pulizia.
   I documenti e le etichette arrivano dal dizionario della lingua (lib/i18n.ts). */

export type ReaderText = { docs: [string, [string, string][]][]; pause: string; resume: string };

/* ---------- tempi (secondi): si regolano tutti da qui ---------- */
const T = { foldStart: 0.25, letterGap: 0.16, facetGap: 0.2, foldDur: 0.62, firstSweep: 2.35, sweepDur: 1.7, cycle: 7, sheetLead: 0.95, inkDur: 0.45, typeSpeed: 0.034 };
const W = 3406, BEAM_FROM = -140, BEAM_TO = W + 140;
type RGB = [number, number, number];
const PAPER_L: RGB = [251, 253, 251], PAPER_D: RGB = [226, 238, 230], EDGE: RGB = [143, 168, 154], GLINT: RGB = [214, 245, 228], SHADE: RGB = [196, 214, 203];
const TONE: Record<"l" | "d", RGB> = { l: [31, 157, 90], d: [22, 136, 79] };
const GLYPH = "0123456789€/,.ABCDEFGHILMNOPRSTUVZ";
const LETTER_MID = [515, 1161 + 330, 1956 + 330, 2746 + 330];

type M6 = [number, number, number, number, number, number];
interface Facet {
  el: SVGGraphicsElement; li: number; ox: number; seq: number; pid: string | null; parent: Facet | null;
  px: number; py: number; c: number; s: number; cx: number; cy: number; gx: number; start: number;
  tone: "l" | "d"; ink: number; inkAt: number | null; flash: number; hover: number; hoverTo: number;
  M: M6; last: string; swept: boolean;
}
interface Typing { at: number | null; label: string; value: string; shown: string; done: boolean }

const mul = (m: M6, n: M6): M6 => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const foldM = (f: Facet, k: number): M6 => { const a = f.c * f.c + k * f.s * f.s, b = f.c * f.s * (1 - k), d = f.s * f.s + k * f.c * f.c; return [a, b, b, d, f.px - a * f.px - b * f.py, f.py - b * f.px - d * f.py]; };
const mix = (p: RGB, q: RGB, t: number): RGB => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
const rgb = (c: RGB) => "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const outBack = (p: number) => { const c = 1.35; p -= 1; return 1 + (c + 1) * p * p * p + c * p * p; };
const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);

export function startReader(root: HTMLElement, { docs: DOCS, pause, resume }: ReaderText): () => void {
  const $ = <E extends Element>(sel: string) => root.querySelector(sel) as E;
  const svg = $<SVGSVGElement>("#mark"), beam = $<SVGGElement>("#beam"), sheet = $<SVGGElement>("#sheet");
  const docname = $<HTMLElement>("#docname");
  const fields = [...root.querySelectorAll<HTMLElement>(".field")];
  /* pulsanti facoltativi: oggi sotto l'hero c'è solo un testo; il logo resta cliccabile per rivedere */
  const replayBtn = root.querySelector<HTMLButtonElement>("#replay"), pauseBtn = root.querySelector<HTMLButtonElement>("#pause");
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const timers = new Set<number>();
  let raf = 0;

  /* ---------- facce del nastro ---------- */
  const byId: Record<string, Facet> = {}, facets: Facet[] = [];
  [...svg.querySelectorAll<SVGGElement>("g[data-x]")].forEach((g, li) => {
    const ox = +g.dataset.x!;
    g.querySelectorAll<SVGGraphicsElement>(".facet").forEach((el) => {
      const b = el.getBBox(), h = el.dataset.h!.split(",").map(Number);
      const th = Math.atan2(h[3] - h[1], h[2] - h[0]);
      const f: Facet = {
        el, li, ox, seq: +el.dataset.s!, pid: el.dataset.p || null, parent: null, px: h[0], py: h[1], c: Math.cos(th), s: Math.sin(th),
        cx: b.x + b.width / 2, cy: b.y + b.height / 2, gx: 0, start: 0, tone: el.classList.contains("l") ? "l" : "d",
        ink: 0, inkAt: null, flash: 0, hover: 0, hoverTo: 0, M: [1, 0, 0, 1, 0, 0], last: "", swept: false,
      };
      f.gx = f.cx + ox; f.start = T.foldStart + li * T.letterGap + f.seq * T.facetGap;
      byId[el.dataset.id!] = f; facets.push(f);
    });
  });
  facets.forEach((f) => { f.parent = f.pid ? byId[f.pid] : null; });
  /* i genitori vanno calcolati prima dei figli */
  const ordered = [...facets].sort((a, b) => a.seq - b.seq);

  /* ---------- stato ---------- */
  let t = 0, prev = 0, paused = false, sweepIdx = -1, beamX = BEAM_FROM, prepared = -1, ready = false;
  let typing: Typing[] = fields.map(() => ({ at: null, label: "", value: "", shown: "", done: false }));

  function prepare(k: number) { /* prima di ogni passata: nuovo documento, campi vuoti */
    prepared = k;
    const d = DOCS[k % DOCS.length];
    if (docname.textContent !== d[0]) {
      docname.classList.add("swap");
      const id = window.setTimeout(() => { timers.delete(id); docname.textContent = d[0]; docname.classList.remove("swap"); }, 300);
      timers.add(id);
    }
    typing = fields.map((el, i) => {
      el.classList.remove("on"); el.children[1].textContent = "";
      return { at: null, label: d[1][i][0], value: d[1][i][1], shown: "", done: false };
    });
  }

  function type(i: number) {
    const y = typing[i], el = fields[i]; if (y.at === null) return;
    const n = Math.floor((t - y.at) / T.typeSpeed);
    let s = y.value.slice(0, clamp(n, 0, y.value.length));
    if (n < y.value.length) s += GLYPH[(Math.random() * GLYPH.length) | 0];
    if (s !== y.shown) { y.shown = s; el.children[1].textContent = s; }
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - prev) / 1000 || 0); prev = now;
    if (!paused) t += dt;

    /* passata del raggio */
    const k = Math.floor((t - T.firstSweep + T.sheetLead) / T.cycle); /* ciclo corrente, contato dal volo del foglio */
    if (k >= 0 && k !== prepared) prepare(k);
    const sw = k >= 0 ? t - (T.firstSweep + k * T.cycle) : -1; /* secondi dall'inizio della passata */
    let beamOn = 0;
    if (sw >= 0 && sw <= T.sweepDur) {
      const p = sw / T.sweepDur; beamX = BEAM_FROM + (BEAM_TO - BEAM_FROM) * inOut(p);
      beamOn = clamp(p * 8) * clamp((1 - p) * 8);
      if (sweepIdx !== k) { sweepIdx = k; facets.forEach((f) => (f.swept = false)); typing.forEach((y) => (y.done = false)); }
      facets.forEach((f) => { if (!f.swept && beamX >= f.gx) { f.swept = true; f.flash = 1; if (f.inkAt === null) f.inkAt = t; } });
      LETTER_MID.forEach((x, i) => {
        if (!typing[i].done && beamX >= x) { typing[i].done = true; typing[i].at = t; fields[i].children[0].textContent = typing[i].label; fields[i].classList.add("on"); }
      });
    }
    beam.style.opacity = String(beamOn);
    beam.setAttribute("transform", "translate(" + beamX.toFixed(1) + ",0)");

    /* foglio che entra nel logo */
    const sh = k >= 0 ? (t - (T.firstSweep + k * T.cycle - T.sheetLead)) / (T.sheetLead + 0.15) : -1;
    if (sh >= 0 && sh <= 1) {
      const e = inOut(sh), x = -560 + (330 + 560) * e, y = 300 + (430 - 300) * e - Math.sin(e * Math.PI) * 120, sc = 1 - 0.84 * sh * sh * sh, r = -22 * (1 - e);
      sheet.style.opacity = String(clamp(sh * 6) * clamp((1 - sh) * 5));
      sheet.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ") rotate(" + r.toFixed(2) + ") scale(" + sc.toFixed(3) + ")");
    } else sheet.style.opacity = "0";

    /* facce: piega, colore */
    ordered.forEach((f) => {
      const p = clamp((t - f.start) / T.foldDur);
      let ang = 90 * (1 - outBack(p)); /* 90° = di taglio, 0° = piatta */
      f.hover += (f.hoverTo - f.hover) * Math.min(1, dt * 9);
      if (f.parent) ang += f.hover * 34;
      const kf = p <= 0 ? 0 : Math.cos((ang * Math.PI) / 180);
      const local = foldM(f, kf);
      f.M = f.parent ? mul(f.parent.M, local) : local;
      if (f.inkAt !== null) f.ink = clamp((t - f.inkAt) / T.inkDur);
      f.flash = Math.max(0, f.flash - dt * 2.3);
      const tilt = Math.abs(Math.sin((ang * Math.PI) / 180));
      const paper = mix(f.tone === "l" ? PAPER_L : PAPER_D, SHADE, tilt * 0.55);
      let col = mix(paper, TONE[f.tone], outCubic(f.ink));
      col = mix(col, GLINT, clamp(f.flash * 0.3 * f.ink + tilt * 0.42 * f.ink + f.hover * 0.12));
      const line = mix(EDGE, col, f.ink);
      const key = f.M.map((v) => v.toFixed(3)).join(" ") + rgb(col);
      if (key !== f.last) {
        f.last = key;
        f.el.setAttribute("transform", "matrix(" + f.M.map((v) => v.toFixed(4)).join(" ") + ")");
        f.el.style.fill = rgb(col); f.el.style.stroke = rgb(line);
      }
    });
    fields.forEach((_, i) => type(i));

    if (!ready && t >= T.firstSweep - 0.15) { ready = true; root.classList.add("ready"); }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- il logo reagisce al puntatore ---------- */
  const point = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * 801;
    facets.forEach((f) => { const d = Math.hypot(f.gx - x, f.cy - y); f.hoverTo = f.parent ? clamp(1 - d / 520) : 0; });
  };
  const leave = () => facets.forEach((f) => (f.hoverTo = 0));
  const up = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") { const id = window.setTimeout(() => { timers.delete(id); leave(); }, 500); timers.add(id); }
  };
  function togglePause() {
    paused = !paused;
    pauseBtn?.setAttribute("aria-pressed", String(paused));
    if (pauseBtn) pauseBtn.textContent = paused ? resume : pause;
  }
  function replay() {
    t = 0; sweepIdx = -1; prepared = -1;
    facets.forEach((f) => { f.ink = 0; f.inkAt = null; f.flash = 0; });
    if (paused) togglePause();
  }
  /* niente animazione a scheda nascosta: si riprende da dove era */
  const onVisibility = () => { if (!document.hidden) prev = performance.now(); };

  /* ---------- avvio ---------- */
  if (reduce) {
    svg.classList.add("live"); root.classList.add("ready");
    DOCS[0][1].forEach(([l, v], i) => { fields[i].children[0].textContent = l; fields[i].children[1].textContent = v; fields[i].classList.add("on"); });
    if (pauseBtn) pauseBtn.hidden = true;
    if (replayBtn) replayBtn.hidden = true;
    return () => {};
  }

  svg.addEventListener("pointermove", point);
  svg.addEventListener("pointerleave", leave);
  svg.addEventListener("pointerup", up);
  svg.addEventListener("click", replay);
  replayBtn?.addEventListener("click", replay);
  pauseBtn?.addEventListener("click", togglePause);
  document.addEventListener("visibilitychange", onVisibility);

  facets.forEach((f) => f.el.setAttribute("transform", "matrix(1 0 0 0 0 800)"));
  svg.classList.add("live");
  raf = requestAnimationFrame((n) => { prev = n; frame(n); });

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach((id) => clearTimeout(id));
    svg.removeEventListener("pointermove", point);
    svg.removeEventListener("pointerleave", leave);
    svg.removeEventListener("pointerup", up);
    svg.removeEventListener("click", replay);
    replayBtn?.removeEventListener("click", replay);
    pauseBtn?.removeEventListener("click", togglePause);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
