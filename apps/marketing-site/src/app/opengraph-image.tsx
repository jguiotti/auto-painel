import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AutoPainel — plataforma digital para concessionárias";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #09090b 0%, #0f172a 45%, #042f2e 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#22d3ee",
              boxShadow: "0 0 40px rgba(34, 211, 238, 0.35)",
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>AUTOPAINEL</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>
            Site exclusivo + painel de gestão para concessionárias
          </div>
          <div style={{ fontSize: 28, color: "#a1a1aa", lineHeight: 1.4 }}>
            Estoque isolado, equipe com papéis, 3 layouts whitelabel e SEO de qualidade.
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#22d3ee" }}>autopainel.com.br</div>
      </div>
    ),
    { ...size },
  );
}
