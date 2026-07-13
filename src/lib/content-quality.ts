import type {
  Exercise,
  FillInSentence,
  Lesson,
  ListenExerciseItem,
  MatchingPair,
  ModuleMeta,
  QuizQuestion,
  SentenceBuilder,
} from "@/types";

const SUPPORTED_EXERCISE_TYPES = new Set(["quiz", "fill-in", "matching", "sentence-builder", "listen"]);

export type ContentQualityCategory =
  | "untestedVocabulary"
  | "missingAudio"
  | "missingAcceptedAnswers"
  | "unsupportedExerciseTypes"
  | "duplicateIds"
  | "missingGrammarExplanations"
  | "lessonsWithoutProductiveExercises";

export interface ContentQualityFinding {
  path: string;
  message: string;
  affectedIds: string[];
}

export interface ContentQualityReport {
  totals: {
    modules: number;
    lessons: number;
    vocabularyItems: number;
    exerciseItems: number;
  };
  findings: Record<ContentQualityCategory, ContentQualityFinding[]>;
  affected: Record<ContentQualityCategory, number>;
}

function lessonPath(lesson: Lesson): string {
  const level = lesson.level.toLowerCase();
  const lessonNumber = lesson.lessonId.replace(`${lesson.moduleId}-`, "");
  const moduleDirectory = lesson.moduleId.replace(`${level}-modul-`, "module-");
  return `content/${level}/${moduleDirectory}/lessons/${lessonNumber}.json`;
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("bg").replace(/[\s\p{P}\p{S}]+/gu, " ").trim();
}

function includesTerm(candidate: string, term: string): boolean {
  const normalizedCandidate = ` ${normalize(candidate)} `;
  const normalizedTerm = normalize(term);
  return normalizedTerm.length > 0 && normalizedCandidate.includes(` ${normalizedTerm} `);
}

function exerciseCandidates(exercise: Exercise): string[] {
  switch (exercise.type) {
    case "quiz":
      return (exercise.data as QuizQuestion[]).flatMap((item) => [item.bg, ...item.options].filter(Boolean) as string[]);
    case "matching":
      return (exercise.data as MatchingPair[]).flatMap((item) => [item.bg, item.de]);
    case "fill-in":
      return (exercise.data as FillInSentence[]).flatMap((item) =>
        [item.answer, ...item.answers, item.bg, item.de].filter(Boolean) as string[]
      );
    case "sentence-builder":
      return (exercise.data as SentenceBuilder[]).flatMap((item) =>
        [...item.words, item.correctOrder.join(" "), item.bg, item.de].filter(Boolean) as string[]
      );
    case "listen":
      return (exercise.data as ListenExerciseItem[]).flatMap((item) => {
        const common = [item.audioText];
        switch (item.format) {
          case "listen-select":
            return [...common, ...item.options.flatMap((option) => [option.bg, option.de])];
          case "listen-type":
            return [...common, ...item.acceptedAnswers];
          case "dictation":
            return [...common, ...(item.acceptedVariants ?? []), ...(item.acceptedTransliterations ?? [])];
          case "listen-reorder":
            return [...common, item.correctOrder.join(" ")];
          case "audio-comprehension":
            return [...common, ...item.options];
        }
      });
    default:
      return [];
  }
}

function vocabularyIsTested(lesson: Lesson, vocabularyId: string, bulgarian: string): boolean {
  return lesson.exercises.some((exercise) => {
    const items = Array.isArray(exercise.data)
      ? exercise.data as unknown as Array<Record<string, unknown>>
      : [];
    if (items.some((item) => item.vocabularyId === vocabularyId)) return true;
    return exerciseCandidates(exercise).some((candidate) => includesTerm(candidate, bulgarian));
  });
}

function acceptedAnswerIsMissing(exercise: Exercise, item: Record<string, unknown>): boolean {
  switch (exercise.type) {
    case "quiz": {
      const options = item.options;
      const index = item.correctOptionIndex;
      return !Array.isArray(options) || typeof index !== "number" || index < 0 || index >= options.length;
    }
    case "matching":
      return typeof item.bg !== "string" || item.bg.trim().length === 0;
    case "fill-in":
      return !Array.isArray(item.answers) || item.answers.length === 0;
    case "sentence-builder":
      return !Array.isArray(item.correctOrder) || item.correctOrder.length === 0;
    case "listen":
      if (item.format === "listen-select") {
        return typeof item.correctOptionId !== "string" || item.correctOptionId.length === 0;
      }
      if (item.format === "listen-type") {
        return !Array.isArray(item.acceptedAnswers) || item.acceptedAnswers.length === 0;
      }
      if (item.format === "listen-reorder") {
        return !Array.isArray(item.correctOrder) || item.correctOrder.length === 0;
      }
      if (item.format === "audio-comprehension") {
        return typeof item.correctOptionIndex !== "number";
      }
      return typeof item.audioText !== "string" || item.audioText.trim().length === 0;
    default:
      return false;
  }
}

