export type LearningErrorCode =
  | "UNKNOWN_LESSON"
  | "UNKNOWN_MODULE"
  | "UNKNOWN_EXERCISE"
  | "UNKNOWN_ITEM"
  | "INVALID_EXERCISE_TYPE"
  | "MISSING_REQUIRED_ITEM"
  | "INVALID_ATTEMPT_TIMELINE";

export class LearningValidationError extends Error {
  constructor(
    public readonly code: LearningErrorCode,
    message: string,
    public readonly path?: string
  ) {
    super(message);
    this.name = "LearningValidationError";
  }
}
