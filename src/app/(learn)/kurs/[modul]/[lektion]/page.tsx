import { notFound } from "next/navigation";
import { getAllModules, getLessonById, getModuleAndLessonIndex, getNextLessonId } from "@/lib/content";
import { LessonView } from "@/components/lesson/LessonView";

export function generateStaticParams() {
  const modules = getAllModules();
  const params: { modul: string; lektion: string }[] = [];
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      params.push({ modul: mod.moduleId, lektion: lesson.lessonId });
    }
  }
  return params;
}

interface LessonPageProps {
  params: Promise<{ modul: string; lektion: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { modul, lektion } = await params;
  const lesson = getLessonById(lektion);
  if (!lesson || lesson.moduleId !== modul) {
    notFound();
  }

  const nextLessonId = getNextLessonId(modul, lektion);
  const context = getModuleAndLessonIndex(lektion);

  return (
    <LessonView
      lesson={lesson}
      moduleId={modul}
      nextLessonId={nextLessonId}
      context={context}
    />
  );
}
