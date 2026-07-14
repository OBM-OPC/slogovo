import { notFound } from "next/navigation";
import { getAllModules, getModuleById, getVocabularyByCategory } from "@/lib/content";
import { VocabularyCategoryClient } from "@/components/vocabulary/VocabularyCategoryClient";

export function generateStaticParams() {
  const modules = getAllModules();
  return modules.map((m) => ({ kategorie: m.moduleId }));
}

export default async function VocabularyCategoryPage({
  params,
}: {
  params: Promise<{ kategorie: string }>;
}) {
  const { kategorie } = await params;
  const moduleMeta = getModuleById(kategorie);
  const words = getVocabularyByCategory(kategorie);

  if (!moduleMeta || words.length === 0) {
    notFound();
  }

  return <VocabularyCategoryClient moduleMeta={moduleMeta} words={words} />;
}
