import { notFound } from "next/navigation";
import { getAllGrammarTopics, getGrammarTopicBySlug } from "@/lib/content";
import { GrammarClient } from "@/components/lesson/GrammarClient";

export function generateStaticParams() {
  const topics = getAllGrammarTopics();
  return topics.map((t) => ({ thema: t.slug }));
}

export default function GrammarDetailPage({
  params,
}: {
  params: { thema: string };
}) {
  const topic = getGrammarTopicBySlug(params.thema);
  if (!topic) {
    notFound();
  }

  return <GrammarClient topic={topic} />;
}
