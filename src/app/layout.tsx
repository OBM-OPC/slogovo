import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TelemetryMonitor } from "@/components/telemetry/TelemetryMonitor";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Slogovo - Bulgarisch lernen",
  description: "Lerne Bulgarisch mit Slogovo - der interaktiven Sprachlern-App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <TelemetryMonitor />
        {children}
      </body>
    </html>
  );
}
