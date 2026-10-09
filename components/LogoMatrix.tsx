"use client";

import { useEffect, useRef } from "react";
import { GLYPHS } from "./MatrixRain";

/* Il logo One Tech composto da caratteri Matrix (binario + alfabeto).
   1. i caratteri cadono e si fermano nelle celle del logo
   2. dal logo partono flussi di codice verso la linea (bordo sinistro del canvas; su mobile, bordo in basso)
   Gira solo se visibile; con riduzione del movimento il logo è fermo e senza flussi. */

const SRC = "/one-tech-mark.png";
const CELL = 11; /* lato della cella in px CSS */
const ASSEMBLE = 1.6; /* secondi per comporre il logo */
const FPS = 30;

type Cell = { x: number; y: number; ch: string; at: number; hi: number };
type Stream = { x: number; y: number; v: number; len: number; trail: string[] };
type Hit = { pos: number; life: number };

const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

export default function LogoMatrix({ className, label }: { className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const stacked = matchMedia("(max-width:860px)"); /* su mobile la linea è orizzontale, sotto al logo */
    const font = getComputedStyle(document.body).fontFamily;
    const img = new Image();
    let w = 0, h = 0, cells: Cell[] = [], sources: { x: number; y: number }[] = [];
    let streams: Stream[] = [], hits: Hit[] = [];
    let raf = 0, last = 0, t0 = -1, visible = false, ready = false;

    /* campiona il PNG su una griglia: ogni cella piena del logo diventa un carattere */
    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!img.complete || !img.naturalWidth) return;

      const down = stacked.matches;
      const size = Math.min(w * (down ? 0.62 : 0.56), h * (down ? 0.7 : 0.72));
      const cols = Math.floor(size / CELL), rows = Math.round((cols * img.naturalHeight) / img.naturalWidth);
      /* canvas non ancora misurato (0×0 durante il caricamento o un ridimensionamento):
         niente griglia per ora, la ricostruisce il ResizeObserver appena ha una misura vera */
      if (cols < 4 || rows < 4) { ready = false; cells = []; sources = []; streams = []; hits = []; return; }
      const ox = down ? (w - cols * CELL) / 2 : w - cols * CELL - w * 0.1;
      const oy = down ? h * 0.08 : (h - rows * CELL) / 2;

      const probe = document.createElement("canvas");
      probe.width = cols; probe.height = rows;
      const pc = probe.getContext("2d", { willReadFrequently: true })!;
      pc.drawImage(img, 0, 0, cols, rows);
      const data = pc.getImageData(0, 0, cols, rows).data;

      cells = []; sources = [];
      const edge: number[] = Array(down ? cols : rows).fill(-1);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          if (data[(r * cols + c) * 4 + 3] < 110) continue;
          const x = ox + c * CELL, y = oy + r * CELL;
          cells.push({ x, y, ch: rnd(), at: Math.random() * ASSEMBLE * 0.75 + (down ? r / rows : 1 - c / cols) * ASSEMBLE * 0.25, hi: Math.random() });
          /* il bordo da cui partono i flussi: il più a sinistra per riga (o il più in basso per colonna) */
          if (down) edge[c] = Math.max(edge[c], y); else if (edge[r] < 0 || x < edge[r]) edge[r] = x;
        }
      edge.forEach((v, k) => {
        if (v < 0) return;
        sources.push(down ? { x: ox + k * CELL, y: v + CELL } : { x: v - CELL, y: oy + k * CELL });
      });
      streams = []; hits = [];
      ready = true;
    };

    const spawn = (): Stream => {
      const s = sources[(Math.random() * sources.length) | 0];
      return { x: s.x, y: s.y, v: 140 + Math.random() * 220, len: 5 + ((Math.random() * 9) | 0), trail: Array.from({ length: 14 }, rnd) };
    };

    const draw = (time: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${CELL - 1}px ${font}`;
      ctx.textBaseline = "top";
      const down = stacked.matches;
      const age = reduce ? 99 : time - t0;

      /* logo */
      for (const c of cells) {
        const p = Math.min(1, Math.max(0, (age - c.at) / 0.45));
        if (p <= 0) continue;
        if (Math.random() < (p < 1 ? 0.5 : 0.035)) c.ch = rnd();
        const e = 1 - Math.pow(1 - p, 3);
        const y = c.y - (1 - e) * 90; /* cade dall'alto e si ferma */
        const settled = p >= 1;
        ctx.globalAlpha = settled ? 0.55 + c.hi * 0.45 : e;
        ctx.fillStyle = !settled ? "#e9fff1" : c.hi > 0.93 ? "#d4f25a" : c.hi > 0.6 ? "#7fe0a8" : "#1f9d5a";
        ctx.fillText(c.ch, c.x, y);
      }
      ctx.globalAlpha = 1;

      /* flussi verso la linea */
      if (!reduce && age > ASSEMBLE * 0.8 && sources.length) {
        const want = down ? 8 : 22;
        while (streams.length < want && Math.random() < 0.35) streams.push(spawn());
        streams = streams.filter((s) => {
          if (down) s.y += s.v * dt; else s.x -= s.v * dt;
          if (Math.random() < 0.3) s.trail[(Math.random() * s.trail.length) | 0] = rnd();
          for (let k = 0; k < s.len; k++) {
            const x = down ? s.x : s.x + k * CELL, y = down ? s.y - k * CELL : s.y;
            if (down ? y > h - 2 : x < 2) continue;
            ctx.globalAlpha = (1 - k / s.len) * 0.9;
            ctx.fillStyle = k === 0 ? "#e9fff1" : "#2fbf72";
            ctx.fillText(s.trail[k], x, y);
          }
          const arrived = down ? s.y >= h - CELL : s.x <= 0;
          if (arrived) hits.push({ pos: down ? s.x + CELL / 2 : s.y + CELL / 2, life: 1 });
          return !arrived;
        });
        ctx.globalAlpha = 1;
      }

      /* lampi dove il codice tocca la linea */
      hits = hits.filter((hit) => {
        hit.life -= dt * 2.2;
        if (hit.life <= 0) return false;
        const g = down
          ? ctx.createRadialGradient(hit.pos, h, 0, hit.pos, h, 26)
          : ctx.createRadialGradient(0, hit.pos, 0, 0, hit.pos, 26);
        g.addColorStop(0, `rgba(201,247,220,${0.85 * hit.life})`);
        g.addColorStop(1, "rgba(47,191,114,0)");
        ctx.fillStyle = g;
        if (down) ctx.fillRect(hit.pos - 26, h - 26, 52, 26); else ctx.fillRect(0, hit.pos - 26, 26, 52);
        return true;
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      const dt = Math.min(0.1, (now - last) / 1000 || 0);
      last = now;
      if (t0 < 0) t0 = now / 1000;
      if (ready) draw(now / 1000, dt);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (reduce) { if (ready) draw(0, 0); return; }
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    img.onload = () => { build(); play(); };
    img.src = SRC;

    const ro = new ResizeObserver(() => { build(); if (reduce && ready) draw(0, 0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }, { threshold: 0.2 });
    io.observe(canvas);
    document.addEventListener("visibilitychange", play);
    stacked.addEventListener("change", build);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", play);
      stacked.removeEventListener("change", build);
      img.onload = null;
    };
  }, []);

  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}
