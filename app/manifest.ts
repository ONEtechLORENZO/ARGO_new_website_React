import type { MetadataRoute } from "next";
import { DICTS } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} di ${SITE.company}`,
    short_name: SITE.name,
    description: DICTS.it.meta.description,
    lang: "it",
    start_url: "/",
    display: "standalone",
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
