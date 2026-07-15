import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandGlyph({ className, title = "Slogovo" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true} className={cn("h-10 w-10", className)}>
      <rect width="48" height="48" rx="15" fill="#2D6A4F" />
      <path d="M31.5 14.5c-2.3-1.7-5-2.5-7.7-2.5-6.7 0-11.8 4.9-11.8 12s5.1 12 11.8 12c2.7 0 5.5-.8 7.7-2.5l-2.8-4.1a8.2 8.2 0 0 1-4.7 1.5c-3.7 0-6.2-2.8-6.2-6.9s2.5-6.9 6.2-6.9c1.7 0 3.3.5 4.7 1.5l2.8-4.1Z" fill="white" />
      <circle cx="34.5" cy="14" r="3" fill="#D4A574" />
    </svg>
  );
}

export function BrandLogo({ href = "/", inverse = false, compact = false, className }: { href?: string; inverse?: boolean; compact?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-2.5 rounded-xl", inverse ? "text-white" : "text-primary", className)} aria-label="Slogovo Startseite">
      <BrandGlyph className="h-10 w-10" title="" />
      {!compact && <span className="font-serif text-xl font-bold tracking-tight">Slogovo</span>}
    </Link>
  );
}
