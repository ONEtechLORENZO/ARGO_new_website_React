export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:6120").replace(/\/$/, ""),
  name: "ARGO",
  company: "One Tech",
  /* titoli, descrizioni e parole chiave per lingua sono in lib/i18n.ts */
  themeColor: "#0b120e", // fondo del sito (solo tema scuro): barra del browser e manifest
  email: "sales@otech.one",
  whatsapp: "393409683934", // +39 340 968 3934 (pulsante WhatsApp fisso in basso a destra)
  street: "Via Gustavo Fara 35",
  postalCode: "20124",
  city: "Milano",
  region: "MI",
  /* "Contattaci" / "Richiedi una demo" aprono il modulo (components/DemoModal.tsx);
     le richieste vanno a DEMO_WEBHOOK_URL se impostato, altrimenti via email a questo indirizzo */
};

/* sezione "Piani e prezzi": nascosta per ora. true la rimette in pagina, insieme alla voce "Piani"
   nell'header e ai prezzi nei dati strutturati (JSON-LD). */
export const SHOW_PRICING = false;
