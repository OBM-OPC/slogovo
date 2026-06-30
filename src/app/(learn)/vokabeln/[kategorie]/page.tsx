import { notFound } from "next/navigation";
import { getAllModules, getModuleById, getVocabularyByCategory } from "@/lib/content";
import { VocabularyCategoryClient } from "@/components/vocabulary/VocabularyCategoryClient";

export function generateStaticParams() {
  const modules = getAllModules();
  return modules.map((m) => ({ kategorie: m.moduleId }));
}

export default function VocabularyCategoryPage({
  params,
}: {
  params: { kategorie: string };
}) {
  const moduleMeta = getModuleById(params.kategorie);
  const words = getVocabularyByCategory(params.kategorie);

  if (!moduleMeta || words.length === 0) {
    notFound();
  }

  return <VocabularyCategoryClient moduleMeta={moduleMeta} words={words} />;
}