function hasProductiveExercise(lesson: Lesson): boolean {
  return lesson.exercises.some((exercise) => {
    if (exercise.type === "fill-in" || exercise.type === "sentence-builder") return true;
    if (exercise.type !== "listen") return false;
    return (exercise.data as ListenExerciseItem[]).some((item) =>
      item.format === "listen-type" || item.format === "dictation" || item.format === "listen-reorder"
    );
  });
}

function emptyFindings(): Record<ContentQualityCategory, ContentQualityFinding[]> {
  return {
    untestedVocabulary: [],
    missingAudio: [],
    missingAcceptedAnswers: [],
    unsupportedExerciseTypes: [],
    duplicateIds: [],
    missingGrammarExplanations: [],
    lessonsWithoutProductiveExercises: [],
  };
}

function addDuplicateFindings(
  findings: ContentQualityFinding[],
  label: string,
  values: Array<{ id: string; path: string }>
) {
  const locations = new Map<string, string[]>();
  values.forEach(({ id, path }) => {
    if (!id) return;
    locations.set(id, [...(locations.get(id) ?? []), path]);
  });
  locations.forEach((paths, id) => {
    if (paths.length < 2) return;
    findings.push({
      path: paths[0],
      message: `duplicate ${label} '${id}' appears at ${paths.join(", ")}`,
      affectedIds: [id],
    });
  });
}

