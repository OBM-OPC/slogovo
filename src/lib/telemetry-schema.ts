import { z } from "zod";

export const learningEventNames = [
  "lesson_started",
  "lesson_abandoned",
  "lesson_passed",
  "lesson_failed",
  "exercise_answered",
  "hint_used",
  "item_failed",
  "item_later_corrected",
  "review_completed",
  "audio_replayed",
  "daily_session_completed",
] as const;

export const monitoringEventNames = [
  "auth_failure",
  "content_loading_error",
  "sync_failure",
  "audio_failure",
  "database_error",
  "invalid_lesson_content",
  "client_crash",
] as const;

export type LearningEventName = typeof learningEventNames[number];
export type MonitoringEventName = typeof monitoringEventNames[number];
export type TelemetryEventName = LearningEventName | MonitoringEventName;

const propertiesSchema = z.object({
  lessonId: z.string().min(1).max(100).optional(),
  moduleId: z.string().min(1).max(100).optional(),
  exerciseId: z.string().min(1).max(100).optional(),
  itemId: z.string().min(1).max(100).optional(),
  vocabularyId: z.string().min(1).max(100).optional(),
  outcome: z.enum(["passed", "failed", "correct", "incorrect", "abandoned"]).optional(),
  reason: z.enum(["navigation", "unload", "invalid_credentials", "validation", "network", "server", "unknown"]).optional(),
  source: z.enum(["native", "cache", "offline", "tts", "none"]).optional(),
  speed: z.enum(["normal", "slow"]).optional(),
  mode: z.enum(["recognition", "production"]).optional(),
  errorCode: z.enum([
    "AUTH_REJECTED",
    "AUTH_SERVER_ERROR",
    "CONTENT_LOAD_FAILED",
    "SYNC_TRANSPORT_FAILED",
    "SYNC_EVENT_REJECTED",
    "AUDIO_PLAYBACK_FAILED",
    "DATABASE_READ_FAILED",
    "DATABASE_WRITE_FAILED",
    "INVALID_CONTENT",
    "UNHANDLED_ERROR",
    "UNHANDLED_REJECTION",
  ]).optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
  count: z.number().int().min(0).max(10_000).optional(),
  durationBucket: z.enum(["under_30s", "30s_2m", "2m_10m", "over_10m"]).optional(),
  online: z.boolean().optional(),
}).strict();

export type TelemetryProperties = z.infer<typeof propertiesSchema>;

export const telemetryEventSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(["learning", "monitoring"]),
  name: z.enum([...learningEventNames, ...monitoringEventNames]),
  timestamp: z.string().datetime(),
  properties: propertiesSchema,
}).strict().superRefine((event, context) => {
  const expected = learningEventNames.includes(event.name as LearningEventName) ? "learning" : "monitoring";
  if (event.category !== expected) {
    context.addIssue({ code: "custom", message: `Event category must be '${expected}'`, path: ["category"] });
  }
});

export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;

export const telemetryBatchSchema = z.object({
  events: z.array(telemetryEventSchema).min(1).max(50),
}).strict();

export function parseTelemetryBatch(input: unknown): TelemetryEvent[] {
  return telemetryBatchSchema.parse(input).events;
}
