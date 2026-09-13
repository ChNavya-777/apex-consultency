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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      counsellors: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          status: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      demo_call_requests: {
        Row: {
          email: string
          full_name: string
          id: string
          phone: string
          submitted_at: string
          webhook_status: string | null
          whatsapp: string | null
        }
        Insert: {
          email: string
          full_name: string
          id?: string
          phone: string
          submitted_at?: string
          webhook_status?: string | null
          whatsapp?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          id?: string
          phone?: string
          submitted_at?: string
          webhook_status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      session_questions: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          position: number | null
          question: string | null
          session_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          position?: number | null
          question?: string | null
          session_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          position?: number | null
          question?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          booking_event: string | null
          booking_status: string | null
          booking_uid: string
          calendly_event_type_uri: string | null
          calendly_invitee_uri: string | null
          calendly_location: string | null
          cancel_url: string | null
          counsellor_email: string | null
          counsellor_id: string | null
          counsellor_name: string | null
          counsellor_user_uri: string | null
          created_at: string
          end_time: string | null
          event_uri: string | null
          id: string
          invitee_status: string | null
          reschedule_url: string | null
          rescheduled: boolean | null
          session_name: string | null
          start_time: string | null
          status: string | null
          student_email: string
          student_id: string | null
          student_name: string | null
          timezone: string | null
        }
        Insert: {
          booking_event?: string | null
          booking_status?: string | null
          booking_uid: string
          calendly_event_type_uri?: string | null
          calendly_invitee_uri?: string | null
          calendly_location?: string | null
          cancel_url?: string | null
          counsellor_email?: string | null
          counsellor_id?: string | null
          counsellor_name?: string | null
          counsellor_user_uri?: string | null
          created_at?: string
          end_time?: string | null
          event_uri?: string | null
          id?: string
          invitee_status?: string | null
          reschedule_url?: string | null
          rescheduled?: boolean | null
          session_name?: string | null
          start_time?: string | null
          status?: string | null
          student_email: string
          student_id?: string | null
          student_name?: string | null
          timezone?: string | null
        }
        Update: {
          booking_event?: string | null
          booking_status?: string | null
          booking_uid?: string
          calendly_event_type_uri?: string | null
          calendly_invitee_uri?: string | null
          calendly_location?: string | null
          cancel_url?: string | null
          counsellor_email?: string | null
          counsellor_id?: string | null
          counsellor_name?: string | null
          counsellor_user_uri?: string | null
          created_at?: string
          end_time?: string | null
          event_uri?: string | null
          id?: string
          invitee_status?: string | null
          reschedule_url?: string | null
          rescheduled?: boolean | null
          session_name?: string | null
          start_time?: string | null
          status?: string | null
          student_email?: string
          student_id?: string | null
          student_name?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_counsellor_id_fkey"
            columns: ["counsellor_id"]
            isOneToOne: false
            referencedRelation: "counsellors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          additional_info: string | null
          branch: string | null
          budget: string | null
          cgpa: string | null
          created_at: string
          current_degree: string | null
          email: string
          english_test: string | null
          graduation_year: string | null
          id: string
          phone: string | null
          preferred_country: string | null
          preferred_course: string | null
          preferred_intake: string | null
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          additional_info?: string | null
          branch?: string | null
          budget?: string | null
          cgpa?: string | null
          created_at?: string
          current_degree?: string | null
          email: string
          english_test?: string | null
          graduation_year?: string | null
          id?: string
          phone?: string | null
          preferred_country?: string | null
          preferred_course?: string | null
          preferred_intake?: string | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          additional_info?: string | null
          branch?: string | null
          budget?: string | null
          cgpa?: string | null
          created_at?: string
          current_degree?: string | null
          email?: string
          english_test?: string | null
          graduation_year?: string | null
          id?: string
          phone?: string | null
          preferred_country?: string | null
          preferred_course?: string | null
          preferred_intake?: string | null
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          account_status: string | null
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          account_status?: string | null
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
        }
        Update: {
          account_status?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      app_role: "super_admin" | "counsellor" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "counsellor", "student"],
    },
  },
} as const
