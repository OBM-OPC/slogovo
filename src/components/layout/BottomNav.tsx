"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/lernen", label: "Уча", icon: BookOpen },
  { href: "/profil", label: "Аз", icon: User },
  { href: "/einstellungen", label: "⚙️", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl shadow-nav safe-bottom">
      <ul className="mx-auto flex max-w-md items-center justify-around px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary"
                    : "text-muted hover:text-foreground hover:bg-warm-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
