import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { TelemetryMonitor } from "@/components/telemetry/TelemetryMonitor";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans", display: "swap" });
const lora = Lora({ subsets: ["latin", "cyrillic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://slogovo.vercel.app"),
  title: { default: "Slogovo – Bulgarisch im Alltag lernen", template: "%s · Slogovo" },
  description: "Lerne Bulgarisch in kurzen, alltagstauglichen Einheiten – mit Aussprache, gezielten Wiederholungen und einem klaren A1–A2-Lernweg.",
  applicationName: "Slogovo",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Slogovo",
    title: "Slogovo – Bulgarisch im Alltag lernen",
    description: "Kurze Lektionen, natürliche Aussprache und ein klarer Lernweg für deutschsprachige Bulgarisch-Anfänger.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${lora.variable}`}>
        <ToastProvider>
          <TelemetryMonitor />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
