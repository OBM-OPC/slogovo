// Generated-style Supabase database contract. Regenerate with the Supabase CLI after staging migration.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          streak_current: number;
          streak_longest: number;
          streak_last_study_date: string | null;
          completed_lessons: string[];
          mastered_lessons: string[];
          completed_modules: string[];
          vocabulary_progress: Json;
          lesson_scores: Json;
          recorded_attempt_ids: string[];
          exercise_stats: Json;
          daily_stats: Json;
          settings: Json;
          achievements: string[];
          updated_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_progress"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["user_progress"]["Row"]>;
        Relationships: [];
      };
      lesson_attempts: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          module_id: string;
          level: string;
          results: Json;
          total_duration_ms: number;
          active_time_seconds: number;
          started_at: string;
          finished_at: string | null;
          first_try_correct: number;
          items_answered: number;
          correct_count: number;
          incorrect_count: number;
          required_score: number;
          passed: boolean;
          mastered: boolean;
          completed: boolean;
          accuracy: number;
          score: number;
          xp_earned: number;
          client_event_id: string | null;
          device_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lesson_attempts"]["Row"]> & {
          user_id: string;
          lesson_id: string;
          module_id: string;
          level: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_attempts"]["Row"]>;
        Relationships: [];
      };
      exercise_results: {
        Row: {
          id: string;
          attempt_id: string;
          user_id: string;
          exercise_id: string;
          exercise_type: string;
          item_id: string;
          status: string;
          is_passing: boolean;
          user_answer: string | null;
          correct_answers: Json;
          feedback: string | null;
          feedback_status: string | null;
          feedback_needs_review: boolean;
          duration_ms: number;
          answered_at: string;
          vocabulary_id: string | null;
          client_event_id: string | null;
          device_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exercise_results"]["Row"]> & {
          attempt_id: string;
          user_id: string;
          exercise_id: string;
          exercise_type: string;
          item_id: string;
          status: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_results"]["Row"]>;
        Relationships: [];
      };
      vocabulary_review_events: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          rating: string;
          reviewed_at: string;
          client_event_id: string;
          device_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vocabulary_review_events"]["Row"]> & {
          user_id: string;
          word_id: string;
          rating: string;
          client_event_id: string;
          device_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["vocabulary_review_events"]["Row"]>;
        Relationships: [];
      };
      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          minutes: number;
          vocabulary_count: number;
          client_event_id: string;
          device_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["daily_activity"]["Row"]> & {
          user_id: string;
          date: string;
          client_event_id: string;
          device_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_activity"]["Row"]>;
        Relationships: [];
      };
      offline_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          payload: Json;
          client_event_id: string;
          device_id: string;
          synced: boolean;
          error_count: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["offline_events"]["Row"]> & {
          user_id: string;
          event_type: string;
          payload: Json;
          client_event_id: string;
          device_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["offline_events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
