import { LearningValidationError } from "./learning-errors";

type LogValue = string | number | boolean | null | undefined;
type LogContext = Record<string, LogValue>;

function errorFields(error: unknown): LogContext {
  if (error instanceof LearningValidationError) {
    return { errorName: error.name, errorCode: error.code, errorMessage: error.message, path: error.path };
  }
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message };
  }
  return { errorName: "UnknownError", errorMessage: String(error) };
}

export function logError(event: string, error: unknown, context: LogContext = {}): void {
  console.error(JSON.stringify({
    level: "error",
    event,
    timestamp: new Date().toISOString(),
    ...context,
    ...errorFields(error),
  }));
}

export function logEvent(event: string, context: LogContext = {}): void {
  console.warn(JSON.stringify({
    level: "warn",
    event,
    timestamp: new Date().toISOString(),
    ...context,
  }));
}
