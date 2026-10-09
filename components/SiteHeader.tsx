"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ARGO_LOGO } from "@/lib/argoLogo";
import { LOCALES, homePath, type Locale } from "@/lib/i18n";
import { SHOW_PRICING } from "@/lib/site";
import { DEMO_HASH } from "./DemoModal";
import { useT } from "./I18n";

const IDS = (["hero", "come-funziona", "argo-plus", "perche-conviene", "prezzi", "chi-siamo"] as const).filter((id) => SHOW_PRICING || id !== "prezzi");
const HEADER_PIXELS = [
  3, 3, 2, 1, 2,
  1, 3, 0, 2, 0,
  1, 0, 3, 3, 1,
  2, 1, 3, 0, 1,
  3, 3, 2, 2, 3,
] as const;

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* IT | EN: riapre l'altra lingua nello stesso punto della pagina.
   Non si usa il #ancora dell'indirizzo (resta quello dell'ultimo clic nel menu, non dove si è ora):
   si salva la sezione in vista e quanto la si è scorsa, e la nuova pagina ci torna (restoreLangScroll). */
const LANG_SCROLL_KEY = "argo-lang-scroll";

function sectionInView() {
  const top = (document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0) + 1;
  let pick: HTMLElement | null = null;
  for (const id of IDS) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= top) pick = el;
  }
  return pick ? { id: pick.id, dy: Math.max(0, top - pick.getBoundingClientRect().top) } : null;
}

function restoreLangScroll() {
  let saved: { id: string; dy: number } | null = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(LANG_SCROLL_KEY) ?? "null");
    sessionStorage.removeItem(LANG_SCROLL_KEY);
  } catch { return; }
  const el = saved && document.getElementById(saved.id);
  if (!saved || !el) return;
  const go = () => {
    const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header - 1 + saved.dy, behavior: "instant" });
  };
  go();
  /* il carattere caricato dopo può cambiare le altezze: si riallinea una volta */
  document.fonts?.ready.then(go);
}

