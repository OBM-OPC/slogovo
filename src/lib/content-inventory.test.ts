import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { Lesson, ModuleMeta } from "@/types";
import { loadContentInventory, validateRegistryDrift } from "./content-inventory";

const temporaryDirectories: string[] = [];

async function makeContentRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "slogovo-content-"));
  temporaryDirectories.push(root);
  await mkdir(path.join(root, "a1", "module-1", "lessons"), { recursive: true });
  return root;
}

function moduleMeta(): ModuleMeta {
  return {
    moduleId: "a1-modul-1",
    level: "A1",
    title: "Module",
    description: "Description",
    order: 1,
    lessons: [{ lessonId: "a1-modul-1-lektion-1", title: "Lesson", duration: "10 min" }],
  };
}

function lesson(): Lesson {
  return {
    lessonId: "a1-modul-1-lektion-1",
    moduleId: "a1-modul-1",
    level: "A1",
    title: "Lesson",
    duration: "10 min",
    introduction: "Introduction",
    summary: "Summary",
    vocabulary: [],
    grammar: { title: "Grammar", explanation: "Explanation", examples: [] },
    exercises: [],
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("loadContentInventory", () => {
  it("discovers every nested module meta and lesson JSON file", async () => {
    const root = await makeContentRoot();
    await writeFile(path.join(root, "a1", "module-1", "meta.json"), JSON.stringify(moduleMeta()));
    await writeFile(path.join(root, "a1", "module-1", "lessons", "lektion-1.json"), JSON.stringify(lesson()));
    await writeFile(path.join(root, "a1", "module-1", "notes.json"), "{}");

    const inventory = await loadContentInventory(root);

    expect(inventory.issues).toEqual([]);
    expect(inventory.modules.map((file) => file.path)).toEqual(["content/a1/module-1/meta.json"]);
    expect(inventory.lessons.map((file) => file.path)).toEqual(["content/a1/module-1/lessons/lektion-1.json"]);
  });

  it("reports invalid JSON instead of silently skipping the file", async () => {
    const root = await makeContentRoot();
    await writeFile(path.join(root, "a1", "module-1", "meta.json"), "{");

    const inventory = await loadContentInventory(root);

    expect(inventory.issues).toHaveLength(1);
    expect(inventory.issues[0]).toMatchObject({ path: "content/a1/module-1/meta.json", severity: "error" });
  });
});

describe("validateRegistryDrift", () => {
  it("reports filesystem content missing from the registry", () => {
    const meta = moduleMeta();
    const contentLesson = lesson();
    const issues = validateRegistryDrift(
      {
        modules: [{ path: "content/a1/module-1/meta.json", data: meta }],
        lessons: [{ path: "content/a1/module-1/lessons/lektion-1.json", data: contentLesson }],
        issues: [],
      },
      [],
      [],
    );

    expect(issues.map((issue) => issue.message)).toEqual([
      "filesystem module 'a1-modul-1' is not registered in src/lib/content.ts",
      "filesystem lesson 'a1-modul-1-lektion-1' is not registered in src/lib/content.ts",
    ]);
  });

  it("reports registered content missing from the filesystem", () => {
    const issues = validateRegistryDrift({ modules: [], lessons: [], issues: [] }, [moduleMeta()], [lesson()]);

    expect(issues.map((issue) => issue.message)).toEqual([
      "registered module 'a1-modul-1' has no filesystem meta.json",
      "registered lesson 'a1-modul-1-lektion-1' has no filesystem lesson JSON",
    ]);
  });
});
