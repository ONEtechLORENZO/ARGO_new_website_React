import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { DICTS, LOCALES, homePath, isLocale } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import "../globals.css";
import "../how.css";
import "../plus.css";
import "../why.css";
import "../prices.css";
import "../about.css";
import "../footer.css";
import "../header.css";
import "../form.css";
import "../theme.css";

const dmMono = localFont({
  src: [
    { path: "../fonts/DMMono-400.ttf", weight: "400", style: "normal" },
    { path: "../fonts/DMMono-500.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

/* solo le lingue previste: /it (servita su "/") e /en; tutto il resto è 404 */
export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = DICTS[lang].meta;
  return {
    metadataBase: new URL(SITE.url),
    title: { default: m.title, template: `%s | ${SITE.name} · ${SITE.company}` },
    description: m.description,
    keywords: m.keywords,
    applicationName: SITE.name,
    authors: [{ name: SITE.company }],
    creator: SITE.company,
    publisher: SITE.company,
    category: "technology",
    /* ogni lingua è canonica di sé stessa e indica la versione nell'altra lingua (hreflang) */
    alternates: {
      canonical: homePath(lang),
      languages: { "it-IT": homePath("it"), "en-GB": homePath("en"), "x-default": homePath("it") },
    },
    openGraph: {
      type: "website",
      locale: m.ogLocale,
      alternateLocale: lang === "it" ? ["en_GB"] : ["it_IT"],
      url: homePath(lang),
      siteName: `${SITE.name} · ${SITE.company}`,
      title: m.shortTitle,
      description: m.description,
    },
    twitter: { card: "summary_large_image", title: m.shortTitle, description: m.description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* il sito è solo in tema scuro: barra del browser e controlli nativi scuri */
  themeColor: SITE.themeColor,
  colorScheme: "dark",
};

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={dmMono.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        {/* marks JS as available before first paint, so the logo can start hidden and fold in */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
