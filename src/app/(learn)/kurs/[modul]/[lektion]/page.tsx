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
  params: { modul: string; lektion: string };
}

export default function LessonPage({ params }: LessonPageProps) {
  const lesson = getLessonById(params.lektion);
  if (!lesson || lesson.moduleId !== params.modul) {
    notFound();
  }

  const nextLessonId = getNextLessonId(params.modul, params.lektion);
  const context = getModuleAndLessonIndex(params.lektion);

  return (
    <LessonView
      lesson={lesson}
      moduleId={params.modul}
      nextLessonId={nextLessonId}
      context={context}
    />
  );
}
