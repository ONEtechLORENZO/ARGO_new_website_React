import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/* una voce per lingua, ciascuna con il riferimento all'altra (hreflang) */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { "it-IT": `${SITE.url}/`, "en-GB": `${SITE.url}/en` };
  return [
    { url: `${SITE.url}/`, lastModified: new Date(), changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${SITE.url}/en`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
  ];
}
