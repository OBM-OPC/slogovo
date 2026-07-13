import { UserProgress } from "@/types";

export function mergeProgress(local: UserProgress, remote: UserProgress): UserProgress {
  if (local.userId !== remote.userId) {
    throw new Error("Cannot merge progress for different users");
  }

  const completedLessons = union(local.completedLessons, remote.completedLessons);
  const masteredLessons = union(local.masteredLessons, remote.masteredLessons);
  const completedModules = union(local.completedModules, remote.completedModules);

  const lessonScores = { ...remote.lessonScores, ...local.lessonScores };
  for (const lessonId of new Set([...Object.keys(local.lessonScores), ...Object.keys(remote.lessonScores)])) {
    const localScore = local.lessonScores[lessonId] ?? 0;
    const remoteScore = remote.lessonScores[lessonId] ?? 0;
    lessonScores[lessonId] = Math.max(localScore, remoteScore);
  }

  const vocabularyProgress = { ...remote.vocabularyProgress };
  for (const [wordId, localReview] of Object.entries(local.vocabularyProgress)) {
    const remoteReview = remote.vocabularyProgress[wordId];
    if (!remoteReview) {
      vocabularyProgress[wordId] = localReview;
      continue;
    }
    // Prefer the review with the higher interval index (more advanced) or more recent correct count.
    const localStrength =
      (localReview.intervalIndex ?? 0) * 10 + localReview.timesCorrect;
    const remoteStrength =
      (remoteReview.intervalIndex ?? 0) * 10 + remoteReview.timesCorrect;
    const stronger = localStrength >= remoteStrength ? localReview : remoteReview;
    vocabularyProgress[wordId] = {
      ...stronger,
      recognitionCorrect: Math.max(localReview.recognitionCorrect ?? 0, remoteReview.recognitionCorrect ?? 0),
      recognitionTotal: Math.max(localReview.recognitionTotal ?? 0, remoteReview.recognitionTotal ?? 0),
      productionCorrect: Math.max(localReview.productionCorrect ?? 0, remoteReview.productionCorrect ?? 0),
      productionTotal: Math.max(localReview.productionTotal ?? 0, remoteReview.productionTotal ?? 0),
    };
  }

  const dailyStats = { ...remote.dailyStats };
  for (const [date, localDay] of Object.entries(local.dailyStats)) {
    const remoteDay = remote.dailyStats[date];
    if (!remoteDay) {
      dailyStats[date] = localDay;
    } else {
      dailyStats[date] = {
        minutes: Math.max(localDay.minutes, remoteDay.minutes),
        vocabulary: Math.max(localDay.vocabulary, remoteDay.vocabulary),
        activeSeconds: Math.max(localDay.activeSeconds ?? 0, remoteDay.activeSeconds ?? 0),
      };
    }
  }

  const exerciseStats = {
    total: Math.max(local.exerciseStats.total, remote.exerciseStats.total),
    correct: Math.max(local.exerciseStats.correct, remote.exerciseStats.correct),
    wrong: Math.max(local.exerciseStats.wrong, remote.exerciseStats.wrong),
    consecutiveCorrect: Math.max(
      local.exerciseStats.consecutiveCorrect ?? 0,
      remote.exerciseStats.consecutiveCorrect ?? 0
    ),
  };

  const achievements = union(local.achievements, remote.achievements);

  // Settings: last-write-wins based on dailyStats or settings? We don't have a timestamp.
  // Use local settings as the local device is authoritative for its own UI.
  const settings = { ...remote.settings, ...local.settings };

  // Streak: keep the higher current streak and longest streak.
  const streak = {
    current: Math.max(local.streak.current, remote.streak.current),
    longest: Math.max(local.streak.longest, remote.streak.longest),
    lastStudyDate:
      (local.streak.lastStudyDate ?? "") >= (remote.streak.lastStudyDate ?? "")
        ? local.streak.lastStudyDate
        : remote.streak.lastStudyDate,
  };

  return {
    userId: local.userId,
    completedLessons,
    masteredLessons,
    completedModules,
    lessonScores,
    vocabularyProgress,
    dailyStats,
    exerciseStats,
    achievements,
    settings,
    streak,
    recordedAttemptIds: union(local.recordedAttemptIds, remote.recordedAttemptIds),
  };
}

function union(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}
