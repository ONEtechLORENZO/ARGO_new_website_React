/* Riepilogo di un piano (da lib/plans.ts) nella lingua indicata: usato dal modulo demo,
   dall'API (che lo manda allo script email in italiano) e dal fallback mailto. */
import type { Dict } from "./i18n";
import { PLANS, perPage } from "./plans";

export const PLAN_IDS = [...PLANS.map((p) => p.id), "enterprise"];

export type PlanSummary = { id: string; name: string; fee: string; rows: [string, string][] };

export function planSummary(id: string | null | undefined, d: Dict): PlanSummary | null {
  if (!id) return null;
  const r = d.form.planRows;
  if (id === "enterprise") {
    const e = d.prices.enterprise;
    return { id, name: "Enterprise", fee: e.price, rows: [[r.fee, e.price], [r.terms, e.features.join(" · ")]] };
  }
  const p = PLANS.find((x) => x.id === id);
  if (!p) return null;
  const fee = `€ ${d.num(p.price)}${d.prices.perMonth}`;
  return {
    id,
    name: p.name,
    fee,
    rows: [
      [r.fee, fee],
      [r.pages, d.prices.pages(p.pages)],
      [r.perPage, d.prices.perPage(perPage(p))],
      [r.onboarding, p.onboarding === null ? d.form.free : d.prices.onboardingFee(p.onboarding)[1]],
      [r.orchestrator, d.prices.orchestrator(p.orchestrator)[1]],
    ],
  };
}
