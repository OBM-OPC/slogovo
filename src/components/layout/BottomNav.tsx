"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumnIncreasing, Library, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/lernen", label: "Lernen", icon: BookOpen, matches: ["/lernen", "/heute-lernen", "/kurs"] },
  { href: "/wiederholen", label: "Wiederholen", icon: RotateCcw, matches: ["/wiederholen"] },
  { href: "/vokabeln", label: "Wortschatz", icon: Library, matches: ["/vokabeln"] },
  { href: "/fortschritt", label: "Fortschritt", icon: ChartNoAxesColumnIncreasing, matches: ["/fortschritt"] },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Hauptnavigation" className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl shadow-nav safe-bottom">
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matches.some((path) => pathname === path || pathname.startsWith(`${path}/`));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-medium transition-colors",
                  isActive ? "bg-primary-50 text-primary" : "text-muted hover:bg-warm-50 hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
