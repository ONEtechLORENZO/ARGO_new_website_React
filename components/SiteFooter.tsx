"use client";

import { useEffect, useRef } from "react";
import { decode } from "@/lib/decode";
import { onFirstView } from "@/lib/inView";
import { ARGO_LOGO } from "@/lib/argoLogo";
import { SITE } from "@/lib/site";
import { useT } from "./I18n";

/* Link esterni: lasciare url vuoto finché l'indirizzo non è confermato
   (la voce resta testo semplice, così non ci sono link rotti). */
const PRODUCTS = [
  { name: "Kore", url: "https://kore-hub.otech.one/" },
  { name: "Allmessage", url: "https://allmessage.chat/" },
  { name: "Argo", url: "#hero" },
];
const SOCIAL = [
  { name: "LinkedIn", url: "https://www.linkedin.com/company/otech-one/" },
  { name: "Instagram", url: "https://www.instagram.com/onetech.one" },
];


function Item({ name, url }: { name: string; url: string }) {
  if (!url) return <li><span>{name}</span></li>;
  const external = url.startsWith("http");
  return (
    <li>
      <a href={url} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{name}</a>
    </li>
  );
}

export default function SiteFooter() {
  const ref = useRef<HTMLElement>(null);
  const f = useT().footer;

  useEffect(() => {
    const el = ref.current!;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    let undo = () => {};
    const stop = onFirstView(el.querySelector<HTMLElement>(".f-brand")!, 0.4, () => {
      el.classList.add("seen");
      if (!reduce) undo = decode([...el.querySelectorAll<HTMLElement>(".f-by [data-text]")], { delay: 700, stagger: 0, dur: 900 });
    });
    return () => { stop(); undo(); };
  }, []);

  let n = 0; /* indice progressivo delle sfaccettature, per l'ingresso a cascata */

  return (
    <footer className="site-footer" ref={ref}>
      <div className="f-cols">
        <nav aria-labelledby="f-products">
          <h2 id="f-products">{f.products}</h2>
          <ul>{PRODUCTS.map((p) => <Item key={p.name} {...p} />)}</ul>
        </nav>
        <nav aria-labelledby="f-social">
          <h2 id="f-social">{f.social}</h2>
          <ul>{SOCIAL.map((p) => <Item key={p.name} {...p} />)}</ul>
        </nav>
        <div>
          <h2>{f.partnership}</h2>
          <ul><li><a href="mailto:partnerships@otech.one">partnerships@otech.one</a></li></ul>
          <h2 className="f-gap">{f.press}</h2>
          <ul><li><a href="mailto:press@otech.one">press@otech.one</a></li></ul>
        </div>
        <div>
          <h2>{f.offices}</h2>
          <address>
            <span>{SITE.street}, <span className="nw">{SITE.postalCode} {SITE.city} {SITE.region}</span></span>
            <a className="f-mail" href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </address>
        </div>
      </div>

      <div className="f-brand">
        <a href="#hero" className="f-logo-link" aria-label={f.home}>
          <svg className="f-logo" viewBox="0 0 3406 801" aria-hidden="true" focusable="false">
            {ARGO_LOGO.map(([x, paths]) => (
              <g key={x} transform={`translate(${x},0)`}>
                {paths.map(([t, d]) => (
                  <path key={d} d={d} className={t === "l" ? "fl" : "fd"} style={{ "--n": n++ } as React.CSSProperties} />
                ))}
              </g>
            ))}
          </svg>
        </a>
        <p className="f-by">
          {f.by}{" "}
          <a className="f-company" href="https://www.otech.one/" target="_blank" rel="noopener noreferrer">
            <b><span data-text="One Tech">One Tech</span></b>
          </a>
        </p>
      </div>
    </footer>
  );
}
