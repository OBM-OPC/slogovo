import { Exercise, ExerciseType, FillInSentence, GrammarSection, GrammarTopic, Lesson, ListenExerciseItem, MatchingPair, ModuleMeta, QuizQuestion, SentenceBuilder, VocabularyItem } from "@/types";

export interface ContentValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

const EXERCISE_TYPES: ExerciseType[] = ["quiz", "fill-in", "matching", "sentence-builder", "listen"];

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function validateLesson(lesson: Lesson, moduleMeta: ModuleMeta, issues: ContentValidationIssue[]): void {
  const prefix = `content/${lesson.level.toLowerCase()}/${lesson.moduleId}/lessons/${lesson.lessonId}`;

  if (!isNonEmptyString(lesson.lessonId)) {
    issues.push({ path: prefix, message: "lessonId is missing", severity: "error" });
  }
  if (lesson.lessonId !== `${moduleMeta.moduleId}-${lesson.lessonId.split("-").pop()}`) {
    // lessonId must be moduleId + lektion-N
    const expectedSuffix = lesson.lessonId.replace(`${lesson.moduleId}-`, "");
    if (!/^lektion-\d+$/.test(expectedSuffix)) {
      issues.push({ path: prefix, message: `lessonId '${lesson.lessonId}' does not match expected '${lesson.moduleId}-lektion-N'`, severity: "warning" });
    }
  }
  if (lesson.moduleId !== moduleMeta.moduleId) {
    issues.push({ path: prefix, message: `moduleId mismatch: lesson ${lesson.moduleId} vs meta ${moduleMeta.moduleId}`, severity: "error" });
  }
  if (!isNonEmptyString(lesson.title)) {
    issues.push({ path: prefix, message: "title is missing", severity: "error" });
  }
  if (!isNonEmptyString(lesson.introduction)) {
    issues.push({ path: prefix, message: "introduction is missing", severity: "error" });
  }
  if (!isNonEmptyString(lesson.summary)) {
    issues.push({ path: prefix, message: "summary is missing", severity: "error" });
  }
  if (!Array.isArray(lesson.vocabulary) || lesson.vocabulary.length === 0) {
    issues.push({ path: prefix, message: "vocabulary array is empty or missing", severity: "error" });
  }

  const vocabIds = new Set<string>();
  lesson.vocabulary.forEach((item, idx) => {
    validateVocabularyItem(item, lesson.level, `${prefix}/vocabulary[${idx}]`, issues);
    if (vocabIds.has(item.id)) {
      issues.push({ path: `${prefix}/vocabulary[${idx}]`, message: `duplicate vocabulary id '${item.id}'`, severity: "error" });
    }
    vocabIds.add(item.id);
  });

  validateGrammarSection(lesson.grammar, `${prefix}/grammar`, issues);

  const exerciseIds = new Set<string>();
  lesson.exercises.forEach((exercise, idx) => {
    validateExercise(exercise, `${prefix}/exercises[${idx}]`, issues, lesson);
    if (exerciseIds.has(exercise.id)) {
      issues.push({ path: `${prefix}/exercises[${idx}]`, message: `duplicate exercise id '${exercise.id}'`, severity: "error" });
    }
    exerciseIds.add(exercise.id);
  });

  validateRequiredExerciseGroups(lesson, exerciseIds, prefix, issues);

  // Cross-check vocabulary ids referenced in exercises? Not yet, content does not use ids there.
}

