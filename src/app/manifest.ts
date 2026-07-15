import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Slogovo – Bulgarisch lernen",
    short_name: "Slogovo",
    description: "Alltagstaugliches Bulgarisch in kurzen, persönlichen Lerneinheiten.",
    start_url: "/lernen",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#2D6A4F",
    lang: "de",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