export function buildContentQualityReport(modules: ModuleMeta[], lessons: Lesson[]): ContentQualityReport {
  const findings = emptyFindings();
  const ids = {
    modules: modules.map((module) => ({ id: module.moduleId, path: `module:${module.moduleId}` })),
    lessons: lessons.map((lesson) => ({ id: lesson.lessonId, path: lessonPath(lesson) })),
    vocabulary: [] as Array<{ id: string; path: string }>,
    exercises: [] as Array<{ id: string; path: string }>,
    exerciseItems: [] as Array<{ id: string; path: string }>,
  };

  for (const lesson of lessons) {
    const path = lessonPath(lesson);
    const untested = lesson.vocabulary
      .filter((item) => !vocabularyIsTested(lesson, item.id, item.bg))
      .map((item) => item.id);
    if (untested.length > 0) {
      findings.untestedVocabulary.push({
        path,
        message: `vocabulary not referenced by an exercise: ${untested.join(", ")}`,
        affectedIds: untested,
      });
    }

    const vocabularyWithoutAudio = lesson.vocabulary
      .filter((item) => typeof item.audio !== "string" || item.audio.trim().length === 0)
      .map((item) => item.id);
    if (vocabularyWithoutAudio.length > 0) {
      findings.missingAudio.push({
        path,
        message: `vocabulary without authored audio: ${vocabularyWithoutAudio.join(", ")}`,
        affectedIds: vocabularyWithoutAudio,
      });
    }

    lesson.vocabulary.forEach((item, index) => {
      ids.vocabulary.push({ id: item.id, path: `${path}#vocabulary[${index}]` });
    });

    if (!lesson.grammar || typeof lesson.grammar.explanation !== "string" || lesson.grammar.explanation.trim().length === 0) {
      findings.missingGrammarExplanations.push({
        path,
        message: "lesson grammar explanation is missing",
        affectedIds: [lesson.lessonId],
      });
    }

    if (!hasProductiveExercise(lesson)) {
      findings.lessonsWithoutProductiveExercises.push({
        path,
        message: "lesson has no fill-in, sentence-builder, dictation, typed-listening, or reorder exercise",
        affectedIds: [lesson.lessonId],
      });
    }

    lesson.exercises.forEach((exercise, exerciseIndex) => {
      const exercisePath = `${path}#exercises[${exerciseIndex}]`;
      ids.exercises.push({ id: exercise.id, path: exercisePath });
      const runtimeType = String(exercise.type);
      if (!SUPPORTED_EXERCISE_TYPES.has(runtimeType)) {
        findings.unsupportedExerciseTypes.push({
          path: exercisePath,
          message: `unsupported exercise type '${runtimeType}'`,
          affectedIds: [exercise.id],
        });
      }

      const data = Array.isArray(exercise.data)
        ? exercise.data as unknown as Array<Record<string, unknown>>
        : [];
      const withoutAcceptedAnswers: string[] = [];
      const listenWithoutAudio: string[] = [];
      data.forEach((item, itemIndex) => {
        const itemId = typeof item.id === "string" ? item.id : `item-${itemIndex + 1}`;
        ids.exerciseItems.push({ id: `${exercise.id}/${itemId}`, path: `${exercisePath}/data[${itemIndex}]` });
        if (acceptedAnswerIsMissing(exercise, item)) withoutAcceptedAnswers.push(itemId);
        if (exercise.type === "listen" && (typeof item.audioUrl !== "string" || item.audioUrl.trim().length === 0)) {
          listenWithoutAudio.push(itemId);
        }
      });
      if (withoutAcceptedAnswers.length > 0) {
        findings.missingAcceptedAnswers.push({
          path: exercisePath,
          message: `exercise items without a valid accepted answer: ${withoutAcceptedAnswers.join(", ")}`,
          affectedIds: withoutAcceptedAnswers,
        });
      }
      if (listenWithoutAudio.length > 0) {
        findings.missingAudio.push({
          path: exercisePath,
          message: `listening items without authored audioUrl: ${listenWithoutAudio.join(", ")}`,
          affectedIds: listenWithoutAudio,
        });
      }
    });
  }

  addDuplicateFindings(findings.duplicateIds, "module id", ids.modules);
  addDuplicateFindings(findings.duplicateIds, "lesson id", ids.lessons);
  addDuplicateFindings(findings.duplicateIds, "vocabulary id", ids.vocabulary);
  addDuplicateFindings(findings.duplicateIds, "exercise id", ids.exercises);
  addDuplicateFindings(findings.duplicateIds, "exercise item id within its exercise", ids.exerciseItems);

  const affected = Object.fromEntries(
    Object.entries(findings).map(([category, categoryFindings]) => [
      category,
      categoryFindings.reduce((total, finding) => total + finding.affectedIds.length, 0),
    ])
  ) as Record<ContentQualityCategory, number>;

  return {
    totals: {
      modules: modules.length,
      lessons: lessons.length,
      vocabularyItems: lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0),
      exerciseItems: lessons.reduce(
        (total, lesson) => total + lesson.exercises.reduce(
          (lessonTotal, exercise) => lessonTotal + (Array.isArray(exercise.data) ? exercise.data.length : 0),
          0
        ),
        0
      ),
    },
    findings,
    affected,
  };
}

const CATEGORY_LABELS: Record<ContentQualityCategory, string> = {
  untestedVocabulary: "Untested vocabulary",
  missingAudio: "Missing authored audio",
  missingAcceptedAnswers: "Missing accepted answers",
  unsupportedExerciseTypes: "Unsupported exercise types",
  duplicateIds: "Duplicate stable IDs",
  missingGrammarExplanations: "Missing grammar explanations",
  lessonsWithoutProductiveExercises: "Lessons without productive exercises",
};

export function renderContentQualityReport(report: ContentQualityReport): string {
  const lines = [
    "Course content quality report",
    "=============================",
    `Inventory: ${report.totals.modules} modules | ${report.totals.lessons} lessons | ${report.totals.vocabularyItems} vocabulary items | ${report.totals.exerciseItems} exercise items`,
    "",
    "Coverage gaps:",
  ];
  (Object.keys(CATEGORY_LABELS) as ContentQualityCategory[]).forEach((category) => {
    lines.push(`- ${CATEGORY_LABELS[category]}: ${report.affected[category]}`);
  });

  (Object.keys(CATEGORY_LABELS) as ContentQualityCategory[]).forEach((category) => {
    const categoryFindings = report.findings[category];
    if (categoryFindings.length === 0) return;
    lines.push("", `${CATEGORY_LABELS[category]} (${report.affected[category]})`);
    categoryFindings.forEach((finding) => lines.push(`- ${finding.path}: ${finding.message}`));
  });
  return lines.join("\n");
}