function validateRequiredExerciseGroups(
  lesson: Lesson,
  exerciseIds: Set<string>,
  lessonPath: string,
  issues: ContentValidationIssue[]
): void {
  const groupIds = new Set<string>();
  (lesson.requiredExerciseGroups ?? []).forEach((group, index) => {
    const path = `${lessonPath}/requiredExerciseGroups[${index}]`;
    const groupId = typeof group.id === "string" ? group.id.trim() : "";
    if (!isNonEmptyString(group.id)) {
      issues.push({ path, message: "required exercise group id is missing", severity: "error" });
    } else if (groupIds.has(groupId)) {
      issues.push({ path, message: `duplicate required exercise group id '${groupId}'`, severity: "error" });
    } else {
      groupIds.add(groupId);
    }

    if (!Array.isArray(group.exerciseIds) || group.exerciseIds.length === 0) {
      issues.push({ path, message: "required exercise group must reference at least one exercise", severity: "error" });
      return;
    }

    const uniqueExerciseIds = new Set(group.exerciseIds);
    if (uniqueExerciseIds.size !== group.exerciseIds.length) {
      issues.push({ path, message: "required exercise group contains duplicate exercise ids", severity: "error" });
    }
    group.exerciseIds.forEach((exerciseId) => {
      if (!exerciseIds.has(exerciseId)) {
        issues.push({ path, message: `required exercise group references unknown exercise '${exerciseId}'`, severity: "error" });
        return;
      }
      const exercise = lesson.exercises.find((candidate) => candidate.id === exerciseId);
      if (exercise && !exercise.data.some((item) => item.required !== false)) {
        issues.push({
          path,
          message: `required exercise group references exercise '${exerciseId}' without required items`,
          severity: "error",
        });
      }
    });

    const minimumPassed = group.minimumPassed ?? 1;
    if (!Number.isInteger(minimumPassed) || minimumPassed < 1 || minimumPassed > uniqueExerciseIds.size) {
      issues.push({
        path,
        message: `required exercise group minimumPassed must be an integer between 1 and ${uniqueExerciseIds.size}`,
        severity: "error",
      });
    }
  });
}

function validateVocabularyItem(item: VocabularyItem, level: Lesson["level"], path: string, issues: ContentValidationIssue[]): void {
  if (!isNonEmptyString(item.id)) {
    issues.push({ path, message: "vocabulary item id is missing", severity: "error" });
  }
  if (!isNonEmptyString(item.de)) {
    issues.push({ path, message: "German text (de) is missing", severity: "error" });
  }
  if (!isNonEmptyString(item.bg)) {
    issues.push({ path, message: "Bulgarian text (bg) is missing", severity: "error" });
  }
  if (item.needsNativeReview === true) {
    issues.push({ path, message: "vocabulary item still needs native-speaker review", severity: "error" });
  }
  if (item.bgLatin === "NATIVE_REVIEW_NEEDED") {
    issues.push({ path, message: "bgLatin still contains the NATIVE_REVIEW_NEEDED marker", severity: "error" });
  } else if (level === "A1" && !isNonEmptyString(item.bgLatin)) {
    issues.push({ path, message: "A1 vocabulary requires a non-empty bgLatin reading aid", severity: "error" });
  } else if (item.bgLatin !== undefined && !isNonEmptyString(item.bgLatin)) {
    issues.push({ path, message: "bgLatin is present but empty", severity: "warning" });
  }
  if (item.audio !== undefined && !isNonEmptyString(item.audio)) {
    issues.push({ path, message: "audio path is present but empty", severity: "warning" });
  }
}

function validateGrammarSection(
  section: GrammarSection | undefined,
  path: string,
  issues: ContentValidationIssue[],
): void {
  if (!section) {
    issues.push({ path, message: "grammar section is missing", severity: "error" });
    return;
  }
  if (!isNonEmptyString(section.title)) {
    issues.push({ path, message: "grammar title is missing", severity: "error" });
  }
  if (!isNonEmptyString(section.explanation)) {
    issues.push({ path, message: "grammar explanation is missing", severity: "error" });
  }
  if (!Array.isArray(section.examples) || section.examples.length === 0) {
    issues.push({ path, message: "grammar examples are missing or empty", severity: "error" });
  } else {
    section.examples.forEach((example, index) => {
      const examplePath = `${path}/examples[${index}]`;
      if (!isNonEmptyString(example.bg)) {
        issues.push({ path: examplePath, message: "grammar example Bulgarian text (bg) is missing", severity: "error" });
      }
      if (!isNonEmptyString(example.de)) {
        issues.push({ path: examplePath, message: "grammar example German text (de) is missing", severity: "error" });
      }
    });
  }
}

function validateExercise(exercise: Exercise, path: string, issues: ContentValidationIssue[], lesson: Lesson): void {
  if (!isNonEmptyString(exercise.id)) {
    issues.push({ path, message: "exercise id is missing", severity: "error" });
  }
  if (!isNonEmptyString(exercise.title)) {
    issues.push({ path, message: "exercise title is missing", severity: "warning" });
  }
  if (!EXERCISE_TYPES.includes(exercise.type)) {
    issues.push({ path, message: `unsupported exercise type '${exercise.type}'`, severity: "error" });
  }
  if (!Array.isArray(exercise.data) || exercise.data.length === 0) {
    issues.push({ path, message: "exercise data is empty or missing", severity: "error" });
    return;
  }

  switch (exercise.type) {
    case "quiz":
      validateQuiz(exercise.data as QuizQuestion[], path, issues);
      break;
    case "matching":
      validateMatching(exercise.data as MatchingPair[], path, issues, lesson);
      break;
    case "fill-in":
      validateFillIn(exercise.data as FillInSentence[], path, issues);
      break;
    case "sentence-builder":
      validateSentenceBuilder(exercise.data as SentenceBuilder[], path, issues);
      break;
    case "listen":
      validateListen(exercise.data as ListenExerciseItem[], path, issues);
      break;
  }
}

