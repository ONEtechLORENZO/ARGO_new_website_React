/* Regole di validazione del modulo demo: usate sia nel browser sia dal server (app/api/demo). */

export type DemoData = {
  company: string;
  contact: string;
  email: string;
  phone: string;
  sector: string;
  role: string;
  interest: string;
  message: string;
  consent: boolean;
};
export type FieldKey = keyof DemoData;
export type ErrorCode = "required" | "email" | "phone" | "consent" | "long";

/* i campi di ogni passo, nell'ordine in cui compaiono */
export const STEP_FIELDS: FieldKey[][] = [
  ["company", "contact"],
  ["email", "phone"],
  ["sector", "role"],
  ["interest", "message", "consent"],
];

const MAX: Partial<Record<FieldKey, number>> = { message: 2000 };
const DEFAULT_MAX = 160;

/* email: parte locale + dominio con almeno un punto e un TLD di 2+ lettere */
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
export function isEmail(raw: string) {
  const v = raw.trim();
  if (v.length > 254 || !EMAIL_RE.test(v)) return false;
  const [local] = v.split("@");
  return local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !v.includes("..");
}

/* numero italiano senza prefisso:
   - cellulare: inizia con 3, 9 o 10 cifre (es. 347 123 4567)
   - fisso: inizia con 0, da 6 a 11 cifre (es. 02 1234 5678, 06 123456) */
const isItalianNational = (n: string) => /^3\d{8,9}$/.test(n) || /^0\d{5,10}$/.test(n);

/* Restituisce il numero normalizzato in formato internazionale (+39…) oppure null se non valido.
   Accetta spazi, punti, trattini, barre e parentesi; prefissi +39 / 0039 o altri internazionali (+44…). */
export function normalizePhone(raw: string): string | null {
  const s = raw.trim();
  if (!/^\+?[\d\s.\-()/]+$/.test(s)) return null;
  let d = s.replace(/[\s.\-()/]/g, "");
  let intl = false;
  if (d.startsWith("+")) { d = d.slice(1); intl = true; }
  else if (d.startsWith("00")) { d = d.slice(2); intl = true; }
  if (!/^\d+$/.test(d)) return null;
  if (intl) {
    if (d.startsWith("39")) return isItalianNational(d.slice(2)) ? "+" + d : null;
    return /^[1-9]\d{6,14}$/.test(d) ? "+" + d : null; /* E.164: al massimo 15 cifre */
  }
  return isItalianNational(d) ? "+39" + d : null;
}

export function validateField(key: FieldKey, data: DemoData): ErrorCode | null {
  if (key === "consent") return data.consent ? null : "consent";
  const v = String(data[key] ?? "").trim();
  if (!v) return "required";
  if (v.length > (MAX[key] ?? DEFAULT_MAX)) return "long";
  if (key === "email" && !isEmail(v)) return "email";
  if (key === "phone" && !normalizePhone(v)) return "phone";
  return null;
}

export function validateAll(data: DemoData) {
  const errors: Partial<Record<FieldKey, ErrorCode>> = {};
  STEP_FIELDS.flat().forEach((k) => {
    const e = validateField(k, data);
    if (e) errors[k] = e;
  });
  return errors;
}
