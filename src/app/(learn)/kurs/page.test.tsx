import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createDefaultProgress } from "@/lib/progress-db";
import type { ModuleMeta } from "@/types";
import { buildCourseRoadmap, CourseRoadmap } from "./page";

const modules: ModuleMeta[] = [
  {
    moduleId: "a1-one", level: "A1", order: 1, title: "Begrüßung", description: "Begrüßen und vorstellen.",
    lessons: [
      { lessonId: "hello", title: "Hallo sagen", duration: "5 min" },
      { lessonId: "introduce", title: "Sich vorstellen", duration: "7 min" },
    ],
  },
  {
    moduleId: "a1-two", level: "A1", order: 2, title: "Im Café", description: "Bestellen und bezahlen.",
    lessons: [{ lessonId: "order", title: "Etwas bestellen", duration: "8 min" }],
  },
];

describe("course roadmap", () => {
  it("derives current, completed, and locked chapters sequentially", () => {
    const progress = createDefaultProgress("roadmap-test");
    let roadmap = buildCourseRoadmap(modules, progress);
    expect(roadmap.map((chapter) => chapter.state)).toEqual(["current", "locked"]);

    progress.completedLessons = ["hello", "introduce"];
    roadmap = buildCourseRoadmap(modules, progress);
    expect(roadmap.map((chapter) => chapter.state)).toEqual(["completed", "current"]);
    expect(roadmap[0].totalMinutes).toBe(12);
  });

  it("shows objectives and statuses inside expandable chapter cards", async () => {
    const user = userEvent.setup();
    const progress = createDefaultProgress("roadmap-test");
    render(<CourseRoadmap modules={modules} progress={progress} />);

    expect(screen.getByRole("progressbar", { name: "0 von 3 Lektionen abgeschlossen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Begrüßung/ }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Das lernst du")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Hallo sagen/ }).getAttribute("href")).toBe("/kurs/a1-one/hello");

    const lockedChapter = screen.getByRole("button", { name: /Im Café/ });
    expect(lockedChapter.getAttribute("aria-expanded")).toBe("false");
    await user.click(lockedChapter);
    expect(screen.getByLabelText("Etwas bestellen, gesperrt")).toBeTruthy();
    expect(screen.getByText("Schließe das vorherige Kapitel ab, um diese Lektionen freizuschalten.")).toBeTruthy();
  });
});
