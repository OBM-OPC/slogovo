import type { ModuleMeta, UserProgress } from "@/types";

export type ChapterState = "completed" | "current" | "locked" | "available";

export interface ChapterView {
  module: ModuleMeta;
  state: ChapterState;
  completedCount: number;
  total: number;
  progressPercent: number;
  totalMinutes: number;
}

export function buildCourseRoadmap(modules: ModuleMeta[], progress: UserProgress): ChapterView[] {
  const ordered = [...modules].sort((a, b) => a.level.localeCompare(b.level) || a.order - b.order);
  let foundCurrent = false;
  return ordered.map((module, index) => {
    const completedCount = module.lessons.filter((lesson) => progress.completedLessons.includes(lesson.lessonId)).length;
    const completed = completedCount === module.lessons.length && module.lessons.length > 0;
    const previous = ordered[index - 1];
    const previousCompleted = !previous || previous.lessons.every((lesson) => progress.completedLessons.includes(lesson.lessonId));
    const unlocked = index === 0 || previousCompleted || progress.completedModules.includes(previous?.moduleId ?? "");
    const current = unlocked && !completed && !foundCurrent;
    if (current) foundCurrent = true;
    const state: ChapterState = completed ? "completed" : current ? "current" : unlocked ? "available" : "locked";
    return {
      module, state, completedCount, total: module.lessons.length,
      progressPercent: module.lessons.length === 0 ? 0 : Math.round((completedCount / module.lessons.length) * 100),
      totalMinutes: module.lessons.reduce((sum, lesson) => sum + (Number.parseInt(lesson.duration, 10) || 0), 0),
    };
  });
}
