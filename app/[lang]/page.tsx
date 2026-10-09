import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ArgoPlus from "@/components/ArgoPlus";
import WhyArgo from "@/components/WhyArgo";
import Pricing from "@/components/Pricing";
import About from "@/components/About";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { I18nProvider } from "@/components/I18n";
import DemoModal from "@/components/DemoModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import { DICTS, homePath, isLocale, type Locale } from "@/lib/i18n";
import { PLANS, perPage } from "@/lib/plans";
import { SHOW_PRICING, SITE } from "@/lib/site";

function jsonLd(lang: Locale) {
  const t = DICTS[lang];
  const page = SITE.url + (lang === "it" ? "/" : homePath(lang));
  const inLanguage = lang === "it" ? "it-IT" : "en-GB";
  /* offerte: i piani con prezzo (Enterprise è su richiesta), IVA esclusa, canone mensile */
  const offers = PLANS.map((p) => ({
    "@type": "Offer",
    name: `${SITE.name} ${p.name}`,
    description: t.prices.offer(p.pages, perPage(p)),
    url: `${page}#prezzi`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: p.price,
      priceCurrency: "EUR",
      unitCode: "MON",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      valueAddedTaxIncluded: false,
    },
  }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.company,
        url: SITE.url,
        logo: `${SITE.url}/one-tech-mark.png`,
        email: SITE.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.street,
          postalCode: SITE.postalCode,
          addressLocality: SITE.city,
          addressRegion: SITE.region,
          addressCountry: "IT",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${page}#website`,
        url: page,
        name: `${SITE.name} · ${SITE.company}`,
        inLanguage,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${page}#software`,
        name: SITE.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: t.meta.description,
        inLanguage,
        publisher: { "@id": `${SITE.url}/#organization` },
        featureList: t.meta.features,
        /* niente prezzi nei dati strutturati se la sezione non è visibile in pagina */
        ...(SHOW_PRICING ? { offers } : {}),
      },
    ],
  };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <I18nProvider locale={lang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(lang)).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <ArgoPlus />
        <WhyArgo />
        {SHOW_PRICING && <Pricing />}
        <About />
      </main>
      <SiteFooter />
      <DemoModal />
      <WhatsAppButton />
    </I18nProvider>
  );
}
