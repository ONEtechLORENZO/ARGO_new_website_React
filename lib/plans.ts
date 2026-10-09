/* Piani e prezzi (IVA esclusa), solo numeri: i testi e i formati sono in lib/i18n.ts.
   Unica fonte per la tabella prezzi e per i dati strutturati. */
export type Plan = {
  id: string;
  name: string;
  price: number; /* €/mese */
  pages: number; /* pagine al mese */
  onboarding: number | null; /* fee una tantum; null = onboarding gratuito */
  orchestrator: number; /* fee mensile che si somma al pacchetto */
};

export const PLANS: Plan[] = [
  { id: "base", name: "Base", price: 1200, pages: 5000, onboarding: null, orchestrator: 200 },
  { id: "pro", name: "Pro", price: 2000, pages: 10000, onboarding: null, orchestrator: 400 },
  { id: "business", name: "Business", price: 2400, pages: 15000, onboarding: 3000, orchestrator: 600 },
  { id: "premium", name: "Premium", price: 2800, pages: 20000, onboarding: 3000, orchestrator: 1000 },
  { id: "premium-plus", name: "Premium Plus", price: 3000, pages: 25000, onboarding: 3000, orchestrator: 2000 },
];

/* prezzo a pagina: 1200 / 5000 = 0,24 */
export const perPage = (p: Plan) => p.price / p.pages;
