"use client";

import { useState } from "react";
import Link from "next/link";
import { GrammarTopic, GrammarExample } from "@/types";
import { useProgressStore } from "@/stores/useProgressStore";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ChevronDown, ChevronUp, Lightbulb, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface GrammarClientProps {
  topic: GrammarTopic;
}

export function GrammarClient({ topic }: GrammarClientProps) {
  const progress = useProgressStore((state) => state.progress);
  const [activeExample, setActiveExample] = useState<number | null>(null);
  const [expandedTables, setExpandedTables] = useState<Record<number, boolean>>({});

  const toggleTable = (sectionIdx: number) => {
    setExpandedTables((prev) => ({ ...prev, [sectionIdx]: !prev[sectionIdx] }));
  };

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/grammatik/" className="rounded-full bg-gray-100 p-2 text-muted hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-muted">{topic.level}</p>
          <h1 className="text-xl font-bold">{topic.title}</h1>
        </div>
      </header>

      <div className="mb-4 rounded-2xl bg-primary/10 p-4">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" />
          <p className="text-sm font-medium">{topic.shortDescription}</p>
        </div>
      </div>

      <div className="space-y-6">
        {topic.content.map((section, idx) => (
          <section key={idx} className="card">
            <h2 className="mb-3 text-lg font-semibold">{section.title}</h2>
            <div className="mb-4 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed text-muted">
              {section.explanation}
            </div>

            {/* Tables */}
            {section.tables && section.tables.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleTable(idx)}
                  className="mb-2 flex w-full items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-100"
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Übersichtstabelle{section.tables.length > 1 ? "n" : ""}
                  </span>
                  {expandedTables[idx] ? (
                    <ChevronUp className="h-4 w-4 text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted" />
                  )}
                </button>
                {expandedTables[idx] && (
                  <div className="space-y-3 animate-fade-in">
                    {section.tables.map((table, tIdx) => (
                      <div key={tIdx} className="overflow-hidden rounded-xl border border-gray-200">
                        {table.title && (
                          <p className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-muted">{table.title}</p>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                {table.headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="border-t border-gray-100">
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="px-3 py-2 font-mono text-sm text-foreground"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Examples */}
            <div className="space-y-3">
              {section.examples.map((example, i) => (
                <InteractiveExample
                  key={i}
                  example={example}
                  isActive={activeExample === i}
                  onToggle={() => setActiveExample(activeExample === i ? null : i)}
                  showLatin={progress.settings.showLatin}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function InteractiveExample({
  example,
  isActive,
  onToggle,
  showLatin,
}: {
  example: GrammarExample;
  isActive: boolean;
  onToggle: () => void;
  showLatin: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-gray-50 p-4 transition-all duration-200",
        isActive ? "border-primary ring-1 ring-primary/20" : "border-gray-100"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="mb-1 text-lg font-medium text-foreground">{example.bg}</p>
          <p className={cn("text-sm text-muted", isActive ? "block" : "hidden md:block")}>
            {example.de}
          </p>
          {showLatin && example.bgLatin && (
            <p className={cn("text-xs italic text-muted", isActive ? "block" : "hidden md:block")}>
              {example.bgLatin}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} className="shrink-0">
          {isActive ? "Weniger" : "Details"}
        </Button>
      </div>

      {isActive && (
        <div className="mt-3 animate-fade-in border-t border-gray-200 pt-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Übersetzung: </span>
              {example.de}
            </p>
            {showLatin && example.bgLatin && (
              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">Lateinisch: </span>
                {example.bgLatin}
              </p>
            )}
            <div className="mt-2">
              <SpeakButton text={example.bg} variant="inline" label="Aussprache anhören" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
