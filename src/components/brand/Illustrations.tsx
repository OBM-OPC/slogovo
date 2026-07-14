import { cn } from "@/lib/utils";

interface IllustrationProps { className?: string }

export function EmptyLearningIllustration({ className }: IllustrationProps) {
  return <svg viewBox="0 0 160 120" aria-hidden="true" className={cn("h-24 w-32", className)}><path d="M31 30h43c11 0 20 9 20 20v48H51c-11 0-20-9-20-20V30Z" fill="#D4EBDE"/><path d="M129 30H86c-11 0-20 9-20 20v48h43c11 0 20-9 20-20V30Z" fill="#EDF5F0"/><path d="M80 45v53M45 48h20M45 61h14M95 48h20M95 61h13" fill="none" stroke="#2D6A4F" strokeWidth="5" strokeLinecap="round"/><circle cx="126" cy="26" r="12" fill="#D4A574"/><path d="m120 26 4 4 8-9" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function AchievementIllustration({ className }: IllustrationProps) {
  return <svg viewBox="0 0 160 120" aria-hidden="true" className={cn("h-24 w-32", className)}><path d="M55 23h50v24c0 18-11 32-25 32S55 65 55 47V23Z" fill="#D4A574"/><path d="M55 33H38c0 18 9 28 24 28M105 33h17c0 18-9 28-24 28" fill="none" stroke="#9E6E38" strokeWidth="6" strokeLinecap="round"/><path d="M80 79v16M61 103h38" stroke="#2D6A4F" strokeWidth="7" strokeLinecap="round"/><path d="m80 34 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" fill="#fff"/><circle cx="35" cy="19" r="5" fill="#B91C1C"/><circle cx="124" cy="76" r="6" fill="#2D6A4F"/></svg>;
}

export function OnboardingIllustration({ className }: IllustrationProps) {
  return <svg viewBox="0 0 180 130" aria-hidden="true" className={cn("h-28 w-40", className)}><path d="M26 90c24-2 37-15 45-40 9 25 22 38 45 40" fill="none" stroke="#A9D7BD" strokeWidth="10" strokeLinecap="round"/><circle cx="26" cy="90" r="13" fill="#2D6A4F"/><circle cx="71" cy="50" r="13" fill="#D4A574"/><circle cx="116" cy="90" r="13" fill="#B91C1C"/><path d="M124 90h29" stroke="#D6C8B8" strokeWidth="10" strokeLinecap="round"/><path d="m143 76 14 14-14 14" fill="none" stroke="#5C5147" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M59 50 71 38l12 12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
