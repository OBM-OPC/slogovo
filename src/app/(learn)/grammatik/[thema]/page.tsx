import { notFound } from "next/navigation";
import { getAllGrammarTopics, getGrammarTopicBySlug } from "@/lib/content";
import { GrammarClient } from "@/components/lesson/GrammarClient";

export function generateStaticParams() {
  const topics = getAllGrammarTopics();
  return topics.map((t) => ({ thema: t.slug }));
}

export default async function GrammarDetailPage({
  params,
}: {
  params: Promise<{ thema: string }>;
}) {
  const { thema } = await params;
  const topic = getGrammarTopicBySlug(thema);
  if (!topic) {
    notFound();
  }

  return <GrammarClient topic={topic} />;
}
