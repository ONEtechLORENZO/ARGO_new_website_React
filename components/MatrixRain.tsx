"use client";

import { useEffect, useRef } from "react";

/* Pioggia di caratteri stile Matrix, nei verdi di ARGO.
   Gira solo quando è a schermo e la scheda è visibile; con riduzione del movimento resta ferma.
   - variante "dark": fondo pieno, per la card ARGO+
   - variante "light": fondo trasparente, per le card chiare */

/* binario e alfabeto: gli 0/1 pesano di più, le lettere compaiono qua e là */
export const GLYPHS = "01".repeat(14) + "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BG = "7,17,12"; /* deve combaciare con il fondo della card ARGO+ (#07110c) */

const VARIANTS = {
  dark: { size: 14, step: 16, tick: 55, head: "#c9f7dc", trail: "#1f9d5a", accent: "#d4f25a" },
  light: { size: 12, step: 14, tick: 70, head: "#16884f", trail: "#1f9d5a", accent: "#16884f" },
  /* sul blocco verde "Cosa legge" */
  green: { size: 12, step: 14, tick: 60, head: "#ffffff", trail: "#9fe8bd", accent: "#d4f25a" },
  /* sul pannello scuro della demo */
  night: { size: 12, step: 14, tick: 60, head: "#c9f7dc", trail: "#1f9d5a", accent: "#d4f25a" },
  /* bianco e nero, per le card "Perché conviene" */
  mono: { size: 12, step: 14, tick: 60, head: "#ffffff", trail: "#5f6662", accent: "#2fbf72" },
};
type Variant = keyof typeof VARIANTS;

type Props = {
  className?: string;
  variant?: Variant;
  /* se impostato: una sola "pioggia" di questa durata (ms) al primo ingresso, poi sfuma e si ferma */
  once?: number;
  delay?: number;
};

export default function MatrixRain({ className, variant = "dark", once, delay = 0 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const v = VARIANTS[variant], clear = variant !== "dark";
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const font = getComputedStyle(document.body).fontFamily;
    let w = 0, h = 0, drops: number[] = [], raf = 0, last = 0, visible = false;
    let startedAt = -1, fading = 0, finished = false;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (clear) ctx.clearRect(0, 0, w, h);
      else { ctx.fillStyle = `rgb(${BG})`; ctx.fillRect(0, 0, w, h); }
      drops = Array.from({ length: Math.ceil(w / v.step) }, () => Math.floor(Math.random() * -(h / v.step)));
    };

    const step = () => {
      /* sfuma la scia: sul fondo scuro ci si dipinge sopra, su quello chiaro si cancella */
      if (clear) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,.16)"; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      } else { ctx.fillStyle = `rgba(${BG},.14)`; ctx.fillRect(0, 0, w, h); }
      if (fading) return;
      ctx.font = `${v.size}px ${font}`; ctx.textBaseline = "top";
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * v.step;
        if (y >= 0) {
          const r = Math.random();
          ctx.fillStyle = r > .985 ? v.accent : r > .55 ? v.head : v.trail;
          ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * v.step + 2, y);
        }
        if (y > h && Math.random() > .972) drops[i] = Math.floor(Math.random() * -12);
        else drops[i]++;
      }
    };
    const still = () => { for (let i = 0; i < 80; i++) step(); };

    const loop = (now: number) => {
      if (once) {
        if (startedAt < 0) startedAt = now + delay;
        if (now < startedAt) { raf = requestAnimationFrame(loop); return; }
        if (!fading && now - startedAt > once) fading = 1;
      }
      if (now - last > v.tick) {
        last = now; step();
        if (fading && ++fading > 30) { finished = true; ctx.clearRect(0, 0, w, h); return; }
      }
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden && !reduce && !finished) raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduce && !once) still();

    const ro = new ResizeObserver(() => {
      if (once && (finished || startedAt >= 0)) return; /* niente ripartenze dopo l'ingresso */
      resize(); if (reduce && !once) still();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); });
    io.observe(canvas);
    document.addEventListener("visibilitychange", play);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", play);
    };
  }, [variant, once, delay]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
