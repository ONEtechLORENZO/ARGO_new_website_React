"use client";

import { SITE } from "@/lib/site";
import { useT } from "./I18n";

/* pulsante WhatsApp fisso in basso a destra: apre la chat con il numero di SITE.whatsapp,
   con un primo messaggio già scritto nella lingua della pagina */
export default function WhatsAppButton() {
  const { header: t } = useT();
  const href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(t.whatsappText)}`;
  return (
    <a className="wa" href={href} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp} title={t.whatsapp}>
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.53 1.74 6.5L3 29l6.68-1.75A12.95 12.95 0 0 0 16.04 29C23.2 29 29.03 23.18 29.03 16S23.2 3 16.04 3zm0 23.8c-1.98 0-3.92-.53-5.61-1.53l-.4-.24-3.97 1.04 1.06-3.86-.26-.4A10.76 10.76 0 0 1 5.21 16c0-5.97 4.86-10.82 10.83-10.82 5.96 0 10.81 4.85 10.81 10.82 0 5.96-4.85 10.8-10.81 10.8zm5.93-8.1c-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.73.17-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.38-.51-2.62-1.62-.97-.86-1.62-1.93-1.81-2.26-.19-.32-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.32.33-.54.11-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.41-.3.32-1.14 1.11-1.14 2.71s1.17 3.15 1.33 3.36c.16.22 2.3 3.5 5.56 4.91.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.63-.09 1.93-.79 2.2-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.62-.38z"
        />
      </svg>
    </a>
  );
}