function validateQuiz(questions: QuizQuestion[], path: string, issues: ContentValidationIssue[]): void {
  const ids = new Set<string>();
  questions.forEach((q, idx) => {
    const qPath = `${path}/data[${idx}]`;
    if (!isNonEmptyString(q.id)) {
      issues.push({ path: qPath, message: "question id is missing", severity: "error" });
    } else if (ids.has(q.id)) {
      issues.push({ path: qPath, message: `duplicate question id '${q.id}'`, severity: "error" });
    } else {
      ids.add(q.id);
    }
    if (!isNonEmptyString(q.question)) {
      issues.push({ path: qPath, message: "question text is missing", severity: "error" });
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      issues.push({ path: qPath, message: "quiz options must have at least 2 entries", severity: "error" });
    }
    if (typeof q.correctOptionIndex !== "number" || q.correctOptionIndex < 0 || (Array.isArray(q.options) && q.correctOptionIndex >= q.options.length)) {
      issues.push({ path: qPath, message: "correctOptionIndex is out of range", severity: "error" });
    }
    if (q.options && q.options.some((o) => !isNonEmptyString(o))) {
      issues.push({ path: qPath, message: "empty option text", severity: "error" });
    }
  });
}

function validateMatching(pairs: MatchingPair[], path: string, issues: ContentValidationIssue[], lesson: Lesson): void {
  if (pairs.length < 2) {
    issues.push({ path, message: "matching exercise must have at least 2 pairs", severity: "warning" });
  }
  const ids = new Set<string>();
  const deValues = new Set<string>();
  const bgValues = new Set<string>();
  pairs.forEach((pair, idx) => {
    const pPath = `${path}/data[${idx}]`;
    if (!isNonEmptyString(pair.id)) {
      issues.push({ path: pPath, message: "pair id is missing", severity: "error" });
    } else if (ids.has(pair.id)) {
      issues.push({ path: pPath, message: `duplicate pair id '${pair.id}'`, severity: "error" });
    } else {
      ids.add(pair.id);
    }
    if (!isNonEmptyString(pair.de)) {
      issues.push({ path: pPath, message: "pair German (de) is missing", severity: "error" });
    }
    if (!isNonEmptyString(pair.bg)) {
      issues.push({ path: pPath, message: "pair Bulgarian (bg) is missing", severity: "error" });
    }
    if (deValues.has(pair.de)) {
      issues.push({ path: pPath, message: `duplicate German value '${pair.de}'`, severity: "warning" });
    }
    if (bgValues.has(pair.bg)) {
      issues.push({ path: pPath, message: `duplicate Bulgarian value '${pair.bg}'`, severity: "warning" });
    }
    deValues.add(pair.de);
    bgValues.add(pair.bg);

    // Content correctness: matching pairs should be in lesson vocabulary or at least German word present in content?
    const knownBg = lesson.vocabulary.some((v) => v.bg === pair.bg || v.de === pair.de);
    if (!knownBg) {
      issues.push({ path: pPath, message: `pair '${pair.de}' / '${pair.bg}' not found in lesson vocabulary`, severity: "warning" });
    }
  });
}

