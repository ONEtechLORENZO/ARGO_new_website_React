import { ImageResponse } from "next/og";
import { DICTS, isLocale } from "@/lib/i18n";

export const alt = "ARGO · One Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* anteprima social nella lingua della pagina */
export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const m = DICTS[isLocale(lang) ? lang : "it"].meta;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(circle at 50% 40%, #cbe7d6 0%, #edf4ef 70%)",
          color: "#24382e",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 28, color: "#5f7469" }}>One Tech</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 200, fontWeight: 700, color: "#1f9d5a", letterSpacing: -8, lineHeight: 1 }}>ARGO</div>
          <div style={{ fontSize: 52, marginTop: 28, letterSpacing: -2 }}>{m.ogTagline}</div>
        </div>
        <div style={{ fontSize: 24, color: "#5f7469" }}>{m.ogTypes}</div>
      </div>
    ),
    size,
  );
}
