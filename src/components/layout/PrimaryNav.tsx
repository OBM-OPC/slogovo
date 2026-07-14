"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumnIncreasing, ChevronDown, House, Library, RotateCcw, UserRound, Grid3X3, BookMarked } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const learnChildren = [
  { href: "/grammatik", label: "Grammatik", icon: BookMarked },
  { href: "/alphabet", label: "Alphabet", icon: Grid3X3 },
  { href: "/vokabeln", label: "Wortschatz", icon: Library },
] as const;

const primaryItems = [
  { href: "/lernen", label: "Home", icon: House, matches: ["/lernen", "/heute-lernen"] },
  { href: "/kurs", label: "Lernen", icon: BookOpen, matches: ["/kurs", "/grammatik", "/alphabet", "/vokabeln", "/sprechen", "/fehler"] },
  { href: "/wiederholen", label: "Wiederholen", icon: RotateCcw, matches: ["/wiederholen"] },
  { href: "/fortschritt", label: "Fortschritt", icon: ChartNoAxesColumnIncreasing, matches: ["/fortschritt"] },
  { href: "/profil", label: "Profil", icon: UserRound, matches: ["/profil", "/einstellungen", "/onboarding"] },
] as const;

export function isNavigationItemActive(pathname: string, matches: readonly string[]) {
  return matches.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function PrimaryNav() {
  const pathname = usePathname() ?? "";
  return (
    <header className="sticky top-0 z-50 hidden border-b border-warm-200/80 bg-background/90 backdrop-blur-xl md:block">
      <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-6 px-6">
        <BrandLogo href="/lernen" />
        <nav aria-label="Hauptnavigation">
          <ul className="flex items-center gap-1">
            {primaryItems.map((item) => item.label === "Lernen" ? <LearnMenu key={item.href} pathname={pathname} item={item} /> : (
              <li key={item.href}>
                <Link href={item.href} aria-current={isNavigationItemActive(pathname, item.matches) ? "page" : undefined} className={cn("inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors", isNavigationItemActive(pathname, item.matches) ? "bg-primary-50 text-primary" : "text-warm-700 hover:bg-warm-100 hover:text-foreground")}>
                  <item.icon className="h-4 w-4" aria-hidden="true" />{item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function LearnMenu({ pathname, item }: { pathname: string; item: (typeof primaryItems)[number] }) {
  const active = isNavigationItemActive(pathname, item.matches);
  return (
    <li className="relative">
      <details className="group">
        <summary aria-current={active ? "page" : undefined} className={cn("flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-semibold marker:hidden", active ? "bg-primary-50 text-primary" : "text-warm-700 hover:bg-warm-100 hover:text-foreground")}>
          <BookOpen className="h-4 w-4" aria-hidden="true" />Lernen<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 rounded-2xl border border-warm-200 bg-white p-2 shadow-xl">
          <Link href="/kurs" aria-current={pathname === "/kurs" || pathname.startsWith("/kurs/") ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-primary-50"><BookOpen className="h-5 w-5 text-primary" aria-hidden="true" /><span><span className="block">Kurs</span><span className="block text-xs font-normal text-muted">Dein Lernpfad</span></span></Link>
          <div className="my-1 h-px bg-warm-100" />
          {learnChildren.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-primary-50"><Icon className="h-5 w-5 text-primary" aria-hidden="true" />{label}</Link>)}
        </div>
      </details>
    </li>
  );
}

export { primaryItems, learnChildren };
