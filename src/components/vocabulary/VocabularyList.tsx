"use client";

import { VocabularyItem } from "@/types";
import { useProgressSafe } from "@/hooks/useProgressSafe";
import { SpeakButton } from "@/components/ui/SpeakButton";

interface VocabularyListProps {
  items: VocabularyItem[];
}

export function VocabularyList({ items }: VocabularyListProps) {
  const progress = useProgressSafe();

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4"
        >
          <div className="flex-1">
            <p className="text-lg font-semibold text-foreground">{item.bg}</p>
            <p className="text-sm text-muted">{item.de}</p>
            {progress.settings.showLatin && item.bgLatin && (
              <p className="text-xs italic text-muted">{item.bgLatin}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SpeakButton text={item.bg} progress={progress} aria-label="Vokabel anhören" />
          </div>
        </li>
      ))}
    </ul>
  );
}