function LangSwitch({ current, label, className }: { current: Locale; label: string; className?: string }) {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, l: Locale) => {
    e.preventDefault();
    if (l === current) return;
    const spot = sectionInView();
    try {
      if (spot && window.scrollY > 0) sessionStorage.setItem(LANG_SCROLL_KEY, JSON.stringify(spot));
    } catch { /* storage bloccato: si apre in cima */ }
    window.location.href = homePath(l);
  };
  return (
    <div className={"h-lang" + (className ? " " + className : "")} role="group" aria-label={label}>
      {LOCALES.map((l) => (
        <a
          key={l}
          href={homePath(l)}
          hrefLang={l}
          lang={l}
          className={l === current ? "on" : ""}
          aria-current={l === current ? "true" : undefined}
          onClick={(e) => go(e, l)}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}

export default function SiteHeader() {
  const { header: t, locale } = useT();
  const [active, setActive] = useState("hero");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [bar, setBar] = useState({ x: 0, w: 0 });
  const header = useRef<HTMLElement>(null);
  const nav = useRef<HTMLUListElement>(null);
  const tabs = useRef<HTMLUListElement>(null);
  const logo = useRef<HTMLAnchorElement>(null);
  const scanner = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollY = useRef(0);

  /* arrivo dal cambio lingua: torna nel punto in cui si era */
  useEffect(() => { restoreLangScroll(); }, []);

  /* sezione attiva: quella che attraversa la fascia centrale dello schermo */
  useEffect(() => {
    const els = IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setScanning(true);
      scanner.current?.setAttribute("data-direction", y < lastScrollY.current ? "up" : "down");
      lastScrollY.current = y;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setScanning(false), 150);
    };
    lastScrollY.current = window.scrollY;
    setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  /* riga delle sezioni su telefono: la voce attiva resta in vista (scorre solo la riga, non la pagina) */
  useEffect(() => {
    const ul = tabs.current;
    const a = ul?.querySelector<HTMLElement>(`a[data-id="${active}"]`);
    if (!ul || !a || !ul.offsetParent || ul.scrollWidth <= ul.clientWidth) return;
    const li = a.parentElement!;
    ul.scrollTo({ left: li.offsetLeft - (ul.clientWidth - li.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  /* la barretta verde scorre sotto la voce attiva */
  const measure = useCallback(() => {
    const a = nav.current?.querySelector<HTMLElement>(`a[data-id="${active}"]`);
    if (a) setBar({ x: a.offsetLeft + 14, w: a.offsetWidth - 28 });
  }, [active]);
  const measureScanner = useCallback(() => {
    const headerBox = header.current?.getBoundingClientRect();
    const logoBox = logo.current?.getBoundingClientRect();
    const homeBox = nav.current?.querySelector<HTMLElement>('a[data-id="hero"]')?.getBoundingClientRect();
    /* menu nascosto (tablet/telefono): a metà fra il logo e i pulsanti a destra */
    const rightBox = header.current?.querySelector<HTMLElement>(".h-right")?.getBoundingClientRect();
    const next = homeBox && homeBox.width ? homeBox.left : rightBox?.left;
    if (!headerBox || !logoBox || next === undefined || !scanner.current) return;
    const midpoint = (logoBox.right + next) / 2 - headerBox.left;
    scanner.current.style.setProperty("--scanner-x", `${midpoint}px`);
  }, []);
  useLayoutEffect(() => {
    const onResize = () => { measure(); measureScanner(); };
    onResize();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure, measureScanner]);

  /* menu mobile: si chiude con Esc o allargando lo schermo */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const wide = matchMedia("(min-width:1101px)");
    const onWide = () => { if (wide.matches) setOpen(false); };
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => { document.removeEventListener("keydown", onKey); wide.removeEventListener("change", onWide); };
  }, [open]);

  return (
    <header ref={header} className={"site-header" + (scrolled ? " scrolled" : "") + (open ? " open" : "")}>
      <a className="skip" href="#contenuto">{t.skip}</a>

      <a ref={logo} className="h-logo" href="#hero" aria-label={t.home}>
        <svg viewBox="0 0 3406 801" aria-hidden="true" focusable="false">
          {ARGO_LOGO.map(([x, paths]) => (
            <g key={x} transform={`translate(${x},0)`}>
              {paths.map(([tone, d]) => <path key={d} d={d} className={tone === "l" ? "hl" : "hd"} />)}
            </g>
          ))}
        </svg>
      </a>

      <div
        ref={scanner}
        className={"h-scanner" + (scanning ? " is-scanning" : "")}
        data-direction="down"
        aria-hidden="true"
      >
        <span className="h-pixel-grid">
          {HEADER_PIXELS.map((tone, index) => (
            <i
              key={index}
              className={`h-pixel p${tone}`}
              style={{ "--delay": `${-((index * 83) % 970)}ms` } as React.CSSProperties}
            />
          ))}
        </span>
      </div>

      <nav className="h-nav" aria-label={t.nav}>
        <ul ref={nav}>
          {IDS.map((id) => (
            <li key={id}>
              <a href={`#${id}`} data-id={id} className={active === id ? "on" : ""} aria-current={active === id ? "location" : undefined}>
                {t.links[id]}
              </a>
            </li>
          ))}
        </ul>
        <span className="h-ind" aria-hidden="true" style={{ "--x": bar.x + "px", "--w": bar.w + "px" } as React.CSSProperties} />
      </nav>

      <div className="h-right">
        <LangSwitch current={locale} label={t.lang} />
        <a className="h-cta" href={DEMO_HASH}>
          {t.demo} <Arrow />
        </a>
        <button
          type="button"
          className="h-burger"
          aria-label={open ? t.close : t.open}
          aria-expanded={open}
          aria-controls="h-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <i /><i />
        </button>
      </div>

      {/* tablet e telefono: tutte le sezioni in una riga sotto l'header (scorre di lato se non ci stanno) */}
      <nav className="h-tabs" aria-label={t.nav}>
        <ul ref={tabs}>
          {IDS.map((id) => (
            <li key={id}>
              <a href={`#${id}`} data-id={id} className={active === id ? "on" : ""} aria-current={active === id ? "location" : undefined}>
                {t.tabs[id]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <nav id="h-menu" className="h-menu" aria-label={t.menu}>
          <ul>
            {IDS.map((id, k) => (
              <li key={id} style={{ "--k": k } as React.CSSProperties}>
                <a href={`#${id}`} className={active === id ? "on" : ""} onClick={() => setOpen(false)}>
                  {t.links[id]} <Arrow />
                </a>
              </li>
            ))}
          </ul>
          <a className="h-cta h-cta-menu" href={DEMO_HASH} onClick={() => setOpen(false)}>
            {t.demo} <Arrow />
          </a>
        </nav>
      )}
    </header>
  );
}