function validateFillIn(sentences: FillInSentence[], path: string, issues: ContentValidationIssue[]): void {
  sentences.forEach((s, idx) => {
    const sPath = `${path}/data[${idx}]`;
    if (!isNonEmptyString(s.id)) {
      issues.push({ path: sPath, message: "sentence id is missing", severity: "error" });
    }
    if (!Array.isArray(s.parts) || s.parts.length < 2) {
      issues.push({ path: sPath, message: "fill-in parts must contain at least prompt and blank", severity: "error" });
    }
    if (!isNonEmptyString(s.answer)) {
      issues.push({ path: sPath, message: "fill-in answer is missing", severity: "error" });
    }
    if (!Array.isArray(s.answers) || s.answers.length === 0) {
      issues.push({ path: sPath, message: "fill-in accepted answers array is empty", severity: "error" });
    }
    if (Array.isArray(s.answers) && s.answers.some((a) => !isNonEmptyString(a))) {
      issues.push({ path: sPath, message: "fill-in accepted answers contain empty string", severity: "error" });
    }
    if (Array.isArray(s.answers) && !s.answers.includes(s.answer)) {
      issues.push({ path: sPath, message: "fill-in primary answer is not included in accepted answers", severity: "error" });
    }
    if (!isNonEmptyString(s.bg)) {
      issues.push({ path: sPath, message: "fill-in Bulgarian sentence (bg) is missing", severity: "warning" });
    }
  });
}

function validateSentenceBuilder(sentences: SentenceBuilder[], path: string, issues: ContentValidationIssue[]): void {
  sentences.forEach((s, idx) => {
    const sPath = `${path}/data[${idx}]`;
    if (!isNonEmptyString(s.id)) {
      issues.push({ path: sPath, message: "sentence id is missing", severity: "error" });
    }
    if (!Array.isArray(s.words) || s.words.length === 0) {
      issues.push({ path: sPath, message: "sentence-builder words are missing", severity: "error" });
    }
    if (!Array.isArray(s.correctOrder) || s.correctOrder.length === 0) {
      issues.push({ path: sPath, message: "sentence-builder correctOrder is missing", severity: "error" });
    }
    if (Array.isArray(s.correctOrder) && Array.isArray(s.words)) {
      const wordBag = new Map<string, number>();
      s.words.forEach((w) => wordBag.set(w, (wordBag.get(w) ?? 0) + 1));
      const orderBag = new Map<string, number>();
      s.correctOrder.forEach((w) => orderBag.set(w, (orderBag.get(w) ?? 0) + 1));
      let mismatch = false;
      orderBag.forEach((count, word) => {
        if ((wordBag.get(word) ?? 0) < count) mismatch = true;
      });
      if (mismatch) {
        issues.push({ path: sPath, message: "correctOrder contains words not present in words pool", severity: "error" });
      }
    }
  });
}

function validateListen(items: ListenExerciseItem[], path: string, issues: ContentValidationIssue[]): void {
  const ids = new Set<string>();
  items.forEach((item, index) => {
    const itemPath = `${path}/data[${index}]`;
    if (!isNonEmptyString(item.id) || ids.has(item.id)) {
      issues.push({ path: itemPath, message: "listen item id is missing or duplicated", severity: "error" });
    }
    ids.add(item.id);
    if (!isNonEmptyString(item.audioText)) {
      issues.push({ path: itemPath, message: "listen audioText is missing", severity: "error" });
    }
    if (item.format === "listen-select") {
      if (item.options.length < 2 || !item.options.some((option) => option.id === item.correctOptionId)) {
        issues.push({ path: itemPath, message: "listen-select options or correctOptionId are invalid", severity: "error" });
      }
    } else if (item.format === "listen-type" && item.acceptedAnswers.length === 0) {
      issues.push({ path: itemPath, message: "listen-type acceptedAnswers are missing", severity: "error" });
    } else if (item.format === "listen-reorder" && item.correctOrder.length === 0) {
      issues.push({ path: itemPath, message: "listen-reorder correctOrder is missing", severity: "error" });
    } else if (item.format === "audio-comprehension") {
      if (item.options.length < 2 || item.correctOptionIndex < 0 || item.correctOptionIndex >= item.options.length) {
        issues.push({ path: itemPath, message: "audio-comprehension options are invalid", severity: "error" });
      }
    }
  });
}

