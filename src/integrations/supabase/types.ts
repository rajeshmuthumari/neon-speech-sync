export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analysis_results: {
        Row: {
          body_language: Json | null
          confidence_score: number | null
          created_at: string
          detected_language: string | null
          ego_centric_phrases: number | null
          emotions: Json | null
          empathy_score: number | null
          eye_contact_score: number | null
          facial_emotions: Json | null
          id: string
          inclusive_phrases: number | null
          key_themes: string[] | null
          overall_sentiment: string | null
          processing_error: string | null
          processing_status: string | null
          sentiment_confidence: number | null
          topics: Json | null
          transcription: string | null
          updated_at: string
          user_id: string | null
          video_id: string
        }
        Insert: {
          body_language?: Json | null
          confidence_score?: number | null
          created_at?: string
          detected_language?: string | null
          ego_centric_phrases?: number | null
          emotions?: Json | null
          empathy_score?: number | null
          eye_contact_score?: number | null
          facial_emotions?: Json | null
          id?: string
          inclusive_phrases?: number | null
          key_themes?: string[] | null
          overall_sentiment?: string | null
          processing_error?: string | null
          processing_status?: string | null
          sentiment_confidence?: number | null
          topics?: Json | null
          transcription?: string | null
          updated_at?: string
          user_id?: string | null
          video_id: string
        }
        Update: {
          body_language?: Json | null
          confidence_score?: number | null
          created_at?: string
          detected_language?: string | null
          ego_centric_phrases?: number | null
          emotions?: Json | null
          empathy_score?: number | null
          eye_contact_score?: number | null
          facial_emotions?: Json | null
          id?: string
          inclusive_phrases?: number | null
          key_themes?: string[] | null
          overall_sentiment?: string | null
          processing_error?: string | null
          processing_status?: string | null
          sentiment_confidence?: number | null
          topics?: Json | null
          transcription?: string | null
          updated_at?: string
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_analysis: {
        Row: {
          analysis_id: string
          body_gesture: string | null
          confidence_level: number | null
          created_at: string
          emotion: string | null
          facial_expression: string | null
          id: string
          sentiment: string | null
          text_segment: string | null
          timestamp_seconds: number
        }
        Insert: {
          analysis_id: string
          body_gesture?: string | null
          confidence_level?: number | null
          created_at?: string
          emotion?: string | null
          facial_expression?: string | null
          id?: string
          sentiment?: string | null
          text_segment?: string | null
          timestamp_seconds: number
        }
        Update: {
          analysis_id?: string
          body_gesture?: string | null
          confidence_level?: number | null
          created_at?: string
          emotion?: string | null
          facial_expression?: string | null
          id?: string
          sentiment?: string | null
          text_segment?: string | null
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "timeline_analysis_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analysis_results"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_path: string
          file_size: number
          id: string
          mime_type: string
          title: string
          updated_at: string
          upload_status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          title: string
          updated_at?: string
          upload_status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          title?: string
          updated_at?: string
          upload_status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
