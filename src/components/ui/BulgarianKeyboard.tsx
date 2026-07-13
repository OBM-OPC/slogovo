"use client";

import { useId, useState } from "react";
import { Keyboard } from "lucide-react";

const BULGARIAN_KEYS = ["ъ", "ь", "ю", "я", "ч", "ш", "щ", "ж", "ц"] as const;

interface BulgarianKeyboardProps {
  disabled?: boolean;
  onInsert: (character: string) => void;
}

export function BulgarianKeyboard({ disabled = false, onInsert }: BulgarianKeyboardProps) {
  const [open, setOpen] = useState(false);
  const keysId = useId();

  return (
    <div className="mb-4 rounded-xl border border-warm-200 bg-warm-50/60 p-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={keysId}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
      >
        <Keyboard className="h-4 w-4" aria-hidden="true" />
        Bulgarische Tastaturhilfe
      </button>
      {open && (
        <div id={keysId} className="mt-2 grid grid-cols-9 gap-1" aria-label="Bulgarische Sonderbuchstaben">
          {BULGARIAN_KEYS.map((character) => (
            <button
              key={character}
              type="button"
              className="min-h-11 min-w-0 rounded-lg bg-white text-lg font-semibold text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => onInsert(character)}
              disabled={disabled}
              aria-label={`${character} einfügen`}
            >
              {character}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