export function validateModules(moduleMetas: ModuleMeta[], lessons: Lesson[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];

  const metaIds = new Set<string>();
  const expectedLessonsByModule = new Map<string, { lessonId: string; title: string }[]>();
  moduleMetas.forEach((meta) => {
    const path = `content/${meta.level.toLowerCase()}/${meta.moduleId}/meta.json`;
    if (!isNonEmptyString(meta.moduleId)) {
      issues.push({ path, message: "moduleId is missing", severity: "error" });
    }
    if (metaIds.has(meta.moduleId)) {
      issues.push({ path, message: `duplicate moduleId '${meta.moduleId}'`, severity: "error" });
    }
    metaIds.add(meta.moduleId);
    if (!isNonEmptyString(meta.title)) {
      issues.push({ path, message: "module title is missing", severity: "error" });
    }
    if (typeof meta.order !== "number") {
      issues.push({ path, message: "module order must be a number", severity: "error" });
    }
    if (!Array.isArray(meta.lessons) || meta.lessons.length === 0) {
      issues.push({ path, message: "module lessons list is empty", severity: "error" });
    }
    const lessonIds = new Set<string>();
    meta.lessons.forEach((l, idx) => {
      if (!isNonEmptyString(l.lessonId)) {
        issues.push({ path: `${path}/lessons[${idx}]`, message: "lessonId is missing in meta", severity: "error" });
      }
      if (!isNonEmptyString(l.title)) {
        issues.push({ path: `${path}/lessons[${idx}]`, message: "lesson title is missing in meta", severity: "error" });
      }
      if (lessonIds.has(l.lessonId)) {
        issues.push({ path: `${path}/lessons[${idx}]`, message: `duplicate lessonId '${l.lessonId}' in meta`, severity: "error" });
      }
      lessonIds.add(l.lessonId);
    });
    expectedLessonsByModule.set(meta.moduleId, meta.lessons);
  });

  // Build module meta lookup by moduleId
  const metaByModuleId = new Map<string, ModuleMeta>();
  moduleMetas.forEach((meta) => metaByModuleId.set(meta.moduleId, meta));

  const lessonIds = new Set<string>();
  lessons.forEach((lesson) => {
    const meta = metaByModuleId.get(lesson.moduleId);
    if (!meta) {
      issues.push({ path: `content/${lesson.level.toLowerCase()}/${lesson.moduleId}`, message: `lesson references unknown module '${lesson.moduleId}'`, severity: "error" });
      return;
    }
    validateLesson(lesson, meta, issues);
    if (lessonIds.has(lesson.lessonId)) {
      issues.push({ path: `content/${lesson.level.toLowerCase()}/${lesson.moduleId}/lessons/${lesson.lessonId}`, message: `duplicate lessonId '${lesson.lessonId}'`, severity: "error" });
    }
    lessonIds.add(lesson.lessonId);
  });

  // Ensure every meta lesson has a registered lesson
  expectedLessonsByModule.forEach((expected, moduleId) => {
    expected.forEach((l) => {
      if (!lessonIds.has(l.lessonId)) {
        issues.push({
          path: `content/${moduleId}/meta.json`,
          message: `module meta references missing lesson '${l.lessonId}'`,
          severity: "error",
        });
      }
    });
  });

  return issues;
}

export function validateGrammarTopics(topics: GrammarTopic[]): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const topicIds = new Set<string>();
  const slugs = new Set<string>();

  topics.forEach((topic, topicIndex) => {
    const path = `src/lib/content.ts/grammarTopics[${topicIndex}]`;
    if (!isNonEmptyString(topic.topicId)) {
      issues.push({ path, message: "grammar topic id is missing", severity: "error" });
    } else if (topicIds.has(topic.topicId)) {
      issues.push({ path, message: `duplicate grammar topic id '${topic.topicId}'`, severity: "error" });
    } else {
      topicIds.add(topic.topicId);
    }
    if (!isNonEmptyString(topic.slug)) {
      issues.push({ path, message: "grammar topic slug is missing", severity: "error" });
    } else if (slugs.has(topic.slug)) {
      issues.push({ path, message: `duplicate grammar topic slug '${topic.slug}'`, severity: "error" });
    } else {
      slugs.add(topic.slug);
    }
    if (!isNonEmptyString(topic.title)) {
      issues.push({ path, message: "grammar topic title is missing", severity: "error" });
    }
    if (!isNonEmptyString(topic.shortDescription)) {
      issues.push({ path, message: "grammar topic short description is missing", severity: "error" });
    }
    if (!Array.isArray(topic.content) || topic.content.length === 0) {
      issues.push({ path, message: "grammar topic content is missing or empty", severity: "error" });
      return;
    }
    topic.content.forEach((section, sectionIndex) => {
      validateGrammarSection(section, `${path}/content[${sectionIndex}]`, issues);
    });
  });

  return issues;
}

export function reportIssues(issues: ContentValidationIssue[]): { errors: number; warnings: number; text: string } {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const text = issues
    .map((i) => `${i.severity.toUpperCase()}: ${i.path} — ${i.message}`)
    .join("\n");
  return { errors, warnings, text };
}
