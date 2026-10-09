import { NextResponse } from "next/server";
import { normalizePhone, validateAll, type DemoData } from "@/lib/validate";
import { DICTS } from "@/lib/i18n";
import { PLAN_IDS, planSummary } from "@/lib/planSummary";

/* Riceve le richieste demo, le ricontrolla e le inoltra al Google Apps Script (apps-script/Code.gs),
   che invia la mail a sales@otech.one e la conferma al cliente.
   In .env.local: DEMO_WEBHOOK_URL = URL dell'App web (…/exec), DEMO_WEBHOOK_SECRET = stesso valore
   della proprietà DEMO_SECRET dello script. Senza URL risponde "not_configured" e il browser apre
   l'email precompilata verso sales@otech.one. */

export async function POST(req: Request) {
  let body: Partial<DemoData> & { website?: string; lang?: string; plan?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  /* campo trappola per i bot: un utente vero non lo vede e non lo compila */
  if (body.website) return NextResponse.json({ ok: true });

  const data: DemoData = {
    company: String(body.company ?? ""),
    contact: String(body.contact ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    sector: String(body.sector ?? ""),
    role: String(body.role ?? ""),
    interest: String(body.interest ?? ""),
    message: String(body.message ?? ""),
    consent: body.consent === true,
  };
  const errors = validateAll(data);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, reason: "invalid", errors }, { status: 422 });

  const hook = process.env.DEMO_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  /* piano scelto da "Contattaci": accettiamo solo id noti e ricostruiamo i dettagli qui,
     in italiano, così la mail a sales riporta i prezzi veri e non quelli inviati dal browser */
  const planId = typeof body.plan === "string" && PLAN_IDS.includes(body.plan) ? body.plan : null;
  const chosen = planSummary(planId, DICTS.it);

  const payload = {
    plan: chosen ? { id: chosen.id, name: chosen.name, fee: chosen.fee, rows: chosen.rows } : null,
    ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])),
    phone: normalizePhone(data.phone),
    phoneAsTyped: data.phone.trim(),
    lang: body.lang === "en" ? "en" : "it",
    source: "argo-website",
    submittedAt: new Date().toISOString(),
    /* firma condivisa: lo script accetta solo richieste che arrivano da qui */
    secret: process.env.DEMO_WEBHOOK_SECRET ?? "",
  };
  try {
    /* Apps Script risponde con un redirect verso la risposta vera: fetch lo segue da solo */
    const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), redirect: "follow" });
    const out = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !out?.ok) {
      console.error("[demo] invio non riuscito:", res.status, out?.error ?? "risposta non valida");
      return NextResponse.json({ ok: false, reason: out?.error === "rate_limited" ? "rate_limited" : "upstream" }, { status: 502 });
    }
  } catch (err) {
    console.error("[demo] script non raggiungibile:", err);
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
