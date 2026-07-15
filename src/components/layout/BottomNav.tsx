"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavigationItemActive, primaryItems } from "./PrimaryNav";

export function BottomNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-warm-200/80 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.375rem)] backdrop-blur-xl shadow-nav md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5 px-1 pt-1.5">
        {primaryItems.map((item) => {
          const active = isNavigationItemActive(pathname, item.matches);
          return <li key={item.href}><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[11px] font-semibold transition-colors", active ? "bg-primary-50 text-primary" : "text-warm-600 hover:bg-warm-50 hover:text-foreground")}><item.icon className="h-5 w-5" aria-hidden="true" /><span>{item.label}</span></Link></li>;
        })}
      </ul>
    </nav>
  );
}
