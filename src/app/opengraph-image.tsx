import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#FAF8F5", color: "#1E1A16", padding: "72px 84px", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", width: 520, height: 520, right: -140, top: -160, borderRadius: 999, background: "rgba(45,106,79,.12)" }} />
      <div style={{ position: "absolute", width: 380, height: 380, right: 80, bottom: -230, borderRadius: 999, background: "rgba(212,165,116,.24)" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, color: "#2D6A4F", fontSize: 42, fontWeight: 700 }}><div style={{ width: 72, height: 72, borderRadius: 22, background: "#2D6A4F", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>С</div>Slogovo</div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}><div style={{ fontSize: 72, lineHeight: 1.08, fontWeight: 750 }}>Bulgarisch, das du im Alltag wirklich sprichst.</div><div style={{ marginTop: 28, fontSize: 30, color: "#5C5147" }}>Kurze Lektionen · Aussprache · Persönlicher Lernweg</div></div>
        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#2D6A4F", fontWeight: 600 }}><span>60 Lektionen</span><span>·</span><span>A1–A2</span><span>·</span><span>5–10 Minuten</span></div>
      </div>
    </div>,
    size
  );
}
