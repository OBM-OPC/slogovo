import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Lesson, LessonAttempt } from "@/types";
import { buildLessonPerformanceSummary } from "@/lib/lesson-summary";
import { Button } from "@/components/ui/Button";

interface LessonSummaryProps {
  attempt: LessonAttempt;
  lesson: Lesson;
  nextLessonId: string | null;
  passedPreviously: boolean;
  onRetry: () => void;
}

function vocabularyLabels(lesson: Lesson, ids: string[]): ReactNode[] {
  const idSet = new Set(ids);
  return lesson.vocabulary
    .filter((item) => idSet.has(item.id))
    .map((item, idx, arr) => (
      <span key={item.id}>
        <span lang="bg">{item.bg}</span> ({item.de})
        {idx < arr.length - 1 ? ", " : null}
      </span>
    ));
}

export function LessonSummary({
  attempt,
  lesson,
  nextLessonId,
  passedPreviously,
  onRetry,
}: LessonSummaryProps) {
  const summary = buildLessonPerformanceSummary(attempt);
  const weakVocabulary = vocabularyLabels(lesson, summary.weakVocabularyIds);
  const masteredVocabulary = vocabularyLabels(lesson, summary.masteredVocabularyIds);

  return (
    <section className="card text-center" aria-live="polite">
      <div className={`mb-4 inline-flex rounded-full p-4 ${attempt.passed ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
        {summary.passed ? <CheckCircle2 className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
      </div>
      <h2 className="mb-2 text-xl font-bold">
        {summary.mastered ? "Lektion gemeistert!" : summary.passed ? "Lektion bestanden!" : "Noch nicht bestanden"}
      </h2>
      <p className="mb-6 text-muted">{summary.feedback}</p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-bold">{summary.score}</p><p className="text-xs text-muted">Punkte</p></div>
        <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-bold">{Math.round(summary.accuracy * 100)}%</p><p className="text-xs text-muted">Genauigkeit</p></div>
        <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-bold">{summary.correctCount}/{summary.correctCount + summary.incorrectCount}</p><p className="text-xs text-muted">Antworten</p></div>
        <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-bold">{summary.activeTimeSeconds}s</p><p className="text-xs text-muted">aktive Zeit</p></div>
        <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-bold">{summary.xpEarned}</p><p className="text-xs text-muted">XP verdient</p></div>
      </div>

      {(summary.strongestSkill || summary.weakestSkill) && (
        <div className="mb-6 grid gap-3 text-left sm:grid-cols-2">
          {summary.strongestSkill && (
            <div className="rounded-xl bg-success/10 p-3">
              <p className="text-xs font-medium text-muted">Stärkste Fertigkeit</p>
              <p className="font-semibold">{summary.strongestSkill.label} · {Math.round(summary.strongestSkill.accuracy * 100)}%</p>
            </div>
          )}
          {summary.weakestSkill && (
            <div className="rounded-xl bg-warm-50 p-3">
              <p className="text-xs font-medium text-muted">Schwächste Fertigkeit</p>
              <p className="font-semibold">{summary.weakestSkill.label} · {Math.round(summary.weakestSkill.accuracy * 100)}%</p>
            </div>
          )}
        </div>
      )}

      {(weakVocabulary.length > 0 || masteredVocabulary.length > 0) && (
        <div className="mb-6 space-y-3 text-left">
          {weakVocabulary.length > 0 && (
            <div className="rounded-xl bg-danger/5 p-3">
              <p className="text-sm font-semibold">Weiter üben</p>
              <p className="text-sm text-muted">{weakVocabulary}</p>
            </div>
          )}
          {masteredVocabulary.length > 0 && (
            <div className="rounded-xl bg-success/10 p-3">
              <p className="text-sm font-semibold">Sicher beantwortet</p>
              <p className="text-sm text-muted">{masteredVocabulary}</p>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-100 p-3 text-left">
        <p className="text-xs font-medium text-muted">Empfohlener nächster Schritt</p>
        <p className="text-sm font-semibold">{summary.recommendedActionLabel}</p>
      </div>

      <div className="space-y-3">
        {summary.recommendedAction === "retry-lesson" && (
          <Button onClick={onRetry} fullWidth>Erneut versuchen</Button>
        )}
        {summary.recommendedAction === "review-weak-items" && (
          <Button onClick={onRetry} fullWidth>Lektion wiederholen</Button>
        )}
        {summary.recommendedAction === "continue-course" && nextLessonId && (
          <Link href={`/kurs/${lesson.moduleId}/${nextLessonId}/`}><Button fullWidth>Nächste Lektion</Button></Link>
        )}
        {summary.recommendedAction === "review-weak-items" && nextLessonId && (
          <Link href={`/kurs/${lesson.moduleId}/${nextLessonId}/`}><Button fullWidth variant="outline">Trotzdem weiter</Button></Link>
        )}
        <Link href="/kurs/"><Button fullWidth variant={summary.passed || passedPreviously ? "primary" : "outline"}>Zurück zum Kurs</Button></Link>
      </div>
    </section>
  );
}
