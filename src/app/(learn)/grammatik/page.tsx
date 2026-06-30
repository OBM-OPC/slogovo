import Link from "next/link";
import { getAllGrammarTopics } from "@/lib/content";

export default function GrammarIndexPage() {
  const topics = getAllGrammarTopics();

  return (
    <main className="animate-fade-in px-4 py-6 safe-top">
      <h1 className="mb-2 text-2xl font-bold">Grammatik</h1>
      <p className="mb-6 text-muted">Alle Grammatikthemen von A1 bis C1.</p>

      <div className="grid gap-3">
        {topics.map((topic) => (
          <Link
            key={topic.topicId}
            href={`/grammatik/${topic.slug}/`}
            className="card transition-colors hover:bg-gray-50"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                {topic.level}
              </span>
            </div>
            <h2 className="text-lg font-bold">{topic.title}</h2>
            <p className="text-sm text-muted">{topic.shortDescription}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
