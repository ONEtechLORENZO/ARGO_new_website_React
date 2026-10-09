"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { planSummary } from "@/lib/planSummary";
import { SITE } from "@/lib/site";
import { STEP_FIELDS, validateAll, validateField, type DemoData, type ErrorCode, type FieldKey } from "@/lib/validate";
import { useT } from "./I18n";
import MatrixRain from "./MatrixRain";

/* Modulo "Richiedi demo" in 4 passi, in una finestra (<dialog>).
   Si apre da qualunque link a #richiedi-demo; data-interest="…" precompila "Interesse principale",
   data-plan="business" (i "Contattaci" dei prezzi) mostra il piano scelto e lo invia con la richiesta. */

export const DEMO_HASH = "#richiedi-demo";
const EMPTY: DemoData = { company: "", contact: "", email: "", phone: "", sector: "", role: "", interest: "", message: "", consent: false };
type Status = "form" | "sending" | "done" | "mail" | "fail";
type TextKey = Exclude<FieldKey, "consent">;

/* tipo di campo e suggerimenti per l'autocompilazione del browser */
const INPUTS: Record<TextKey, { type?: string; auto?: string; mode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; area?: boolean }> = {
  company: { auto: "organization" },
  contact: { auto: "name" },
  email: { type: "email", auto: "email", mode: "email" },
  phone: { type: "tel", auto: "tel", mode: "tel" },
  sector: {},
  role: { auto: "organization-title" },
  interest: {},
  message: { area: true },
};

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DemoModal() {
  const dict = useT();
  const { form: t, locale } = dict;
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const [opens, setOpens] = useState(0);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [data, setData] = useState<DemoData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, ErrorCode>>>({});
  const [status, setStatus] = useState<Status>("form");
  const [plan, setPlan] = useState<string | null>(null);
  const chosen = planSummary(plan, dict);
  const total = STEP_FIELDS.length;

  const open = useCallback((interest?: string, planId?: string) => {
    const d = dialog.current;
    if (!d || d.open) return;
    opener.current = document.activeElement as HTMLElement | null;
    /* da un piano: il piano scelto sostituisce l'eventuale precedente; altrimenti nessun piano */
    setPlan(planId ?? null);
    if (planId && interest) setData((v) => ({ ...v, interest }));
    else if (interest) setData((v) => (v.interest ? v : { ...v, interest }));
    setOpens((n) => n + 1);
    d.showModal();
    document.documentElement.classList.add("dm-lock");
  }, []);

  /* qualunque link a #richiedi-demo apre il modulo; anche arrivando con #richiedi-demo nell'indirizzo */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.(`a[href="${DEMO_HASH}"]`) as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      open(a.dataset.interest, a.dataset.plan);
    };
    document.addEventListener("click", onClick);
    if (location.hash === DEMO_HASH) open();
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const onClose = () => {
    document.documentElement.classList.remove("dm-lock");
    if (location.hash === DEMO_HASH) history.replaceState(null, "", location.pathname + location.search);
    /* dopo un invio riuscito il modulo riparte vuoto */
    if (status === "done" || status === "mail") { setData(EMPTY); setPlan(null); setStep(0); setErrors({}); setStatus("form"); }
    if (status === "fail") setStatus("form");
    opener.current?.focus?.();
  };
  const close = () => dialog.current?.close();

  /* fuoco sul primo campo di ogni passo */
  useEffect(() => {
    if (!dialog.current?.open || status !== "form") return;
    const id = window.setTimeout(() => document.getElementById(`dm-${STEP_FIELDS[step][0]}`)?.focus(), 60);
    return () => clearTimeout(id);
  }, [step, opens, status]);

  const set = (k: FieldKey, v: string | boolean) => {
    const next = { ...data, [k]: v };
    setData(next);
    /* se il campo era in errore, l'errore sparisce appena il valore è giusto */
    if (errors[k]) setErrors((e) => ({ ...e, [k]: validateField(k, next) ?? undefined }));
  };
  const onBlur = (k: FieldKey) => {
    if (k !== "consent" && String(data[k]).trim()) setErrors((e) => ({ ...e, [k]: validateField(k, data) ?? undefined }));
  };

  /* controlla i campi del passo corrente; in caso di errore porta il fuoco sul primo */
  const checkStep = (s: number) => {
    const found: Partial<Record<FieldKey, ErrorCode>> = {};
    STEP_FIELDS[s].forEach((k) => { const e = validateField(k, data); if (e) found[k] = e; });
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(STEP_FIELDS[s].map((k) => [k, found[k]])) }));
    const first = STEP_FIELDS[s].find((k) => found[k]);
    if (first) document.getElementById(`dm-${first}`)?.focus();
    return !first;
  };

  const next = () => { if (checkStep(step)) { setDir("fwd"); setStep((s) => Math.min(total - 1, s + 1)); } };
  const back = () => { setDir("back"); setStep((s) => Math.max(0, s - 1)); };

  const mailto = () => {
    const keys: TextKey[] = ["company", "contact", "email", "phone", "sector", "role", "interest", "message"];
    const lines = keys.map((k) => `${t.labels[k]}: ${data[k].trim()}`);
    if (chosen) lines.push("", `${t.planTitle}: ${chosen.name}`, ...chosen.rows.map(([l, v]) => `${l}: ${v}`));
    const body = lines.join("\n");
    return `mailto:${SITE.email}?subject=${encodeURIComponent(`${t.mailSubject} — ${data.company.trim()}`)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < total - 1) return next();
    if (!checkStep(step)) return;
    const all = validateAll(data);
    const firstBad = STEP_FIELDS.findIndex((fs) => fs.some((k) => all[k]));
    if (firstBad >= 0) { setErrors(all); setDir("back"); setStep(firstBad); return; }

    setStatus("sending");
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, plan, website: honeypot.current?.value ?? "", lang: locale }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.ok) return setStatus("done");
      if (json.reason === "not_configured") { window.location.href = mailto(); return setStatus("mail"); }
      if (json.reason === "invalid" && json.errors) {
        setErrors(json.errors);
        const bad = STEP_FIELDS.findIndex((fs) => fs.some((k) => json.errors[k]));
        setStep(bad >= 0 ? bad : 0);
        return setStatus("form");
      }
      setStatus("fail");
    } catch {
      setStatus("fail");
    }
  };

  const field = (k: TextKey) => {
    const cfg = INPUTS[k], err = errors[k], id = `dm-${k}`;
    const common = {
      id, name: k, value: data[k] as string, "aria-required": true, "aria-invalid": !!err,
      "aria-describedby": err ? `${id}-err` : undefined, placeholder: t.placeholders[k],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
      onBlur: () => onBlur(k),
    };
    return (
      <div className="dm-field" key={k}>
        <label htmlFor={id}>{t.labels[k]} <span className="dm-req" aria-hidden="true">*</span></label>
        {cfg.area
          ? <textarea {...common} rows={5} maxLength={2000} />
          : <input {...common} type={cfg.type ?? "text"} autoComplete={cfg.auto ?? "off"} inputMode={cfg.mode} maxLength={160} />}
        {err && <p className="dm-err" id={`${id}-err`} role="alert">{t.errors[err]}</p>}
      </div>
    );
  };

  const pct = Math.round(((step + 1) / total) * 100);
  const finished = status === "done" || status === "mail";

  return (
    <dialog ref={dialog} className="dm" aria-labelledby="dm-title" onClose={onClose} onClick={(e) => { if (e.target === dialog.current) close(); }}>
      <div className="dm-card">
        <aside className="dm-side">
          <MatrixRain key={opens} className="dm-rain" variant="night" once={1800} />
          <span className="dm-tag">{t.kicker}</span>
          <h2 id="dm-title">{t.title}</h2>
          <ol className="dm-steps" aria-hidden="true">
            {t.steps.map((s, i) => (
              <li key={s} className={finished || i < step ? "done" : i === step ? "on" : ""}>
                <span className="dm-n">{finished || i < step ? "✓" : String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="dm-alt">{t.alt} <a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        </aside>

        <div className="dm-main">
          <button type="button" className="dm-x" onClick={close} aria-label={t.close}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>

          {finished ? (
            <div className="dm-done" role="status">
              <svg className="dm-check" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="28" pathLength={1} />
                <path d="M20 33l8 8 16-18" pathLength={1} />
              </svg>
              <h3>{status === "done" ? t.doneTitle : t.mailTitle}</h3>
              <p>{status === "done" ? t.doneText : t.mailText}</p>
              <button type="button" className="dm-btn dm-next" onClick={close}>{t.close}</button>
            </div>
          ) : (
            <form className="dm-form" noValidate onSubmit={submit}>
              {/* avanzamento + campi, centrati in verticale; i pulsanti restano in fondo */}
              <div className="dm-body">
              {chosen && (
                <div className="dm-plan">
                  <div className="dm-plan-top">
                    <span className="dm-plan-k">{t.planTitle}</span>
                    <button type="button" className="dm-plan-x" onClick={() => setPlan(null)} aria-label={t.planRemove}>
                      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                  <p className="dm-plan-name"><strong>{chosen.name}</strong><span>{chosen.fee}</span></p>
                  <dl className="dm-plan-rows">
                    {chosen.rows.slice(1).map(([l, v]) => (<div key={l}><dt>{l}</dt><dd>{v}</dd></div>))}
                  </dl>
                </div>
              )}
              <div className="dm-prog" aria-live="polite">
                <span>{t.progress(step + 1, total, t.steps[step])}</span>
                <span>{pct}%</span>
              </div>
              <div className="dm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ width: pct + "%" }} /></div>

              <div className={"dm-fields " + dir} key={step}>
                {STEP_FIELDS[step].filter((k): k is TextKey => k !== "consent").map(field)}
                {step === total - 1 && (
                  <div className="dm-field">
                    <label className="dm-consent">
                      <input
                        type="checkbox"
                        id="dm-consent"
                        checked={data.consent}
                        onChange={(e) => set("consent", e.target.checked)}
                        aria-invalid={!!errors.consent}
                        aria-describedby={errors.consent ? "dm-consent-err" : undefined}
                      />
                      <span>{t.consent} <span className="dm-req" aria-hidden="true">*</span></span>
                    </label>
                    {errors.consent && <p className="dm-err" id="dm-consent-err" role="alert">{t.errors.consent}</p>}
                  </div>
                )}
              </div>

              {/* campo trappola per i bot, invisibile alle persone */}
              <input ref={honeypot} className="dm-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

              {status === "fail" && <p className="dm-err dm-fail" role="alert">{t.failText}</p>}
              </div>

              <div className="dm-actions">
                {step > 0 ? <button type="button" className="dm-btn dm-back" onClick={back}>{t.back}</button> : <span />}
                <button type="submit" className="dm-btn dm-next" disabled={status === "sending"}>
                  {step < total - 1 ? t.next : status === "sending" ? t.sending : t.submit} <Arrow />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}
