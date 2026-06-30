"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/lernen", label: "Lernen", icon: BookOpen },
  { href: "/profil", label: "Profil", icon: User },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur safe-bottom">
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted hover:text-foreground"
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
