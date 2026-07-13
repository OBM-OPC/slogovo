import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { Lesson, ModuleMeta } from "@/types";
import type { ContentValidationIssue } from "./content-validation";

export interface ContentFile<T> {
  path: string;
  data: T;
}

export interface ContentInventory {
  modules: ContentFile<ModuleMeta>[];
  lessons: ContentFile<Lesson>[];
  issues: ContentValidationIssue[];
}

async function findJsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findJsonFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat().sort();
}

function displayPath(contentRoot: string, filePath: string): string {
  const relativePath = path.relative(contentRoot, filePath).split(path.sep).join("/");
  return `content/${relativePath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function loadContentInventory(contentRoot = path.resolve(process.cwd(), "content")): Promise<ContentInventory> {
  const modules: ContentFile<ModuleMeta>[] = [];
  const lessons: ContentFile<Lesson>[] = [];
  const issues: ContentValidationIssue[] = [];
  const files = await findJsonFiles(contentRoot);

  for (const filePath of files) {
    const relativePath = path.relative(contentRoot, filePath).split(path.sep).join("/");
    const isModuleMeta = path.posix.basename(relativePath) === "meta.json";
    const isLesson = path.posix.basename(path.posix.dirname(relativePath)) === "lessons";
    if (!isModuleMeta && !isLesson) continue;

    const contentPath = displayPath(contentRoot, filePath);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(filePath, "utf8"));
    } catch (error) {
      issues.push({
        path: contentPath,
        message: `invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
      continue;
    }

    if (!isRecord(parsed)) {
      issues.push({ path: contentPath, message: "content file must contain a JSON object", severity: "error" });
      continue;
    }

    if (isModuleMeta) {
      modules.push({ path: contentPath, data: parsed as unknown as ModuleMeta });
    } else {
      lessons.push({ path: contentPath, data: parsed as unknown as Lesson });
    }
  }

  return { modules, lessons, issues };
}

function indexRegisteredContent<T>(items: T[], getId: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [getId(item), item]));
}

export function validateRegistryDrift(
  inventory: ContentInventory,
  registeredModules: ModuleMeta[],
  registeredLessons: Lesson[],
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const registeredModulesById = indexRegisteredContent(registeredModules, (module) => module.moduleId);
  const registeredLessonsById = indexRegisteredContent(registeredLessons, (lesson) => lesson.lessonId);
  const filesystemModuleIds = new Set(inventory.modules.map(({ data }) => data.moduleId));
  const filesystemLessonIds = new Set(inventory.lessons.map(({ data }) => data.lessonId));

  inventory.modules.forEach(({ path: contentPath, data }) => {
    if (typeof data.moduleId === "string" && !registeredModulesById.has(data.moduleId)) {
      issues.push({
        path: contentPath,
        message: `filesystem module '${data.moduleId}' is not registered in src/lib/content.ts`,
        severity: "error",
      });
    }
  });

  inventory.lessons.forEach(({ path: contentPath, data }) => {
    if (typeof data.lessonId === "string" && !registeredLessonsById.has(data.lessonId)) {
      issues.push({
        path: contentPath,
        message: `filesystem lesson '${data.lessonId}' is not registered in src/lib/content.ts`,
        severity: "error",
      });
    }
  });

  registeredModules.forEach((module) => {
    if (!filesystemModuleIds.has(module.moduleId)) {
      issues.push({
        path: "src/lib/content.ts",
        message: `registered module '${module.moduleId}' has no filesystem meta.json`,
        severity: "error",
      });
    }
  });

  registeredLessons.forEach((lesson) => {
    if (!filesystemLessonIds.has(lesson.lessonId)) {
      issues.push({
        path: "src/lib/content.ts",
        message: `registered lesson '${lesson.lessonId}' has no filesystem lesson JSON`,
        severity: "error",
      });
    }
  });

  return issues;
}
