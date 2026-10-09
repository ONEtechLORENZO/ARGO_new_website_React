"use client";

import { createContext, useContext } from "react";
import { DICTS, type Dict, type Locale } from "@/lib/i18n";

const Ctx = createContext<Dict>(DICTS.it);

/* la lingua arriva dalla pagina (server); i testi si leggono qui, lato client */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={DICTS[locale]}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
